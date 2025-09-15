using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;

namespace FYLA2_Backend.Controllers
{
    [ApiController]
    [Route("api/booking")]
    [Authorize]
    public class BookingActionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BookingActionsController> _logger;

        public BookingActionsController(ApplicationDbContext context, ILogger<BookingActionsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new UnauthorizedAccessException();

        // GET: api/booking/{bookingId}/cancellation-info
        [HttpGet("{bookingId}/cancellation-info")]
        public async Task<ActionResult<object>> GetCancellationInfo(int bookingId)
        {
            var userId = GetUserId();

            var booking = await _context.Bookings
                .Include(b => b.Provider)
                .Include(b => b.Service)
                .FirstOrDefaultAsync(b => b.Id == bookingId && 
                    (b.ClientId == userId || b.ProviderId == userId));

            if (booking == null)
                return NotFound("Booking not found");

            // Get provider's cancellation policy
            var policy = await _context.CancellationPolicies
                .FirstOrDefaultAsync(p => p.ProviderId == booking.ProviderId);

            if (policy == null)
            {
                // Default policy
                policy = new CancellationPolicy
                {
                    ProviderId = booking.ProviderId,
                    SameDayFeePercentage = 100m,
                    OneDayBeforeFeePercentage = 50m,
                    TwoDaysBeforeFeePercentage = 25m,
                    ThreeDaysBeforeFeePercentage = 10m,
                    OneWeekBeforeFeePercentage = 0m,
                    PolicyDescription = "Standard cancellation policy applies."
                };
            }

            // Calculate time until appointment
            var hoursUntilAppointment = (booking.StartTime - DateTime.UtcNow).TotalHours;
            
            decimal cancellationFeePercentage = 0m;
            string timeFrame = "";
            
            if (hoursUntilAppointment <= 24)
            {
                cancellationFeePercentage = policy.SameDayFeePercentage;
                timeFrame = "Same Day";
            }
            else if (hoursUntilAppointment <= 48)
            {
                cancellationFeePercentage = policy.OneDayBeforeFeePercentage;
                timeFrame = "1 Day Before";
            }
            else if (hoursUntilAppointment <= 72)
            {
                cancellationFeePercentage = policy.TwoDaysBeforeFeePercentage;
                timeFrame = "2 Days Before";
            }
            else if (hoursUntilAppointment <= 96)
            {
                cancellationFeePercentage = policy.ThreeDaysBeforeFeePercentage;
                timeFrame = "3 Days Before";
            }
            else
            {
                cancellationFeePercentage = policy.OneWeekBeforeFeePercentage;
                timeFrame = "1+ Week Before";
            }

            var cancellationFee = booking.TotalPrice * (cancellationFeePercentage / 100m);
            var refundAmount = booking.TotalPrice - cancellationFee;

            return Ok(new
            {
                bookingId = booking.Id,
                serviceName = booking.Service?.Name,
                bookingDate = booking.BookingDate,
                startTime = booking.StartTime,
                totalPrice = booking.TotalPrice,
                hoursUntilAppointment = Math.Round(hoursUntilAppointment, 1),
                timeFrame,
                cancellationFeePercentage,
                cancellationFee,
                refundAmount,
                canCancel = policy.AllowSameDayCancellation || hoursUntilAppointment > 24,
                canReschedule = policy.AllowSameDayReschedule || hoursUntilAppointment > policy.MinimumRescheduleHours,
                policy = new
                {
                    description = policy.PolicyDescription,
                    specialCircumstances = policy.SpecialCircumstances,
                    freeReschedulesAllowed = policy.FreeReschedulesAllowed,
                    rescheduleFeePercentage = policy.RescheduleFeePercentage
                }
            });
        }

        // POST: api/booking/{bookingId}/cancel
        [HttpPost("{bookingId}/cancel")]
        public async Task<ActionResult> CancelBooking(int bookingId, [FromBody] CancelBookingRequest request)
        {
            var userId = GetUserId();

            var booking = await _context.Bookings
                .Include(b => b.Provider)
                .Include(b => b.Service)
                .FirstOrDefaultAsync(b => b.Id == bookingId && 
                    (b.ClientId == userId || b.ProviderId == userId));

            if (booking == null)
                return NotFound("Booking not found");

            if (booking.Status == BookingStatus.Cancelled)
                return BadRequest("Booking is already cancelled");

            if (booking.Status == BookingStatus.Completed)
                return BadRequest("Cannot cancel completed booking");

            // Get cancellation policy
            var policy = await _context.CancellationPolicies
                .FirstOrDefaultAsync(p => p.ProviderId == booking.ProviderId);

            // Calculate fees
            var cancellationInfo = await GetCancellationInfo(bookingId);
            var infoResult = cancellationInfo.Result as OkObjectResult;
            var info = infoResult?.Value as dynamic;

            // Create booking action record
            var bookingAction = new BookingAction
            {
                BookingId = bookingId,
                ActionType = "cancel",
                RequestedBy = userId,
                Reason = request.Reason,
                FeeAmount = (decimal)info.cancellationFee,
                RefundAmount = (decimal)info.refundAmount,
                Status = "Approved", // Auto-approve cancellations
                ProcessedAt = DateTime.UtcNow
            };

            _context.BookingActions.Add(bookingAction);

            // Update booking status
            booking.Status = BookingStatus.Cancelled;
            
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Booking {bookingId} cancelled by user {userId}. Fee: {bookingAction.FeeAmount}, Refund: {bookingAction.RefundAmount}");

            return Ok(new
            {
                message = "Booking cancelled successfully",
                cancellationFee = bookingAction.FeeAmount,
                refundAmount = bookingAction.RefundAmount,
                actionId = bookingAction.Id
            });
        }

        // POST: api/booking/{bookingId}/reschedule
        [HttpPost("{bookingId}/reschedule")]
        public async Task<ActionResult> RescheduleBooking(int bookingId, [FromBody] RescheduleBookingRequest request)
        {
            var userId = GetUserId();

            var booking = await _context.Bookings
                .Include(b => b.Provider)
                .Include(b => b.Service)
                .FirstOrDefaultAsync(b => b.Id == bookingId && 
                    (b.ClientId == userId || b.ProviderId == userId));

            if (booking == null)
                return NotFound("Booking not found");

            if (booking.Status == BookingStatus.Cancelled)
                return BadRequest("Cannot reschedule cancelled booking");

            if (booking.Status == BookingStatus.Completed)
                return BadRequest("Cannot reschedule completed booking");

            // Validate new date/time
            var newStartTime = DateTime.Parse($"{request.NewDate} {request.NewTime}");
            var newEndTime = newStartTime.AddMinutes(booking.DurationMinutes);

            if (newStartTime <= DateTime.UtcNow)
                return BadRequest("Cannot reschedule to past date/time");

            // Check for conflicts
            var hasConflict = await _context.Bookings
                .AnyAsync(b => b.ProviderId == booking.ProviderId && 
                         b.Id != bookingId &&
                         b.Status != BookingStatus.Cancelled &&
                         ((newStartTime >= b.StartTime && newStartTime < b.EndTime) ||
                          (newEndTime > b.StartTime && newEndTime <= b.EndTime) ||
                          (newStartTime <= b.StartTime && newEndTime >= b.EndTime)));

            if (hasConflict)
                return BadRequest("Provider is not available at the requested time");

            // Get policy and calculate fees
            var policy = await _context.CancellationPolicies
                .FirstOrDefaultAsync(p => p.ProviderId == booking.ProviderId);

            // Count previous reschedules
            var previousReschedules = await _context.BookingActions
                .CountAsync(ba => ba.BookingId == bookingId && 
                           ba.ActionType == "reschedule" && 
                           ba.Status == "Approved");

            decimal rescheduleFee = 0m;
            if (policy != null && previousReschedules >= policy.FreeReschedulesAllowed)
            {
                rescheduleFee = booking.TotalPrice * (policy.RescheduleFeePercentage / 100m);
            }

            // Create booking action record
            var bookingAction = new BookingAction
            {
                BookingId = bookingId,
                ActionType = "reschedule",
                RequestedBy = userId,
                Reason = request.Reason,
                NewBookingDate = DateTime.Parse(request.NewDate),
                NewStartTime = newStartTime,
                NewEndTime = newEndTime,
                FeeAmount = rescheduleFee,
                Status = userId == booking.ProviderId ? "Approved" : "Pending", // Auto-approve if provider reschedules
                ProcessedAt = userId == booking.ProviderId ? DateTime.UtcNow : null
            };

            _context.BookingActions.Add(bookingAction);

            // If approved, update booking
            if (bookingAction.Status == "Approved")
            {
                booking.BookingDate = DateTime.Parse(request.NewDate);
                booking.StartTime = newStartTime;
                booking.EndTime = newEndTime;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = bookingAction.Status == "Approved" ? 
                    "Booking rescheduled successfully" : 
                    "Reschedule request submitted for provider approval",
                rescheduleFee,
                status = bookingAction.Status,
                newDate = request.NewDate,
                newTime = request.NewTime,
                actionId = bookingAction.Id
            });
        }

        // GET: api/booking/policy/{providerId}
        [HttpGet("policy/{providerId}")]
        public async Task<ActionResult<CancellationPolicy>> GetProviderPolicy(string providerId)
        {
            var policy = await _context.CancellationPolicies
                .FirstOrDefaultAsync(p => p.ProviderId == providerId);

            if (policy == null)
            {
                // Return default policy
                return Ok(new CancellationPolicy
                {
                    ProviderId = providerId,
                    SameDayFeePercentage = 100m,
                    OneDayBeforeFeePercentage = 50m,
                    TwoDaysBeforeFeePercentage = 25m,
                    ThreeDaysBeforeFeePercentage = 10m,
                    OneWeekBeforeFeePercentage = 0m,
                    FreeReschedulesAllowed = 2,
                    RescheduleFeePercentage = 10m,
                    MinimumRescheduleHours = 24,
                    AllowSameDayCancellation = true,
                    AllowSameDayReschedule = false,
                    PolicyDescription = "Standard cancellation policy: Free cancellation 7+ days before, fees apply for shorter notice."
                });
            }

            return Ok(policy);
        }

        // POST: api/booking/policy (for providers to set their policy)
        [HttpPost("policy")]
        public async Task<ActionResult> SetCancellationPolicy([FromBody] CancellationPolicy policy)
        {
            var userId = GetUserId();
            
            // Verify user is a provider
            var user = await _context.Users.FindAsync(userId);
            if (user == null || !user.IsServiceProvider)
                return Forbid("Only service providers can set cancellation policies");

            var existingPolicy = await _context.CancellationPolicies
                .FirstOrDefaultAsync(p => p.ProviderId == userId);

            if (existingPolicy != null)
            {
                // Update existing policy
                existingPolicy.SameDayFeePercentage = policy.SameDayFeePercentage;
                existingPolicy.OneDayBeforeFeePercentage = policy.OneDayBeforeFeePercentage;
                existingPolicy.TwoDaysBeforeFeePercentage = policy.TwoDaysBeforeFeePercentage;
                existingPolicy.ThreeDaysBeforeFeePercentage = policy.ThreeDaysBeforeFeePercentage;
                existingPolicy.OneWeekBeforeFeePercentage = policy.OneWeekBeforeFeePercentage;
                existingPolicy.FreeReschedulesAllowed = policy.FreeReschedulesAllowed;
                existingPolicy.RescheduleFeePercentage = policy.RescheduleFeePercentage;
                existingPolicy.MinimumRescheduleHours = policy.MinimumRescheduleHours;
                existingPolicy.AllowSameDayCancellation = policy.AllowSameDayCancellation;
                existingPolicy.AllowSameDayReschedule = policy.AllowSameDayReschedule;
                existingPolicy.RefundProcessingFee = policy.RefundProcessingFee;
                existingPolicy.PolicyDescription = policy.PolicyDescription;
                existingPolicy.SpecialCircumstances = policy.SpecialCircumstances;
                existingPolicy.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                // Create new policy
                policy.ProviderId = userId;
                policy.CreatedAt = DateTime.UtcNow;
                policy.UpdatedAt = DateTime.UtcNow;
                _context.CancellationPolicies.Add(policy);
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cancellation policy updated successfully" });
        }
    }

    public class RescheduleBookingRequest
    {
        public string NewDate { get; set; } = string.Empty; // YYYY-MM-DD
        public string NewTime { get; set; } = string.Empty; // HH:MM
        public string Reason { get; set; } = string.Empty;
    }
}
