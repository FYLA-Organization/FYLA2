using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FYLA2.Models;
using System.Security.Claims;

namespace FYLA2.Controllers
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
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("posts/{postId}/comments")]
        public ActionResult<SocialComment> AddComment(string postId, [FromBody] CreateCommentRequest request)
        {
            try
            {
                var userId = GetUserId();
                _logger.LogInformation($"User {userId} commenting on post {postId}");

                var comment = new SocialComment
                {
                    Id = Guid.NewGuid().ToString(),
                    PostId = postId,
                    UserId = userId,
                    UserName = "Current User",
                    UserAvatar = "https://via.placeholder.com/40",
                    Content = request.Content,
                    CreatedAt = DateTime.UtcNow,
                    LikesCount = 0,
                    IsLiked = false,
                    Replies = new List<SocialComment>()
                };

                return Ok(comment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding comment");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("posts/{postId}/comments")]
        public ActionResult<List<SocialComment>> GetPostComments(string postId)
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
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("follow/{providerId}")]
        public ActionResult FollowProvider(string providerId)
        {
            try
            {
                var userId = GetUserId();
                _logger.LogInformation($"User {userId} following provider {providerId}");

                return Ok(new { success = true, isFollowing = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error following provider");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("stories")]
        public ActionResult<List<SocialStory>> GetStories()
        {
            try
            {
                var stories = GenerateMockStories();
                return Ok(stories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting stories");
                return StatusCode(500, "Internal server error");
            }
        }

        // Mock data generators
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

        private List<SocialPost> GenerateMockPosts(int page, int limit)
        {
            var posts = new List<SocialPost>();
            var startIndex = (page - 1) * limit;

            for (int i = 0; i < limit; i++)
            {
                var postId = (startIndex + i + 1).ToString();
                posts.Add(new SocialPost
                {
                    Id = postId,
                    UserId = $"provider_{i % 5 + 1}",
                    UserName = GetMockProviderName(i % 5),
                    UserAvatar = $"https://via.placeholder.com/50?text=P{i % 5 + 1}",
                    Content = GetMockPostContent(i),
                    Images = GetMockPostImages(i),
                    CreatedAt = DateTime.UtcNow.AddHours(-(i * 2)),
                    LikesCount = new Random().Next(5, 150),
                    CommentsCount = new Random().Next(1, 25),
                    IsLiked = i % 3 == 0,
                    Location = GetMockLocation(i)
                });
            }

            return posts;
        }

        private List<SocialStory> GenerateMockStories()
        {
            return new List<SocialStory>
            {
                new SocialStory
                {
                    Id = "story1",
                    UserId = "provider1",
                    UserName = "Glamour Studio",
                    UserAvatar = "https://via.placeholder.com/60?text=GS",
                    Thumbnail = "https://via.placeholder.com/120x200?text=Story1",
                    IsViewed = false
                },
                new SocialStory
                {
                    Id = "story2",
                    UserId = "provider2",
                    UserName = "Elite Cuts",
                    UserAvatar = "https://via.placeholder.com/60?text=EC",
                    Thumbnail = "https://via.placeholder.com/120x200?text=Story2",
                    IsViewed = true
                },
                new SocialStory
                {
                    Id = "story3",
                    UserId = "provider3",
                    UserName = "Nail Paradise",
                    UserAvatar = "https://via.placeholder.com/60?text=NP",
                    Thumbnail = "https://via.placeholder.com/120x200?text=Story3",
                    IsViewed = false
                }
            };
        }

        private List<SocialComment> GenerateMockComments(string postId)
        {
            return new List<SocialComment>
            {
                new SocialComment
                {
                    Id = "comment1",
                    PostId = postId,
                    UserId = "user1",
                    UserName = "Sarah M.",
                    UserAvatar = "https://via.placeholder.com/40?text=SM",
                    Content = "Absolutely gorgeous! 😍 What products did you use?",
                    CreatedAt = DateTime.UtcNow.AddHours(-2),
                    LikesCount = 3,
                    IsLiked = false,
                    Replies = new List<SocialComment>
                    {
                        new SocialComment
                        {
                            Id = "reply1",
                            PostId = postId,
                            UserId = "provider1",
                            UserName = "Glamour Studio",
                            UserAvatar = "https://via.placeholder.com/40?text=GS",
                            Content = "Thank you! I used Olaplex treatment and Redken color 💜",
                            CreatedAt = DateTime.UtcNow.AddHours(-1),
                            LikesCount = 1,
                            IsLiked = true,
                            Replies = new List<SocialComment>()
                        }
                    }
                },
                new SocialComment
                {
                    Id = "comment2",
                    PostId = postId,
                    UserId = "user2",
                    UserName = "Jessica R.",
                    UserAvatar = "https://via.placeholder.com/40?text=JR",
                    Content = "Can I book an appointment? This is exactly what I want!",
                    CreatedAt = DateTime.UtcNow.AddMinutes(-30),
                    LikesCount = 1,
                    IsLiked = false,
                    Replies = new List<SocialComment>()
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
                $"https://via.placeholder.com/400x400?text=Post{imageIndex}A",
                $"https://via.placeholder.com/400x400?text=Post{imageIndex}B"
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
    public class SocialFeedResponse
    {
        public List<SocialPost> Posts { get; set; } = new();
        public List<SocialStory> Stories { get; set; } = new();
        public bool HasMorePosts { get; set; }
        public int TotalPosts { get; set; }
    }

    public class CreatePostRequest
    {
        public string Content { get; set; } = "";
        public List<string>? Images { get; set; }
        public string? Location { get; set; }
    }

    public class CreateCommentRequest
    {
        public string Content { get; set; } = "";
    }

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
}
