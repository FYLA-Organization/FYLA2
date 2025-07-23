namespace FYLA2_Backend.DTOs.Analytics
{
  public class ProviderDashboardDto
  {
    public int TodayAppointments { get; set; }
    public int PendingAppointments { get; set; }
    public decimal WeeklyRevenue { get; set; }
    public decimal MonthlyRevenue { get; set; }
    public int TotalClients { get; set; }
    public double AverageRating { get; set; }
    public NextAppointmentDto? NextAppointment { get; set; }
    public List<RecentBookingDto> RecentBookings { get; set; } = new();
  }

  public class NextAppointmentDto
  {
    public int Id { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public DateTime ScheduledDate { get; set; }
    public int Duration { get; set; }
    public decimal TotalAmount { get; set; }
  }

  public class RecentBookingDto
  {
    public int Id { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public DateTime ScheduledDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
  }
}
