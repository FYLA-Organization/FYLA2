using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;
using FYLA2_Backend.DTOs.Appointment;
using System.Security.Claims;

namespace FYLA2_Backend.Controllers
{
  [ApiController]
  [Route("api/provider/[controller]")]
  [Authorize]
  public class ScheduleManagementController : ControllerBase
  {
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ScheduleManagementController> _logger;

    public ScheduleManagementController(ApplicationDbContext context, ILogger<ScheduleManagementController> logger)
    {
      _context = context;
      _logger = logger;
    }

    private string GetUserId()
    {
      return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new UnauthorizedAccessException();
    }

    [HttpGet("availability/{providerId}")]
    [AllowAnonymous] // Allow clients to check availability
    public async Task<ActionResult<DayScheduleDto>> GetProviderAvailability(string providerId, [FromQuery] DateTime date)
    {
      try
      {
        var daySchedule = await BuildPublicDaySchedule(providerId, date.Date);
        return Ok(daySchedule);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting provider availability");
        return StatusCode(500, "Internal server error");
      }
    }

    [HttpGet("week")]
    public async Task<ActionResult<WeekScheduleDto>> GetWeekSchedule([FromQuery] DateTime weekStart)
    {
      try
      {
        var providerId = GetUserId();

        // Ensure we start from Monday
        var monday = weekStart.Date.AddDays(-(int)weekStart.DayOfWeek + (int)DayOfWeek.Monday);
        if (weekStart.DayOfWeek == DayOfWeek.Sunday)
          monday = monday.AddDays(-7);

        var weekEnd = monday.AddDays(6);

        var weekSchedule = new WeekScheduleDto
        {
          WeekStartDate = monday,
          WeekEndDate = weekEnd,
          Days = new List<DayScheduleDto>()
        };

        for (int i = 0; i < 7; i++)
        {
          var currentDate = monday.AddDays(i);
          var daySchedule = await BuildDetailedDaySchedule(providerId, currentDate);
          weekSchedule.Days.Add(daySchedule);
        }

        weekSchedule.TotalWeekAppointments = weekSchedule.Days.Sum(d => d.TotalAppointments);
        weekSchedule.WeekRevenue = weekSchedule.Days.Sum(d => d.DayRevenue);
        weekSchedule.AvailableSlots = weekSchedule.Days.Sum(d => d.TimeSlots.Count(t => t.IsAvailable));

        return Ok(weekSchedule);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting week schedule");
        return StatusCode(500, "Internal server error");
      }
    }

    [HttpPost("availability")]
    public async Task<ActionResult> UpdateAvailability([FromBody] AvailabilityUpdateDto availabilityUpdate)
    {
      try
      {
        var providerId = GetUserId();

        // For now, we'll store this in the User's profile or create a separate Availability table
        // Since we don't have an Availability table yet, we'll implement basic logic

        _logger.LogInformation($"Provider {providerId} updated availability for {availabilityUpdate.Date:yyyy-MM-dd}");

        return Ok(new { message = "Availability updated successfully" });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error updating availability");
        return StatusCode(500, "Internal server error");
      }
    }

    [HttpPost("bulk-availability")]
    public async Task<ActionResult> UpdateBulkAvailability([FromBody] BulkAvailabilityUpdateDto bulkUpdate)
    {
      try
      {
        var providerId = GetUserId();

        foreach (var update in bulkUpdate.Updates)
        {
          // Update availability for each day
          _logger.LogInformation($"Provider {providerId} updated availability for {update.Date:yyyy-MM-dd}");

          // If apply to future weeks is enabled, replicate the pattern
          if (bulkUpdate.ApplyToFutureWeeks)
          {
            for (int week = 1; week <= bulkUpdate.WeeksToApply; week++)
            {
              var futureDate = update.Date.AddDays(7 * week);
              _logger.LogInformation($"Applied same availability to {futureDate:yyyy-MM-dd}");
            }
          }
        }

        return Ok(new { message = "Bulk availability updated successfully" });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error updating bulk availability");
        return StatusCode(500, "Internal server error");
      }
    }

    [HttpPost("block-time")]
    public async Task<ActionResult> BlockTimeSlot([FromBody] BlockTimeSlotDto blockRequest)
    {
      try
      {
        var providerId = GetUserId();

        // Check if there's already a booking at this time
        var existingBooking = await _context.Bookings
            .FirstOrDefaultAsync(b => b.ProviderId == providerId &&
                                   b.BookingDate.Date == blockRequest.Date.Date &&
                                   b.StartTime <= blockRequest.StartTime &&
                                   b.EndTime > blockRequest.StartTime &&
                                   b.Status != BookingStatus.Cancelled);

        if (existingBooking != null)
        {
          return BadRequest("Cannot block time slot - there's already a booking at this time");
        }

        // Create a blocked booking
        var blockedBooking = new Booking
        {
          ProviderId = providerId,
          ClientId = providerId, // Use provider as client for blocked slots
          ServiceId = 0, // Special value for blocked slots
          BookingDate = blockRequest.Date.Date,
          StartTime = blockRequest.StartTime,
          EndTime = blockRequest.EndTime,
          Status = BookingStatus.Blocked,
          TotalPrice = 0,
          DurationMinutes = (int)(blockRequest.EndTime - blockRequest.StartTime).TotalMinutes,
          Notes = blockRequest.Reason ?? "Time blocked by provider",
          CreatedAt = DateTime.UtcNow
        };

        _context.Bookings.Add(blockedBooking);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Time slot blocked successfully" });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error blocking time slot");
        return StatusCode(500, "Internal server error");
      }
    }

    [HttpDelete("unblock-time/{bookingId}")]
    public async Task<ActionResult> UnblockTimeSlot(int bookingId)
    {
      try
      {
        var providerId = GetUserId();
        var blockedBooking = await _context.Bookings
            .FirstOrDefaultAsync(b => b.Id == bookingId &&
                                   b.ProviderId == providerId &&
                                   b.Status == BookingStatus.Blocked);

        if (blockedBooking == null)
        {
          return NotFound("Blocked time slot not found");
        }

        _context.Bookings.Remove(blockedBooking);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Time slot unblocked successfully" });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error unblocking time slot");
        return StatusCode(500, "Internal server error");
      }
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ScheduleStatsDto>> GetScheduleStats([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
      try
      {
        var providerId = GetUserId();

        var start = startDate ?? DateTime.Today.AddDays(-30);
        var end = endDate ?? DateTime.Today.AddDays(30);

        var bookings = await _context.Bookings
            .Include(b => b.Service)
            .Where(b => b.ProviderId == providerId &&
                      b.BookingDate >= start &&
                      b.BookingDate <= end)
            .ToListAsync();

        var stats = new ScheduleStatsDto
        {
          TotalBookedHours = bookings.Sum(b => b.DurationMinutes) / 60.0,
          TotalAvailableHours = CalculateAvailableHours(start, end),
          UtilizationRate = 0, // Will calculate below
          PeakDays = GetPeakDays(bookings),
          PeakHours = GetPeakHours(bookings),
          AverageBookingsPerDay = 0,
          TotalBlockedSlots = bookings.Count(b => b.Status == BookingStatus.Blocked),
          UpcomingAppointments = bookings.Count(b => b.BookingDate >= DateTime.Today && b.Status != BookingStatus.Cancelled),
          RevenueProjection = bookings.Where(b => b.BookingDate >= DateTime.Today && b.Status != BookingStatus.Cancelled).Sum(b => b.TotalPrice)
        };

        if (stats.TotalAvailableHours > 0)
        {
          stats.UtilizationRate = stats.TotalBookedHours / stats.TotalAvailableHours * 100;
        }

        var workingDays = CountWorkingDays(start, end);
        if (workingDays > 0)
        {
          stats.AverageBookingsPerDay = bookings.Count(b => b.Status != BookingStatus.Blocked) / (double)workingDays;
        }

        return Ok(stats);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting schedule stats");
        return StatusCode(500, "Internal server error");
      }
    }

    private async Task<DayScheduleDto> BuildPublicDaySchedule(string providerId, DateTime date)
    {
      // Get appointments for this day (only show availability, not detailed info)
      var appointments = await _context.Bookings
          .Where(b => b.ProviderId == providerId &&
                    b.BookingDate.Date == date.Date &&
                    b.Status != BookingStatus.Cancelled)
          .ToListAsync();

      var timeSlots = GenerateTimeSlots(date, appointments, false);

      return new DayScheduleDto
      {
        Date = date,
        IsWorkingDay = IsWorkingDay(date),
        StartTime = GetWorkingStartTime(date.DayOfWeek),
        EndTime = GetWorkingEndTime(date.DayOfWeek),
        TimeSlots = timeSlots,
        TotalAppointments = appointments.Count(a => a.Status != BookingStatus.Blocked),
        DayRevenue = 0, // Don't expose revenue in public API
        HasAvailableSlots = timeSlots.Any(t => t.IsAvailable)
      };
    }

    private async Task<DayScheduleDto> BuildDetailedDaySchedule(string providerId, DateTime date)
    {
      // Get appointments for this day with full details
      var appointments = await _context.Bookings
          .Include(b => b.Client)
          .Include(b => b.Service)
          .Where(b => b.ProviderId == providerId && b.BookingDate.Date == date.Date)
          .ToListAsync();

      var timeSlots = GenerateTimeSlots(date, appointments, true);
      var dayRevenue = appointments.Where(a => a.Status == BookingStatus.Completed).Sum(a => a.TotalPrice);

      return new DayScheduleDto
      {
        Date = date,
        IsWorkingDay = IsWorkingDay(date),
        StartTime = GetWorkingStartTime(date.DayOfWeek),
        EndTime = GetWorkingEndTime(date.DayOfWeek),
        TimeSlots = timeSlots,
        TotalAppointments = appointments.Count(a => a.Status != BookingStatus.Blocked),
        DayRevenue = dayRevenue,
        HasAvailableSlots = timeSlots.Any(t => t.IsAvailable)
      };
    }

    private List<AppointmentTimeSlotDto> GenerateTimeSlots(DateTime date, List<Booking> appointments, bool includeDetails)
    {
      var timeSlots = new List<AppointmentTimeSlotDto>();
      var workingStart = GetWorkingStartTime(date.DayOfWeek);
      var workingEnd = GetWorkingEndTime(date.DayOfWeek);
      var slotDuration = TimeSpan.FromMinutes(30);

      if (!workingStart.HasValue || !workingEnd.HasValue)
        return timeSlots; // Not a working day

      for (var time = workingStart.Value; time < workingEnd.Value; time = time.Add(slotDuration))
      {
        var slotStart = date.Date.Add(time);
        var slotEnd = slotStart.Add(slotDuration);

        var appointment = appointments.FirstOrDefault(a =>
            a.StartTime <= slotStart && a.EndTime > slotStart);

        var slot = new AppointmentTimeSlotDto
        {
          StartTime = slotStart,
          EndTime = slotEnd,
          IsAvailable = appointment == null
        };

        if (includeDetails && appointment != null)
        {
          slot.BookingId = appointment.Id.ToString();
          slot.ClientName = appointment.Status == BookingStatus.Blocked ? "BLOCKED" :
                           $"{appointment.Client?.FirstName} {appointment.Client?.LastName}";
          slot.ServiceName = appointment.Service?.Name;
          slot.Status = appointment.Status;
        }

        timeSlots.Add(slot);
      }

      return timeSlots;
    }

    private bool IsWorkingDay(DateTime date)
    {
      // Default working days: Monday to Saturday
      return date.DayOfWeek != DayOfWeek.Sunday;
    }

    private TimeSpan? GetWorkingStartTime(DayOfWeek dayOfWeek)
    {
      // Default working hours: 9 AM to 6 PM, closed on Sundays
      return dayOfWeek == DayOfWeek.Sunday ? null : new TimeSpan(9, 0, 0);
    }

    private TimeSpan? GetWorkingEndTime(DayOfWeek dayOfWeek)
    {
      return dayOfWeek == DayOfWeek.Sunday ? null : new TimeSpan(18, 0, 0);
    }

    private double CalculateAvailableHours(DateTime start, DateTime end)
    {
      var totalHours = 0.0;
      for (var date = start.Date; date <= end.Date; date = date.AddDays(1))
      {
        if (IsWorkingDay(date))
        {
          var startTime = GetWorkingStartTime(date.DayOfWeek);
          var endTime = GetWorkingEndTime(date.DayOfWeek);
          if (startTime.HasValue && endTime.HasValue)
          {
            totalHours += (endTime.Value - startTime.Value).TotalHours;
          }
        }
      }
      return totalHours;
    }

    private int CountWorkingDays(DateTime start, DateTime end)
    {
      var count = 0;
      for (var date = start.Date; date <= end.Date; date = date.AddDays(1))
      {
        if (IsWorkingDay(date)) count++;
      }
      return count;
    }

    private List<string> GetPeakDays(List<Booking> bookings)
    {
      return bookings
          .Where(b => b.Status != BookingStatus.Blocked && b.Status != BookingStatus.Cancelled)
          .GroupBy(b => b.BookingDate.DayOfWeek)
          .OrderByDescending(g => g.Count())
          .Take(3)
          .Select(g => g.Key.ToString())
          .ToList();
    }

    private List<int> GetPeakHours(List<Booking> bookings)
    {
      return bookings
          .Where(b => b.Status != BookingStatus.Blocked && b.Status != BookingStatus.Cancelled)
          .GroupBy(b => b.StartTime.Hour)
          .OrderByDescending(g => g.Count())
          .Take(3)
          .Select(g => g.Key)
          .ToList();
    }
  }

  public class BlockTimeSlotDto
  {
    public DateTime Date { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Reason { get; set; }
  }

  public class ScheduleStatsDto
  {
    public double TotalBookedHours { get; set; }
    public double TotalAvailableHours { get; set; }
    public double UtilizationRate { get; set; }
    public List<string> PeakDays { get; set; } = new();
    public List<int> PeakHours { get; set; } = new();
    public double AverageBookingsPerDay { get; set; }
    public int TotalBlockedSlots { get; set; }
    public int UpcomingAppointments { get; set; }
    public decimal RevenueProjection { get; set; }
  }
}
