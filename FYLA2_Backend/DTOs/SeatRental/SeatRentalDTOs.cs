using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.DTOs.SeatRental
{
    public class SeatRentalDto
    {
        public int Id { get; set; }
        public string OwnerId { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string ZipCode { get; set; } = string.Empty;
        public decimal DailyRate { get; set; }
        public decimal WeeklyRate { get; set; }
        public decimal MonthlyRate { get; set; }
        public decimal CommissionRate { get; set; }
        public List<string> Amenities { get; set; } = new List<string>();
        public ScheduleDto AvailableHours { get; set; } = new ScheduleDto();
        public List<string> Photos { get; set; } = new List<string>();
        public bool IsActive { get; set; }
        public bool RequiresApproval { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<SeatRentalBookingDto> ActiveBookings { get; set; } = new List<SeatRentalBookingDto>();
    }

    public class CreateSeatRentalDto
    {
        [Required]
        [StringLength(100)]
        public string Title { get; set; } = string.Empty;

        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string Address { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string City { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string State { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string ZipCode { get; set; } = string.Empty;

        [Range(0, 10000)]
        public decimal DailyRate { get; set; }

        [Range(0, 50000)]
        public decimal WeeklyRate { get; set; }

        [Range(0, 200000)]
        public decimal MonthlyRate { get; set; }

        [Range(0, 1)]
        public decimal CommissionRate { get; set; } = 0.10m;

        public List<string> Amenities { get; set; } = new List<string>();

        public ScheduleDto AvailableHours { get; set; } = new ScheduleDto();

        public bool RequiresApproval { get; set; } = true;
    }

    public class UpdateSeatRentalDto : CreateSeatRentalDto
    {
        public int Id { get; set; }
    }

    public class SeatRentalBookingDto
    {
        public int Id { get; set; }
        public int SeatRentalId { get; set; }
        public string RenterId { get; set; } = string.Empty;
        public string RenterName { get; set; } = string.Empty;
        public string RenterEmail { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal CommissionAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public SeatRentalDto? SeatRental { get; set; }
        public int ClientBookingsCount { get; set; }
    }

    public class CreateSeatRentalBookingDto
    {
        [Required]
        public int SeatRentalId { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public string? Notes { get; set; }
    }

    public class UpdateBookingStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty; // approved, rejected

        public string? Notes { get; set; }
    }

    public class ScheduleDto
    {
        public DaySchedule Monday { get; set; } = new DaySchedule();
        public DaySchedule Tuesday { get; set; } = new DaySchedule();
        public DaySchedule Wednesday { get; set; } = new DaySchedule();
        public DaySchedule Thursday { get; set; } = new DaySchedule();
        public DaySchedule Friday { get; set; } = new DaySchedule();
        public DaySchedule Saturday { get; set; } = new DaySchedule();
        public DaySchedule Sunday { get; set; } = new DaySchedule();
    }

    public class DaySchedule
    {
        public bool IsAvailable { get; set; } = true;
        public string StartTime { get; set; } = "09:00";
        public string EndTime { get; set; } = "17:00";
    }

    public class SeatRentalSearchDto
    {
        public string? City { get; set; }
        public string? State { get; set; }
        public decimal? MaxDailyRate { get; set; }
        public decimal? MaxWeeklyRate { get; set; }
        public decimal? MaxMonthlyRate { get; set; }
        public List<string> RequiredAmenities { get; set; } = new List<string>();
        public DateTime? AvailableFrom { get; set; }
        public DateTime? AvailableTo { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class SeatRentalStatsDto
    {
        public int TotalListings { get; set; }
        public int ActiveBookings { get; set; }
        public int PendingRequests { get; set; }
        public decimal MonthlyRevenue { get; set; }
        public decimal CommissionEarned { get; set; }
        public List<BookingStatsDto> RecentActivity { get; set; } = new List<BookingStatsDto>();
    }

    public class BookingStatsDto
    {
        public string RenterName { get; set; } = string.Empty;
        public string SeatTitle { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }
}
