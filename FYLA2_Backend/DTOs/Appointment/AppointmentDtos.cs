using FYLA2_Backend.Models;

namespace FYLA2_Backend.DTOs.Appointment
{
  public class ProviderAppointmentDto
  {
    public int Id { get; set; }
    public string ClientId { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public string ClientEmail { get; set; } = string.Empty;
    public string ClientPhone { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public decimal ServicePrice { get; set; }
    public int DurationMinutes { get; set; }
    public DateTime BookingDate { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public BookingStatus Status { get; set; }
    public decimal TotalPrice { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
    public decimal? TipAmount { get; set; }
    public bool HasReview { get; set; }
    public double? Rating { get; set; }
    public string? ReviewText { get; set; }
    public DateTime? LastStatusUpdate { get; set; }
    public string ServiceCategory { get; set; } = string.Empty;
    public int ClientTotalBookings { get; set; }
    public decimal ClientLifetimeValue { get; set; }
    public bool IsFirstTimeClient { get; set; }
    public string ClientMembershipTier { get; set; } = "Bronze";
    public int ClientLoyaltyPoints { get; set; }
  }

  public class AppointmentFilterDto
  {
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public BookingStatus? Status { get; set; }
    public string? ServiceCategory { get; set; }
    public string? ClientName { get; set; }
    public bool? IsFirstTimeClient { get; set; }
    public string? PaymentStatus { get; set; }
    public decimal? MinAmount { get; set; }
    public decimal? MaxAmount { get; set; }
    public string? SortBy { get; set; } = "StartTime"; // StartTime, ClientName, Amount, Status
    public bool SortDescending { get; set; } = false;
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
  }

  public class AppointmentSearchResultDto
  {
    public List<ProviderAppointmentDto> Appointments { get; set; } = new();
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public int CurrentPage { get; set; }
    public AppointmentStatsDto Stats { get; set; } = new();
  }

  public class AppointmentStatsDto
  {
    public int TotalAppointments { get; set; }
    public int CompletedAppointments { get; set; }
    public int PendingAppointments { get; set; }
    public int CancelledAppointments { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AverageAppointmentValue { get; set; }
    public int UniqueClients { get; set; }
    public int FirstTimeClients { get; set; }
    public double AverageRating { get; set; }
    public Dictionary<string, int> ServiceBreakdown { get; set; } = new();
    public Dictionary<string, decimal> RevenueBreakdown { get; set; } = new();
  }

  public class UpdateAppointmentStatusDto
  {
    public BookingStatus Status { get; set; }
    public string? Notes { get; set; }
    public decimal? TipAmount { get; set; }
  }

  public class AppointmentTimeSlotDto
  {
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public bool IsAvailable { get; set; }
    public string? BookingId { get; set; }
    public string? ClientName { get; set; }
    public string? ServiceName { get; set; }
    public BookingStatus? Status { get; set; }
  }

  public class DayScheduleDto
  {
    public DateTime Date { get; set; }
    public bool IsWorkingDay { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public TimeSpan? BreakStart { get; set; }
    public TimeSpan? BreakEnd { get; set; }
    public List<AppointmentTimeSlotDto> TimeSlots { get; set; } = new();
    public int TotalAppointments { get; set; }
    public decimal DayRevenue { get; set; }
    public bool HasAvailableSlots { get; set; }
  }

  public class WeekScheduleDto
  {
    public DateTime WeekStartDate { get; set; }
    public DateTime WeekEndDate { get; set; }
    public List<DayScheduleDto> Days { get; set; } = new();
    public int TotalWeekAppointments { get; set; }
    public decimal WeekRevenue { get; set; }
    public int AvailableSlots { get; set; }
  }

  public class PaymentHistoryDto
  {
    public int BookingId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal? TipAmount { get; set; }
    public decimal TotalAmount => Amount + (TipAmount ?? 0);
    public DateTime PaymentDate { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public bool CanGenerateInvoice { get; set; }
  }

  public class InvoiceDto
  {
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime InvoiceDate { get; set; }
    public DateTime DueDate { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string ClientEmail { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public string ProviderBusinessName { get; set; } = string.Empty;
    public string ProviderEmail { get; set; } = string.Empty;
    public string ProviderPhone { get; set; } = string.Empty;
    public List<InvoiceLineItemDto> LineItems { get; set; } = new();
    public decimal Subtotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TipAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
    public DateTime? PaymentDate { get; set; }
    public string? Notes { get; set; }
  }

  public class InvoiceLineItemDto
  {
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Total { get; set; }
    public DateTime ServiceDate { get; set; }
  }

  public class AvailabilityUpdateDto
  {
    public DateTime Date { get; set; }
    public bool IsWorkingDay { get; set; }
    public TimeSpan? StartTime { get; set; }
    public TimeSpan? EndTime { get; set; }
    public TimeSpan? BreakStart { get; set; }
    public TimeSpan? BreakEnd { get; set; }
    public List<string> BlockedSlots { get; set; } = new(); // Time slots to block (format: "HH:mm")
  }

  public class BulkAvailabilityUpdateDto
  {
    public List<AvailabilityUpdateDto> Updates { get; set; } = new();
    public bool ApplyToFutureWeeks { get; set; } = false;
    public int WeeksToApply { get; set; } = 4;
  }
}
