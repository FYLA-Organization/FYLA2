using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
  public class PushToken
  {
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public string Token { get; set; } = string.Empty;

    [Required]
    public string Platform { get; set; } = string.Empty; // "expo", "fcm", "apns"

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    // Navigation property
    public virtual User User { get; set; } = null!;
  }
}
