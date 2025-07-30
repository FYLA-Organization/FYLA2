using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
  public class User : IdentityUser
  {
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Bio { get; set; }

    public string? ProfilePictureUrl { get; set; }

    public DateTime? DateOfBirth { get; set; }

    public bool IsServiceProvider { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<Booking> BookingsAsClient { get; set; } = new List<Booking>();
    public virtual ICollection<Booking> BookingsAsProvider { get; set; } = new List<Booking>();
    public virtual ICollection<Service> Services { get; set; } = new List<Service>();
    public virtual ICollection<Review> ReviewsGiven { get; set; } = new List<Review>();
    public virtual ICollection<Review> ReviewsReceived { get; set; } = new List<Review>();
    public virtual ICollection<Message> MessagesSent { get; set; } = new List<Message>();
    public virtual ICollection<Message> MessagesReceived { get; set; } = new List<Message>();
    public virtual ICollection<UserFollow> Following { get; set; } = new List<UserFollow>();
    public virtual ICollection<UserFollow> Followers { get; set; } = new List<UserFollow>();
    public virtual ICollection<Post> Posts { get; set; } = new List<Post>();
    public virtual ICollection<PostLike> PostLikes { get; set; } = new List<PostLike>();
    public virtual ICollection<PostBookmark> PostBookmarks { get; set; } = new List<PostBookmark>();
    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public virtual ICollection<CommentLike> CommentLikes { get; set; } = new List<CommentLike>();
    public virtual ServiceProvider? ServiceProvider { get; set; }
    public virtual PaymentSettings? PaymentSettings { get; set; }
  }
}
