using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
  public enum PaymentStatus
  {
    Pending,
    Processing,
    Succeeded,
    Failed,
    Cancelled,
    Refunded
  }

  public class PaymentRecord
  {
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public decimal Amount { get; set; }

    [Required]
    public string Currency { get; set; } = "usd";

    [Required]
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    public string? StripePaymentIntentId { get; set; }

    public string? StripeChargeId { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? FailureReason { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
  }
}
