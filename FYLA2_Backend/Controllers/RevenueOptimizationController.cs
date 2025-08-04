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
  public class RevenueOptimizationController : ControllerBase
  {
    private readonly ApplicationDbContext _context;
    private readonly ILogger<RevenueOptimizationController> _logger;

    public RevenueOptimizationController(ApplicationDbContext context, ILogger<RevenueOptimizationController> logger)
    {
      _context = context;
      _logger = logger;
    }

    private string GetUserId()
    {
      return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new UnauthorizedAccessException();
    }

    // Get dynamic pricing recommendations
    [HttpGet("pricing-recommendations")]
    public async Task<IActionResult> GetPricingRecommendations()
    {
      try
      {
        var userId = GetUserId();
        var user = await _context.Users.FindAsync(userId);

        if (user == null || !user.IsServiceProvider)
          return NotFound("Service provider not found");

        var services = await _context.Services
            .Include(s => s.Bookings)
            .Where(s => s.ProviderId == userId && s.IsActive)
            .ToListAsync();

        var recommendations = new List<object>();

        foreach (var service in services)
        {
          var analysis = await AnalyzeServicePricing(service);
          recommendations.Add(analysis);
        }

        return Ok(new { recommendations = recommendations });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error generating pricing recommendations");
        return StatusCode(500, "Error generating recommendations");
      }
    }

    // Get A/B testing setup for pricing
    [HttpPost("ab-test-pricing")]
    public async Task<IActionResult> SetupPricingABTest([FromBody] PricingABTestDto request)
    {
      try
      {
        var userId = GetUserId();
        var service = await _context.Services
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId && s.ProviderId == userId);

        if (service == null)
          return NotFound("Service not found");

        // For A/B testing, we'll track different pricing strategies
        var abTest = new
        {
          serviceId = service.Id,
          currentPrice = service.Price,
          testPriceA = request.PriceA,
          testPriceB = request.PriceB,
          testDuration = request.TestDurationDays,
          startDate = DateTime.UtcNow,
          endDate = DateTime.UtcNow.AddDays(request.TestDurationDays),
          metrics = new
          {
            bookingRateA = 0,
            bookingRateB = 0,
            revenueA = 0,
            revenueB = 0
          }
        };

        // In a real implementation, you'd store this in a dedicated ABTest table
        _logger.LogInformation($"A/B test setup for service {service.Id}: ${request.PriceA} vs ${request.PriceB}");

        return Ok(new { success = true, testId = Guid.NewGuid(), test = abTest });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error setting up A/B test");
        return StatusCode(500, "Error setting up test");
      }
    }

    // Get commission optimization insights
    [HttpGet("commission-analysis")]
    public async Task<IActionResult> GetCommissionAnalysis()
    {
      try
      {
        var userId = GetUserId();

        // Calculate commission impact at different rates
        var payments = await _context.PaymentRecords
            .Include(p => p.Booking)
            .Where(p => p.Booking != null &&
                       p.Booking.ProviderId == userId &&
                       p.Status == PaymentStatus.Succeeded &&
                       p.UpdatedAt >= DateTime.UtcNow.AddMonths(-3))
            .ToListAsync();

        var totalRevenue = payments.Sum(p => p.Amount);
        var currentCommissionRate = 0.03m; // 3%

        var commissionScenarios = new[]
        {
                    new { rate = 0.02m, description = "2% - Lower rate" },
                    new { rate = 0.03m, description = "3% - Current rate" },
                    new { rate = 0.04m, description = "4% - Higher rate" },
                    new { rate = 0.05m, description = "5% - Premium rate" }
                }.Select(scenario => new
                {
                  commissionRate = scenario.rate,
                  description = scenario.description,
                  totalCommission = Math.Round(totalRevenue * scenario.rate, 2),
                  providerEarnings = Math.Round(totalRevenue * (1 - scenario.rate), 2),
                  monthlyCommission = Math.Round((totalRevenue * scenario.rate) / 3, 2), // 3 months
                  impact = scenario.rate == currentCommissionRate ? "Current" :
                            scenario.rate < currentCommissionRate ? "Savings" : "Cost"
                });

        var analysis = new
        {
          period = "Last 3 months",
          totalRevenue = totalRevenue,
          currentRate = currentCommissionRate,
          scenarios = commissionScenarios,
          recommendations = new
          {
            optimalRate = 0.03m,
            reasoning = "Current 3% rate balances platform sustainability with provider earnings",
            potentialSavings = 0m,
            riskAssessment = "Low - Rate is competitive with industry standards"
          }
        };

        return Ok(analysis);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error analyzing commission impact");
        return StatusCode(500, "Error analyzing commission");
      }
    }

    // Get revenue optimization opportunities
    [HttpGet("optimization-opportunities")]
    public async Task<IActionResult> GetOptimizationOpportunities()
    {
      try
      {
        var userId = GetUserId();

        var opportunities = new List<object>();

        // 1. Service bundling opportunities
        var bundlingOpportunity = await AnalyzeBundlingOpportunities(userId);
        if (bundlingOpportunity != null) opportunities.Add(bundlingOpportunity);

        // 2. Peak hours pricing
        var peakPricingOpportunity = await AnalyzePeakHoursPricing(userId);
        if (peakPricingOpportunity != null) opportunities.Add(peakPricingOpportunity);

        // 3. Customer retention opportunities
        var retentionOpportunity = await AnalyzeRetentionOpportunities(userId);
        if (retentionOpportunity != null) opportunities.Add(retentionOpportunity);

        // 4. Upselling opportunities
        var upsellingOpportunity = await AnalyzeUpsellingOpportunities(userId);
        if (upsellingOpportunity != null) opportunities.Add(upsellingOpportunity);

        return Ok(new { opportunities = opportunities });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error generating optimization opportunities");
        return StatusCode(500, "Error generating opportunities");
      }
    }

    // Get seasonal pricing recommendations
    [HttpGet("seasonal-pricing")]
    public async Task<IActionResult> GetSeasonalPricingRecommendations()
    {
      try
      {
        var userId = GetUserId();

        var bookings = await _context.Bookings
            .Where(b => b.ProviderId == userId &&
                       b.Status == BookingStatus.Completed &&
                       b.BookingDate >= DateTime.UtcNow.AddYears(-1))
            .ToListAsync();

        var monthlyDemand = bookings
            .GroupBy(b => b.BookingDate.Month)
            .Select(g => new
            {
              month = g.Key,
              monthName = new DateTime(2023, g.Key, 1).ToString("MMMM"),
              bookingCount = g.Count(),
              averageRevenue = g.Average(b => b.TotalPrice)
            })
            .OrderBy(x => x.month)
            .ToList();

        var peakMonths = monthlyDemand.OrderByDescending(x => x.bookingCount).Take(3);
        var lowMonths = monthlyDemand.OrderBy(x => x.bookingCount).Take(3);

        var seasonalRecommendations = new
        {
          monthlyDemand = monthlyDemand,
          peakSeason = new
          {
            months = peakMonths.Select(x => x.monthName),
            recommendedPriceIncrease = "10-15%",
            reasoning = "High demand periods allow for premium pricing"
          },
          lowSeason = new
          {
            months = lowMonths.Select(x => x.monthName),
            recommendedPriceDecrease = "5-10%",
            reasoning = "Competitive pricing to maintain bookings during slower periods"
          },
          promotionalOpportunities = lowMonths.Select(x => new
          {
            month = x.monthName,
            suggestedPromotion = "Early Bird Special",
            discount = "15% off",
            expectedImpact = "25% increase in bookings"
          })
        };

        return Ok(seasonalRecommendations);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error generating seasonal pricing recommendations");
        return StatusCode(500, "Error generating recommendations");
      }
    }

    // Private helper methods
    private async Task<object> AnalyzeServicePricing(Service service)
    {
      var completedBookings = service.Bookings.Where(b => b.Status == BookingStatus.Completed).ToList();
      var totalBookings = completedBookings.Count;
      var revenue = completedBookings.Sum(b => b.TotalPrice);

      // Get industry benchmarks for similar services
      var similarServices = await _context.Services
          .Include(s => s.Bookings)
          .Where(s => s.Category == service.Category && s.Id != service.Id && s.IsActive)
          .ToListAsync();

      var industryAvgPrice = similarServices.Any() ? similarServices.Average(s => s.Price) : service.Price;
      var industryBookingRate = similarServices.Any() ?
          similarServices.Average(s => s.Bookings.Count(b => b.Status == BookingStatus.Completed)) : totalBookings;

      var pricePosition = service.Price > industryAvgPrice ? "Above Market" :
                         service.Price < industryAvgPrice ? "Below Market" : "Market Rate";

      var recommendation = "";
      var suggestedPrice = service.Price;

      if (totalBookings > industryBookingRate && service.Price < industryAvgPrice)
      {
        recommendation = "Consider increasing price - high demand and below market rate";
        suggestedPrice = Math.Min(service.Price * 1.15m, industryAvgPrice);
      }
      else if (totalBookings < (decimal)industryBookingRate * 0.7m && service.Price > industryAvgPrice)
      {
        recommendation = "Consider decreasing price - low demand and above market rate";
        suggestedPrice = Math.Max(service.Price * 0.9m, industryAvgPrice * 0.95m);
      }
      else if (totalBookings > (decimal)industryBookingRate * 1.3m)
      {
        recommendation = "High demand - opportunity for premium pricing";
        suggestedPrice = service.Price * 1.1m;
      }
      else
      {
        recommendation = "Price is optimally positioned";
      }

      return new
      {
        serviceId = service.Id,
        serviceName = service.Name,
        currentPrice = service.Price,
        suggestedPrice = Math.Round(suggestedPrice, 2),
        pricePosition = pricePosition,
        totalBookings = totalBookings,
        revenue = revenue,
        industryAvgPrice = Math.Round(industryAvgPrice, 2),
        industryAvgBookings = Math.Round(industryBookingRate, 1),
        recommendation = recommendation,
        confidence = totalBookings > 5 ? "High" : totalBookings > 2 ? "Medium" : "Low"
      };
    }

    private async Task<object?> AnalyzeBundlingOpportunities(string userId)
    {
      var bookings = await _context.Bookings
          .Include(b => b.Service)
          .Where(b => b.ProviderId == userId && b.Status == BookingStatus.Completed)
          .GroupBy(b => b.ClientId)
          .Where(g => g.Count() > 1)
          .ToListAsync();

      if (!bookings.Any()) return null;

      var commonCombinations = bookings
          .Select(g => g.Select(b => b.Service?.Category).Distinct().OrderBy(c => c))
          .GroupBy(combo => string.Join(",", combo))
          .Where(g => g.Count() > 1)
          .OrderByDescending(g => g.Count())
          .Take(3)
          .Select(g => new
          {
            services = g.Key.Split(','),
            frequency = g.Count(),
            suggestedDiscount = "10-15%",
            expectedIncrease = "20% in average booking value"
          });

      return new
      {
        type = "Service Bundling",
        priority = "High",
        description = "Create service packages for commonly booked combinations",
        opportunities = commonCombinations,
        estimatedReveneueIncrease = "15-25%"
      };
    }

    private async Task<object?> AnalyzePeakHoursPricing(string userId)
    {
      var bookings = await _context.Bookings
          .Where(b => b.ProviderId == userId && b.Status == BookingStatus.Completed)
          .ToListAsync();

      if (bookings.Count < 10) return null;

      var hourlyDistribution = bookings
          .GroupBy(b => b.BookingDate.Hour)
          .Select(g => new { hour = g.Key, count = g.Count() })
          .OrderByDescending(x => x.count)
          .ToList();

      var peakHours = hourlyDistribution.Take(3).Select(x => x.hour);
      var averageBookings = hourlyDistribution.Average(x => x.count);
      var peakBookings = hourlyDistribution.Take(3).Average(x => x.count);

      if (peakBookings > averageBookings * 1.5)
      {
        return new
        {
          type = "Peak Hours Pricing",
          priority = "Medium",
          description = "Implement premium pricing during high-demand hours",
          peakHours = peakHours.Select(h => $"{h}:00-{h + 1}:00"),
          suggestedIncrease = "10-20%",
          estimatedReveneueIncrease = "8-12%"
        };
      }

      return null;
    }

    private async Task<object?> AnalyzeRetentionOpportunities(string userId)
    {
      var oneMonthAgo = DateTime.UtcNow.AddMonths(-1);
      var threeMonthsAgo = DateTime.UtcNow.AddMonths(-3);

      var recentCustomers = await _context.Bookings
          .Where(b => b.ProviderId == userId &&
                     b.BookingDate >= threeMonthsAgo &&
                     b.Status == BookingStatus.Completed)
          .GroupBy(b => b.ClientId)
          .ToListAsync();

      var atRiskCustomers = recentCustomers
          .Where(g => g.Max(b => b.BookingDate) < oneMonthAgo && g.Count() > 1)
          .Count();

      if (atRiskCustomers > 0)
      {
        return new
        {
          type = "Customer Retention",
          priority = "High",
          description = "Re-engage customers who haven't booked recently",
          atRiskCustomers = atRiskCustomers,
          suggestedAction = "Send personalized offers or follow-up messages",
          estimatedReveneueIncrease = "5-10%"
        };
      }

      return null;
    }

    private async Task<object?> AnalyzeUpsellingOpportunities(string userId)
    {
      var services = await _context.Services
          .Include(s => s.Bookings)
          .Where(s => s.ProviderId == userId && s.IsActive)
          .ToListAsync();

      var lowPriceServices = services.Where(s => s.Price < services.Average(sv => sv.Price));
      var highBookingServices = services.OrderByDescending(s => s.Bookings.Count).Take(3);

      var opportunities = highBookingServices
          .Where(s => lowPriceServices.Contains(s))
          .Select(s => new
          {
            serviceName = s.Name,
            currentPrice = s.Price,
            bookingCount = s.Bookings.Count,
            suggestedAddOns = "Premium packages, extended duration, or complementary services"
          });

      if (opportunities.Any())
      {
        return new
        {
          type = "Upselling",
          priority = "Medium",
          description = "Add premium options to popular services",
          opportunities = opportunities,
          estimatedReveneueIncrease = "10-15%"
        };
      }

      return null;
    }
  }

  // DTOs
  public class PricingABTestDto
  {
    public int ServiceId { get; set; }
    public decimal PriceA { get; set; }
    public decimal PriceB { get; set; }
    public int TestDurationDays { get; set; } = 30;
  }
}
