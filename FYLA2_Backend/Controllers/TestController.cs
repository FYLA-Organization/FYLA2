using Microsoft.AspNetCore.Mvc;

namespace FYLA2_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        // Simple test endpoint to verify API connectivity
        [HttpGet]
        public ActionResult<object> Get()
        {
            return Ok(new { 
                message = "API is working!", 
                timestamp = DateTime.UtcNow,
                version = "1.0.0"
            });
        }

        // Test endpoint that returns mock providers
        [HttpGet("providers")]
        public ActionResult<object> GetTestProviders()
        {
            var mockProviders = new[]
            {
                new {
                    id = "test-1",
                    userId = "user-1", 
                    businessName = "Test Beauty Studio",
                    businessDescription = "A test beauty studio for development",
                    profilePictureUrl = "https://via.placeholder.com/120",
                    averageRating = 4.5,
                    totalReviews = 10,
                    isVerified = true,
                    followersCount = 100,
                    followingCount = 50,
                    specialties = new[] { "Makeup", "Hair" },
                    priceRange = "$$",
                    yearsOfExperience = 3,
                    businessAddress = "123 Test Street"
                }
            };

            return Ok(mockProviders);
        }

        // Test social feed endpoint
        [HttpGet("social-feed")]
        public ActionResult<object> GetTestSocialFeed()
        {
            var mockFeed = new {
                posts = new[] {
                    new {
                        id = "test-post-1",
                        userId = "user-1",
                        content = "Test post content",
                        imageUrl = "https://picsum.photos/400/400?random=1",
                        likesCount = 25,
                        commentsCount = 5,
                        createdAt = DateTime.UtcNow.ToString()
                    }
                },
                hasMore = false
            };

            return Ok(mockFeed);
        }
    }
}
