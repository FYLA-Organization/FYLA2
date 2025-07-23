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
  //[Authorize] // Temporarily disabled for debugging
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
      try
      {
        // For debugging - return a simple test response first
        return Ok(new ProviderDashboardDto
        {
          TodayAppointments = 5,
          PendingAppointments = 3,
          WeeklyRevenue = 1250.00m,
          MonthlyRevenue = 5000.00m,
          TotalClients = 25,
          AverageRating = 4.5,
          NextAppointment = new NextAppointmentDto
          {
            Id = 1,
            ClientName = "Test Client",
            ServiceName = "Test Service",
            ScheduledDate = DateTime.Now.AddDays(1),
            Duration = 60,
            TotalAmount = 100.00m
          },
          RecentBookings = new List<RecentBookingDto>
                    {
                        new RecentBookingDto
                        {
                            Id = 1,
                            ClientName = "Test Client",
                            ServiceName = "Test Service",
                            ScheduledDate = DateTime.Now.AddDays(-1),
                            Status = "Completed",
                            TotalAmount = 100.00m
                        }
                    }
        });
      }
      catch (Exception ex)
      {
        return StatusCode(500, $"Internal server error: {ex.Message}");
      }
    }

    [HttpGet("revenue")]
    public async Task<ActionResult<RevenueAnalyticsDto>> GetRevenueAnalytics([FromQuery] string period = "month")
    {
      try
      {
        // For debugging - return a simple test response
        return Ok(new RevenueAnalyticsDto
        {
          Period = period,
          StartDate = DateTime.Today.ToString("yyyy-MM-dd"),
          EndDate = DateTime.Today.AddDays(30).ToString("yyyy-MM-dd"),
          TotalRevenue = 5000.00m,
          TotalBookings = 50,
          AverageBookingValue = 100.00m,
          GrowthPercentage = 15.5,
          DailyRevenue = new List<DailyRevenueDto>
                    {
                        new DailyRevenueDto
                        {
                            Date = DateTime.Today.ToString("yyyy-MM-dd"),
                            Revenue = 250.00m,
                            BookingCount = 3
                        }
                    },
          TopServices = new List<ServicePerformanceDto>
                    {
                        new ServicePerformanceDto
                        {
                            ServiceId = 1,
                            ServiceName = "Test Service",
                            BookingCount = 10,
                            TotalRevenue = 1000.00m,
                            AveragePrice = 100.00m
                        }
                    }
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
      try
      {
        // For debugging - return a simple test response
        return Ok(new ClientAnalyticsDto
        {
          Period = period,
          TotalClients = 25,
          NewClients = 5,
          ReturningClients = 20,
          NewClientPercentage = 20.0,
          TopClients = new List<TopClientDto>
                    {
                        new TopClientDto
                        {
                            UserId = "test-user-id",
                            ClientName = "Test Client",
                            BookingCount = 5,
                            TotalSpent = 500.00m,
                            LastBooking = DateTime.Today.ToString("yyyy-MM-dd")
                        }
                    },
          ClientAcquisition = new List<ClientAcquisitionDto>
                    {
                        new ClientAcquisitionDto
                        {
                            Date = DateTime.Today.ToString("yyyy-MM"),
                            NewClients = 3
                        }
                    },
          PopularTimeSlots = new List<TimeSlotDto>
                    {
                        new TimeSlotDto
                        {
                            Hour = 14,
                            TimeSlot = "14:00 - 15:00",
                            BookingCount = 8
                        }
                    }
        });
      }
      catch (Exception ex)
      {
        return StatusCode(500, $"Internal server error: {ex.Message}");
      }
    }
  }
}
