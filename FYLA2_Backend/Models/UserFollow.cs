using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
  public class UserFollow
  {
    public int Id { get; set; }

    // Foreign Keys
    [Required]
    public string FollowerId { get; set; } = string.Empty;

    [Required]
    public string FollowingId { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User Follower { get; set; } = null!;
    public virtual User Following { get; set; } = null!;
  }
}
