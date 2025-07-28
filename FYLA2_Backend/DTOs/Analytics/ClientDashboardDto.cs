using System;
using System.Collections.Generic;

namespace FYLA2_Backend.DTOs.Analytics
{
  public class ClientDashboardDto
  {
    public ClientPersonalStatsDto PersonalStats { get; set; } = new();
    public List<ClientRecentBookingDto> RecentBookings { get; set; } = new();
    public List<FavoriteProviderDto> FavoriteProviders { get; set; } = new();
    public List<UpcomingAppointmentDto> UpcomingAppointments { get; set; } = new();
    public ClientSpendingInsightDto SpendingInsights { get; set; } = new();
  }

  public class ClientPersonalStatsDto
  {
    public int TotalBookings { get; set; }
    public decimal TotalSpent { get; set; }
    public int FavoriteProviders { get; set; }
    public DateTime? LastBooking { get; set; }
    public string MostBookedService { get; set; } = string.Empty;
    public decimal AverageBookingValue { get; set; }
    public int BookingsThisMonth { get; set; }
    public decimal SpentThisMonth { get; set; }
  }

  public class ClientRecentBookingDto
  {
    public string BookingId { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public string ProviderImage { get; set; } = string.Empty;
    public DateTime BookingDate { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool CanRate { get; set; }
    public bool CanRebook { get; set; }
  }

  public class FavoriteProviderDto
  {
    public string ProviderId { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public string ProviderImage { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public double Rating { get; set; }
    public int BookingCount { get; set; }
    public decimal TotalSpent { get; set; }
    public DateTime LastVisit { get; set; }
    public bool IsAvailable { get; set; }
  }

  public class UpcomingAppointmentDto
  {
    public string BookingId { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public string ProviderImage { get; set; } = string.Empty;
    public DateTime BookingDate { get; set; }
    public string Duration { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Location { get; set; } = string.Empty;
    public int DaysUntil { get; set; }
    public bool CanReschedule { get; set; }
    public bool CanCancel { get; set; }
  }

  public class ClientSpendingInsightDto
  {
    public decimal MonthlyAverage { get; set; }
    public List<MonthlySpendingDto> MonthlyBreakdown { get; set; } = new();
    public List<ServiceSpendingDto> ServiceBreakdown { get; set; } = new();
    public string TopSpendingCategory { get; set; } = string.Empty;
    public decimal YearToDateSpending { get; set; }
    public decimal PredictedMonthlySpending { get; set; }
  }

  public class MonthlySpendingDto
  {
    public string Month { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int BookingCount { get; set; }
  }

  public class ServiceSpendingDto
  {
    public string ServiceName { get; set; } = string.Empty;
    public decimal TotalSpent { get; set; }
    public int BookingCount { get; set; }
    public decimal AveragePrice { get; set; }
    public double Percentage { get; set; }
  }
}
