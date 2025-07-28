using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
  public enum BookingStatus
  {
    Pending,
    Confirmed,
    InProgress,
    Completed,
    Cancelled
  }

  public class Booking
  {
    public int Id { get; set; }

    [Required]
    public DateTime BookingDate { get; set; }

    [Required]
    public DateTime StartTime { get; set; }

    [Required]
    public DateTime EndTime { get; set; }

    [Required]
    public BookingStatus Status { get; set; } = BookingStatus.Pending;

    [MaxLength(500)]
    public string? Notes { get; set; }

    [Required]
    public decimal TotalPrice { get; set; }

    public string? PaymentIntentId { get; set; }

    public int DurationMinutes { get; set; }

    [MaxLength(50)]
    public string? PaymentMethod { get; set; } = "stripe";

    // Foreign Keys
    [Required]
    public string ClientId { get; set; } = string.Empty;

    [Required]
    public string ProviderId { get; set; } = string.Empty;

    [Required]
    public int ServiceId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User Client { get; set; } = null!;
    public virtual User Provider { get; set; } = null!;
    public virtual Service Service { get; set; } = null!;
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
  }
}
