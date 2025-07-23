namespace FYLA2_Backend.DTOs.Analytics
{
  public class ClientAnalyticsDto
  {
    public string Period { get; set; } = string.Empty;
    public int TotalClients { get; set; }
    public int NewClients { get; set; }
    public int ReturningClients { get; set; }
    public double NewClientPercentage { get; set; }
    public List<TopClientDto> TopClients { get; set; } = new();
    public List<ClientAcquisitionDto> ClientAcquisition { get; set; } = new();
    public List<TimeSlotDto> PopularTimeSlots { get; set; } = new();
  }

  public class TopClientDto
  {
    public string UserId { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public int BookingCount { get; set; }
    public decimal TotalSpent { get; set; }
    public string LastBooking { get; set; } = string.Empty;
  }

  public class ClientAcquisitionDto
  {
    public string Date { get; set; } = string.Empty;
    public int NewClients { get; set; }
  }

  public class TimeSlotDto
  {
    public int Hour { get; set; }
    public string TimeSlot { get; set; } = string.Empty;
    public int BookingCount { get; set; }
  }
}
