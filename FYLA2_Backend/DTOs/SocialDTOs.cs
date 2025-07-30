using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.DTOs
{
    // Post DTOs
    public class CreatePostDto
    {
        [Required]
        [MaxLength(1000)]
        public string Content { get; set; } = string.Empty;

        public string? ImageUrl { get; set; }

        public bool IsBusinessPost { get; set; } = false;
    }

    public class PostDto
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public string? Caption { get; set; }
        public string? ImageUrl { get; set; }
        public string? Location { get; set; }
        public bool IsBusinessPost { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string UserFirstName { get; set; } = string.Empty;
        public string UserLastName { get; set; } = string.Empty;
        public string? UserProfilePicture { get; set; }
        public UserDto? User { get; set; }
        public DateTime CreatedAt { get; set; }
        public int LikesCount { get; set; }
        public int CommentsCount { get; set; }
        public int BookmarksCount { get; set; }
        public bool IsLikedByCurrentUser { get; set; }
        public bool IsBookmarkedByCurrentUser { get; set; }
        public List<CommentDto> Comments { get; set; } = new List<CommentDto>();
    }

    // Comment DTOs
    public class CreateCommentDto
    {
        [Required]
        public int PostId { get; set; }

        [Required]
        [MaxLength(500)]
        public string Content { get; set; } = string.Empty;
    }

    public class CommentDto
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool IsPinned { get; set; }
        public int PostId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string? UserProfilePicture { get; set; }
        public DateTime CreatedAt { get; set; }
        public int LikesCount { get; set; }
        public bool IsLikedByCurrentUser { get; set; }
        public bool IsOwner { get; set; }
    }

    // Like DTOs
    public class LikePostDto
    {
        [Required]
        public int PostId { get; set; }
    }

    public class LikeCommentDto
    {
        [Required]
        public int CommentId { get; set; }
    }

    public class PinCommentDto
    {
        [Required]
        public int CommentId { get; set; }
    }

    // Bookmark DTOs
    public class BookmarkPostDto
    {
        [Required]
        public int PostId { get; set; }
    }

    public class DeleteCommentDto
    {
        [Required]
        public int CommentId { get; set; }
    }

    // Feed DTOs
    public class FeedDto
    {
        public List<PostDto> Posts { get; set; } = new List<PostDto>();
        public int TotalCount { get; set; }
        public bool HasMore { get; set; }
    }

    // Response DTOs
    public class SocialActionResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int? Count { get; set; }
    }

    // User Profile DTOs
    public class UserProfileDto
    {
        public string Id { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public bool IsServiceProvider { get; set; }
        public DateTime CreatedAt { get; set; }
        public int PostsCount { get; set; }
        public int FollowersCount { get; set; }
        public int FollowingCount { get; set; }
        public bool IsVerified { get; set; }
        public bool IsFollowedByCurrentUser { get; set; }
    }

    public class FollowResponseDto
    {
        public bool IsFollowing { get; set; }
        public int FollowersCount { get; set; }
    }

    // Enhanced Post DTO
    public class PostDtoEnhanced : PostDto
    {
        public List<string> Tags { get; set; } = new List<string>();
    }
}