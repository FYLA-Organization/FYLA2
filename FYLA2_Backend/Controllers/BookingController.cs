using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;
using FYLA2_Backend.DTOs;
using FYLA2_Backend.DTOs.Booking;
using FYLA2_Backend.DTOs.Loyalty;
using FYLA2_Backend.Services;
using System.Security.Claims;

namespace FYLA2_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BookingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BookingController> _logger;
        private readonly ILoyaltyService _loyaltyService;

        public BookingController(ApplicationDbContext context, ILogger<BookingController> logger, ILoyaltyService loyaltyService)
        {
            _context = context;
            _logger = logger;
            _loyaltyService = loyaltyService;
        }

        private string GetUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new UnauthorizedAccessException();
        }

        [HttpGet("available-slots")]
        public async Task<ActionResult<List<AvailableTimeSlotDto>>> GetAvailableSlots(
            [FromQuery] string providerId,
            [FromQuery] int serviceId,
            [FromQuery] string date)
        {
            try
            {
                if (!DateTime.TryParse(date, out var requestDate))
                {
                    return BadRequest("Invalid date format");
                }

                // Get service details
                var service = await _context.Services
                    .FirstOrDefaultAsync(s => s.Id == serviceId);

                if (service == null)
                {
                    return NotFound("Service not found");
                }

                // Get provider schedule for the requested day
                var dayOfWeek = (DayOfWeekEnum)(int)requestDate.DayOfWeek;
                var providerSchedule = await _context.ProviderSchedules
                    .Include(ps => ps.Breaks)
                    .FirstOrDefaultAsync(ps => ps.ProviderId == providerId && 
                                              ps.DayOfWeek == dayOfWeek && 
                                              ps.IsAvailable);

                // Check for specific date overrides
                var specificDateSchedule = await _context.ProviderSchedules
                    .Include(ps => ps.Breaks)
                    .FirstOrDefaultAsync(ps => ps.ProviderId == providerId && 
                                              ps.SpecificDate.HasValue && 
                                              ps.SpecificDate.Value.Date == requestDate.Date);

                var workingSchedule = specificDateSchedule ?? providerSchedule;

                if (workingSchedule == null || !workingSchedule.IsAvailable)
                {
                    // For future days, just return empty list (no special message)
                    if (requestDate.Date > DateTime.Today)
                    {
                        return Ok(new List<AvailableTimeSlotDto>());
                    }
                    
                    // For today only, find next available day and show message
                    var nextAvailableInfo = await GetNextAvailableTime(providerId, requestDate);
                    return Ok(new List<AvailableTimeSlotDto>
                    {
                        new AvailableTimeSlotDto
                        {
                            StartTime = DateTime.MinValue,
                            EndTime = DateTime.MinValue,
                            IsAvailable = false,
                            Price = service.Price,
                            Duration = service.DurationMinutes,
                            UnavailableReason = nextAvailableInfo
                        }
                    });
                }

                // Get existing bookings for the day
                var existingBookings = await _context.Bookings
                    .Where(b => b.ProviderId == providerId &&
                               b.BookingDate.Date == requestDate.Date &&
                               b.Status != BookingStatus.Cancelled)
                    .ToListAsync();

                // Get blocked times for the day
                var blockedTimes = await _context.ProviderBlockedTimes
                    .Where(bt => bt.ProviderId == providerId && 
                                bt.Date.Date == requestDate.Date)
                    .ToListAsync();

                // Generate time slots based on provider's working hours
                var timeSlots = new List<AvailableTimeSlotDto>();
                var workingStart = workingSchedule.StartTime ?? new TimeSpan(9, 0, 0);
                var workingEnd = workingSchedule.EndTime ?? new TimeSpan(18, 0, 0);
                var serviceDuration = TimeSpan.FromMinutes(service.DurationMinutes);
                var slotInterval = TimeSpan.FromMinutes(15); // 15-minute intervals for flexibility
                var bufferTime = TimeSpan.FromMinutes(15); // 15-minute buffer between appointments

                var currentTime = workingStart;
                bool hasAvailableSlots = false;
                
                while (currentTime.Add(serviceDuration) <= workingEnd)
                {
                    var slotStart = requestDate.Date.Add(currentTime);
                    var slotEnd = slotStart.Add(serviceDuration);

                    // Skip past time slots entirely for today (don't include them in response)
                    bool isPastTime = requestDate.Date == DateTime.Today && slotStart <= DateTime.Now.AddMinutes(30);
                    if (isPastTime)
                    {
                        currentTime = currentTime.Add(slotInterval);
                        continue;
                    }

                    // Skip if it's during break time
                    bool isDuringBreak = workingSchedule.Breaks.Any(breakTime =>
                    {
                        var breakStart = requestDate.Date.Add(breakTime.StartTime);
                        var breakEnd = requestDate.Date.Add(breakTime.EndTime);
                        return (slotStart < breakEnd && slotEnd > breakStart);
                    });

                    // Check if slot conflicts with existing bookings (with buffer)
                    bool isBookingConflict = existingBookings.Any(b =>
                        (slotStart < b.EndTime.Add(bufferTime) && slotEnd.Add(bufferTime) > b.StartTime));

                    // Check if slot conflicts with blocked times
                    bool isBlockedTime = blockedTimes.Any(bt =>
                    {
                        var blockedStart = requestDate.Date.Add(bt.StartTime);
                        var blockedEnd = requestDate.Date.Add(bt.EndTime);
                        return (slotStart < blockedEnd && slotEnd > blockedStart);
                    });

                    bool isAvailable = !isDuringBreak && !isBookingConflict && !isBlockedTime;

                    if (isAvailable)
                    {
                        hasAvailableSlots = true;
                    }

                    string? unavailableReason = null;
                    if (!isAvailable)
                    {
                        if (isDuringBreak)
                            unavailableReason = "Break time";
                        else if (isBookingConflict)
                            unavailableReason = "Already booked";
                        else if (isBlockedTime)
                            unavailableReason = "Blocked time";
                    }

                    timeSlots.Add(new AvailableTimeSlotDto
                    {
                        StartTime = slotStart,
                        EndTime = slotEnd,
                        IsAvailable = isAvailable,
                        Price = service.Price,
                        Duration = service.DurationMinutes,
                        UnavailableReason = unavailableReason
                    });

                    currentTime = currentTime.Add(slotInterval);
                }

                // If it's today and no future slots are available (all were in the past), find next available day
                if (requestDate.Date == DateTime.Today && !hasAvailableSlots && timeSlots.Count == 0)
                {
                    var nextAvailableInfo = await GetNextAvailableTime(providerId, requestDate.AddDays(1));
                    
                    // Add a single slot indicating next availability
                    timeSlots.Add(new AvailableTimeSlotDto
                    {
                        StartTime = DateTime.MinValue,
                        EndTime = DateTime.MinValue,
                        IsAvailable = false,
                        Price = service.Price,
                        Duration = service.DurationMinutes,
                        UnavailableReason = $"Provider is done for today. {nextAvailableInfo}"
                    });
                }

                return Ok(timeSlots);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available slots");
                return StatusCode(500, new { error = "Failed to get available slots", details = ex.Message });
            }
        }

        [HttpPost("create")]
        public async Task<ActionResult<BookingCreationResponseDto>> CreateBooking([FromBody] CreateBookingDto request)
        {
            try
            {
                var userId = GetUserId();

                // Validate service
                var service = await _context.Services
                    .Include(s => s.Provider)
                    .FirstOrDefaultAsync(s => s.Id == request.ServiceId);

                if (service == null)
                {
                    return NotFound("Service not found");
                }

                // Check for conflicts
                var existingBooking = await _context.Bookings
                    .FirstOrDefaultAsync(b => b.ProviderId == service.ProviderId &&
                                            b.BookingDate.Date == request.BookingDate.Date &&
                                            ((request.StartTime >= b.StartTime && request.StartTime < b.EndTime) ||
                                             (request.EndTime > b.StartTime && request.EndTime <= b.EndTime)) &&
                                            b.Status != BookingStatus.Cancelled);

                if (existingBooking != null)
                {
                    return BadRequest("Time slot is not available");
                }

                var booking = new Booking
                {
                    ClientId = userId,
                    ProviderId = service.ProviderId,
                    ServiceId = request.ServiceId,
                    BookingDate = request.BookingDate,
                    StartTime = request.StartTime,
                    EndTime = request.EndTime,
                    TotalPrice = service.Price,
                    Status = BookingStatus.Pending,
                    Notes = request.Notes,
                    PaymentMethod = request.PaymentMethod
                };

                _context.Bookings.Add(booking);
                await _context.SaveChangesAsync();

                // Calculate loyalty points for completed bookings (or pending ones that will likely complete)
                var loyaltyPointsEarned = await _loyaltyService.AwardPointsForBookingAsync(booking.Id);

                var bookingDto = new BookingDto
                {
                    Id = booking.Id,
                    ClientId = booking.ClientId,
                    ProviderId = booking.ProviderId,
                    ServiceId = booking.ServiceId,
                    BookingDate = booking.BookingDate,
                    StartTime = booking.StartTime,
                    EndTime = booking.EndTime,
                    Status = booking.Status.ToString(),
                    TotalPrice = booking.TotalPrice,
                    Notes = booking.Notes,
                    DurationMinutes = booking.DurationMinutes,
                    PaymentMethod = booking.PaymentMethod
                };

                var response = new BookingCreationResponseDto
                {
                    Booking = bookingDto,
                    LoyaltyPoints = loyaltyPointsEarned
                };

                return CreatedAtAction(nameof(GetBooking), new { id = booking.Id }, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating booking");
                return StatusCode(500, new { error = "Failed to create booking", details = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<BookingDto>> GetBooking(int id)
        {
            try
            {
                var booking = await _context.Bookings
                    .Include(b => b.Client)
                    .Include(b => b.Provider)
                    .Include(b => b.Service)
                    .FirstOrDefaultAsync(b => b.Id == id);

                if (booking == null)
                {
                    return NotFound();
                }

                var bookingDto = new BookingDto
                {
                    Id = booking.Id,
                    ClientId = booking.ClientId,
                    ProviderId = booking.ProviderId,
                    ServiceId = booking.ServiceId,
                    BookingDate = booking.BookingDate,
                    StartTime = booking.StartTime,
                    EndTime = booking.EndTime,
                    Status = booking.Status.ToString(),
                    TotalPrice = booking.TotalPrice,
                    Notes = booking.Notes,
                    DurationMinutes = booking.DurationMinutes,
                    PaymentMethod = booking.PaymentMethod
                };

                return Ok(bookingDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting booking");
                return StatusCode(500, new { error = "Failed to get booking", details = ex.Message });
            }
        }

        [HttpGet("user")]
        public async Task<ActionResult<List<BookingDto>>> GetUserBookings()
        {
            try
            {
                var userId = GetUserId();

                var bookings = await _context.Bookings
                    .Include(b => b.Client)
                    .Include(b => b.Provider)
                    .Include(b => b.Service)
                    .Where(b => b.ClientId == userId || b.ProviderId == userId)
                    .OrderByDescending(b => b.BookingDate)
                    .ToListAsync();

                var bookingDtos = bookings.Select(booking => new BookingDto
                {
                    Id = booking.Id,
                    ClientId = booking.ClientId,
                    ProviderId = booking.ProviderId,
                    ServiceId = booking.ServiceId,
                    BookingDate = booking.BookingDate,
                    StartTime = booking.StartTime,
                    EndTime = booking.EndTime,
                    Status = booking.Status.ToString(),
                    TotalPrice = booking.TotalPrice,
                    Notes = booking.Notes,
                    DurationMinutes = booking.DurationMinutes,
                    PaymentMethod = booking.PaymentMethod
                }).ToList();

                return Ok(bookingDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user bookings");
                return StatusCode(500, new { error = "Failed to get user bookings", details = ex.Message });
            }
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult> UpdateBookingStatus(int id, [FromBody] UpdateBookingStatusDto request)
        {
            try
            {
                var userId = GetUserId();
                var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.Id == id);

                if (booking == null)
                {
                    return NotFound();
                }

                // Only provider or client can update status
                if (booking.ProviderId != userId && booking.ClientId != userId)
                {
                    return Forbid();
                }

                if (Enum.TryParse<BookingStatus>(request.Status, out var status))
                {
                    booking.Status = status;
                    booking.UpdatedAt = DateTime.UtcNow;

                    await _context.SaveChangesAsync();
                    return Ok();
                }

                return BadRequest("Invalid status");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating booking status");
                return StatusCode(500, new { error = "Failed to update booking status", details = ex.Message });
            }
        }

        [HttpGet("loyalty-status/{providerId}")]
        public async Task<ActionResult<ClientLoyaltyStatusDto>> GetClientLoyaltyStatus(string providerId)
        {
            try
            {
                var userId = GetUserId();
                var loyaltyStatus = await _loyaltyService.GetClientLoyaltyStatusAsync(userId, providerId);
                return Ok(loyaltyStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting loyalty status");
                return StatusCode(500, new { error = "Failed to get loyalty status", details = ex.Message });
            }
        }

        private async Task<string> GetNextAvailableTime(string providerId, DateTime startDate)
        {
            try
            {
                // Look ahead up to 7 days to find next available time
                for (int day = 0; day < 7; day++)
                {
                    var checkDate = startDate.AddDays(day);
                    var dayOfWeek = (DayOfWeekEnum)(int)checkDate.DayOfWeek;
                    
                    var schedule = await _context.ProviderSchedules
                        .Include(ps => ps.Breaks)
                        .FirstOrDefaultAsync(ps => ps.ProviderId == providerId && 
                                                  ps.DayOfWeek == dayOfWeek && 
                                                  ps.IsAvailable);

                    if (schedule != null && schedule.StartTime.HasValue)
                    {
                        var dayName = checkDate.ToString("dddd, MMMM d");
                        var startTime = checkDate.Date.Add(schedule.StartTime.Value);
                        var timeString = startTime.ToString("h:mm tt");
                        
                        if (day == 0)
                            return $"Next available: Tomorrow at {timeString}";
                        else if (day == 1)
                            return $"Next available: {dayName} at {timeString}";
                        else
                            return $"Next available: {dayName} at {timeString}";
                    }
                }
                
                return "Next availability: Please contact provider";
            }
            catch (Exception)
            {
                return "Next availability: Please contact provider";
            }
        }

        [HttpGet("available-days")]
        public async Task<ActionResult<List<AvailableDayDto>>> GetAvailableDays(
            [FromQuery] string providerId,
            [FromQuery] int serviceId,
            [FromQuery] string startDate,
            [FromQuery] int daysCount = 14)
        {
            try
            {
                if (!DateTime.TryParse(startDate, out var start))
                {
                    return BadRequest("Invalid start date format");
                }

                var service = await _context.Services
                    .FirstOrDefaultAsync(s => s.Id == serviceId);

                if (service == null)
                {
                    return NotFound("Service not found");
                }

                var availableDays = new List<AvailableDayDto>();

                for (int i = 0; i < daysCount; i++)
                {
                    var currentDate = start.AddDays(i);
                    var dayOfWeek = (int)currentDate.DayOfWeek;

                    // Check for specific date schedule first
                    var specificSchedule = await _context.ProviderSchedules
                        .Where(ps => ps.ProviderId == providerId && 
                                ps.SpecificDate.HasValue && 
                                ps.SpecificDate.Value.Date == currentDate.Date)
                        .FirstOrDefaultAsync();

                    bool isAvailable = false;
                    string? workingHours = null;

                    if (specificSchedule != null)
                    {
                        isAvailable = specificSchedule.IsAvailable;
                        if (isAvailable)
                        {
                            workingHours = $"{specificSchedule.StartTime?.ToString(@"hh\:mm")} - {specificSchedule.EndTime?.ToString(@"hh\:mm")}";
                        }
                    }
                    else
                    {
                        // Check regular weekly schedule
                        var weeklySchedule = await _context.ProviderSchedules
                            .Where(ps => ps.ProviderId == providerId && 
                                    ps.DayOfWeek == (DayOfWeekEnum)dayOfWeek && 
                                    ps.IsAvailable)
                            .FirstOrDefaultAsync();

                        if (weeklySchedule != null)
                        {
                            isAvailable = true;
                            workingHours = $"{weeklySchedule.StartTime?.ToString(@"hh\:mm")} - {weeklySchedule.EndTime?.ToString(@"hh\:mm")}";
                        }
                    }

                    if (isAvailable)
                    {
                        availableDays.Add(new AvailableDayDto
                        {
                            Date = currentDate,
                            DayOfWeek = currentDate.DayOfWeek.ToString(),
                            IsAvailable = true,
                            WorkingHours = workingHours
                        });
                    }
                }

                return Ok(availableDays);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available days for provider {ProviderId}", providerId);
                return StatusCode(500, "An error occurred while retrieving available days");
            }
        }
    }
}
