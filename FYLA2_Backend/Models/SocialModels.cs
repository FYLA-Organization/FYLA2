using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
  public class Post
  {
    public int Id { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Content { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    // Foreign Keys
    [Required]
    public string UserId { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual ICollection<PostLike> Likes { get; set; } = new List<PostLike>();
    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
  }

  public class PostLike
  {
    public int Id { get; set; }

    // Foreign Keys
    [Required]
    public int PostId { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Post Post { get; set; } = null!;
    public virtual User User { get; set; } = null!;
  }

  public class Comment
  {
    public int Id { get; set; }

    [Required]
    [MaxLength(500)]
    public string Content { get; set; } = string.Empty;

    // Foreign Keys
    [Required]
    public int PostId { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Post Post { get; set; } = null!;
    public virtual User User { get; set; } = null!;
  }
}
