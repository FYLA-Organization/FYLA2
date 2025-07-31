using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYLA2_Backend.Data;
using FYLA2_Backend.Services;

namespace FYLA2_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DatabaseController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly DataSeedingService _seedingService;
        private readonly ILogger<DatabaseController> _logger;

        public DatabaseController(
            ApplicationDbContext context,
            DataSeedingService seedingService,
            ILogger<DatabaseController> logger)
        {
            _context = context;
            _seedingService = seedingService;
            _logger = logger;
        }

        [HttpPost("reseed")]
        public async Task<IActionResult> ReseedDatabase()
        {
            try
            {
                _logger.LogInformation("Starting comprehensive database reseed...");

                // Force clear and reseed
                await _seedingService.SeedDataAsync();

                // Get final counts
                var userCount = await _context.Users.CountAsync();
                var providerCount = await _context.ServiceProviders.CountAsync();
                var serviceCount = await _context.Services.CountAsync();
                var postCount = await _context.Posts.CountAsync();
                var commentCount = await _context.Comments.CountAsync();
                var likeCount = await _context.PostLikes.CountAsync();
                var followCount = await _context.UserFollows.CountAsync();
                var bookingCount = await _context.Bookings.CountAsync();
                var messageCount = await _context.Messages.CountAsync();
                var notificationCount = await _context.Notifications.CountAsync();

                var result = new
                {
                    success = true,
                    message = "Database comprehensively reseeded successfully!",
                    data = new
                    {
                        totalUsers = userCount,
                        serviceProviders = providerCount,
                        clients = userCount - providerCount,
                        services = serviceCount,
                        posts = postCount,
                        comments = commentCount,
                        likes = likeCount,
                        follows = followCount,
                        bookings = bookingCount,
                        messages = messageCount,
                        notifications = notificationCount
                    }
                };

                _logger.LogInformation("Database reseed completed: {Result}", result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reseeding database");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to reseed database", 
                    error = ex.Message 
                });
            }
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetDatabaseStats()
        {
            try
            {
                var stats = new
                {
                    users = new
                    {
                        total = await _context.Users.CountAsync(),
                        clients = await _context.Users.CountAsync(u => !u.IsServiceProvider),
                        providers = await _context.Users.CountAsync(u => u.IsServiceProvider)
                    },
                    content = new
                    {
                        services = await _context.Services.CountAsync(),
                        posts = await _context.Posts.CountAsync(),
                        comments = await _context.Comments.CountAsync(),
                        likes = await _context.PostLikes.CountAsync(),
                        reviews = await _context.Reviews.CountAsync(),
                        schedules = await _context.ProviderSchedules.CountAsync()
                    },
                    interactions = new
                    {
                        follows = await _context.UserFollows.CountAsync(),
                        bookings = await _context.Bookings.CountAsync(),
                        messages = await _context.Messages.CountAsync(),
                        notifications = await _context.Notifications.CountAsync()
                    }
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting database stats");
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
