using FYLA2_Backend.Models;

namespace FYLA2_Backend.DTOs
{
  public class CreateSubscriptionDto
  {
    public SubscriptionTier Tier { get; set; }
    public string BillingInterval { get; set; } = "month"; // "month" or "year"
    public string SuccessUrl { get; set; } = string.Empty;
    public string CancelUrl { get; set; } = string.Empty;
  }

  public class CreateBookingPaymentDto
  {
    public int BookingId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string? Description { get; set; }
  }

  public class PaymentMethodDto
  {
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Last4 { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public int ExpMonth { get; set; }
    public int ExpYear { get; set; }
    public bool IsDefault { get; set; }
  }

  public class SubscriptionDto
  {
    public int Id { get; set; }
    public SubscriptionTier Tier { get; set; }
    public SubscriptionStatus Status { get; set; }
    public bool IsActive { get; set; }
    public bool IsTrialing { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? TrialEndDate { get; set; }
    public decimal MonthlyPrice { get; set; }
    public decimal? AnnualPrice { get; set; }
    public SubscriptionLimitsDto Limits { get; set; } = new();
    public List<string> Features { get; set; } = new();
  }

  public class SubscriptionLimitsDto
  {
    public int MaxServices { get; set; }
    public int MaxPhotosPerService { get; set; }
    public bool CanUseAdvancedAnalytics { get; set; }
    public bool CanUseCustomBranding { get; set; }
    public bool CanUseAutomatedMarketing { get; set; }
    public bool CanAcceptOnlinePayments { get; set; }
    public bool HasPrioritySupport { get; set; }
  }

  public class SubscriptionTierDto
  {
    public SubscriptionTier Tier { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal MonthlyPrice { get; set; }
    public decimal? AnnualPrice { get; set; }
    public List<string> Features { get; set; } = new();
    public SubscriptionLimitsDto Limits { get; set; } = new();
    public bool IsPopular { get; set; }
    public string? Badge { get; set; }
  }

  public class PaymentRecordDto
  {
    public int Id { get; set; }
    public string StripePaymentIntentId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public PaymentStatus Status { get; set; }
    public PaymentType Type { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public BookingDto? Booking { get; set; }
  }

  public class CreatePaymentIntentDto
  {
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string? Description { get; set; }
    public Dictionary<string, string> Metadata { get; set; } = new();
  }

  public class ConfirmPaymentDto
  {
    public string PaymentIntentId { get; set; } = string.Empty;
    public string PaymentMethodId { get; set; } = string.Empty;
  }

  public class RefundPaymentDto
  {
    public int PaymentRecordId { get; set; }
    public decimal? Amount { get; set; } // If null, full refund
    public string Reason { get; set; } = string.Empty;
  }

  public class StripeConfigDto
  {
    public string PublishableKey { get; set; } = string.Empty;
  }
}
