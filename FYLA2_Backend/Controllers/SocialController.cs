using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYLA2_Backend.Data;
using FYLA2_Backend.DTOs;
using FYLA2_Backend.Models;
using System.Security.Claims;

namespace FYLA2_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SocialControllerNew : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SocialControllerNew> _logger;

        public SocialControllerNew(ApplicationDbContext context, ILogger<SocialControllerNew> logger)
        {
            _context = context;
            _logger = logger;
        }

        private string GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        }

        // GET: api/social/feed
        [HttpGet("feed")]
        public async Task<ActionResult<FeedDto>> GetFeed(int page = 1, int pageSize = 10)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                
                var totalPosts = await _context.Posts.CountAsync();
                
                var posts = await _context.Posts
                    .Include(p => p.User)
                    .Include(p => p.Likes)
                    .Include(p => p.Comments)
                        .ThenInclude(c => c.User)
                    .Include(p => p.Comments)
                        .ThenInclude(c => c.Likes)
                    .Include(p => p.Bookmarks)
                    .OrderByDescending(p => p.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(p => new PostDto
                    {
                        Id = p.Id,
                        Content = p.Content,
                        ImageUrl = p.ImageUrl,
                        IsBusinessPost = p.IsBusinessPost,
                        UserId = p.UserId,
                        UserName = p.User.FirstName + " " + p.User.LastName,
                        UserProfilePicture = p.User.ProfilePictureUrl,
                        User = new UserDto
                        {
                            Id = p.User.Id,
                            FirstName = p.User.FirstName,
                            LastName = p.User.LastName,
                            Email = p.User.Email,
                            ProfilePictureUrl = p.User.ProfilePictureUrl,
                            IsServiceProvider = p.User.IsServiceProvider,
                            CreatedAt = p.User.CreatedAt
                        },
                        CreatedAt = p.CreatedAt,
                        LikesCount = p.Likes.Count,
                        CommentsCount = p.Comments.Count,
                        BookmarksCount = p.Bookmarks.Count,
                        IsLikedByCurrentUser = p.Likes.Any(l => l.UserId == currentUserId),
                        IsBookmarkedByCurrentUser = p.Bookmarks.Any(b => b.UserId == currentUserId),
                        Comments = p.Comments.OrderBy(c => c.IsPinned ? 0 : 1)
                            .ThenByDescending(c => c.CreatedAt)
                            .Take(3)
                            .Select(c => new CommentDto
                            {
                                Id = c.Id,
                                Content = c.Content,
                                IsPinned = c.IsPinned,
                                PostId = c.PostId,
                                UserId = c.UserId,
                                UserName = c.User.FirstName + " " + c.User.LastName,
                                UserProfilePicture = c.User.ProfilePictureUrl,
                                CreatedAt = c.CreatedAt,
                                LikesCount = c.Likes.Count,
                                IsLikedByCurrentUser = c.Likes.Any(l => l.UserId == currentUserId),
                                IsOwner = c.UserId == currentUserId
                            }).ToList()
                    })
                    .ToListAsync();

                return Ok(new FeedDto
                {
                    Posts = posts,
                    TotalCount = totalPosts,
                    HasMore = (page * pageSize) < totalPosts
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting social feed");
                return StatusCode(500, new { error = "Failed to load social feed" });
            }
        }

        // POST: api/social/posts/{postId}/like
        [HttpPost("posts/{postId}/like")]
        public async Task<ActionResult<SocialActionResponse>> LikePost(int postId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var existingLike = await _context.PostLikes
                    .FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == currentUserId);

                if (existingLike != null)
                {
                    _context.PostLikes.Remove(existingLike);
                }
                else
                {
                    _context.PostLikes.Add(new PostLike
                    {
                        PostId = postId,
                        UserId = currentUserId,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                await _context.SaveChangesAsync();

                var likesCount = await _context.PostLikes.CountAsync(l => l.PostId == postId);

                return Ok(new SocialActionResponse
                {
                    Success = true,
                    Message = existingLike != null ? "Post unliked" : "Post liked",
                    Count = likesCount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error liking post {PostId}", postId);
                return StatusCode(500, new SocialActionResponse { Success = false, Message = "Failed to like post" });
            }
        }

        // POST: api/social/posts/{postId}/bookmark
        [HttpPost("posts/{postId}/bookmark")]
        public async Task<ActionResult<SocialActionResponse>> BookmarkPost(int postId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var existingBookmark = await _context.PostBookmarks
                    .FirstOrDefaultAsync(b => b.PostId == postId && b.UserId == currentUserId);

                if (existingBookmark != null)
                {
                    _context.PostBookmarks.Remove(existingBookmark);
                }
                else
                {
                    _context.PostBookmarks.Add(new PostBookmark
                    {
                        PostId = postId,
                        UserId = currentUserId,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                await _context.SaveChangesAsync();

                return Ok(new SocialActionResponse
                {
                    Success = true,
                    Message = existingBookmark != null ? "Post unbookmarked" : "Post bookmarked"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error bookmarking post {PostId}", postId);
                return StatusCode(500, new SocialActionResponse { Success = false, Message = "Failed to bookmark post" });
            }
        }

        // POST: api/social/posts/{postId}/comments
        [HttpPost("posts/{postId}/comments")]
        public async Task<ActionResult<CommentDto>> CreateComment(int postId, CreateCommentDto createCommentDto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var comment = new Comment
                {
                    PostId = postId,
                    UserId = currentUserId,
                    Content = createCommentDto.Content,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Comments.Add(comment);
                await _context.SaveChangesAsync();

                // Reload with user info
                var createdComment = await _context.Comments
                    .Include(c => c.User)
                    .Include(c => c.Likes)
                    .FirstOrDefaultAsync(c => c.Id == comment.Id);

                if (createdComment == null)
                    return NotFound();

                var commentDto = new CommentDto
                {
                    Id = createdComment.Id,
                    Content = createdComment.Content,
                    IsPinned = createdComment.IsPinned,
                    PostId = createdComment.PostId,
                    UserId = createdComment.UserId,
                    UserName = createdComment.User.FirstName + " " + createdComment.User.LastName,
                    UserProfilePicture = createdComment.User.ProfilePictureUrl,
                    CreatedAt = createdComment.CreatedAt,
                    LikesCount = createdComment.Likes.Count,
                    IsLikedByCurrentUser = false,
                    IsOwner = true
                };

                return Ok(commentDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating comment for post {PostId}", postId);
                return StatusCode(500, new { error = "Failed to create comment" });
            }
        }

        // POST: api/social/comments/{commentId}/like
        [HttpPost("comments/{commentId}/like")]
        public async Task<ActionResult<SocialActionResponse>> LikeComment(int commentId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var existingLike = await _context.CommentLikes
                    .FirstOrDefaultAsync(l => l.CommentId == commentId && l.UserId == currentUserId);

                if (existingLike != null)
                {
                    _context.CommentLikes.Remove(existingLike);
                }
                else
                {
                    _context.CommentLikes.Add(new CommentLike
                    {
                        CommentId = commentId,
                        UserId = currentUserId,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                await _context.SaveChangesAsync();

                var likesCount = await _context.CommentLikes.CountAsync(l => l.CommentId == commentId);

                return Ok(new SocialActionResponse
                {
                    Success = true,
                    Message = existingLike != null ? "Comment unliked" : "Comment liked",
                    Count = likesCount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error liking comment {CommentId}", commentId);
                return StatusCode(500, new SocialActionResponse { Success = false, Message = "Failed to like comment" });
            }
        }

        // POST: api/social/comments/{commentId}/pin
        [HttpPost("comments/{commentId}/pin")]
        public async Task<ActionResult<SocialActionResponse>> PinComment(int commentId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var comment = await _context.Comments.FindAsync(commentId);
                if (comment == null)
                    return NotFound();

                // Only post owner can pin comments
                var post = await _context.Posts.FindAsync(comment.PostId);
                if (post == null || post.UserId != currentUserId)
                    return Forbid();

                comment.IsPinned = !comment.IsPinned;
                await _context.SaveChangesAsync();

                return Ok(new SocialActionResponse
                {
                    Success = true,
                    Message = comment.IsPinned ? "Comment pinned" : "Comment unpinned"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error pinning comment {CommentId}", commentId);
                return StatusCode(500, new SocialActionResponse { Success = false, Message = "Failed to pin comment" });
            }
        }

        // DELETE: api/social/comments/{commentId}
        [HttpDelete("comments/{commentId}")]
        public async Task<ActionResult<SocialActionResponse>> DeleteComment(int commentId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                var comment = await _context.Comments.FindAsync(commentId);
                if (comment == null)
                    return NotFound();

                // Only comment owner can delete
                if (comment.UserId != currentUserId)
                    return Forbid();

                _context.Comments.Remove(comment);
                await _context.SaveChangesAsync();

                return Ok(new SocialActionResponse
                {
                    Success = true,
                    Message = "Comment deleted"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting comment {CommentId}", commentId);
                return StatusCode(500, new SocialActionResponse { Success = false, Message = "Failed to delete comment" });
            }
        }

        // DEVELOPMENT ONLY: Seed sample posts
        [HttpPost("seed")]
        public async Task<IActionResult> SeedSamplePosts()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                // Check if posts already exist
                var existingPosts = await _context.Posts.AnyAsync();
                if (existingPosts)
                    return Ok(new { message = "Posts already exist, skipping seed" });

                // Create sample posts
                var samplePosts = new List<Post>
                {
                    new Post
                    {
                        UserId = userId,
                        Content = "Amazing hair transformation! ✨ #balayage #haircolor",
                        ImageUrl = "https://picsum.photos/400/400?random=1",
                        IsBusinessPost = true,
                        CreatedAt = DateTime.UtcNow.AddHours(-1),
                        UpdatedAt = DateTime.UtcNow.AddHours(-1)
                    },
                    new Post
                    {
                        UserId = userId,
                        Content = "Fresh nail art for the weekend! 💅 #nailart #weekend",
                        ImageUrl = "https://picsum.photos/400/400?random=2",
                        IsBusinessPost = true,
                        CreatedAt = DateTime.UtcNow.AddHours(-2),
                        UpdatedAt = DateTime.UtcNow.AddHours(-2)
                    },
                    new Post
                    {
                        UserId = userId,
                        Content = "Glowing skin after our signature facial treatment! ✨ #skincare #facial",
                        ImageUrl = "https://picsum.photos/400/400?random=3",
                        IsBusinessPost = true,
                        CreatedAt = DateTime.UtcNow.AddHours(-3),
                        UpdatedAt = DateTime.UtcNow.AddHours(-3)
                    }
                };

                _context.Posts.AddRange(samplePosts);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Sample posts created successfully", count = samplePosts.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error seeding sample posts");
                return StatusCode(500, new { error = "Failed to seed posts" });
            }
        }
    }
}
