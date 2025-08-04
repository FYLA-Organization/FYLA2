using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;
using FYLA2_Backend.DTOs.Appointment;
using FYLA2_Backend.Services;
using System.Security.Claims;
using System.Globalization;

namespace FYLA2_Backend.Controllers
{
  [ApiController]
  [Route("api/provider/[controller]")]
  [Authorize]
  public class AppointmentsController : ControllerBase
  {
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AppointmentsController> _logger;
    private readonly ILoyaltyService _loyaltyService;

    public AppointmentsController(
        ApplicationDbContext context,
        ILogger<AppointmentsController> logger,
        ILoyaltyService loyaltyService)
    {
      _context = context;
      _logger = logger;
      _loyaltyService = loyaltyService;
    }

    private string GetUserId()
    {
      return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new UnauthorizedAccessException();
    }

    [HttpGet("test")]
    public async Task<ActionResult> Test()
    {
      try
      {
        var providerId = GetUserId();
        var bookingCount = await _context.Bookings.Where(b => b.ProviderId == providerId).CountAsync();
        return Ok(new { message = "Test successful", providerId, bookingCount });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Test endpoint error");
        return StatusCode(500, ex.Message);
      }
    }

    [HttpGet]
    public async Task<ActionResult<AppointmentSearchResultDto>> GetAppointments([FromQuery] AppointmentFilterDto filter)
    {
      try
      {
        var providerId = GetUserId();

        var query = _context.Bookings
            .Include(b => b.Client)
            .Include(b => b.Service)
            .Include(b => b.PaymentRecords)
            .Include(b => b.Reviews)
            .Where(b => b.ProviderId == providerId);

        // Apply filters
        if (filter.StartDate.HasValue)
          query = query.Where(b => b.BookingDate >= filter.StartDate.Value.Date);

        if (filter.EndDate.HasValue)
          query = query.Where(b => b.BookingDate <= filter.EndDate.Value.Date);

        if (filter.Status.HasValue)
          query = query.Where(b => b.Status == filter.Status.Value);

        if (!string.IsNullOrEmpty(filter.ServiceCategory))
          query = query.Where(b => b.Service.Category.ToLower().Contains(filter.ServiceCategory.ToLower()));

        if (!string.IsNullOrEmpty(filter.ClientName))
          query = query.Where(b => (b.Client.FirstName + " " + b.Client.LastName).ToLower().Contains(filter.ClientName.ToLower()));

        if (!string.IsNullOrEmpty(filter.PaymentStatus))
        {
          if (filter.PaymentStatus.ToLower() == "paid")
            query = query.Where(b => b.PaymentRecords.Any(p => p.Status == PaymentStatus.Succeeded));
          else if (filter.PaymentStatus.ToLower() == "pending")
            query = query.Where(b => !b.PaymentRecords.Any(p => p.Status == PaymentStatus.Succeeded));
        }

        if (filter.MinAmount.HasValue)
          query = query.Where(b => b.TotalPrice >= filter.MinAmount.Value);

        if (filter.MaxAmount.HasValue)
          query = query.Where(b => b.TotalPrice <= filter.MaxAmount.Value);

        // Get client booking counts for first-time client filter
        if (filter.IsFirstTimeClient.HasValue)
        {
          var clientBookingCounts = await _context.Bookings
              .Where(b => b.ProviderId == providerId && b.Status == BookingStatus.Completed)
              .GroupBy(b => b.ClientId)
              .Select(g => new { ClientId = g.Key, Count = g.Count() })
              .ToListAsync();

          if (filter.IsFirstTimeClient.Value)
          {
            var firstTimeClientIds = clientBookingCounts.Where(c => c.Count == 1).Select(c => c.ClientId).ToList();
            query = query.Where(b => firstTimeClientIds.Contains(b.ClientId));
          }
          else
          {
            var returningClientIds = clientBookingCounts.Where(c => c.Count > 1).Select(c => c.ClientId).ToList();
            query = query.Where(b => returningClientIds.Contains(b.ClientId));
          }
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync();

        // Apply sorting
        query = filter.SortBy?.ToLower() switch
        {
          "clientname" => filter.SortDescending
              ? query.OrderByDescending(b => b.Client.FirstName + " " + b.Client.LastName)
              : query.OrderBy(b => b.Client.FirstName + " " + b.Client.LastName),
          "amount" => filter.SortDescending
              ? query.OrderByDescending(b => b.TotalPrice)
              : query.OrderBy(b => b.TotalPrice),
          "status" => filter.SortDescending
              ? query.OrderByDescending(b => b.Status)
              : query.OrderBy(b => b.Status),
          "service" => filter.SortDescending
              ? query.OrderByDescending(b => b.Service.Name)
              : query.OrderBy(b => b.Service.Name),
          _ => filter.SortDescending
              ? query.OrderByDescending(b => b.StartTime)
              : query.OrderBy(b => b.StartTime)
        };

        // Apply pagination
        var appointments = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        // Get client statistics for each appointment
        var clientIds = appointments.Select(a => a.ClientId).Distinct().ToList();
        var clientStats = await GetClientStats(providerId, clientIds);

        var appointmentDtos = appointments.Select(a => MapToAppointmentDto(a, clientStats)).ToList();

        // Calculate stats
        var stats = await CalculateAppointmentStats(providerId, filter);

        return Ok(new AppointmentSearchResultDto
        {
          Appointments = appointmentDtos,
          TotalCount = totalCount,
          TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize),
          CurrentPage = filter.Page,
          Stats = stats
        });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting provider appointments");
        return StatusCode(500, "Internal server error");
      }
    }

    [HttpGet("payment-history")]
    public async Task<ActionResult<List<PaymentHistoryDto>>> GetPaymentHistory(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
      try
      {
        var providerId = GetUserId();

        var query = _context.PaymentRecords
            .Include(p => p.Booking)
                .ThenInclude(b => b.Client)
            .Include(p => p.Booking)
                .ThenInclude(b => b.Service)
            .Where(p => p.Booking != null && p.Booking.ProviderId == providerId);

        if (startDate.HasValue)
          query = query.Where(p => p.CreatedAt >= startDate.Value);

        if (endDate.HasValue)
          query = query.Where(p => p.CreatedAt <= endDate.Value.AddDays(1));

        var payments = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var paymentHistory = payments.Select(p => new PaymentHistoryDto
        {
          BookingId = p.BookingId ?? 0,
          ClientName = $"{p.Booking?.Client?.FirstName} {p.Booking?.Client?.LastName}",
          ServiceName = p.Booking?.Service?.Name ?? "Unknown Service",
          Amount = p.Amount,
          TipAmount = GetTipAmount(p.BookingId),
          PaymentDate = p.CreatedAt,
          PaymentMethod = "Card", // Assuming Stripe
          PaymentStatus = p.Status.ToString(),
          TransactionId = p.StripePaymentIntentId,
          AppointmentDate = p.Booking?.BookingDate ?? DateTime.MinValue,
          CanGenerateInvoice = p.Status == PaymentStatus.Succeeded
        }).ToList();

        return Ok(paymentHistory);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting payment history");
        return StatusCode(500, "Internal server error");
      }
    }

    [HttpPost("{appointmentId}/update-status")]
    public async Task<ActionResult> UpdateAppointmentStatus(int appointmentId, [FromBody] UpdateAppointmentStatusDto updateDto)
    {
      try
      {
        var providerId = GetUserId();
        var appointment = await _context.Bookings
            .Include(b => b.Client)
            .Include(b => b.Service)
            .FirstOrDefaultAsync(b => b.Id == appointmentId && b.ProviderId == providerId);

        if (appointment == null)
          return NotFound("Appointment not found");

        var oldStatus = appointment.Status;
        appointment.Status = updateDto.Status;

        if (!string.IsNullOrEmpty(updateDto.Notes))
          appointment.Notes = updateDto.Notes;

        if (updateDto.Status == BookingStatus.Completed)
        {
          appointment.CompletedAt = DateTime.UtcNow;

          // Award loyalty points if not already awarded
          var existingLoyaltyTransaction = await _context.LoyaltyTransactions
              .FirstOrDefaultAsync(lt => lt.BookingId == appointmentId && lt.TransactionType == LoyaltyTransactionType.Earned);

          if (existingLoyaltyTransaction == null)
          {
            await _loyaltyService.AwardPointsForBookingAsync(appointmentId);
          }
        }

        // Handle tip amount if provided
        if (updateDto.TipAmount.HasValue && updateDto.TipAmount.Value > 0)
        {
          // Create a tip payment record
          var tipPayment = new PaymentRecord
          {
            UserId = appointment.ClientId,
            BookingId = appointmentId,
            Amount = updateDto.TipAmount.Value,
            Currency = "usd",
            Status = PaymentStatus.Succeeded,
            Type = PaymentType.Tip,
            Description = "Tip payment",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
          };
          _context.PaymentRecords.Add(tipPayment);
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation($"Appointment {appointmentId} status updated from {oldStatus} to {updateDto.Status}");

        return Ok(new { message = "Appointment status updated successfully" });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error updating appointment status");
        return StatusCode(500, "Internal server error");
      }
    }

    [HttpGet("schedule")]
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
          var daySchedule = await BuildDaySchedule(providerId, currentDate);
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

    [HttpPost("generate-invoice/{bookingId}")]
    public async Task<ActionResult<InvoiceDto>> GenerateInvoice(int bookingId)
    {
      try
      {
        var providerId = GetUserId();
        var booking = await _context.Bookings
            .Include(b => b.Client)
            .Include(b => b.Service)
            .Include(b => b.Provider)
            .Include(b => b.PaymentRecords)
            .FirstOrDefaultAsync(b => b.Id == bookingId && b.ProviderId == providerId);

        if (booking == null)
          return NotFound("Booking not found");

        if (booking.Status != BookingStatus.Completed)
          return BadRequest("Can only generate invoices for completed bookings");

        var tipAmount = booking.PaymentRecords.Where(p => p.Type == PaymentType.Tip).Sum(p => p.Amount);

        var invoice = new InvoiceDto
        {
          InvoiceNumber = $"INV-{booking.Id:D6}-{DateTime.Now:yyyyMMdd}",
          InvoiceDate = DateTime.Now,
          DueDate = DateTime.Now, // Immediate since it's already paid
          ClientName = $"{booking.Client.FirstName} {booking.Client.LastName}",
          ClientEmail = booking.Client.Email,
          ProviderName = $"{booking.Provider.FirstName} {booking.Provider.LastName}",
          ProviderBusinessName = booking.Provider.FirstName + "'s Beauty Services", // Could be enhanced with actual business name
          ProviderEmail = booking.Provider.Email,
          ProviderPhone = booking.Provider.PhoneNumber ?? "",
          LineItems = new List<InvoiceLineItemDto>
                    {
                        new InvoiceLineItemDto
                        {
                            Description = booking.Service.Name,
                            Quantity = 1,
                            UnitPrice = booking.Service.Price,
                            Total = booking.Service.Price,
                            ServiceDate = booking.BookingDate
                        }
                    },
          Subtotal = booking.Service.Price,
          TaxAmount = 0, // Could be enhanced with tax calculation
          TipAmount = tipAmount,
          TotalAmount = booking.Service.Price + tipAmount,
          PaymentStatus = "Paid",
          PaymentDate = booking.PaymentRecords.FirstOrDefault(p => p.Type == PaymentType.Booking)?.CreatedAt,
          Notes = booking.Notes
        };

        return Ok(invoice);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error generating invoice");
        return StatusCode(500, "Internal server error");
      }
    }

    private async Task<Dictionary<string, object>> GetClientStats(string providerId, List<string> clientIds)
    {
      var stats = new Dictionary<string, object>();

      foreach (var clientId in clientIds)
      {
        var bookingCount = await _context.Bookings
            .Where(b => b.ProviderId == providerId && b.ClientId == clientId && b.Status == BookingStatus.Completed)
            .CountAsync();

        // Convert to ToListAsync first to avoid SQLite decimal sum issue
        var completedBookings = await _context.Bookings
            .Where(b => b.ProviderId == providerId && b.ClientId == clientId && b.Status == BookingStatus.Completed)
            .Select(b => b.TotalPrice)
            .ToListAsync();

        var lifetimeValue = completedBookings.Sum();

        var loyaltyStatus = await _loyaltyService.GetClientLoyaltyStatusAsync(clientId, providerId);

        stats[clientId] = new
        {
          TotalBookings = bookingCount,
          LifetimeValue = lifetimeValue,
          IsFirstTime = bookingCount <= 1,
          MembershipTier = loyaltyStatus.MembershipTier,
          LoyaltyPoints = loyaltyStatus.TotalPoints
        };
      }

      return stats;
    }

    private ProviderAppointmentDto MapToAppointmentDto(Booking booking, Dictionary<string, object> clientStats)
    {
      var clientStat = clientStats.ContainsKey(booking.ClientId) ? clientStats[booking.ClientId] as dynamic : null;
      var paymentStatus = booking.PaymentRecords?.Any(p => p.Status == PaymentStatus.Succeeded) == true ? "Paid" : "Pending";
      var review = booking.Reviews?.FirstOrDefault();

      return new ProviderAppointmentDto
      {
        Id = booking.Id,
        ClientId = booking.ClientId,
        ClientName = $"{booking.Client.FirstName} {booking.Client.LastName}",
        ClientEmail = booking.Client.Email,
        ClientPhone = booking.Client.PhoneNumber ?? "",
        ServiceName = booking.Service.Name,
        ServicePrice = booking.Service.Price,
        DurationMinutes = booking.DurationMinutes,
        BookingDate = booking.BookingDate,
        StartTime = booking.StartTime,
        EndTime = booking.EndTime,
        Status = booking.Status,
        TotalPrice = booking.TotalPrice,
        Notes = booking.Notes,
        CreatedAt = booking.CreatedAt,
        CompletedAt = booking.CompletedAt,
        PaymentStatus = paymentStatus,
        TipAmount = GetTipAmount(booking.Id),
        HasReview = review != null,
        Rating = review?.Rating,
        ReviewText = review?.Comment,
        LastStatusUpdate = booking.UpdatedAt,
        ServiceCategory = booking.Service.Category,
        ClientTotalBookings = clientStat?.TotalBookings ?? 0,
        ClientLifetimeValue = clientStat?.LifetimeValue ?? 0,
        IsFirstTimeClient = clientStat?.IsFirstTime ?? true,
        ClientMembershipTier = clientStat?.MembershipTier ?? "Bronze",
        ClientLoyaltyPoints = clientStat?.LoyaltyPoints ?? 0
      };
    }

    private decimal? GetTipAmount(int? bookingId)
    {
      if (!bookingId.HasValue) return null;
      return _context.PaymentRecords
          .Where(p => p.BookingId == bookingId && p.Type == PaymentType.Tip)
          .Sum(p => p.Amount);
    }

    private async Task<AppointmentStatsDto> CalculateAppointmentStats(string providerId, AppointmentFilterDto filter)
    {
      var query = _context.Bookings
          .Include(b => b.Service)
          .Include(b => b.Reviews)
          .Where(b => b.ProviderId == providerId);

      // Apply same filters for stats
      if (filter.StartDate.HasValue)
        query = query.Where(b => b.BookingDate >= filter.StartDate.Value.Date);
      if (filter.EndDate.HasValue)
        query = query.Where(b => b.BookingDate <= filter.EndDate.Value.Date);

      var appointments = await query.ToListAsync();

      var stats = new AppointmentStatsDto
      {
        TotalAppointments = appointments.Count,
        CompletedAppointments = appointments.Count(a => a.Status == BookingStatus.Completed),
        PendingAppointments = appointments.Count(a => a.Status == BookingStatus.Pending || a.Status == BookingStatus.Confirmed),
        CancelledAppointments = appointments.Count(a => a.Status == BookingStatus.Cancelled),
        TotalRevenue = appointments.Where(a => a.Status == BookingStatus.Completed).Sum(a => a.TotalPrice),
        UniqueClients = appointments.Select(a => a.ClientId).Distinct().Count(),
        ServiceBreakdown = appointments.GroupBy(a => a.Service.Category).ToDictionary(g => g.Key, g => g.Count()),
        RevenueBreakdown = appointments.Where(a => a.Status == BookingStatus.Completed)
              .GroupBy(a => a.Service.Category).ToDictionary(g => g.Key, g => g.Sum(a => a.TotalPrice))
      };

      if (stats.TotalAppointments > 0)
        stats.AverageAppointmentValue = stats.TotalRevenue / stats.CompletedAppointments;

      var reviews = appointments.SelectMany(a => a.Reviews).ToList();
      if (reviews.Any())
        stats.AverageRating = reviews.Average(r => r.Rating);

      return stats;
    }

    private async Task<DayScheduleDto> BuildDaySchedule(string providerId, DateTime date)
    {
      // Get appointments for this day
      var appointments = await _context.Bookings
          .Include(b => b.Client)
          .Include(b => b.Service)
          .Where(b => b.ProviderId == providerId && b.BookingDate.Date == date.Date)
          .ToListAsync();

      // Generate time slots (9 AM to 6 PM, 30-minute intervals)
      var timeSlots = new List<AppointmentTimeSlotDto>();
      var workingStart = new TimeSpan(9, 0, 0); // 9 AM
      var workingEnd = new TimeSpan(18, 0, 0);  // 6 PM
      var slotDuration = TimeSpan.FromMinutes(30);

      for (var time = workingStart; time < workingEnd; time = time.Add(slotDuration))
      {
        var slotStart = date.Date.Add(time);
        var slotEnd = slotStart.Add(slotDuration);

        var appointment = appointments.FirstOrDefault(a =>
            a.StartTime <= slotStart && a.EndTime > slotStart);

        timeSlots.Add(new AppointmentTimeSlotDto
        {
          StartTime = slotStart,
          EndTime = slotEnd,
          IsAvailable = appointment == null,
          BookingId = appointment?.Id.ToString(),
          ClientName = appointment != null ? $"{appointment.Client.FirstName} {appointment.Client.LastName}" : null,
          ServiceName = appointment?.Service.Name,
          Status = appointment?.Status
        });
      }

      var dayRevenue = appointments.Where(a => a.Status == BookingStatus.Completed).Sum(a => a.TotalPrice);

      return new DayScheduleDto
      {
        Date = date,
        IsWorkingDay = date.DayOfWeek != DayOfWeek.Sunday, // Assuming closed on Sundays
        StartTime = workingStart,
        EndTime = workingEnd,
        TimeSlots = timeSlots,
        TotalAppointments = appointments.Count,
        DayRevenue = dayRevenue,
        HasAvailableSlots = timeSlots.Any(t => t.IsAvailable)
      };
    }
  }
}
