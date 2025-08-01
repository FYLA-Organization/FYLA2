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
  public class PaymentController : ControllerBase
  {
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PaymentController> _logger;
    private readonly IConfiguration _configuration;

    public PaymentController(
        ApplicationDbContext context,
        ILogger<PaymentController> logger,
        IConfiguration configuration)
    {
      _context = context;
      _logger = logger;
      _configuration = configuration;

      // Configure Stripe
      StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"];
    }

    private string GetUserId()
    {
      return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new UnauthorizedAccessException();
    }

    [HttpPost("create-subscription")]
    public async Task<IActionResult> CreateSubscription([FromBody] CreateSubscriptionDto request)
    {
      try
      {
        var userId = GetUserId();
        var user = await _context.Users.FindAsync(userId);

        if (user == null)
          return NotFound("User not found");

        // Check if user already has an active subscription
        var existingSubscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.IsActive);

        if (existingSubscription != null)
          return BadRequest("User already has an active subscription");

        // Get subscription tier configuration
        var tierConfig = SubscriptionTierConfig.Configs[request.Tier];

        // Create Stripe customer if doesn't exist
        var customerService = new CustomerService();
        var customer = await customerService.CreateAsync(new CustomerCreateOptions
        {
          Email = user.Email,
          Name = $"{user.FirstName} {user.LastName}",
          Metadata = new Dictionary<string, string>
                    {
                        { "user_id", userId }
                    }
        });

        // Create checkout session
        var sessionService = new SessionService();
        var options = new SessionCreateOptions
        {
          Customer = customer.Id,
          PaymentMethodTypes = new List<string> { "card" },
          Mode = "subscription",
          LineItems = new List<SessionLineItemOptions>
                    {
                        new SessionLineItemOptions
                        {
                            Price = GetStripePriceId(request.Tier, request.BillingInterval),
                            Quantity = 1,
                        }
                    },
          SuccessUrl = $"{request.SuccessUrl}?session_id={{CHECKOUT_SESSION_ID}}",
          CancelUrl = request.CancelUrl,
          Metadata = new Dictionary<string, string>
                    {
                        { "user_id", userId },
                        { "subscription_tier", request.Tier.ToString() }
                    }
        };

        var session = await sessionService.CreateAsync(options);

        // Create pending subscription record
        var subscription = new FYLA2_Backend.Models.Subscription
        {
          UserId = userId,
          Tier = request.Tier,
          Status = SubscriptionStatus.Inactive,
          StripeCustomerId = customer.Id,
          MonthlyPrice = tierConfig.MonthlyPrice,
          AnnualPrice = tierConfig.AnnualPrice,
          MaxServices = tierConfig.MaxServices,
          MaxPhotosPerService = tierConfig.MaxPhotosPerService,
          CanUseAdvancedAnalytics = tierConfig.CanUseAdvancedAnalytics,
          CanUseCustomBranding = tierConfig.CanUseCustomBranding,
          CanUseAutomatedMarketing = tierConfig.CanUseAutomatedMarketing,
          CanAcceptOnlinePayments = tierConfig.CanAcceptOnlinePayments,
          HasPrioritySupport = tierConfig.HasPrioritySupport
        };

        _context.Subscriptions.Add(subscription);
        await _context.SaveChangesAsync();

        return Ok(new
        {
          sessionId = session.Id,
          sessionUrl = session.Url,
          subscriptionId = subscription.Id
        });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error creating subscription for user {UserId}", GetUserId());
        return StatusCode(500, new { error = "Failed to create subscription", details = ex.Message });
      }
    }

    [HttpPost("create-booking-payment")]
    public async Task<IActionResult> CreateBookingPayment([FromBody] CreateBookingPaymentDto request)
    {
      try
      {
        var userId = GetUserId();
        var booking = await _context.Bookings
            .Include(b => b.Service)
            .Include(b => b.Provider)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId);

        if (booking == null)
          return NotFound("Booking not found");

        if (booking.ClientId != userId && booking.ProviderId != userId)
          return Forbid("Not authorized to process payment for this booking");

        // Create payment intent
        var paymentIntentService = new PaymentIntentService();
        var amount = (long)(booking.TotalPrice * 100); // Convert to cents

        var paymentIntent = await paymentIntentService.CreateAsync(new PaymentIntentCreateOptions
        {
          Amount = amount,
          Currency = "usd",
          Metadata = new Dictionary<string, string>
                    {
                        { "booking_id", request.BookingId.ToString() },
                        { "user_id", userId },
                        { "type", "booking" }
                    }
        });

        // Create payment record
        var paymentRecord = new PaymentRecord
        {
          UserId = userId,
          BookingId = request.BookingId,
          StripePaymentIntentId = paymentIntent.Id,
          Amount = booking.TotalPrice,
          Currency = "USD",
          Status = PaymentStatus.Pending,
          Type = PaymentType.Booking,
          Description = $"Payment for {booking.Service?.Name ?? "Service"}"
        };

        _context.PaymentRecords.Add(paymentRecord);
        await _context.SaveChangesAsync();

        return Ok(new
        {
          clientSecret = paymentIntent.ClientSecret,
          paymentIntentId = paymentIntent.Id,
          paymentRecordId = paymentRecord.Id
        });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error creating booking payment for booking {BookingId}", request.BookingId);
        return StatusCode(500, new { error = "Failed to create payment", details = ex.Message });
      }
    }

    [HttpGet("subscription")]
    public async Task<IActionResult> GetUserSubscription()
    {
      try
      {
        var userId = GetUserId();
        var subscription = await _context.Subscriptions
            .Include(s => s.Features)
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (subscription == null)
        {
          // Return free tier configuration
          var freeConfig = SubscriptionTierConfig.Configs[SubscriptionTier.Free];
          return Ok(new
          {
            tier = SubscriptionTier.Free,
            status = SubscriptionStatus.Active,
            isActive = true,
            config = freeConfig,
            features = freeConfig.Features
          });
        }

        var config = SubscriptionTierConfig.Configs[subscription.Tier];

        return Ok(new
        {
          id = subscription.Id,
          tier = subscription.Tier,
          status = subscription.Status,
          isActive = subscription.IsActive,
          isTrialing = subscription.IsTrialing,
          startDate = subscription.StartDate,
          endDate = subscription.EndDate,
          trialEndDate = subscription.TrialEndDate,
          monthlyPrice = subscription.MonthlyPrice,
          annualPrice = subscription.AnnualPrice,
          config = config,
          features = config.Features,
          limits = new
          {
            maxServices = subscription.MaxServices,
            maxPhotosPerService = subscription.MaxPhotosPerService,
            canUseAdvancedAnalytics = subscription.CanUseAdvancedAnalytics,
            canUseCustomBranding = subscription.CanUseCustomBranding,
            canUseAutomatedMarketing = subscription.CanUseAutomatedMarketing,
            canAcceptOnlinePayments = subscription.CanAcceptOnlinePayments,
            hasPrioritySupport = subscription.HasPrioritySupport
          }
        });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting subscription for user {UserId}", GetUserId());
        return StatusCode(500, new { error = "Failed to get subscription", details = ex.Message });
      }
    }

    [HttpGet("subscription-tiers")]
    [AllowAnonymous]
    public IActionResult GetSubscriptionTiers()
    {
      try
      {
        var tiers = SubscriptionTierConfig.Configs.Select(kvp => new
        {
          tier = kvp.Key,
          name = kvp.Value.Name,
          description = kvp.Value.Description,
          monthlyPrice = kvp.Value.MonthlyPrice,
          annualPrice = kvp.Value.AnnualPrice,
          features = kvp.Value.Features,
          limits = new
          {
            maxServices = kvp.Value.MaxServices == int.MaxValue ? "Unlimited" : kvp.Value.MaxServices.ToString(),
            maxPhotosPerService = kvp.Value.MaxPhotosPerService == int.MaxValue ? "Unlimited" : kvp.Value.MaxPhotosPerService.ToString(),
            canUseAdvancedAnalytics = kvp.Value.CanUseAdvancedAnalytics,
            canUseCustomBranding = kvp.Value.CanUseCustomBranding,
            canUseAutomatedMarketing = kvp.Value.CanUseAutomatedMarketing,
            canAcceptOnlinePayments = kvp.Value.CanAcceptOnlinePayments,
            hasPrioritySupport = kvp.Value.HasPrioritySupport
          }
        }).ToList();

        return Ok(tiers);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting subscription tiers");
        return StatusCode(500, new { error = "Failed to get subscription tiers", details = ex.Message });
      }
    }

    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> StripeWebhook()
    {
      try
      {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var endpointSecret = _configuration["Stripe:WebhookSecret"];

        var stripeEvent = EventUtility.ConstructEvent(
            json,
            Request.Headers["Stripe-Signature"],
            endpointSecret
        );

        _logger.LogInformation("Received Stripe webhook: {EventType}", stripeEvent.Type);

        switch (stripeEvent.Type)
        {
          case "checkout.session.completed":
            await HandleCheckoutSessionCompleted(stripeEvent);
            break;
          case "invoice.payment_succeeded":
            await HandleInvoicePaymentSucceeded(stripeEvent);
            break;
          case "invoice.payment_failed":
            await HandleInvoicePaymentFailed(stripeEvent);
            break;
          case "customer.subscription.deleted":
            await HandleSubscriptionDeleted(stripeEvent);
            break;
          case "payment_intent.succeeded":
            await HandlePaymentIntentSucceeded(stripeEvent);
            break;
          default:
            _logger.LogInformation("Unhandled webhook event type: {EventType}", stripeEvent.Type);
            break;
        }

        return Ok();
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error processing Stripe webhook");
        return BadRequest();
      }
    }

    private async Task HandleCheckoutSessionCompleted(Stripe.Event stripeEvent)
    {
      var session = stripeEvent.Data.Object as Session;
      if (session?.Metadata.TryGetValue("user_id", out var userId) == true)
      {
        var subscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.StripeCustomerId == session.CustomerId);

        if (subscription != null)
        {
          subscription.Status = SubscriptionStatus.Active;
          subscription.StartDate = DateTime.UtcNow;
          subscription.StripeSubscriptionId = session.SubscriptionId;
          subscription.UpdatedAt = DateTime.UtcNow;

          await _context.SaveChangesAsync();
          _logger.LogInformation("Activated subscription for user {UserId}", userId);
        }
      }
    }

    private async Task HandlePaymentIntentSucceeded(Stripe.Event stripeEvent)
    {
      var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
      if (paymentIntent != null)
      {
        var paymentRecord = await _context.PaymentRecords
            .FirstOrDefaultAsync(p => p.StripePaymentIntentId == paymentIntent.Id);

        if (paymentRecord != null)
        {
          paymentRecord.Status = PaymentStatus.Succeeded;
          paymentRecord.UpdatedAt = DateTime.UtcNow;

          // Update booking status if it's a booking payment
          if (paymentRecord.BookingId.HasValue)
          {
            var booking = await _context.Bookings.FindAsync(paymentRecord.BookingId.Value);
            if (booking != null)
            {
              booking.Status = BookingStatus.Confirmed;
              booking.UpdatedAt = DateTime.UtcNow;
            }
          }

          await _context.SaveChangesAsync();
          _logger.LogInformation("Payment succeeded for PaymentIntent {PaymentIntentId}", paymentIntent.Id);
        }
      }
    }

    private async Task HandleInvoicePaymentSucceeded(Stripe.Event stripeEvent)
    {
      // Handle recurring subscription payments
      _logger.LogInformation("Invoice payment succeeded");
    }

    private async Task HandleInvoicePaymentFailed(Stripe.Event stripeEvent)
    {
      // Handle failed subscription payments
      _logger.LogWarning("Invoice payment failed");
    }

    private async Task HandleSubscriptionDeleted(Stripe.Event stripeEvent)
    {
      var stripeSubscription = stripeEvent.Data.Object as Stripe.Subscription;
      if (stripeSubscription != null)
      {
        var subscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.StripeSubscriptionId == stripeSubscription.Id);

        if (subscription != null)
        {
          subscription.Status = SubscriptionStatus.Cancelled;
          subscription.EndDate = DateTime.UtcNow;
          subscription.UpdatedAt = DateTime.UtcNow;

          await _context.SaveChangesAsync();
          _logger.LogInformation("Cancelled subscription {SubscriptionId}", subscription.Id);
        }
      }
    }

    private string GetStripePriceId(SubscriptionTier tier, string billingInterval)
    {
      // In a real app, these would be stored in configuration
      return tier switch
      {
        SubscriptionTier.Basic => billingInterval == "year" ? "price_basic_annual" : "price_basic_monthly",
        SubscriptionTier.Premium => billingInterval == "year" ? "price_premium_annual" : "price_premium_monthly",
        SubscriptionTier.Enterprise => billingInterval == "year" ? "price_enterprise_annual" : "price_enterprise_monthly",
        _ => throw new ArgumentException("Invalid subscription tier")
      };
    }
  }
}
