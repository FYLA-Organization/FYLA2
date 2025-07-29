using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
  public enum TransactionType
  {
    Payment = 0,
    Refund = 1,
    PartialRefund = 2,
    Deposit = 3,
    FinalPayment = 4,
    Fee = 5
  }

  public class PaymentTransaction
  {
    public int Id { get; set; }

    [Required]
    public int BookingId { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty; // Client who made the payment

    [Required]
    public string ProviderId { get; set; } = string.Empty; // Provider receiving the payment

    [Required]
    public TransactionType Type { get; set; }

    [Required]
    public PaymentMethod PaymentMethod { get; set; }

    [Required]
    public decimal Amount { get; set; }

    [Required]
    public decimal ServiceAmount { get; set; } // Amount for the service (before tax/fees)

    [Required]
    public decimal TaxAmount { get; set; } = 0;

    [Required]
    public decimal PlatformFeeAmount { get; set; } = 0;

    [Required]
    public string Currency { get; set; } = "USD";

    [Required]
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    // External payment system IDs
    public string? StripePaymentIntentId { get; set; }
    public string? StripeChargeId { get; set; }
    public string? PayPalTransactionId { get; set; }
    public string? ExternalTransactionId { get; set; }

    // For refunds - reference to original transaction
    public int? OriginalTransactionId { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? FailureReason { get; set; }

    public DateTime? ProcessedAt { get; set; }
    public DateTime? RefundedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Booking Booking { get; set; } = null!;
    public virtual User Client { get; set; } = null!;
    public virtual User Provider { get; set; } = null!;
    public virtual PaymentTransaction? OriginalTransaction { get; set; }
    public virtual ICollection<PaymentTransaction> RefundTransactions { get; set; } = new List<PaymentTransaction>();
  }
}
