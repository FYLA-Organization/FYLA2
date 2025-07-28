using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FYLA2_Backend.Models;
using System.Security.Claims;

namespace FYLA2_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SocialController : ControllerBase
    {
        private readonly ILogger<SocialController> _logger;

        public SocialController(ILogger<SocialController> logger)
        {
            _logger = logger;
        }

        private string GetUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        }

        [HttpGet("feed")]
        public ActionResult<object> GetSocialFeed(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string filter = "all")
        {
            try
            {
                var userId = GetUserId();
                _logger.LogInformation($"Getting social feed for user {userId}, page {page}, pageSize {pageSize}, filter {filter}");

                // Generate mock posts in the format expected by the frontend
                var posts = GenerateMockFeedPosts(page, pageSize);

                var response = new
                {
                    posts = posts,
                    hasMore = page < 3 // Mock pagination
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting social feed");
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpPost("posts")]
        public ActionResult<object> CreateSocialPost([FromBody] CreateSocialPostRequest request)
        {
            try
            {
                var userId = GetUserId();
                _logger.LogInformation($"Creating social post for user {userId}");

                var post = new
                {
                    id = Guid.NewGuid().ToString(),
                    userId = userId,
                    content = request.Content,
                    images = request.Images ?? new List<string>(),
                    location = request.Location,
                    tags = request.Tags ?? new List<string>(),
                    isBusinessPost = request.IsBusinessPost,
                    serviceCategory = request.ServiceCategory,
                    priceRange = request.PriceRange,
                    allowBooking = request.AllowBooking,
                    createdAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                    likes = 0,
                    comments = 0,
                    shares = 0,
                    isLiked = false,
                    isBookmarked = false
                };

                return Ok(post);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating social post");
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpPost("posts/{postId}/like")]
        public ActionResult LikePost(string postId)
        {
            try
            {
                var userId = GetUserId();
                _logger.LogInformation($"User {userId} liking post {postId}");

                // Mock response - implement actual like logic
                return Ok(new { success = true, isLiked = true, likesCount = 42 });
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
        public ActionResult BookmarkPost(string postId)
        {
            try
            {
                var userId = GetUserId();
                _logger.LogInformation($"User {userId} bookmarking post {postId}");

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
        public ActionResult<List<object>> GetPostComments(string postId)
        {
            try
            {
                _logger.LogInformation($"Getting comments for post {postId}");

                var comments = GenerateMockComments(postId);
                return Ok(comments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting comments");
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpPost("posts/{postId}/comments")]
        public ActionResult<object> AddComment(string postId, [FromBody] CreateCommentRequest request)
        {
            try
            {
                var userId = GetUserId();
                _logger.LogInformation($"User {userId} commenting on post {postId}");

                var comment = new
                {
                    id = Guid.NewGuid().ToString(),
                    postId = postId,
                    userId = userId,
                    userName = "Current User",
                    userAvatar = "https://via.placeholder.com/40",
                    content = request.Content,
                    createdAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                    likesCount = 0,
                    isLiked = false,
                    replies = new List<object>()
                };

                return Ok(comment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding comment");
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
