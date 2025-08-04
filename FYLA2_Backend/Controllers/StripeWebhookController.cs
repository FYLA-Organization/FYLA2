using Microsoft.AspNetCore.Mvc;
using Stripe;
using Stripe.Checkout;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;
using Microsoft.EntityFrameworkCore;
using System.IO;
using System.Text;

namespace FYLA2_Backend.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  public class StripeWebhookController : ControllerBase
  {
    private readonly ApplicationDbContext _context;
    private readonly ILogger<StripeWebhookController> _logger;
    private readonly IConfiguration _configuration;
    private readonly string _webhookSecret;

    public StripeWebhookController(
        ApplicationDbContext context,
        ILogger<StripeWebhookController> logger,
        IConfiguration configuration)
    {
      _context = context;
      _logger = logger;
      _configuration = configuration;
      _webhookSecret = _configuration["Stripe:WebhookSecret"] ?? "whsec_test_webhook_secret";
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> HandleWebhook()
    {
      var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();

      try
      {
        var stripeEvent = EventUtility.ConstructEvent(
            json,
            Request.Headers["Stripe-Signature"],
            _webhookSecret
        );

        _logger.LogInformation($"Stripe webhook received: {stripeEvent.Type}");

        // Handle the event
        switch (stripeEvent.Type)
        {
          case Events.PaymentIntentSucceeded:
            await HandlePaymentIntentSucceeded(stripeEvent);
            break;

          case Events.PaymentIntentPaymentFailed:
            await HandlePaymentIntentFailed(stripeEvent);
            break;

          case Events.ChargeDisputeCreated:
            await HandleChargeDispute(stripeEvent);
            break;

          case Events.InvoicePaymentSucceeded:
            await HandleSubscriptionPayment(stripeEvent);
            break;

          default:
            _logger.LogInformation($"Unhandled event type: {stripeEvent.Type}");
            break;
        }

        return Ok();
      }
      catch (StripeException ex)
      {
        _logger.LogError(ex, "Stripe webhook signature verification failed");
        return BadRequest();
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error processing Stripe webhook");
        return StatusCode(500);
      }
    }

    private async Task HandlePaymentIntentSucceeded(Event stripeEvent)
    {
      var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
      if (paymentIntent == null) return;

      _logger.LogInformation($"Payment succeeded: {paymentIntent.Id}");

      // Find the payment record
      var payment = await _context.PaymentRecords
          .Include(p => p.Booking)
          .ThenInclude(b => b.Provider)
          .Include(p => p.Booking)
          .ThenInclude(b => b.Client)
          .FirstOrDefaultAsync(p => p.StripePaymentIntentId == paymentIntent.Id);

      if (payment != null)
      {
        // Update payment status
        payment.Status = PaymentStatus.Succeeded;
        payment.UpdatedAt = DateTime.UtcNow;
        payment.StripeChargeId = paymentIntent.LatestChargeId;

        // Update booking status
        if (payment.Booking != null)
        {
          payment.Booking.Status = BookingStatus.Confirmed;
          payment.Booking.UpdatedAt = DateTime.UtcNow;

          // TODO: Send push notification to provider
          await SendBookingConfirmationNotification(payment.Booking);
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation($"Payment record updated: {payment.Id}");
      }
    }

    private async Task HandlePaymentIntentFailed(Event stripeEvent)
    {
      var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
      if (paymentIntent == null) return;

      _logger.LogWarning($"Payment failed: {paymentIntent.Id}");

      var payment = await _context.PaymentRecords
          .Include(p => p.Booking)
          .FirstOrDefaultAsync(p => p.StripePaymentIntentId == paymentIntent.Id);

      if (payment != null)
      {
        payment.Status = PaymentStatus.Failed;
        payment.UpdatedAt = DateTime.UtcNow;
        payment.FailureReason = paymentIntent.LastPaymentError?.Message ?? "Payment failed";

        if (payment.Booking != null)
        {
          payment.Booking.Status = BookingStatus.Cancelled;
          payment.Booking.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation($"Payment failure recorded: {payment.Id}");
      }
    }

    private async Task HandleChargeDispute(Event stripeEvent)
    {
      var dispute = stripeEvent.Data.Object as Dispute;
      if (dispute == null) return;

      _logger.LogWarning($"Charge dispute received: {dispute.Id} for charge: {dispute.ChargeId}");

      // Find payment by charge ID
      var payment = await _context.PaymentRecords
          .FirstOrDefaultAsync(p => p.StripeChargeId == dispute.ChargeId);

      if (payment != null)
      {
        // Create a dispute record (you might want to create a Dispute model)
        payment.Description = $"{payment.Description} - DISPUTED: {dispute.Reason}";
        payment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // TODO: Notify admin about dispute
        _logger.LogWarning($"Dispute recorded for payment: {payment.Id}");
      }
    }

    private async Task HandleSubscriptionPayment(Event stripeEvent)
    {
      var invoice = stripeEvent.Data.Object as Invoice;
      if (invoice == null) return;

      _logger.LogInformation($"Subscription payment succeeded: {invoice.Id}");

      // Handle subscription payments if you implement subscription features
      // This is for future premium provider subscriptions
    }

    private async Task SendBookingConfirmationNotification(Booking booking)
    {
      try
      {
        // Create notification record
        var notification = new Notification
        {
          UserId = booking.ProviderId,
          Type = NotificationType.BookingConfirmed.ToString(),
          Title = "New Booking Confirmed!",
          Message = $"Payment confirmed for booking on {booking.BookingDate:MMM dd, yyyy} at {booking.BookingDate:HH:mm}",
          IsRead = false,
          CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        // TODO: Send actual push notification using your notification service
        _logger.LogInformation($"Booking confirmation notification created for provider: {booking.ProviderId}");
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, $"Failed to send booking confirmation notification for booking: {booking.Id}");
      }
    }
  }

  // Enum for notification types
  public enum NotificationType
  {
    BookingConfirmed,
    BookingCancelled,
    PaymentReceived,
    NewReview,
    PromotionalOffer
  }
}
