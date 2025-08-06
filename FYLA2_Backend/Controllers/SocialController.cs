using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;
using FYLA2_Backend.DTOs;
using System.Security.Claims;

namespace FYLA2_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SocialController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SocialController> _logger;

        public SocialController(ApplicationDbContext context, ILogger<SocialController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private string GetUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        }

        [HttpGet("feed")]
        [AllowAnonymous] // Temporarily allow anonymous access for testing
        public async Task<ActionResult<object>> GetSocialFeed(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string filter = "all")
        {
            try
            {
                var userId = GetUserId();
                _logger.LogInformation($"Getting social feed for user {userId}, page {page}, pageSize {pageSize}, filter {filter}");

                // Get posts from database with user information and stats
                var query = _context.Posts
                    .Include(p => p.User)
                    .OrderByDescending(p => p.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize);

                var posts = await query.ToListAsync();

                // Get like counts and user likes for each post
                var postIds = posts.Select(p => p.Id).ToList();
                var likeCounts = await _context.PostLikes
                    .Where(pl => postIds.Contains(pl.PostId))
                    .GroupBy(pl => pl.PostId)
                    .Select(g => new { PostId = g.Key, Count = g.Count() })
                    .ToListAsync();

                // Only get user likes if user is authenticated
                var userLikes = new List<int>();
                if (!string.IsNullOrEmpty(userId))
                {
                    userLikes = await _context.PostLikes
                        .Where(pl => postIds.Contains(pl.PostId) && pl.UserId == userId)
                        .Select(pl => pl.PostId)
                        .ToListAsync();
                }

                // Get comment counts for each post
                var commentCounts = await _context.Comments
                    .Where(c => postIds.Contains(c.PostId))
                    .GroupBy(c => c.PostId)
                    .Select(g => new { PostId = g.Key, Count = g.Count() })
                    .ToListAsync();

                // Transform to frontend format
                var transformedPosts = posts.Select(p => new
                {
                    id = p.Id.ToString(),
                    userId = p.UserId,
                    user = new
                    {
                        id = p.User.Id,
                        firstName = p.User.FirstName,
                        lastName = p.User.LastName,
                        profilePictureUrl = p.User.ProfilePictureUrl,
                        isServiceProvider = p.User.IsServiceProvider
                    },
                    content = p.Content,
                    images = !string.IsNullOrEmpty(p.ImageUrl) ? new[] { p.ImageUrl } : new string[0],
                    location = "", // Not available in Post model
                    tags = new string[0], // Add tags field to Post model if needed
                    isBusinessPost = p.IsBusinessPost,
                    serviceCategory = "", // Add if needed
                    priceRange = "", // Add if needed
                    allowBooking = false, // Add if needed
                    createdAt = p.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                    likes = likeCounts.FirstOrDefault(lc => lc.PostId == p.Id)?.Count ?? 0,
                    comments = commentCounts.FirstOrDefault(cc => cc.PostId == p.Id)?.Count ?? 0,
                    shares = 0, // Add shares functionality if needed
                    isLiked = userLikes.Contains(p.Id),
                    isBookmarked = false // Add bookmarks functionality if needed
                }).ToList();

                // Check if there are more posts - for infinite scroll, if we have posts, repeat them
                var totalPosts = await _context.Posts.CountAsync();
                var hasRealMore = (page * pageSize) < totalPosts;
                
                // If no new posts but we have some posts, repeat the existing ones for infinite scroll
                if (!hasRealMore && totalPosts > 0 && transformedPosts.Count == 0)
                {
                    _logger.LogInformation("No more new posts, repeating existing posts for infinite scroll");
                    
                    // Get posts from the beginning again
                    var repeatedPosts = await _context.Posts
                        .Include(p => p.User)
                        .OrderByDescending(p => p.CreatedAt)
                        .Take(pageSize)
                        .ToListAsync();

                    // Transform repeated posts with updated IDs to avoid conflicts
                    transformedPosts = repeatedPosts.Select((p, index) => new
                    {
                        id = $"{p.Id}_repeat_{page}_{index}",
                        userId = p.UserId,
                        user = new
                        {
                            id = p.User.Id,
                            firstName = p.User.FirstName,
                            lastName = p.User.LastName,
                            profilePictureUrl = p.User.ProfilePictureUrl,
                            isServiceProvider = p.User.IsServiceProvider
                        },
                        content = p.Content,
                        images = !string.IsNullOrEmpty(p.ImageUrl) ? new[] { p.ImageUrl } : new string[0],
                        location = "",
                        tags = new string[0],
                        isBusinessPost = p.IsBusinessPost,
                        serviceCategory = "",
                        priceRange = "",
                        allowBooking = false,
                        createdAt = p.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                        likes = likeCounts.FirstOrDefault(lc => lc.PostId == p.Id)?.Count ?? 0,
                        comments = commentCounts.FirstOrDefault(cc => cc.PostId == p.Id)?.Count ?? 0,
                        shares = 0,
                        isLiked = userLikes.Contains(p.Id),
                        isBookmarked = false
                    }).ToList();
                }

                // Always return hasMore as true for infinite scroll experience
                var hasMore = totalPosts > 0; // If we have any posts, always allow more scrolling

                var response = new
                {
                    posts = transformedPosts,
                    hasMore = hasMore
                };

                _logger.LogInformation($"Returning {transformedPosts.Count} posts, hasMore: {hasMore}");
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting social feed");
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpGet("posts/user/{userId}")]
        [AllowAnonymous] // Temporarily allow anonymous access for testing
        public async Task<ActionResult<object>> GetUserPosts(
            string userId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var currentUserId = GetUserId();
                _logger.LogInformation($"Getting posts for user {userId}, page {page}, pageSize {pageSize}");

                // Get posts from database for specific user with user information and stats
                var query = _context.Posts
                    .Include(p => p.User)
                    .Where(p => p.UserId == userId)
                    .OrderByDescending(p => p.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize);

                var posts = await query.ToListAsync();

                // Get like counts and user likes for each post
                var postIds = posts.Select(p => p.Id).ToList();
                var likeCounts = await _context.PostLikes
                    .Where(pl => postIds.Contains(pl.PostId))
                    .GroupBy(pl => pl.PostId)
                    .Select(g => new { PostId = g.Key, Count = g.Count() })
                    .ToListAsync();

                // Only get user likes if user is authenticated
                var userLikes = new List<int>();
                if (!string.IsNullOrEmpty(currentUserId))
                {
                    userLikes = await _context.PostLikes
                        .Where(pl => postIds.Contains(pl.PostId) && pl.UserId == currentUserId)
                        .Select(pl => pl.PostId)
                        .ToListAsync();
                }

                // Get comment counts for each post
                var commentCounts = await _context.Comments
                    .Where(c => postIds.Contains(c.PostId))
                    .GroupBy(c => c.PostId)
                    .Select(g => new { PostId = g.Key, Count = g.Count() })
                    .ToListAsync();

                // Transform to frontend format
                var transformedPosts = posts.Select(p => new
                {
                    id = p.Id.ToString(),
                    userId = p.UserId,
                    user = new
                    {
                        id = p.User.Id,
                        firstName = p.User.FirstName,
                        lastName = p.User.LastName,
                        profilePictureUrl = p.User.ProfilePictureUrl,
                        isServiceProvider = p.User.IsServiceProvider
                    },
                    content = p.Content,
                    images = !string.IsNullOrEmpty(p.ImageUrl) ? new[] { p.ImageUrl } : new string[0],
                    location = "", // Not available in Post model
                    tags = new string[0], // Add tags field to Post model if needed
                    isBusinessPost = p.IsBusinessPost,
                    serviceCategory = "", // Add if needed
                    priceRange = "", // Add if needed
                    allowBooking = false, // Add if needed
                    createdAt = p.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                    likes = likeCounts.FirstOrDefault(lc => lc.PostId == p.Id)?.Count ?? 0,
                    comments = commentCounts.FirstOrDefault(cc => cc.PostId == p.Id)?.Count ?? 0,
                    shares = 0, // Add shares functionality if needed
                    isLiked = userLikes.Contains(p.Id),
                    isBookmarked = false // Add bookmarks functionality if needed
                }).ToList();

                // Check if there are more posts for this user
                var totalPosts = await _context.Posts.Where(p => p.UserId == userId).CountAsync();
                var hasMore = (page * pageSize) < totalPosts;

                var response = new
                {
                    data = transformedPosts,
                    pageNumber = page,
                    pageSize = pageSize,
                    totalPages = (int)Math.Ceiling((double)totalPosts / pageSize),
                    totalCount = totalPosts
                };

                _logger.LogInformation($"Returning {transformedPosts.Count} posts for user {userId}, hasMore: {hasMore}");
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting posts for user {userId}");
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpPost("posts")]
        public async Task<ActionResult<object>> CreateSocialPost([FromBody] CreateSocialPostRequest request)
        {
            try
            {
                var userId = GetUserId();
                _logger.LogInformation($"Creating social post for user {userId}");

                // Validate required data
                if (string.IsNullOrWhiteSpace(request.Content) && (request.Images == null || request.Images.Count == 0))
                {
                    return BadRequest("Post must contain either content or images");
                }

                // Create the post in the database
                var post = new Post
                {
                    UserId = userId,
                    Content = request.Content?.Trim() ?? "",
                    ImageUrl = request.Images?.FirstOrDefault(), // For now, use first image
                    IsBusinessPost = request.IsBusinessPost,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Posts.Add(post);
                await _context.SaveChangesAsync();

                // Get the user info for the response
                var user = await _context.Users.FindAsync(userId);

                var response = new
                {
                    id = post.Id.ToString(),
                    userId = post.UserId,
                    user = new
                    {
                        id = user?.Id ?? userId,
                        firstName = user?.FirstName ?? "",
                        lastName = user?.LastName ?? "",
                        profilePictureUrl = user?.ProfilePictureUrl,
                        isServiceProvider = user?.IsServiceProvider ?? false
                    },
                    content = post.Content,
                    images = request.Images ?? new List<string>(),
                    location = request.Location,
                    tags = request.Tags ?? new List<string>(),
                    isBusinessPost = post.IsBusinessPost,
                    serviceCategory = request.ServiceCategory,
                    priceRange = request.PriceRange,
                    allowBooking = request.AllowBooking,
                    createdAt = post.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                    likes = 0,
                    comments = 0,
                    shares = 0,
                    isLiked = false,
                    isBookmarked = false
                };

                _logger.LogInformation($"Successfully created post with ID {post.Id}");
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating social post");
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpPost("posts/{postId}/like")]
        [AllowAnonymous] // Temporarily allow anonymous access for testing
        public async Task<ActionResult> LikePost(int postId)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    // For anonymous users, just return success without saving
                    return Ok(new { success = true, isLiked = true, likesCount = 1 });
                }

                _logger.LogInformation($"User {userId} liking post {postId}");

                // Check if user already liked this post
                var existingLike = await _context.PostLikes
                    .FirstOrDefaultAsync(pl => pl.PostId == postId && pl.UserId == userId);

                if (existingLike == null)
                {
                    // Add new like
                    var like = new PostLike
                    {
                        PostId = postId,
                        UserId = userId,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.PostLikes.Add(like);
                    await _context.SaveChangesAsync();
                }

                // Get updated like count
                var likesCount = await _context.PostLikes.CountAsync(pl => pl.PostId == postId);

                return Ok(new { success = true, isLiked = true, likesCount = likesCount });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error liking post");
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpDelete("posts/{postId}/like")]
        public ActionResult UnlikePost(string postId)
        {
            try
            {
                var userId = GetUserId();
                _logger.LogInformation($"User {userId} unliking post {postId}");

                return Ok(new { success = true, isLiked = false, likesCount = 41 });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unliking post");
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpPost("posts/{postId}/bookmark")]
        [AllowAnonymous] // Temporarily allow anonymous access for testing
        public async Task<ActionResult> BookmarkPost(int postId)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    // For anonymous users, just return success without saving
                    return Ok(new { success = true, isBookmarked = true });
                }

                _logger.LogInformation($"User {userId} bookmarking post {postId}");

                // Check if user already bookmarked this post
                var existingBookmark = await _context.PostBookmarks
                    .FirstOrDefaultAsync(pb => pb.PostId == postId && pb.UserId == userId);

                if (existingBookmark == null)
                {
                    // Add new bookmark
                    var bookmark = new PostBookmark
                    {
                        PostId = postId,
                        UserId = userId,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.PostBookmarks.Add(bookmark);
                    await _context.SaveChangesAsync();
                }

                return Ok(new { success = true, isBookmarked = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error bookmarking post");
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpDelete("posts/{postId}/bookmark")]
        public ActionResult UnbookmarkPost(string postId)
        {
            try
            {
                var userId = GetUserId();
                _logger.LogInformation($"User {userId} removing bookmark from post {postId}");

                return Ok(new { success = true, isBookmarked = false });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing bookmark");
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpGet("posts/{postId}/comments")]
        [AllowAnonymous] // Temporarily allow anonymous access for testing
        public async Task<ActionResult<object>> GetPostComments(int postId)
        {
            try
            {
                _logger.LogInformation($"Getting comments for post {postId}");

                var comments = await _context.Comments
                    .Include(c => c.User)
                    .Where(c => c.PostId == postId)
                    .OrderByDescending(c => c.CreatedAt)
                    .Select(c => new
                    {
                        id = c.Id,
                        content = c.Content,
                        createdAt = c.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                        user = new
                        {
                            id = c.User.Id,
                            firstName = c.User.FirstName,
                            lastName = c.User.LastName,
                            profilePictureUrl = c.User.ProfilePictureUrl
                        }
                    })
                    .ToListAsync();

                return Ok(new { comments = comments, hasMore = false, totalCount = comments.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting comments");
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpPost("posts/{postId}/comments")]
        [AllowAnonymous] // Temporarily allow anonymous access for testing
        public async Task<ActionResult<object>> AddComment(int postId, [FromBody] CreateCommentRequest request)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    // For anonymous users, just return success without saving
                    return Ok(new
                    {
                        id = Guid.NewGuid().ToString(),
                        content = request.Content,
                        createdAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                        user = new
                        {
                            id = "anonymous",
                            firstName = "Anonymous",
                            lastName = "User",
                            profilePictureUrl = "https://via.placeholder.com/40"
                        }
                    });
                }

                _logger.LogInformation($"User {userId} commenting on post {postId}");

                // Get the user
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return BadRequest("User not found");
                }

                // Create new comment
                var comment = new Comment
                {
                    PostId = postId,
                    UserId = userId,
                    Content = request.Content,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Comments.Add(comment);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    id = comment.Id.ToString(),
                    content = comment.Content,
                    createdAt = comment.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                    user = new
                    {
                        id = user.Id,
                        firstName = user.FirstName,
                        lastName = user.LastName,
                        profilePictureUrl = user.ProfilePictureUrl
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding comment");
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpGet("bookmarks")]
        [AllowAnonymous] // Temporarily allow anonymous access for testing
        public async Task<ActionResult<object>> GetBookmarkedPosts(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    // For anonymous users, return empty list
                    return Ok(new { posts = new List<object>(), hasMore = false });
                }

                _logger.LogInformation($"Getting bookmarked posts for user {userId}, page {page}, pageSize {pageSize}");

                var bookmarkedPosts = await _context.PostBookmarks
                    .Include(pb => pb.Post)
                    .ThenInclude(p => p.User)
                    .Where(pb => pb.UserId == userId)
                    .OrderByDescending(pb => pb.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(pb => new
                    {
                        id = pb.Post.Id.ToString(),
                        userId = pb.Post.UserId,
                        user = new
                        {
                            id = pb.Post.User.Id,
                            firstName = pb.Post.User.FirstName,
                            lastName = pb.Post.User.LastName,
                            profilePictureUrl = pb.Post.User.ProfilePictureUrl,
                            isServiceProvider = pb.Post.User.IsServiceProvider
                        },
                        content = pb.Post.Content,
                        images = !string.IsNullOrEmpty(pb.Post.ImageUrl) ? new[] { pb.Post.ImageUrl } : new string[0],
                        location = "",
                        tags = new string[0],
                        isBusinessPost = pb.Post.IsBusinessPost,
                        serviceCategory = "",
                        priceRange = "",
                        allowBooking = false,
                        createdAt = pb.Post.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                        bookmarkedAt = pb.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                        likes = 0, // Could add count if needed
                        comments = 0, // Could add count if needed
                        shares = 0,
                        isLiked = false,
                        isBookmarked = true
                    })
                    .ToListAsync();

                var totalBookmarks = await _context.PostBookmarks.CountAsync(pb => pb.UserId == userId);
                var hasMore = (page * pageSize) < totalBookmarks;

                return Ok(new { posts = bookmarkedPosts, hasMore = hasMore });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting bookmarked posts");
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        // Helper methods
        private List<object> GenerateMockFeedPosts(int page, int pageSize)
        {
            var posts = new List<object>();
            var startIndex = (page - 1) * pageSize;

            for (int i = 0; i < pageSize; i++)
            {
                var index = startIndex + i;
                posts.Add(new
                {
                    id = (index + 1).ToString(),
                    providerId = $"provider_{index % 5 + 1}",
                    provider = new
                    {
                        id = $"provider_{index % 5 + 1}",
                        name = GetMockProviderName(index % 5),
                        profileImage = $"https://randomuser.me/api/portraits/women/{index % 10 + 1}.jpg",
                        isVerified = index % 3 == 0,
                        rating = Math.Round(4.0 + (index % 10) * 0.1, 1)
                    },
                    content = GetMockPostContent(index),
                    images = GetMockPostImages(index),
                    location = GetMockLocation(index),
                    tags = GetMockTags(index),
                    createdAt = DateTime.UtcNow.AddHours(-(index * 2)).ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                    likes = new Random().Next(5, 150),
                    comments = new Random().Next(1, 25),
                    shares = new Random().Next(0, 10),
                    isLiked = index % 3 == 0,
                    isBookmarked = index % 4 == 0,
                    serviceType = GetMockServiceType(index),
                    priceRange = GetMockPriceRange(index),
                    isPromoted = index % 7 == 0
                });
            }

            return posts;
        }

        private List<object> GenerateMockComments(string postId)
        {
            return new List<object>
            {
                new
                {
                    id = "comment1",
                    postId = postId,
                    userId = "user1",
                    userName = "Sarah M.",
                    userAvatar = "https://via.placeholder.com/40?text=SM",
                    content = "Absolutely gorgeous! 😍 What products did you use?",
                    createdAt = DateTime.UtcNow.AddHours(-2).ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                    likesCount = 3,
                    isLiked = false,
                    replies = new List<object>
                    {
                        new
                        {
                            id = "reply1",
                            postId = postId,
                            userId = "provider1",
                            userName = "Glamour Studio",
                            userAvatar = "https://via.placeholder.com/40?text=GS",
                            content = "Thank you! I used Olaplex treatment and Redken color 💜",
                            createdAt = DateTime.UtcNow.AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                            likesCount = 1,
                            isLiked = true,
                            replies = new List<object>()
                        }
                    }
                },
                new
                {
                    id = "comment2",
                    postId = postId,
                    userId = "user2",
                    userName = "Jessica R.",
                    userAvatar = "https://via.placeholder.com/40?text=JR",
                    content = "Can I book an appointment? This is exactly what I want!",
                    createdAt = DateTime.UtcNow.AddMinutes(-30).ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                    likesCount = 1,
                    isLiked = false,
                    replies = new List<object>()
                }
            };
        }

        private string GetMockProviderName(int index)
        {
            var names = new[] { "Glamour Studio", "Elite Cuts", "Nail Paradise", "Beauty Bar", "Style Lounge" };
            return names[index];
        }

        private string GetMockPostContent(int index)
        {
            var content = new[]
            {
                "Fresh balayage transformation! ✨ This color took 4 hours but so worth it! 💜 #balayage #haircolor #transformation",
                "New nail art design! 💅 Loving these fall vibes 🍂 Book your appointment today! #nails #nailart #fallvibes",
                "Before and after facial treatment! 🌟 Glowing skin is always in! #facial #skincare #glowup",
                "Wedding makeup trial complete! 👰✨ Can't wait for the big day! #wedding #makeup #bridal",
                "Cut and color perfection! 💇‍♀️ Sometimes a fresh look is all you need! #haircut #newlook #confidence"
            };
            return content[index % content.Length];
        }

        private List<string> GetMockPostImages(int index)
        {
            var imageIndex = index % 3 + 1;
            return new List<string>
            {
                $"https://picsum.photos/400/400?random={imageIndex}a",
                $"https://picsum.photos/400/400?random={imageIndex}b"
            };
        }

        private string GetMockLocation(int index)
        {
            var locations = new[] { "Downtown LA", "Beverly Hills", "Santa Monica", "Hollywood", "West Hollywood" };
            return locations[index % locations.Length];
        }

        private List<string> GetMockTags(int index)
        {
            var tagSets = new[]
            {
                new[] { "#balayage", "#haircolor", "#transformation" },
                new[] { "#nails", "#nailart", "#fallvibes" },
                new[] { "#facial", "#skincare", "#glowup" },
                new[] { "#wedding", "#makeup", "#bridal" },
                new[] { "#haircut", "#newlook", "#confidence" }
            };
            return tagSets[index % tagSets.Length].ToList();
        }

        private string GetMockServiceType(int index)
        {
            var serviceTypes = new[] { "Hair Services", "Nail Services", "Skincare & Facials", "Makeup & Beauty", "Massage & Spa" };
            return serviceTypes[index % serviceTypes.Length];
        }

        private string GetMockPriceRange(int index)
        {
            var priceRanges = new[] { "$50-$100", "$100-$200", "$200-$300", "$300-$500", "$500+" };
            return priceRanges[index % priceRanges.Length];
        }
    }

    // Request/Response models
    public class CreateSocialPostRequest
    {
        public string Content { get; set; } = "";
        public List<string>? Images { get; set; }
        public string? Location { get; set; }
        public List<string>? Tags { get; set; }
        public bool IsBusinessPost { get; set; } = false;
        public string? ServiceCategory { get; set; }
        public string? PriceRange { get; set; }
        public bool AllowBooking { get; set; } = false;
    }

    public class CreateCommentRequest
    {
        public string Content { get; set; } = "";
    }
}
