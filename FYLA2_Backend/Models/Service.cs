using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
  public class Service
  {
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public decimal Price { get; set; }

    [Required]
    public int DurationMinutes { get; set; }

    // Alias for backwards compatibility
    public int Duration => DurationMinutes;

    public string? ImageUrl { get; set; }

    [Required]
    public string Category { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    // Foreign Keys
    [Required]
    public string ProviderId { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User Provider { get; set; } = null!;
    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
  }
}