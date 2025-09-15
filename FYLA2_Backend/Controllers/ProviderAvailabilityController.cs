using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;
using System.Security.Claims;

namespace FYLA2_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProviderAvailabilityController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProviderAvailabilityController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get provider's weekly schedule with breaks
        /// </summary>
        [HttpGet("{providerId}")]
        public async Task<ActionResult<List<ProviderScheduleDto>>> GetProviderSchedule(string providerId)
        {
            try
            {
                var schedules = await _context.ProviderSchedules
                    .Include(s => s.Breaks)
                    .Where(s => s.ProviderId == providerId && s.SpecificDate == null)
                    .OrderBy(s => s.DayOfWeek)
                    .ToListAsync();

                var scheduleDtos = schedules.Select(s => new ProviderScheduleDto
                {
                    Id = s.Id,
                    DayOfWeek = s.DayOfWeek,
                    IsAvailable = s.IsAvailable,
                    StartTime = s.StartTime?.ToString(@"hh\:mm"),
                    EndTime = s.EndTime?.ToString(@"hh\:mm"),
                    SpecificDate = s.SpecificDate,
                    Breaks = s.Breaks.Select(b => new ProviderBreakDto
                    {
                        Id = b.Id,
                        StartTime = b.StartTime.ToString(@"hh\:mm"),
                        EndTime = b.EndTime.ToString(@"hh\:mm"),
                        Title = b.Title,
                        Type = b.Type,
                        Color = b.Color
                    }).ToList()
                }).ToList();

                return Ok(scheduleDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving schedule", error = ex.Message });
            }
        }

        /// <summary>
        /// Update provider's weekly schedule
        /// </summary>
        [HttpPut("{providerId}")]
        public async Task<ActionResult> UpdateProviderSchedule(string providerId, [FromBody] List<CreateScheduleRequest> scheduleRequests)
        {
            try
            {
                // Verify the provider exists and current user has permission
                var provider = await _context.Users.FindAsync(providerId);
                if (provider == null)
                {
                    return NotFound(new { message = "Provider not found" });
                }

                // For now, allow any authenticated user to update (add proper authorization later)
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (currentUserId != providerId)
                {
                    return StatusCode(403, new { message = "You can only update your own schedule" });
                }

                // Remove existing schedule for this provider (excluding specific dates)
                var existingSchedules = await _context.ProviderSchedules
                    .Include(s => s.Breaks)
                    .Where(s => s.ProviderId == providerId && s.SpecificDate == null)
                    .ToListAsync();

                _context.ProviderSchedules.RemoveRange(existingSchedules);

                // Create new schedules
                foreach (var request in scheduleRequests)
                {
                    var schedule = new ProviderSchedule
                    {
                        ProviderId = providerId,
                        DayOfWeek = request.DayOfWeek,
                        IsAvailable = request.IsAvailable,
                        StartTime = request.IsAvailable && !string.IsNullOrEmpty(request.StartTime) 
                            ? TimeSpan.Parse(request.StartTime) : null,
                        EndTime = request.IsAvailable && !string.IsNullOrEmpty(request.EndTime) 
                            ? TimeSpan.Parse(request.EndTime) : null,
                        SpecificDate = request.SpecificDate,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.ProviderSchedules.Add(schedule);
                    await _context.SaveChangesAsync(); // Save to get the schedule ID

                    // Add breaks for this schedule
                    foreach (var breakRequest in request.Breaks)
                    {
                        var providerBreak = new ProviderBreak
                        {
                            ScheduleId = schedule.Id,
                            StartTime = TimeSpan.Parse(breakRequest.StartTime),
                            EndTime = TimeSpan.Parse(breakRequest.EndTime),
                            Title = breakRequest.Title,
                            Type = breakRequest.Type,
                            Color = breakRequest.Color
                        };

                        _context.ProviderBreaks.Add(providerBreak);
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Schedule updated successfully" });
            }
            catch (FormatException)
            {
                return BadRequest(new { message = "Invalid time format. Use HH:mm format." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating schedule", error = ex.Message });
            }
        }

        /// <summary>
        /// Add a break to a specific day
        /// </summary>
        [HttpPost("{providerId}/breaks")]
        public async Task<ActionResult<ProviderBreakDto>> AddBreak(string providerId, [FromBody] AddBreakRequest request)
        {
            try
            {
                var schedule = await _context.ProviderSchedules
                    .FirstOrDefaultAsync(s => s.ProviderId == providerId && s.DayOfWeek == request.DayOfWeek && s.SpecificDate == null);

                if (schedule == null)
                {
                    return NotFound(new { message = "Schedule not found for the specified day" });
                }

                var providerBreak = new ProviderBreak
                {
                    ScheduleId = schedule.Id,
                    StartTime = TimeSpan.Parse(request.StartTime),
                    EndTime = TimeSpan.Parse(request.EndTime),
                    Title = request.Title,
                    Type = request.Type,
                    Color = request.Color
                };

                _context.ProviderBreaks.Add(providerBreak);
                await _context.SaveChangesAsync();

                var breakDto = new ProviderBreakDto
                {
                    Id = providerBreak.Id,
                    StartTime = providerBreak.StartTime.ToString(@"hh\:mm"),
                    EndTime = providerBreak.EndTime.ToString(@"hh\:mm"),
                    Title = providerBreak.Title,
                    Type = providerBreak.Type,
                    Color = providerBreak.Color
                };

                return Ok(breakDto);
            }
            catch (FormatException)
            {
                return BadRequest(new { message = "Invalid time format. Use HH:mm format." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error adding break", error = ex.Message });
            }
        }

        /// <summary>
        /// Update a specific break
        /// </summary>
        [HttpPut("breaks/{breakId}")]
        public async Task<ActionResult> UpdateBreak(int breakId, [FromBody] UpdateBreakRequest request)
        {
            try
            {
                var providerBreak = await _context.ProviderBreaks
                    .Include(b => b.Schedule)
                    .FirstOrDefaultAsync(b => b.Id == breakId);

                if (providerBreak == null)
                {
                    return NotFound(new { message = "Break not found" });
                }

                // Update break properties
                if (!string.IsNullOrEmpty(request.StartTime))
                    providerBreak.StartTime = TimeSpan.Parse(request.StartTime);
                if (!string.IsNullOrEmpty(request.EndTime))
                    providerBreak.EndTime = TimeSpan.Parse(request.EndTime);
                if (!string.IsNullOrEmpty(request.Title))
                    providerBreak.Title = request.Title;
                if (request.Type.HasValue)
                    providerBreak.Type = request.Type.Value;
                if (!string.IsNullOrEmpty(request.Color))
                    providerBreak.Color = request.Color;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Break updated successfully" });
            }
            catch (FormatException)
            {
                return BadRequest(new { message = "Invalid time format. Use HH:mm format." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating break", error = ex.Message });
            }
        }

        /// <summary>
        /// Delete a specific break
        /// </summary>
        [HttpDelete("breaks/{breakId}")]
        public async Task<ActionResult> DeleteBreak(int breakId)
        {
            try
            {
                var providerBreak = await _context.ProviderBreaks.FindAsync(breakId);

                if (providerBreak == null)
                {
                    return NotFound(new { message = "Break not found" });
                }

                _context.ProviderBreaks.Remove(providerBreak);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Break deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting break", error = ex.Message });
            }
        }

        /// <summary>
        /// Get provider's availability for a specific date (for client booking)
        /// </summary>
        [HttpGet("{providerId}/availability")]
        [AllowAnonymous]
        public async Task<ActionResult<ProviderAvailabilityResponse>> GetProviderAvailability(
            string providerId, 
            [FromQuery] DateTime date)
        {
            try
            {
                var dayOfWeek = (DayOfWeekEnum)((int)date.DayOfWeek);

                // Get the schedule for this day
                var schedule = await _context.ProviderSchedules
                    .Include(s => s.Breaks)
                    .FirstOrDefaultAsync(s => s.ProviderId == providerId && 
                        (s.DayOfWeek == dayOfWeek && s.SpecificDate == null || s.SpecificDate == date.Date));

                if (schedule == null || !schedule.IsAvailable)
                {
                    return Ok(new ProviderAvailabilityResponse
                    {
                        Date = date.Date,
                        IsAvailable = false,
                        TimeSlots = new List<TimeSlot>()
                    });
                }

                // Get existing bookings for this date
                var existingBookings = await _context.Bookings
                    .Where(b => b.ProviderId == providerId && 
                               b.BookingDate.Date == date.Date &&
                               b.Status != BookingStatus.Cancelled)
                    .ToListAsync();

                // Generate available time slots
                var timeSlots = GenerateTimeSlots(schedule, existingBookings, date);

                return Ok(new ProviderAvailabilityResponse
                {
                    Date = date.Date,
                    IsAvailable = true,
                    OpenTime = schedule.StartTime,
                    CloseTime = schedule.EndTime,
                    Breaks = schedule.Breaks.Select(b => new ProviderBreakDto
                    {
                        Id = b.Id,
                        StartTime = b.StartTime.ToString(@"hh\:mm"),
                        EndTime = b.EndTime.ToString(@"hh\:mm"),
                        Title = b.Title,
                        Type = b.Type,
                        Color = b.Color
                    }).ToList(),
                    TimeSlots = timeSlots
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving availability", error = ex.Message });
            }
        }

        private List<TimeSlot> GenerateTimeSlots(ProviderSchedule schedule, List<Booking> existingBookings, DateTime date)
        {
            var timeSlots = new List<TimeSlot>();
            var slotDuration = TimeSpan.FromMinutes(30); // 30-minute slots

            if (!schedule.StartTime.HasValue || !schedule.EndTime.HasValue)
                return timeSlots;

            var currentTime = schedule.StartTime.Value;
            var endTime = schedule.EndTime.Value;

            while (currentTime.Add(slotDuration) <= endTime)
            {
                var slotStart = date.Date.Add(currentTime);
                var slotEnd = slotStart.Add(slotDuration);

                // Check if this slot conflicts with breaks
                var conflictsWithBreak = schedule.Breaks.Any(b =>
                    currentTime < b.EndTime && currentTime.Add(slotDuration) > b.StartTime);

                // Check if this slot conflicts with existing bookings
                var conflictsWithBooking = existingBookings.Any(b =>
                    slotStart < b.BookingDate.Add(TimeSpan.FromMinutes(b.DurationMinutes)) &&
                    slotEnd > b.BookingDate);

                timeSlots.Add(new TimeSlot
                {
                    StartTime = slotStart,
                    EndTime = slotEnd,
                    IsAvailable = !conflictsWithBreak && !conflictsWithBooking,
                    IsBooked = conflictsWithBooking
                });

                currentTime = currentTime.Add(slotDuration);
            }

            return timeSlots;
        }
    }

    // Additional DTOs for the availability API
    public class AddBreakRequest
    {
        public DayOfWeekEnum DayOfWeek { get; set; }
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public BreakType Type { get; set; } = BreakType.Lunch;
        public string Color { get; set; } = "#FF6B35";
    }

    public class UpdateBreakRequest
    {
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
        public string? Title { get; set; }
        public BreakType? Type { get; set; }
        public string? Color { get; set; }
    }

    public class ProviderAvailabilityResponse
    {
        public DateTime Date { get; set; }
        public bool IsAvailable { get; set; }
        public TimeSpan? OpenTime { get; set; }
        public TimeSpan? CloseTime { get; set; }
        public List<ProviderBreakDto> Breaks { get; set; } = new List<ProviderBreakDto>();
        public List<TimeSlot> TimeSlots { get; set; } = new List<TimeSlot>();
    }

    public class TimeSlot
    {
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public bool IsAvailable { get; set; }
        public bool IsBooked { get; set; }
    }
}
