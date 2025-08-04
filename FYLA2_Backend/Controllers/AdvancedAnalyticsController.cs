using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;
using FYLA2_Backend.DTOs;
using System.Security.Claims;

namespace FYLA2_Backend.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  [Authorize]
  public class AdvancedAnalyticsController : ControllerBase
  {
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AdvancedAnalyticsController> _logger;

    public AdvancedAnalyticsController(ApplicationDbContext context, ILogger<AdvancedAnalyticsController> logger)
    {
      _context = context;
      _logger = logger;
    }

    private string GetUserId()
    {
      return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new UnauthorizedAccessException();
    }

    // Get comprehensive business intelligence dashboard
    [HttpGet("business-intelligence")]
    public async Task<IActionResult> GetBusinessIntelligence([FromQuery] string period = "month")
    {
      try
      {
        var userId = GetUserId();
        var user = await _context.Users.FindAsync(userId);

        if (user == null || !user.IsServiceProvider)
          return NotFound("Service provider not found");

        var (startDate, endDate) = GetDateRange(period);

        // Simplified analytics using booking data since PaymentRecords might be empty
        var bookings = await _context.Bookings
            .Include(b => b.Service)
            .Include(b => b.Client)
            .Where(b => b.ProviderId == userId &&
                       b.CreatedAt >= startDate &&
                       b.CreatedAt < endDate)
            .ToListAsync();

        var completedBookings = bookings.Where(b => b.Status == BookingStatus.Completed).ToList();

        var revenue = completedBookings.Sum(b => b.TotalPrice);
        var totalBookings = bookings.Count;
        var averageBookingValue = completedBookings.Any() ? (double)completedBookings.Average(b => b.TotalPrice) : 0;

        // Basic business intelligence metrics
        var businessIntelligence = new
        {
          revenue = new
          {
            totalRevenue = revenue,
            bookingCount = totalBookings,
            completedBookings = completedBookings.Count,
            averageBookingValue = averageBookingValue,
            conversionRate = totalBookings > 0 ? (double)completedBookings.Count / totalBookings * 100 : 0
          },
          topServices = completedBookings
                .GroupBy(b => new { b.ServiceId, b.Service.Name })
                .Select(g => new
                {
                  serviceName = g.Key.Name,
                  bookingCount = g.Count(),
                  revenue = g.Sum(b => b.TotalPrice)
                })
                .OrderByDescending(x => x.revenue)
                .Take(5)
                .ToList(),
          recentTrends = "Positive growth in completed bookings",
          recommendations = new[]
            {
                        "Focus on high-performing services",
                        "Improve booking completion rate",
                        "Consider promotional offers for new clients"
                    }
        };

        return Ok(new
        {
          period = period,
          dateRange = new { startDate, endDate },
          businessIntelligence = businessIntelligence,
          generatedAt = DateTime.UtcNow
        });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error generating business intelligence report");
        return StatusCode(500, "Error generating analytics");
      }
    }

    // Get revenue trend analysis
    [HttpGet("revenue-trends")]
    public async Task<IActionResult> GetRevenueTrends([FromQuery] string period = "month", [FromQuery] int periods = 12)
    {
      try
      {
        var userId = GetUserId();
        var trends = new List<object>();

        for (int i = periods - 1; i >= 0; i--)
        {
          var (startDate, endDate) = GetDateRange(period, i);

          var payments = await _context.PaymentRecords
              .Include(p => p.Booking)
              .Where(p => p.Booking != null &&
                         p.Booking.ProviderId == userId &&
                         p.Status == PaymentStatus.Succeeded &&
                         p.UpdatedAt >= startDate &&
                         p.UpdatedAt < endDate)
              .ToListAsync();

          var revenue = payments.Sum(p => p.Amount);
          var platformFees = Math.Round(revenue * 0.03m, 2);
          var netRevenue = revenue - platformFees;
          var bookingCount = payments.Count;

          trends.Add(new
          {
            period = startDate.ToString(period == "day" ? "MMM dd" : period == "week" ? "MMM dd" : "MMM yyyy"),
            startDate = startDate,
            endDate = endDate,
            totalRevenue = revenue,
            netRevenue = netRevenue,
            platformFees = platformFees,
            bookingCount = bookingCount,
            averageBookingValue = bookingCount > 0 ? revenue / bookingCount : 0
          });
        }

        return Ok(new { trends = trends.OrderBy(t => ((dynamic)t).startDate) });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error generating revenue trends");
        return StatusCode(500, "Error generating trends");
      }
    }

    // Get customer segmentation analysis
    [HttpGet("customer-segmentation")]
    public async Task<IActionResult> GetCustomerSegmentation()
    {
      try
      {
        var userId = GetUserId();
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
        var ninetyDaysAgo = DateTime.UtcNow.AddDays(-90);

        var bookings = await _context.Bookings
            .Include(b => b.Client)
            .Where(b => b.ProviderId == userId && b.Status == BookingStatus.Completed)
            .ToListAsync();

        var customerGroups = bookings
            .GroupBy(b => b.ClientId)
            .Select(g => new
            {
              ClientId = g.Key,
              ClientName = $"{g.First().Client?.FirstName} {g.First().Client?.LastName}",
              TotalBookings = g.Count(),
              TotalSpent = g.Sum(b => b.TotalPrice),
              LastBooking = g.Max(b => b.BookingDate),
              FirstBooking = g.Min(b => b.BookingDate),
              AverageBookingValue = g.Average(b => b.TotalPrice)
            })
            .ToList();

        var segments = new
        {
          highValue = customerGroups.Where(c => c.TotalSpent > 500).Count(),
          mediumValue = customerGroups.Where(c => c.TotalSpent >= 200 && c.TotalSpent <= 500).Count(),
          lowValue = customerGroups.Where(c => c.TotalSpent < 200).Count(),
          loyalCustomers = customerGroups.Where(c => c.TotalBookings >= 5).Count(),
          recentCustomers = customerGroups.Where(c => c.LastBooking >= thirtyDaysAgo).Count(),
          atRiskCustomers = customerGroups.Where(c => c.LastBooking < ninetyDaysAgo && c.TotalBookings > 1).Count(),
          topCustomers = customerGroups.OrderByDescending(c => c.TotalSpent).Take(10)
        };

        return Ok(segments);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error generating customer segmentation");
        return StatusCode(500, "Error generating segmentation");
      }
    }

    // Get performance benchmarks
    [HttpGet("performance-benchmarks")]
    public async Task<IActionResult> GetPerformanceBenchmarks()
    {
      try
      {
        var userId = GetUserId();
        var user = await _context.Users.FindAsync(userId);

        // Get provider's category/specialty for comparison
        var providerServices = await _context.Services
            .Where(s => s.ProviderId == userId && s.IsActive)
            .ToListAsync();

        var categories = providerServices.Select(s => s.Category).Distinct().ToList();

        var benchmarks = new List<object>();

        foreach (var category in categories)
        {
          // Get industry averages for this category
          var industryData = await _context.Services
              .Include(s => s.Provider)
              .Include(s => s.Bookings)
              .Where(s => s.Category == category && s.IsActive)
              .ToListAsync();

          var allBookings = industryData.SelectMany(s => s.Bookings).ToList();
          var providerBookings = allBookings.Where(b => b.ProviderId == userId).ToList();

          var industryAvgPrice = industryData.Any() ? industryData.Average(s => s.Price) : 0;
          var providerAvgPrice = providerServices.Where(s => s.Category == category).Any() ?
              providerServices.Where(s => s.Category == category).Average(s => s.Price) : 0;

          var industryAvgRating = await _context.Reviews
              .Where(r => industryData.Select(s => s.ProviderId).Contains(r.RevieweeId))
              .AverageAsync(r => (double?)r.Rating) ?? 0;

          var providerAvgRating = await _context.Reviews
              .Where(r => r.RevieweeId == userId)
              .AverageAsync(r => (double?)r.Rating) ?? 0;

          benchmarks.Add(new
          {
            category = category,
            pricing = new
            {
              industryAverage = Math.Round(industryAvgPrice, 2),
              yourAverage = Math.Round(providerAvgPrice, 2),
              percentileDifference = industryAvgPrice > 0 ?
                      Math.Round(((providerAvgPrice - industryAvgPrice) / industryAvgPrice) * 100, 1) : 0
            },
            rating = new
            {
              industryAverage = Math.Round(industryAvgRating, 2),
              yourAverage = Math.Round(providerAvgRating, 2),
              percentileDifference = industryAvgRating > 0 ?
                      Math.Round(((providerAvgRating - industryAvgRating) / industryAvgRating) * 100, 1) : 0
            }
          });
        }

        return Ok(new { benchmarks = benchmarks });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error generating performance benchmarks");
        return StatusCode(500, "Error generating benchmarks");
      }
    }

    // Private helper methods
    private async Task<object> GetRevenueAnalytics(string userId, DateTime startDate, DateTime endDate)
    {
      var payments = await _context.PaymentRecords
          .Include(p => p.Booking)
          .Where(p => p.Booking != null &&
                     p.Booking.ProviderId == userId &&
                     p.Status == PaymentStatus.Succeeded &&
                     p.UpdatedAt >= startDate &&
                     p.UpdatedAt < endDate)
          .ToListAsync();

      var totalRevenue = payments.Sum(p => p.Amount);
      var platformFees = Math.Round(totalRevenue * 0.03m, 2);
      var netRevenue = totalRevenue - platformFees;

      return new
      {
        totalRevenue = totalRevenue,
        netRevenue = netRevenue,
        platformFees = platformFees,
        transactionCount = payments.Count,
        averageTransactionValue = payments.Count > 0 ? totalRevenue / payments.Count : 0,
        revenueGrowth = await CalculateRevenueGrowth(userId, startDate, endDate)
      };
    }

    private async Task<object> GetServicePerformance(string userId, DateTime startDate, DateTime endDate)
    {
      var services = await _context.Services
          .Include(s => s.Bookings.Where(b => b.BookingDate >= startDate && b.BookingDate < endDate))
          .Where(s => s.ProviderId == userId && s.IsActive)
          .ToListAsync();

      var performance = services.Select(s => new
      {
        serviceId = s.Id,
        serviceName = s.Name,
        category = s.Category,
        price = s.Price,
        bookingsCount = s.Bookings.Count(b => b.Status == BookingStatus.Completed),
        revenue = s.Bookings.Where(b => b.Status == BookingStatus.Completed).Sum(b => b.TotalPrice),
        averageRating = s.Bookings.Any() ?
              _context.Reviews.Where(r => s.Bookings.Select(b => b.Id).Contains(r.BookingId ?? 0))
                  .Average(r => (double?)r.Rating) ?? 0 : 0
      }).OrderByDescending(s => s.revenue);

      return new { services = performance };
    }

    private async Task<object> GetCustomerAnalytics(string userId, DateTime startDate, DateTime endDate)
    {
      var bookings = await _context.Bookings
          .Include(b => b.Client)
          .Where(b => b.ProviderId == userId &&
                     b.BookingDate >= startDate &&
                     b.BookingDate < endDate)
          .ToListAsync();

      var uniqueCustomers = bookings.Select(b => b.ClientId).Distinct().Count();
      var repeatCustomers = bookings.GroupBy(b => b.ClientId)
          .Count(g => g.Count() > 1);

      return new
      {
        totalCustomers = uniqueCustomers,
        newCustomers = uniqueCustomers - repeatCustomers,
        repeatCustomers = repeatCustomers,
        retentionRate = uniqueCustomers > 0 ? Math.Round((double)repeatCustomers / uniqueCustomers * 100, 1) : 0,
        averageCustomerValue = uniqueCustomers > 0 ?
              bookings.Where(b => b.Status == BookingStatus.Completed).Sum(b => b.TotalPrice) / uniqueCustomers : 0
      };
    }

    private async Task<object> GetTimeBasedAnalytics(string userId, DateTime startDate, DateTime endDate)
    {
      var bookings = await _context.Bookings
          .Where(b => b.ProviderId == userId &&
                     b.BookingDate >= startDate &&
                     b.BookingDate < endDate &&
                     b.Status == BookingStatus.Completed)
          .ToListAsync();

      var hourlyDistribution = bookings
          .GroupBy(b => b.BookingDate.Hour)
          .Select(g => new { hour = g.Key, count = g.Count() })
          .OrderBy(x => x.hour);

      var dayOfWeekDistribution = bookings
          .GroupBy(b => b.BookingDate.DayOfWeek)
          .Select(g => new { dayOfWeek = g.Key.ToString(), count = g.Count() });

      return new
      {
        hourlyDistribution = hourlyDistribution,
        dayOfWeekDistribution = dayOfWeekDistribution,
        peakHour = hourlyDistribution.OrderByDescending(x => x.count).FirstOrDefault()?.hour,
        peakDay = dayOfWeekDistribution.OrderByDescending(x => x.count).FirstOrDefault()?.dayOfWeek
      };
    }

    private async Task<object> GetCompetitiveInsights(string userId)
    {
      var userServices = await _context.Services
          .Where(s => s.ProviderId == userId && s.IsActive)
          .ToListAsync();

      var categories = userServices.Select(s => s.Category).Distinct();
      var insights = new List<object>();

      foreach (var category in categories)
      {
        var competitorServices = await _context.Services
            .Include(s => s.Provider)
            .Where(s => s.Category == category && s.ProviderId != userId && s.IsActive)
            .ToListAsync();

        var userCategoryServices = userServices.Where(s => s.Category == category);
        var avgUserPrice = userCategoryServices.Any() ? userCategoryServices.Average(s => s.Price) : 0;
        var avgCompetitorPrice = competitorServices.Any() ? competitorServices.Average(s => s.Price) : 0;

        insights.Add(new
        {
          category = category,
          competitorCount = competitorServices.Select(s => s.ProviderId).Distinct().Count(),
          averageCompetitorPrice = Math.Round(avgCompetitorPrice, 2),
          yourAveragePrice = Math.Round(avgUserPrice, 2),
          pricePosition = avgCompetitorPrice > 0 ?
                (avgUserPrice > avgCompetitorPrice ? "Above Market" :
                 avgUserPrice < avgCompetitorPrice ? "Below Market" : "Market Rate") : "No Data"
        });
      }

      return new { insights = insights };
    }

    private async Task<double> CalculateRevenueGrowth(string userId, DateTime startDate, DateTime endDate)
    {
      var periodDays = (endDate - startDate).Days;
      var previousStartDate = startDate.AddDays(-periodDays);
      var previousEndDate = startDate;

      // Get payments for current period (convert to List first to avoid SQLite decimal sum issue)
      var currentPayments = await _context.PaymentRecords
          .Include(p => p.Booking)
          .Where(p => p.Booking != null &&
                     p.Booking.ProviderId == userId &&
                     p.Status == PaymentStatus.Succeeded &&
                     p.UpdatedAt >= startDate &&
                     p.UpdatedAt < endDate)
          .Select(p => p.Amount)
          .ToListAsync();

      var currentRevenue = currentPayments.Sum();

      var previousPayments = await _context.PaymentRecords
          .Include(p => p.Booking)
          .Where(p => p.Booking != null &&
                     p.Booking.ProviderId == userId &&
                     p.Status == PaymentStatus.Succeeded &&
                     p.UpdatedAt >= previousStartDate &&
                     p.UpdatedAt < previousEndDate)
          .Select(p => p.Amount)
          .ToListAsync();

      var previousRevenue = previousPayments.Sum();

      if (previousRevenue == 0) return currentRevenue > 0 ? 100 : 0;

      return Math.Round(((double)(currentRevenue - previousRevenue) / (double)previousRevenue) * 100, 1);
    }

    private (DateTime startDate, DateTime endDate) GetDateRange(string period, int offset = 0)
    {
      var now = DateTime.Today;

      switch (period.ToLower())
      {
        case "day":
          return (now.AddDays(-offset), now.AddDays(-offset + 1));

        case "week":
          var startOfWeek = now.AddDays(-(int)now.DayOfWeek).AddDays(-7 * offset);
          return (startOfWeek, startOfWeek.AddDays(7));

        case "year":
          var startOfYear = new DateTime(now.Year - offset, 1, 1);
          return (startOfYear, startOfYear.AddYears(1));

        default: // month
          var startOfMonth = new DateTime(now.Year, now.Month, 1).AddMonths(-offset);
          return (startOfMonth, startOfMonth.AddMonths(1));
      }
    }
  }
}
