using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
  public enum LoyaltyTransactionType
  {
    Earned,
    Redeemed,
    Expired,
    Bonus
  }

  public class LoyaltyTransaction
  {
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public string ProviderId { get; set; } = string.Empty;

    public int? BookingId { get; set; }

    [Required]
    public int Points { get; set; }

    [Required]
    public LoyaltyTransactionType TransactionType { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ExpiresAt { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual User Provider { get; set; } = null!;
    public virtual Booking? Booking { get; set; }
  }
}
