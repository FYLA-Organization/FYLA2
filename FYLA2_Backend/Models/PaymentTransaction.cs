using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
  public class PaymentTransaction
  {
    [Key]
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    public string? ClientId { get; set; }

    public int? ProviderId { get; set; }

    public int? OriginalTransactionId { get; set; }

    public int? BookingId { get; set; }

    [Required]
    public string StripePaymentIntentId { get; set; } = string.Empty;

    public string? StripeChargeId { get; set; }

    [Required]
    public decimal Amount { get; set; }

    public decimal ServiceAmount { get; set; } = 0;

    public decimal TaxAmount { get; set; } = 0;

    public decimal PlatformFeeAmount { get; set; } = 0;

    [Required]
    public string Currency { get; set; } = "USD";

    [Required]
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    [Required]
    public PaymentType Type { get; set; } = PaymentType.Booking;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? FailureReason { get; set; }

    public decimal ServiceFee { get; set; } = 0;

    public decimal NetAmount { get; set; } = 0;

    public decimal? RefundAmount { get; set; }

    public DateTime? RefundedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual User? Client { get; set; }
    public virtual Models.ServiceProvider? Provider { get; set; }
    public virtual PaymentTransaction? OriginalTransaction { get; set; }
    public virtual ICollection<PaymentTransaction> RefundTransactions { get; set; } = new List<PaymentTransaction>();
    public virtual Booking? Booking { get; set; }
  }
}