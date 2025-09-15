using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FYLA2_Backend.Data;
using FYLA2_Backend.Services;
using FYLA2_Backend.DTOs.Loyalty;
using FYLA2_Backend.Models;
using System.Security.Claims;

namespace FYLA2_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LoyaltyController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILoyaltyService _loyaltyService;

        public LoyaltyController(ApplicationDbContext context, ILoyaltyService loyaltyService)
        {
            _context = context;
            _loyaltyService = loyaltyService;
        }

        /// <summary>
        /// Get client loyalty status for a specific provider (PUBLIC ENDPOINT)
        /// </summary>
        [HttpGet("client/{clientId}/provider/{serviceProviderId}")]
        [AllowAnonymous]
        public async Task<ActionResult<ClientLoyaltyStatusDto>> GetClientLoyaltyStatus(string clientId, string serviceProviderId)
        {
            try
            {
                // Verify the client exists
                var client = await _context.Users.FirstOrDefaultAsync(u => u.Id == clientId);
                if (client == null)
                {
                    return NotFound("Client not found");
                }

                // Verify the service provider exists
                var provider = await _context.Users.FirstOrDefaultAsync(u => u.Id == serviceProviderId);
                if (provider == null)
                {
                    return NotFound("Service provider not found");
                }

                var loyaltyStatus = await _loyaltyService.GetClientLoyaltyStatusAsync(clientId, serviceProviderId);
                return Ok(loyaltyStatus);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve loyalty status", details = ex.Message });
            }
        }

        /// <summary>
        /// Get authenticated user's overall loyalty status
        /// </summary>
        [HttpGet("my-status")]
        [Authorize]
        public async Task<ActionResult<ClientLoyaltyStatusDto>> GetMyLoyaltyStatus()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var loyaltyStatus = await _loyaltyService.GetClientLoyaltyStatusAsync(userId);
                return Ok(loyaltyStatus);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve loyalty status", details = ex.Message });
            }
        }

        /// <summary>
        /// Get authenticated user's loyalty status with a specific provider
        /// </summary>
        [HttpGet("my-status/provider/{serviceProviderId}")]
        [Authorize]
        public async Task<ActionResult<ClientLoyaltyStatusDto>> GetMyLoyaltyStatusWithProvider(string serviceProviderId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                // Verify the service provider exists
                var provider = await _context.Users.FirstOrDefaultAsync(u => u.Id == serviceProviderId);
                if (provider == null)
                {
                    return NotFound("Service provider not found");
                }

                var loyaltyStatus = await _loyaltyService.GetClientLoyaltyStatusAsync(userId, serviceProviderId);
                return Ok(loyaltyStatus);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve loyalty status", details = ex.Message });
            }
        }

        /// <summary>
        /// Award loyalty points for a completed booking (called by system)
        /// </summary>
        [HttpPost("award-points/{bookingId}")]
        [Authorize]
        public async Task<ActionResult<LoyaltyPointsEarnedDto>> AwardPointsForBooking(int bookingId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                // Verify booking exists and belongs to the user (either as client or provider)
                var booking = await _context.Bookings
                    .Include(b => b.Client)
                    .Include(b => b.Provider)
                    .FirstOrDefaultAsync(b => b.Id == bookingId && 
                                           (b.ClientId == userId || b.ProviderId == userId));
                
                if (booking == null)
                {
                    return NotFound("Booking not found or unauthorized");
                }

                // Only award points if booking is completed
                if (booking.Status != BookingStatus.Completed)
                {
                    return BadRequest("Points can only be awarded for completed bookings");
                }

                var result = await _loyaltyService.AwardPointsForBookingAsync(bookingId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to award loyalty points", details = ex.Message });
            }
        }

        /// <summary>
        /// Get loyalty transactions for authenticated user
        /// </summary>
        [HttpGet("transactions")]
        [Authorize]
        public async Task<ActionResult<List<LoyaltyTransactionDto>>> GetMyLoyaltyTransactions()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var transactions = await _context.LoyaltyTransactions
                    .Where(lt => lt.ClientId == userId)
                    .Include(lt => lt.Provider)
                    .OrderByDescending(lt => lt.CreatedAt)
                    .Take(50) // Limit to last 50 transactions
                    .Select(lt => new LoyaltyTransactionDto
                    {
                        Id = lt.Id,
                        UserId = lt.ClientId,
                        ProviderId = lt.ProviderId,
                        BookingId = lt.BookingId,
                        Points = lt.Points,
                        TransactionType = lt.TransactionType.ToString(),
                        Description = lt.Description,
                        CreatedAt = lt.CreatedAt,
                        ExpiresAt = lt.ExpiresAt
                    })
                    .ToListAsync();

                return Ok(transactions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve loyalty transactions", details = ex.Message });
            }
        }

        /// <summary>
        /// Check if client has any loyalty programs with provider (PUBLIC ENDPOINT)
        /// </summary>
        [HttpGet("check-membership/{clientId}/provider/{serviceProviderId}")]
        [AllowAnonymous]
        public async Task<ActionResult<object>> CheckLoyaltyMembership(string clientId, string serviceProviderId)
        {
            try
            {
                // Check if client has any loyalty memberships with this provider
                var hasMembership = await _context.LoyaltyMembers
                    .AnyAsync(lm => lm.ClientId == clientId && 
                                   lm.LoyaltyProgram.ServiceProviderId == serviceProviderId &&
                                   lm.IsActive);

                var totalPoints = 0;
                if (hasMembership)
                {
                    // Get total points with this provider
                    totalPoints = await _context.LoyaltyTransactions
                        .Where(lt => lt.ClientId == clientId && 
                                    lt.ProviderId == serviceProviderId)
                        .SumAsync(lt => lt.TransactionType == LoyaltyTransactionType.Earned ? lt.Points : -lt.Points);
                }

                return Ok(new
                {
                    HasMembership = hasMembership,
                    TotalPoints = totalPoints,
                    MembershipTier = totalPoints >= 1000 ? "Gold" : 
                                   totalPoints >= 500 ? "Silver" : "Bronze"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to check loyalty membership", details = ex.Message });
            }
        }

        /// <summary>
        /// Join a loyalty program (authenticated users only)
        /// </summary>
        [HttpPost("join-program/{programId}")]
        [Authorize]
        public async Task<ActionResult<object>> JoinLoyaltyProgram(int programId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                // Check if program exists
                var program = await _context.LoyaltyPrograms
                    .FirstOrDefaultAsync(lp => lp.Id == programId && lp.IsActive);
                
                if (program == null)
                {
                    return NotFound("Loyalty program not found or inactive");
                }

                // Check if already a member
                var existingMembership = await _context.LoyaltyMembers
                    .FirstOrDefaultAsync(lm => lm.ClientId == userId && 
                                              lm.LoyaltyProgramId == programId);

                if (existingMembership != null)
                {
                    if (existingMembership.IsActive)
                    {
                        return BadRequest("Already a member of this loyalty program");
                    }
                    else
                    {
                        // Reactivate membership
                        existingMembership.IsActive = true;
                        existingMembership.JoinedAt = DateTime.UtcNow;
                    }
                }
                else
                {
                    // Create new membership
                    var newMembership = new LoyaltyMember
                    {
                        ClientId = userId,
                        LoyaltyProgramId = programId,
                        CurrentPoints = 0,
                        TotalPointsEarned = 0,
                        JoinedAt = DateTime.UtcNow,
                        IsActive = true
                    };
                    _context.LoyaltyMembers.Add(newMembership);
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Successfully joined loyalty program" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to join loyalty program", details = ex.Message });
            }
        }
    }
}
