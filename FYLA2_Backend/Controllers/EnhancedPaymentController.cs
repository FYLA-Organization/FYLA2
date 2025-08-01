using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Checkout;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;
using FYLA2_Backend.DTOs;
using System.Security.Claims;

namespace FYLA2_Backend.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  [Authorize]
  public class EnhancedPaymentController : ControllerBase
  {
    private readonly ApplicationDbContext _context;
    private readonly ILogger<EnhancedPaymentController> _logger;
    private readonly IConfiguration _configuration;

    public EnhancedPaymentController(
        ApplicationDbContext context,
        ILogger<EnhancedPaymentController> logger,
        IConfiguration configuration)
    {
      _context = context;
      _logger = logger;
      _configuration = configuration;

      // Configure Stripe
      StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"] ?? "sk_test_demo_key";
    }

    private string GetUserId()
    {
      return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new UnauthorizedAccessException();
    }

    // Create payment intent for booking
    [HttpPost("create-booking-payment")]
    public async Task<IActionResult> CreateBookingPayment([FromBody] CreateBookingPaymentDto request)
    {
      try
      {
        var userId = GetUserId();

        // Validate booking exists and belongs to user
        var booking = await _context.Bookings
            .Include(b => b.Service)
            .Include(b => b.Provider)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId && b.ClientId == userId);

        if (booking == null)
          return NotFound("Booking not found");

        // Calculate total amount (including any fees)
        var serviceAmount = booking.TotalPrice;
        var platformFee = Math.Round(serviceAmount * 0.03m, 2); // 3% platform fee
        var totalAmount = serviceAmount + platformFee;

        // Create Stripe Payment Intent
        var paymentIntentService = new PaymentIntentService();
        var paymentIntent = await paymentIntentService.CreateAsync(new PaymentIntentCreateOptions
        {
          Amount = (long)(totalAmount * 100), // Convert to cents
          Currency = "usd",
          PaymentMethodTypes = new List<string> { "card" },
          Metadata = new Dictionary<string, string>
                    {
                        { "booking_id", booking.Id.ToString() },
                        { "client_id", userId },
                        { "provider_id", booking.ProviderId },
                        { "service_amount", serviceAmount.ToString() },
                        { "platform_fee", platformFee.ToString() }
                    }
        });

        // Create payment record
        var payment = new PaymentRecord
        {
          BookingId = booking.Id,
          UserId = userId,
          Amount = totalAmount, // Store total amount including fees
          Currency = "usd",
          Status = PaymentStatus.Pending,
          Type = PaymentType.Booking,
          StripePaymentIntentId = paymentIntent.Id,
          Description = $"Payment for booking #{booking.Id}",
          CreatedAt = DateTime.UtcNow
        };

        _context.PaymentRecords.Add(payment);
        await _context.SaveChangesAsync();

        return Ok(new
        {
          paymentIntentId = paymentIntent.Id,
          clientSecret = paymentIntent.ClientSecret,
          amount = totalAmount,
          serviceAmount = serviceAmount,
          platformFee = platformFee,
          paymentId = payment.Id
        });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error creating booking payment");
        return StatusCode(500, "Error creating payment");
      }
    }

    // Confirm payment after successful Stripe processing
    [HttpPost("confirm-payment")]
    public async Task<IActionResult> ConfirmPayment([FromBody] ConfirmPaymentDto request)
    {
      try
      {
        var userId = GetUserId();

        // Find payment record
        var payment = await _context.PaymentRecords
            .Include(p => p.Booking)
            .FirstOrDefaultAsync(p => p.Id == request.PaymentId && p.UserId == userId);

        if (payment == null)
          return NotFound("Payment not found");

        // Verify with Stripe
        var paymentIntentService = new PaymentIntentService();
        var paymentIntent = await paymentIntentService.GetAsync(payment.StripePaymentIntentId);

        if (paymentIntent.Status == "succeeded")
        {
          // Update payment status
          payment.Status = PaymentStatus.Succeeded;
          payment.UpdatedAt = DateTime.UtcNow;
          payment.StripeChargeId = paymentIntent.Id;

          // Update booking status
          if (payment.Booking != null)
          {
            payment.Booking.Status = BookingStatus.Confirmed;
            payment.Booking.UpdatedAt = DateTime.UtcNow;
          }

          await _context.SaveChangesAsync();

          return Ok(new { success = true, message = "Payment confirmed successfully" });
        }
        else
        {
          payment.Status = PaymentStatus.Failed;
          await _context.SaveChangesAsync();
          return BadRequest("Payment was not successful");
        }
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error confirming payment");
        return StatusCode(500, "Error confirming payment");
      }
    }

    // Get payment history for user
    [HttpGet("history")]
    public async Task<IActionResult> GetPaymentHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
      try
      {
        var userId = GetUserId();

        var paymentsQuery = _context.PaymentRecords
            .Include(p => p.Booking!)
                .ThenInclude(b => b.Service)
            .Include(p => p.Booking!)
                .ThenInclude(b => b.Provider)
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt);

        var totalCount = await paymentsQuery.CountAsync();
        var payments = await paymentsQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var paymentHistory = payments.Select(p => new
        {
          id = p.Id,
          bookingId = p.BookingId,
          amount = p.Amount,
          currency = p.Currency,
          status = p.Status.ToString(),
          paymentType = p.Type.ToString(),
          description = p.Description,
          createdAt = p.CreatedAt,
          updatedAt = p.UpdatedAt,
          booking = p.Booking != null ? new
          {
            serviceName = p.Booking.Service?.Name,
            providerName = p.Booking.Provider != null ?
                    $"{p.Booking.Provider.FirstName} {p.Booking.Provider.LastName}" : null,
            bookingDate = p.Booking.BookingDate
          } : null
        }).ToList();

        return Ok(new
        {
          payments = paymentHistory,
          pagination = new
          {
            currentPage = page,
            pageSize = pageSize,
            totalCount = totalCount,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
          }
        });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error fetching payment history");
        return StatusCode(500, "Error fetching payment history");
      }
    }

    // Process refund
    [HttpPost("refund")]
    public async Task<IActionResult> ProcessRefund([FromBody] RefundRequestDto request)
    {
      try
      {
        var userId = GetUserId();

        // Find payment and validate
        var payment = await _context.PaymentRecords
            .Include(p => p.Booking)
            .FirstOrDefaultAsync(p => p.Id == request.PaymentId);

        if (payment == null)
          return NotFound("Payment not found");

        // Check if user is authorized (only the user who made payment can refund)
        if (payment.UserId != userId)
          return Forbid("Not authorized to refund this payment");

        if (payment.Status != PaymentStatus.Succeeded)
          return BadRequest("Payment is not eligible for refund");

        // Process refund with Stripe
        var refundService = new RefundService();
        var refund = await refundService.CreateAsync(new RefundCreateOptions
        {
          PaymentIntent = payment.StripePaymentIntentId,
          Amount = request.Amount.HasValue ? (long)(request.Amount.Value * 100) : null,
          Reason = request.Reason switch
          {
            "duplicate" => "duplicate",
            "fraudulent" => "fraudulent",
            _ => "requested_by_customer"
          },
          Metadata = new Dictionary<string, string>
                    {
                        { "payment_id", payment.Id.ToString() },
                        { "booking_id", payment.BookingId?.ToString() ?? "" },
                        { "reason", request.Reason ?? "customer_request" }
                    }
        });

        // Update payment status
        payment.Status = PaymentStatus.Refunded;
        payment.UpdatedAt = DateTime.UtcNow;
        payment.Description = $"{payment.Description} - Refunded: {request.Reason ?? "Customer request"}";

        // Update booking status
        if (payment.Booking != null)
        {
          payment.Booking.Status = BookingStatus.Cancelled;
          payment.Booking.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
          success = true,
          refundId = refund.Id,
          refundAmount = request.Amount ?? payment.Amount,
          message = "Refund processed successfully"
        });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error processing refund");
        return StatusCode(500, "Error processing refund");
      }
    }

    // Provider earnings summary
    [HttpGet("earnings")]
    public async Task<IActionResult> GetProviderEarnings([FromQuery] string period = "month")
    {
      try
      {
        var userId = GetUserId();

        // Verify user is a service provider
        var user = await _context.Users.FindAsync(userId);
        if (user == null || !user.IsServiceProvider)
          return NotFound("Service provider not found");

        DateTime startDate;
        switch (period.ToLower())
        {
          case "week":
            startDate = DateTime.Today.AddDays(-(int)DateTime.Today.DayOfWeek);
            break;
          case "year":
            startDate = new DateTime(DateTime.Today.Year, 1, 1);
            break;
          default: // month
            startDate = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
            break;
        }

        var endDate = period.ToLower() switch
        {
          "week" => startDate.AddDays(7),
          "year" => startDate.AddYears(1),
          _ => startDate.AddMonths(1)
        };

        // Calculate earnings from payment records
        var payments = await _context.PaymentRecords
            .Include(p => p.Booking)
            .Where(p => p.Booking != null &&
                       p.Booking.ProviderId == userId &&
                       p.Status == PaymentStatus.Succeeded &&
                       p.UpdatedAt >= startDate &&
                       p.UpdatedAt < endDate)
            .ToListAsync();

        var totalRevenue = payments.Sum(p => p.Amount);
        var totalPlatformFees = Math.Round(totalRevenue * 0.03m, 2); // 3% platform fee
        var netEarnings = totalRevenue - totalPlatformFees;
        var transactionCount = payments.Count;

        // Calculate commission breakdown
        var commissionRate = 0.03m; // 3% platform fee

        return Ok(new
        {
          period = period,
          startDate = startDate,
          endDate = endDate,
          totalRevenue = totalRevenue,
          platformFees = totalPlatformFees,
          netEarnings = netEarnings,
          transactionCount = transactionCount,
          commissionRate = commissionRate,
          averageTransactionValue = transactionCount > 0 ? totalRevenue / transactionCount : 0
        });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error fetching provider earnings");
        return StatusCode(500, "Error fetching earnings data");
      }
    }
  }

  // DTOs
  public class CreateBookingPaymentDto
  {
    public int BookingId { get; set; }
  }

  public class ConfirmPaymentDto
  {
    public int PaymentId { get; set; }
  }

  public class RefundRequestDto
  {
    public int PaymentId { get; set; }
    public decimal? Amount { get; set; } // Null for full refund
    public string? Reason { get; set; }
  }
}