using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Text.Json;

namespace FYLA2_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReviewController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReviewController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/review/{providerId}
        [HttpGet("{providerId}")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<object>>> GetProviderReviews(string providerId)
        {
            try
            {
                var reviews = await _context.Reviews
                    .Where(r => r.RevieweeId == providerId)
                    .Include(r => r.Reviewer)
                    .Include(r => r.Booking)
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new
                    {
                        r.Id,
                        r.BookingId,
                        r.ReviewerId,
                        r.RevieweeId,
                        r.Rating,
                        r.Comment,
                        r.QuestionnaireData,
                        r.CreatedAt,
                        Reviewer = new
                        {
                            r.Reviewer.Id,
                            r.Reviewer.FirstName,
                            r.Reviewer.LastName,
                            ProfilePictureUrl = r.Reviewer.ProfileImageUrl
                        },
                        Questionnaire = r.QuestionnaireData != null ? 
                            JsonSerializer.Deserialize<ReviewQuestionnaire>(r.QuestionnaireData, (JsonSerializerOptions?)null) : null
                    })
                    .ToListAsync();

                return Ok(reviews);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving reviews", error = ex.Message });
            }
        }

        // POST: api/review
        [HttpPost]
        public async Task<ActionResult<object>> CreateReview([FromBody] CreateReviewRequest request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                // Get the booking to verify ownership and get provider info
                var booking = await _context.Bookings
                    .Include(b => b.Provider)
                    .FirstOrDefaultAsync(b => b.Id == request.BookingId);

                if (booking == null)
                {
                    return NotFound(new { message = "Booking not found" });
                }

                if (booking.ClientId != userId)
                {
                    return Forbid("You can only review your own bookings");
                }

                if (booking.Status != BookingStatus.Completed)
                {
                    return BadRequest(new { message = "You can only review completed bookings" });
                }

                // Check if review already exists
                var existingReview = await _context.Reviews
                    .FirstOrDefaultAsync(r => r.BookingId == request.BookingId);

                if (existingReview != null)
                {
                    return BadRequest(new { message = "Review already exists for this booking" });
                }

                // Serialize questionnaire data if provided
                string? questionnaireJson = null;
                if (request.Questionnaire != null)
                {
                    questionnaireJson = JsonSerializer.Serialize(request.Questionnaire);
                }

                var review = new Review
                {
                    Id = Guid.NewGuid().ToString(),
                    BookingId = request.BookingId,
                    ReviewerId = userId,
                    RevieweeId = booking.ProviderId,
                    Rating = request.Rating,
                    Comment = request.Comment,
                    QuestionnaireData = questionnaireJson,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Reviews.Add(review);
                await _context.SaveChangesAsync();

                // Update provider's average rating
                await UpdateProviderRating(booking.ProviderId);

                // Return the created review with user info
                var createdReview = await _context.Reviews
                    .Include(r => r.Reviewer)
                    .Where(r => r.Id == review.Id)
                    .Select(r => new
                    {
                        r.Id,
                        r.BookingId,
                        r.ReviewerId,
                        r.RevieweeId,
                        r.Rating,
                        r.Comment,
                        r.CreatedAt,
                        Reviewer = new
                        {
                            r.Reviewer.Id,
                            r.Reviewer.FirstName,
                            r.Reviewer.LastName,
                            ProfilePictureUrl = r.Reviewer.ProfileImageUrl
                        },
                        Questionnaire = request.Questionnaire
                    })
                    .FirstOrDefaultAsync();

                return CreatedAtAction(nameof(GetProviderReviews), new { providerId = booking.ProviderId }, createdReview);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating review", error = ex.Message });
            }
        }

        // GET: api/review/booking/{bookingId}
        [HttpGet("booking/{bookingId}")]
        public async Task<ActionResult<object>> GetBookingReview(string bookingId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                if (!int.TryParse(bookingId, out int bookingIdInt))
                {
                    return BadRequest(new { message = "Invalid booking ID format" });
                }

                var review = await _context.Reviews
                    .Include(r => r.Reviewer)
                    .Include(r => r.Booking)
                    .Where(r => r.BookingId == bookingIdInt && r.ReviewerId == userId)
                    .Select(r => new
                    {
                        r.Id,
                        r.BookingId,
                        r.ReviewerId,
                        r.RevieweeId,
                        r.Rating,
                        r.Comment,
                        r.CreatedAt,
                        Reviewer = new
                        {
                            r.Reviewer.Id,
                            r.Reviewer.FirstName,
                            r.Reviewer.LastName,
                            ProfilePictureUrl = r.Reviewer.ProfileImageUrl
                        },
                        Questionnaire = r.QuestionnaireData != null ? 
                            JsonSerializer.Deserialize<ReviewQuestionnaire>(r.QuestionnaireData, (JsonSerializerOptions?)null) : null
                    })
                    .FirstOrDefaultAsync();

                if (review == null)
                {
                    return NotFound(new { message = "Review not found" });
                }

                return Ok(review);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving review", error = ex.Message });
            }
        }

        // DELETE: api/review/{reviewId}
        [HttpDelete("{reviewId}")]
        public async Task<ActionResult> DeleteReview(string reviewId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var review = await _context.Reviews
                    .Include(r => r.Booking)
                    .FirstOrDefaultAsync(r => r.Id == reviewId);

                if (review == null)
                {
                    return NotFound(new { message = "Review not found" });
                }

                if (review.ReviewerId != userId)
                {
                    return Forbid("You can only delete your own reviews");
                }

                var providerId = review.RevieweeId;
                _context.Reviews.Remove(review);
                await _context.SaveChangesAsync();

                // Update provider's average rating
                await UpdateProviderRating(providerId);

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting review", error = ex.Message });
            }
        }

        private async Task UpdateProviderRating(string providerId)
        {
            // For now, we'll just ensure the method exists
            // In the future, we can add AverageRating and TotalReviews to the User model
            // or create a separate ServiceProvider profile table
            var user = await _context.Users.FindAsync(providerId);
            if (user != null && user.IsServiceProvider)
            {
                var reviews = await _context.Reviews
                    .Where(r => r.RevieweeId == providerId)
                    .ToListAsync();

                // Calculate ratings but don't store them yet since User model doesn't have these fields
                var averageRating = reviews.Any() ? reviews.Average(r => r.Rating) : 0;
                var totalReviews = reviews.Count;

                // TODO: Add AverageRating and TotalReviews fields to User model or create ServiceProvider profile
                await _context.SaveChangesAsync();
            }
        }
    }

    public class CreateReviewRequest
    {
        public int BookingId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public ReviewQuestionnaire? Questionnaire { get; set; }
    }

    public class ReviewQuestionnaire
    {
        public int Punctuality { get; set; }
        public int Professionalism { get; set; }
        public int ValueForMoney { get; set; }
        public bool WouldRecommend { get; set; }
        public bool WouldUseAgain { get; set; }
        public int CommunicationRating { get; set; }
        public int CleanlinessRating { get; set; }
    }
}
