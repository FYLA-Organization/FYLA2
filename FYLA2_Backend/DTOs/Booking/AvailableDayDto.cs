namespace FYLA2_Backend.DTOs.Booking
{
    public class AvailableDayDto
    {
        public DateTime Date { get; set; }
        public string DayOfWeek { get; set; } = string.Empty;
        public bool IsAvailable { get; set; }
        public string? WorkingHours { get; set; }
    }
}
