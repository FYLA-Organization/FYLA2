namespace FYLA2_Backend.DTOs.Analytics
{
  public class RevenueAnalyticsDto
  {
    public string Period { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public decimal TotalRevenue { get; set; }
    public int TotalBookings { get; set; }
    public decimal AverageBookingValue { get; set; }
    public double GrowthPercentage { get; set; }
    public List<DailyRevenueDto> DailyRevenue { get; set; } = new();
    public List<ServicePerformanceDto> TopServices { get; set; } = new();
  }

  public class DailyRevenueDto
  {
    public string Date { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int BookingCount { get; set; }
  }

  public class ServicePerformanceDto
  {
    public int ServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public int BookingCount { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AveragePrice { get; set; }
  }
}
