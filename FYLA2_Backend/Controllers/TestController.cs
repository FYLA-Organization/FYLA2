using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYLA2_Backend.Data;

namespace FYLA2_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TestController(ApplicationDbContext context)
        {
            _context = context;
        }
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

        // Test endpoint to add addresses to existing providers
        [HttpPost("update-provider-addresses")]
        public async Task<ActionResult<object>> UpdateProviderAddresses()
        {
            var providers = await _context.ServiceProviders.ToListAsync();
            
            if (!providers.Any())
            {
                return NotFound("No providers found");
            }

            // Sample addresses for different provider types
            var sampleAddresses = new[]
            {
                "123 Main Street, Downtown Los Angeles, CA 90012",
                "456 Beauty Blvd, Beverly Hills, CA 90210", 
                "789 Wellness Way, Santa Monica, CA 90401",
                "321 Style Avenue, West Hollywood, CA 90069",
                "654 Glamour Lane, Hollywood, CA 90028",
                "987 Spa Street, Pasadena, CA 91101",
                "147 Salon Circle, Burbank, CA 91502",
                "258 Treatment Terrace, Glendale, CA 91205",
                "369 Beauty Boulevard, Long Beach, CA 90802",
                "741 Wellness Walk, Culver City, CA 90232"
            };

            var updatedCount = 0;
            for (int i = 0; i < providers.Count && i < sampleAddresses.Length; i++)
            {
                if (string.IsNullOrEmpty(providers[i].BusinessAddress))
                {
                    providers[i].BusinessAddress = sampleAddresses[i];
                    providers[i].UpdatedAt = DateTime.UtcNow;
                    updatedCount++;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = $"Updated {updatedCount} providers with addresses",
                updated = updatedCount,
                total = providers.Count
            });
        }

        // Test endpoint to check provider addresses directly from database
        [HttpGet("provider-addresses")]
        public async Task<ActionResult<object>> GetProviderAddresses()
        {
            var providers = await _context.ServiceProviders
                .Select(sp => new {
                    id = sp.Id,
                    userId = sp.UserId,
                    businessName = sp.BusinessName,
                    businessAddress = sp.BusinessAddress
                })
                .ToListAsync();

            return Ok(providers);
        }
    }
}
