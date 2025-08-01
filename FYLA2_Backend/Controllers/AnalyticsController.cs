using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using FYLA2_Backend.Data;
using FYLA2_Backend.DTOs.Analytics;
using FYLA2_Backend.Models;

namespace FYLA2_Backend.Controllers
{
  [ApiController]
  [Route("api/analytics")]
  [Authorize]
  public class AnalyticsController : ControllerBase
  {
    private readonly ApplicationDbContext _context;

    public AnalyticsController(ApplicationDbContext context)
    {
      _context = context;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<ProviderDashboardDto>> GetProviderDashboard()
    {
      var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
        return Unauthorized();
      }

      try
      {
        // Check if user is a service provider
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null || !user.IsServiceProvider)
        {
          return NotFound("Service provider profile not found");
        }

        var today = DateTime.Today;
        var startOfWeek = today.AddDays(-(int)today.DayOfWeek);
        var startOfMonth = new DateTime(today.Year, today.Month, 1);

        // Today's appointments
        var todayAppointments = await _context.Bookings
            .Where(b => b.ProviderId == userId &&
                       b.BookingDate.Date == today &&
                       b.Status != BookingStatus.Cancelled)
            .CountAsync();

        // Pending appointments
        var pendingAppointments = await _context.Bookings
            .Where(b => b.ProviderId == userId &&
                       b.Status == BookingStatus.Pending)
            .CountAsync();

        // This week's revenue
        var weeklyRevenue = (decimal)(await _context.Bookings
            .Where(b => b.ProviderId == userId &&
                       b.BookingDate >= startOfWeek &&
                       (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed))
            .SumAsync(b => (double?)b.TotalPrice) ?? 0);

        // This month's revenue
        var monthlyRevenue = (decimal)(await _context.Bookings
            .Where(b => b.ProviderId == userId &&
                       b.BookingDate >= startOfMonth &&
                       (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed))
            .SumAsync(b => (double?)b.TotalPrice) ?? 0);

        // Total clients
        var totalClients = await _context.Bookings
            .Where(b => b.ProviderId == userId)
            .Select(b => b.ClientId)
            .Distinct()
            .CountAsync();

        // Average rating
        var averageRating = await _context.Reviews
            .Where(r => r.RevieweeId == userId)
            .AverageAsync(r => (double?)r.Rating) ?? 0;

        // Next appointment
        var nextAppointmentData = await _context.Bookings
            .Where(b => b.ProviderId == userId &&
                       b.BookingDate > DateTime.Now &&
                       b.Status == BookingStatus.Confirmed)
            .OrderBy(b => b.BookingDate)
            .FirstOrDefaultAsync();

        NextAppointmentDto? nextAppointment = null;
        if (nextAppointmentData != null)
        {
          try
          {
            var client = await _context.Users.FindAsync(nextAppointmentData.ClientId);
            var service = await _context.Services.FindAsync(nextAppointmentData.ServiceId);

            nextAppointment = new NextAppointmentDto
            {
              Id = nextAppointmentData.Id,
              ClientName = client != null ? $"{client.FirstName} {client.LastName}" : "Unknown Client",
              ServiceName = service?.Name ?? "Unknown Service",
              ScheduledDate = nextAppointmentData.BookingDate,
              Duration = 60, // Default duration
              TotalAmount = nextAppointmentData.TotalPrice
            };
          }
          catch (Exception ex)
          {
            // Log the error but continue without next appointment data
            Console.WriteLine($"Error fetching next appointment details: {ex.Message}");
          }
        }

        // Recent bookings
        var recentBookingData = await _context.Bookings
            .Where(b => b.ProviderId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .Take(10)
            .ToListAsync();

        var recentBookings = new List<RecentBookingDto>();
        foreach (var booking in recentBookingData)
        {
          try
          {
            var client = await _context.Users.FindAsync(booking.ClientId);
            var service = await _context.Services.FindAsync(booking.ServiceId);

            recentBookings.Add(new RecentBookingDto
            {
              Id = booking.Id,
              ClientName = client != null ? $"{client.FirstName} {client.LastName}" : "Unknown Client",
              ServiceName = service?.Name ?? "Unknown Service",
              ScheduledDate = booking.BookingDate,
              Status = booking.Status.ToString(),
              TotalAmount = booking.TotalPrice
            });
          }
          catch (Exception ex)
          {
            Console.WriteLine($"Error processing recent booking {booking.Id}: {ex.Message}");
            // Continue with other bookings
          }
        }

        return Ok(new ProviderDashboardDto
        {
          TodayAppointments = todayAppointments,
          PendingAppointments = pendingAppointments,
          WeeklyRevenue = weeklyRevenue,
          MonthlyRevenue = monthlyRevenue,
          TotalClients = totalClients,
          AverageRating = averageRating,
          NextAppointment = nextAppointment,
          RecentBookings = recentBookings
        });
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Dashboard error: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        return StatusCode(500, $"Internal server error: {ex.Message}");
      }
    }

    [HttpGet("revenue")]
    public async Task<ActionResult<RevenueAnalyticsDto>> GetRevenueAnalytics([FromQuery] string period = "month")
    {
      var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
        return Unauthorized();
      }

      try
      {
        // Check if user is a service provider
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null || !user.IsServiceProvider)
        {
          return NotFound("Service provider profile not found");
        }

        DateTime startDate, endDate;
        switch (period.ToLower())
        {
          case "week":
            startDate = DateTime.Today.AddDays(-(int)DateTime.Today.DayOfWeek);
            endDate = startDate.AddDays(7);
            break;
          case "year":
            startDate = new DateTime(DateTime.Today.Year, 1, 1);
            endDate = startDate.AddYears(1);
            break;
          default: // month
            startDate = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
            endDate = startDate.AddMonths(1);
            break;
        }

        // Total revenue for period
        var totalRevenue = (decimal)(await _context.Bookings
            .Where(b => b.ProviderId == userId &&
                       b.BookingDate >= startDate &&
                       b.BookingDate < endDate &&
                       (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed))
            .SumAsync(b => (double?)b.TotalPrice) ?? 0);

        // Total bookings for period
        var totalBookings = await _context.Bookings
            .Where(b => b.ProviderId == userId &&
                       b.BookingDate >= startDate &&
                       b.BookingDate < endDate &&
                       (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed))
            .CountAsync();

        // Average booking value
        var averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

        // Previous period for growth calculation
        var previousStartDate = period.ToLower() switch
        {
          "week" => startDate.AddDays(-7),
          "year" => startDate.AddYears(-1),
          _ => startDate.AddMonths(-1)
        };

        var previousRevenue = (decimal)(await _context.Bookings
            .Where(b => b.ProviderId == userId &&
                       b.BookingDate >= previousStartDate &&
                       b.BookingDate < startDate &&
                       (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed))
            .SumAsync(b => (double?)b.TotalPrice) ?? 0);

        var growthPercentage = previousRevenue > 0 ? ((double)(totalRevenue - previousRevenue) / (double)previousRevenue) * 100 : 0;

        // Daily revenue breakdown
        var dailyRevenueData = await _context.Bookings
            .Where(b => b.ProviderId == userId &&
                       b.BookingDate >= startDate &&
                       b.BookingDate < endDate &&
                       (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed))
            .GroupBy(b => b.BookingDate.Date)
            .Select(g => new
            {
              Date = g.Key,
              Revenue = g.Sum(b => (double)b.TotalPrice),
              BookingCount = g.Count()
            })
            .ToListAsync();

        var dailyRevenue = dailyRevenueData.Select(d => new DailyRevenueDto
        {
          Date = d.Date.ToString("yyyy-MM-dd"),
          Revenue = (decimal)d.Revenue,
          BookingCount = d.BookingCount
        }).OrderBy(d => d.Date).ToList();

        // Top performing services - simplified to avoid navigation issues
        var topServiceRawData = await _context.Bookings
            .Where(b => b.ProviderId == userId &&
                       b.BookingDate >= startDate &&
                       b.BookingDate < endDate &&
                       (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed))
            .GroupBy(b => b.ServiceId)
            .Select(g => new
            {
              ServiceId = g.Key,
              BookingCount = g.Count(),
              TotalRevenue = g.Sum(b => (double)b.TotalPrice),
              AveragePrice = g.Average(b => (double)b.TotalPrice)
            })
            .ToListAsync();

        var topServiceData = topServiceRawData
            .OrderByDescending(s => s.TotalRevenue)
            .Take(5)
            .ToList();

        var topServices = new List<ServicePerformanceDto>();
        foreach (var serviceData in topServiceData)
        {
          try
          {
            var serviceEntity = await _context.Services.FindAsync(serviceData.ServiceId);
            topServices.Add(new ServicePerformanceDto
            {
              ServiceId = serviceData.ServiceId,
              ServiceName = serviceEntity?.Name ?? "Unknown Service",
              BookingCount = serviceData.BookingCount,
              TotalRevenue = (decimal)serviceData.TotalRevenue,
              AveragePrice = (decimal)serviceData.AveragePrice
            });
          }
          catch (Exception ex)
          {
            Console.WriteLine($"Error processing service {serviceData.ServiceId}: {ex.Message}");
            // Continue with other services
          }
        }

        return Ok(new RevenueAnalyticsDto
        {
          Period = period,
          StartDate = startDate.ToString("yyyy-MM-dd"),
          EndDate = endDate.ToString("yyyy-MM-dd"),
          TotalRevenue = totalRevenue,
          TotalBookings = totalBookings,
          AverageBookingValue = averageBookingValue,
          GrowthPercentage = growthPercentage,
          DailyRevenue = dailyRevenue,
          TopServices = topServices
        });
      }
      catch (Exception ex)
      {
        return StatusCode(500, $"Internal server error: {ex.Message}");
      }
    }

    [HttpGet("clients")]
    public async Task<ActionResult<ClientAnalyticsDto>> GetClientAnalytics([FromQuery] string period = "month")
    {
      var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
        return Unauthorized();
      }

      try
      {
        // Check if user is a service provider
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null || !user.IsServiceProvider)
        {
          return NotFound("Service provider profile not found");
        }

        var startDate = period.ToLower() switch
        {
          "week" => DateTime.Today.AddDays(-(int)DateTime.Today.DayOfWeek),
          "year" => new DateTime(DateTime.Today.Year, 1, 1),
          _ => new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1)
        };

        // Total unique clients
        var totalClients = await _context.Bookings
            .Where(b => b.ProviderId == userId &&
                       b.BookingDate >= startDate)
            .Select(b => b.ClientId)
            .Distinct()
            .CountAsync();

        // New clients in current period
        var newClients = await _context.Bookings
            .Where(b => b.ProviderId == userId &&
                       b.BookingDate >= startDate)
            .GroupBy(b => b.ClientId)
            .Where(g => g.Min(b => b.BookingDate) >= startDate)
            .CountAsync();

        // Returning clients
        var returningClients = totalClients - newClients;

        // New client percentage
        var newClientPercentage = totalClients > 0 ? (double)newClients / totalClients * 100 : 0;

        // Top clients by revenue - simplified to avoid navigation issues
        var topClientRawData = await _context.Bookings
            .Where(b => b.ProviderId == userId &&
                       (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed))
            .GroupBy(b => b.ClientId)
            .Select(g => new
            {
              ClientId = g.Key,
              BookingCount = g.Count(),
              TotalSpent = g.Sum(b => (double)b.TotalPrice),
              LastBooking = g.Max(b => b.BookingDate)
            })
            .ToListAsync();

        var topClientData = topClientRawData
            .OrderByDescending(c => c.TotalSpent)
            .Take(10)
            .ToList();

        var topClients = new List<TopClientDto>();
        foreach (var clientData in topClientData)
        {
          try
          {
            var clientUser = await _context.Users.FindAsync(clientData.ClientId);
            topClients.Add(new TopClientDto
            {
              UserId = clientData.ClientId,
              ClientName = clientUser != null ? $"{clientUser.FirstName} {clientUser.LastName}" : "Unknown Client",
              BookingCount = clientData.BookingCount,
              TotalSpent = (decimal)clientData.TotalSpent,
              LastBooking = clientData.LastBooking.ToString("yyyy-MM-dd")
            });
          }
          catch (Exception ex)
          {
            Console.WriteLine($"Error processing client {clientData.ClientId}: {ex.Message}");
            // Continue with other clients
          }
        }

        // Client acquisition over time (last 6 months)
        var clientAcquisition = new List<ClientAcquisitionDto>();
        for (int i = 5; i >= 0; i--)
        {
          var monthStart = DateTime.Today.AddMonths(-i).AddDays(1 - DateTime.Today.AddMonths(-i).Day);
          var monthEnd = monthStart.AddMonths(1);

          var newClientsInMonth = await _context.Bookings
              .Where(b => b.ProviderId == userId)
              .GroupBy(b => b.ClientId)
              .Where(g => g.Min(b => b.BookingDate) >= monthStart && g.Min(b => b.BookingDate) < monthEnd)
              .CountAsync();

          clientAcquisition.Add(new ClientAcquisitionDto
          {
            Date = monthStart.ToString("yyyy-MM"),
            NewClients = newClientsInMonth
          });
        }

        // Popular time slots
        var popularTimeSlots = await _context.Bookings
            .Where(b => b.ProviderId == userId &&
                       b.BookingDate >= startDate &&
                       (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed))
            .GroupBy(b => b.StartTime.Hour)
            .Select(g => new TimeSlotDto
            {
              Hour = g.Key,
              TimeSlot = $"{g.Key:00}:00 - {g.Key + 1:00}:00",
              BookingCount = g.Count()
            })
            .OrderByDescending(t => t.BookingCount)
            .Take(5)
            .ToListAsync();

        return Ok(new ClientAnalyticsDto
        {
          Period = period,
          TotalClients = totalClients,
          NewClients = newClients,
          ReturningClients = returningClients,
          NewClientPercentage = newClientPercentage,
          TopClients = topClients,
          ClientAcquisition = clientAcquisition,
          PopularTimeSlots = popularTimeSlots
        });
      }
      catch (Exception ex)
      {
        return StatusCode(500, $"Internal server error: {ex.Message}");
      }
    }

    [HttpGet("provider-clients")]
    public async Task<ActionResult<List<object>>> GetProviderClients()
    {
      var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
      if (string.IsNullOrEmpty(userId))
      {
        return Unauthorized();
      }

      try
      {
        // Check if user is a service provider
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null || !user.IsServiceProvider)
        {
          return NotFound("Service provider profile not found");
        }

        // Get all clients who have booked with this provider
        var clientsData = await _context.Bookings
            .Where(b => b.ProviderId == userId)
            .Include(b => b.Client)
            .GroupBy(b => b.ClientId)
            .Select(g => new
            {
              ClientId = g.Key,
              Client = g.First().Client,
              TotalBookings = g.Count(),
              TotalSpent = g.Sum(b => (double)b.TotalPrice),
              LastVisit = g.Max(b => b.BookingDate),
              CompletedBookings = g.Count(b => b.Status == BookingStatus.Completed),
              CancelledBookings = g.Count(b => b.Status == BookingStatus.Cancelled),
              FirstBooking = g.Min(b => b.BookingDate)
            })
            .ToListAsync();

        // Transform to client management format
        var clients = clientsData.Select(c => new
        {
          id = c.ClientId,
          firstName = c.Client?.FirstName ?? "Unknown",
          lastName = c.Client?.LastName ?? "Client",
          email = c.Client?.Email ?? "No email",
          phone = c.Client?.PhoneNumber ?? "No phone",
          profilePictureUrl = c.Client?.ProfilePictureUrl ?? "",
          totalBookings = c.TotalBookings,
          totalSpent = c.TotalSpent,
          lastVisit = c.LastVisit,
          averageRating = 4.5, // Default rating since we don't have review system fully implemented
          loyaltyPoints = (int)(c.TotalSpent * 0.1), // 10% of spending as points
          status = c.TotalSpent > 500 ? "vip" : (c.TotalBookings > 0 ? "active" : "inactive"),
          preferences = new string[] { }, // Empty for now
          notes = "",
          completionRate = c.TotalBookings > 0 ? (double)c.CompletedBookings / c.TotalBookings * 100 : 0,
          isNewClient = c.FirstBooking >= DateTime.Today.AddDays(-30)
        }).OrderByDescending(c => c.totalSpent).ToList();

        return Ok(clients);
      }
      catch (Exception ex)
      {
        return StatusCode(500, $"Internal server error: {ex.Message}");
      }
    }
  }
}
