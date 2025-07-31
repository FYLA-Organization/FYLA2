using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
  public class Notification
  {
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; } = false;

    public string? RelatedId { get; set; } // ID of related entity (post, booking, etc.)

    public string? Type { get; set; } // Type of notification

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
  }
}
