using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
  public class ServiceProvider
  {
    [Key]
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string BusinessName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? BusinessDescription { get; set; }

    [MaxLength(500)]
    public string? BusinessAddress { get; set; }

    public string? BusinessPhone { get; set; }

    public string? BusinessEmail { get; set; }

    public string? BusinessWebsite { get; set; }

    public bool IsVerified { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual ICollection<Service> Services { get; set; } = new List<Service>();
    public virtual PaymentSettings? PaymentSettings { get; set; }
  }
}
