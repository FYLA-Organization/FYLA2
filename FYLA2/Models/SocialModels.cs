using System.ComponentModel.DataAnnotations;

namespace FYLA2.Models
{
    public class SocialPost
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string UserId { get; set; } = "";
        public string UserName { get; set; } = "";
        public string UserAvatar { get; set; } = "";

        public string Content { get; set; } = "";
        public List<string> Images { get; set; } = new();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public int LikesCount { get; set; } = 0;
        public int CommentsCount { get; set; } = 0;
        public int SharesCount { get; set; } = 0;

        public bool IsLiked { get; set; } = false;
        public string? Location { get; set; }

        // Navigation properties
        public virtual List<SocialComment> Comments { get; set; } = new();
        public virtual List<SocialLike> Likes { get; set; } = new();
    }

    public class SocialStory
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string UserId { get; set; } = "";
        public string UserName { get; set; } = "";
        public string UserAvatar { get; set; } = "";

        public string MediaUrl { get; set; } = "";
        public string Thumbnail { get; set; } = "";
        public string MediaType { get; set; } = "image"; // image or video

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(1);

        public bool IsViewed { get; set; } = false;
        public int ViewsCount { get; set; } = 0;
    }

    public class SocialComment
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string PostId { get; set; } = "";
        public string UserId { get; set; } = "";
        public string UserName { get; set; } = "";
        public string UserAvatar { get; set; } = "";

        public string Content { get; set; } = "";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int LikesCount { get; set; } = 0;
        public bool IsLiked { get; set; } = false;

        // For nested replies
        public string? ParentCommentId { get; set; }
        public virtual List<SocialComment> Replies { get; set; } = new();

        // Navigation properties
        public virtual SocialPost? Post { get; set; }
        public virtual SocialComment? ParentComment { get; set; }
    }

    public class SocialLike
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string UserId { get; set; } = "";
        public string PostId { get; set; } = "";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual SocialPost? Post { get; set; }
    }

    public class SocialFollow
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string FollowerId { get; set; } = "";
        public string FollowingId { get; set; } = "";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
