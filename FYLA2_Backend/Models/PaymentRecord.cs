using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
  public enum PaymentStatus
  {
    Pending = 0,
    Processing = 1,
    Succeeded = 2,
    Failed = 3,
    Cancelled = 4,
    Refunded = 5,
    PartiallyRefunded = 6
  }

  public enum PaymentType
  {
    Subscription = 0,
    Booking = 1,
    OneTime = 2,
    Tip = 3,
    Refund = 4
  }

  public class PaymentRecord
  {
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    public int? SubscriptionId { get; set; }
    public int? BookingId { get; set; }

    [Required]
    public decimal Amount { get; set; }

    [Required]
    public string Currency { get; set; } = "USD";

    [Required]
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    [Required]
    public PaymentType Type { get; set; }

    public string? StripePaymentIntentId { get; set; }

    public string? StripeChargeId { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? FailureReason { get; set; }

    public decimal? RefundAmount { get; set; }
    public DateTime? RefundedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Subscription? Subscription { get; set; }
    public virtual Booking? Booking { get; set; }
  }
}
