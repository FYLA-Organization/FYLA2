using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;

namespace FYLA2_Backend.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  [Authorize]
  public class ProviderScheduleController : ControllerBase
  {
    private readonly ApplicationDbContext _context;

    public ProviderScheduleController(ApplicationDbContext context)
    {
      _context = context;
    }

    // GET: api/providerschedule/my-schedule
    [HttpGet("my-schedule")]
    public async Task<ActionResult<IEnumerable<object>>> GetMySchedule()
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      var user = await _context.Users.FindAsync(userId);
      if (user == null || !user.IsServiceProvider)
        return Forbid("Only service providers can access schedules");

      var schedules = await _context.ProviderSchedules
          .Where(ps => ps.ProviderId == userId)
          .OrderBy(ps => ps.DayOfWeek)
          .Select(ps => new
          {
            id = ps.Id,
            dayOfWeek = ps.DayOfWeek.ToString(),
            isAvailable = ps.IsAvailable,
            startTime = ps.StartTime != null ? ps.StartTime.Value.ToString(@"hh\:mm") : null,
            endTime = ps.EndTime != null ? ps.EndTime.Value.ToString(@"hh\:mm") : null,
            breaks = ps.Breaks.Select(b => new {
                startTime = b.StartTime.ToString(@"hh\:mm"),
                endTime = b.EndTime.ToString(@"hh\:mm"),
                title = b.Title,
                type = b.Type.ToString()
            }).ToList(),
            specificDate = ps.SpecificDate != null ? ps.SpecificDate.Value.ToString("yyyy-MM-dd") : null
          })
          .ToListAsync();

      return Ok(schedules);
    }

    // POST: api/providerschedule/set-schedule
    [HttpPost("set-schedule")]
    public async Task<ActionResult> SetSchedule([FromBody] List<SetScheduleRequest> scheduleRequests)
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      var user = await _context.Users.FindAsync(userId);
      if (user == null || !user.IsServiceProvider)
        return Forbid("Only service providers can set schedules");

      // Remove existing schedule for the provider
      var existingSchedules = await _context.ProviderSchedules
          .Where(ps => ps.ProviderId == userId && ps.SpecificDate == null)
          .ToListAsync();

      _context.ProviderSchedules.RemoveRange(existingSchedules);

      // Add new schedules
      foreach (var request in scheduleRequests)
      {
        if (!Enum.TryParse<DayOfWeekEnum>(request.DayOfWeek, out var dayOfWeek))
          continue;

        TimeSpan? startTime = null;
        TimeSpan? endTime = null;
        TimeSpan? breakStartTime = null;
        TimeSpan? breakEndTime = null;

        if (request.IsAvailable)
        {
          if (!TimeSpan.TryParse(request.StartTime, out var parsedStartTime) ||
              !TimeSpan.TryParse(request.EndTime, out var parsedEndTime))
          {
            return BadRequest($"Invalid time format for {request.DayOfWeek}");
          }

          startTime = parsedStartTime;
          endTime = parsedEndTime;

          // Parse break times if provided
          if (!string.IsNullOrEmpty(request.BreakStartTime) &&
              !string.IsNullOrEmpty(request.BreakEndTime))
          {
            if (TimeSpan.TryParse(request.BreakStartTime, out var parsedBreakStart) &&
                TimeSpan.TryParse(request.BreakEndTime, out var parsedBreakEnd))
            {
              breakStartTime = parsedBreakStart;
              breakEndTime = parsedBreakEnd;
            }
          }
        }

        var schedule = new ProviderSchedule
        {
          ProviderId = userId,
          DayOfWeek = dayOfWeek,
          IsAvailable = request.IsAvailable,
          StartTime = startTime,
          EndTime = endTime
        };

        _context.ProviderSchedules.Add(schedule);
        await _context.SaveChangesAsync();

        // Add break times if provided
        if (!string.IsNullOrEmpty(request.BreakStartTime) &&
            !string.IsNullOrEmpty(request.BreakEndTime))
        {
          if (TimeSpan.TryParse(request.BreakStartTime, out var parsedBreakStart) &&
              TimeSpan.TryParse(request.BreakEndTime, out var parsedBreakEnd))
          {
            var breakTime = new ProviderBreak
            {
              ScheduleId = schedule.Id,
              StartTime = parsedBreakStart,
              EndTime = parsedBreakEnd,
              Title = "Break",
              Type = BreakType.Lunch
            };
            _context.ProviderBreaks.Add(breakTime);
          }
        }
      }

      await _context.SaveChangesAsync();
      return Ok(new { message = "Schedule updated successfully" });
    }

    // POST: api/providerschedule/block-time
    [HttpPost("block-time")]
    public async Task<ActionResult> BlockTime([FromBody] BlockTimeRequest request)
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      var user = await _context.Users.FindAsync(userId);
      if (user == null || !user.IsServiceProvider)
        return Forbid("Only service providers can block time");

      if (!DateTime.TryParse(request.Date, out var date) ||
          !TimeSpan.TryParse(request.StartTime, out var startTime) ||
          !TimeSpan.TryParse(request.EndTime, out var endTime))
      {
        return BadRequest("Invalid date or time format");
      }

      var blockedTime = new ProviderBlockedTime
      {
        ProviderId = userId,
        Date = date.Date,
        StartTime = startTime,
        EndTime = endTime,
        Reason = request.Reason
      };

      _context.ProviderBlockedTimes.Add(blockedTime);
      await _context.SaveChangesAsync();

      return Ok(new { message = "Time blocked successfully" });
    }

    // GET: api/providerschedule/blocked-times
    [HttpGet("blocked-times")]
    public async Task<ActionResult<IEnumerable<object>>> GetBlockedTimes([FromQuery] string? date = null)
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      var query = _context.ProviderBlockedTimes
          .Where(pbt => pbt.ProviderId == userId);

      if (!string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var requestedDate))
      {
        query = query.Where(pbt => pbt.Date.Date == requestedDate.Date);
      }

      var blockedTimes = await query
          .Select(pbt => new
          {
            id = pbt.Id,
            date = pbt.Date.ToString("yyyy-MM-dd"),
            startTime = pbt.StartTime.ToString(@"hh\:mm"),
            endTime = pbt.EndTime.ToString(@"hh\:mm"),
            reason = pbt.Reason
          })
          .ToListAsync();

      return Ok(blockedTimes);
    }

    // DELETE: api/providerschedule/blocked-times/{id}
    [HttpDelete("blocked-times/{id}")]
    public async Task<ActionResult> RemoveBlockedTime(int id)
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      var blockedTime = await _context.ProviderBlockedTimes
          .FirstOrDefaultAsync(pbt => pbt.Id == id && pbt.ProviderId == userId);

      if (blockedTime == null)
        return NotFound();

      _context.ProviderBlockedTimes.Remove(blockedTime);
      await _context.SaveChangesAsync();

      return Ok(new { message = "Blocked time removed successfully" });
    }

    // POST: api/providerschedule/weekly
    [HttpPost("weekly")]
    public async Task<ActionResult> SetWeeklySchedule([FromBody] SetWeeklyScheduleRequest request)
    {
      var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (string.IsNullOrEmpty(userId))
        return Unauthorized();

      var user = await _context.Users.FindAsync(userId);
      if (user == null || !user.IsServiceProvider)
        return Forbid("Only service providers can set schedules");

      try
      {
        // Remove existing schedule for this provider
        var existingSchedules = await _context.ProviderSchedules
            .Where(ps => ps.ProviderId == userId && ps.SpecificDate == null)
            .ToListAsync();
        
        _context.ProviderSchedules.RemoveRange(existingSchedules);

        // Add new schedule entries
        foreach (var scheduleItem in request.Schedule)
        {
          if (!Enum.TryParse<DayOfWeek>(scheduleItem.DayOfWeek, out var dayOfWeek))
            continue;

          var providerSchedule = new ProviderSchedule
          {
            ProviderId = userId,
            DayOfWeek = (DayOfWeekEnum)dayOfWeek,
            IsAvailable = scheduleItem.IsAvailable
          };

          if (scheduleItem.IsAvailable)
          {
            if (!string.IsNullOrEmpty(scheduleItem.StartTime) && TimeSpan.TryParse(scheduleItem.StartTime, out var startTime))
              providerSchedule.StartTime = startTime;

            if (!string.IsNullOrEmpty(scheduleItem.EndTime) && TimeSpan.TryParse(scheduleItem.EndTime, out var endTime))
              providerSchedule.EndTime = endTime;
          }

          _context.ProviderSchedules.Add(providerSchedule);
        }

        await _context.SaveChangesAsync();

        // Add break times for each schedule if provided
        foreach (var scheduleItem in request.Schedule)
        {
          if (scheduleItem.IsAvailable && 
              !string.IsNullOrEmpty(scheduleItem.BreakStartTime) && 
              !string.IsNullOrEmpty(scheduleItem.BreakEndTime))
          {
            if (Enum.TryParse<DayOfWeek>(scheduleItem.DayOfWeek, out var dayOfWeek) &&
                TimeSpan.TryParse(scheduleItem.BreakStartTime, out var breakStart) &&
                TimeSpan.TryParse(scheduleItem.BreakEndTime, out var breakEnd))
            {
              var schedule = _context.ProviderSchedules
                .FirstOrDefault(ps => ps.ProviderId == userId && ps.DayOfWeek == (DayOfWeekEnum)dayOfWeek);
              
              if (schedule != null)
              {
                var breakTime = new ProviderBreak
                {
                  ScheduleId = schedule.Id,
                  StartTime = breakStart,
                  EndTime = breakEnd,
                  Title = "Break",
                  Type = BreakType.Lunch
                };
                _context.ProviderBreaks.Add(breakTime);
              }
            }
          }
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "Weekly schedule updated successfully" });
      }
      catch (Exception ex)
      {
        return BadRequest(new { message = "Failed to update schedule", error = ex.Message });
      }
    }
  }

  // DTOs
  public class SetWeeklyScheduleRequest
  {
    public List<SetScheduleRequest> Schedule { get; set; } = new();
  }
  public class SetScheduleRequest
  {
    public string DayOfWeek { get; set; } = string.Empty;
    public bool IsAvailable { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public string? BreakStartTime { get; set; }
    public string? BreakEndTime { get; set; }
  }

  public class BlockTimeRequest
  {
    public string Date { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string? Reason { get; set; }
  }
}
