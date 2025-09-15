namespace FYLA2_Backend.DTOs
{
    public class TimeSlotDto
    {
        public string Id { get; set; } = "";
        public string Time { get; set; } = "";
        public bool IsAvailable { get; set; }
        public decimal Price { get; set; }
    }

    public class CreateBookingDto
    {
        public int ServiceId { get; set; }
        public string ProviderId { get; set; } = "";
        public DateTime BookingDate { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string? Notes { get; set; }
        public string? PaymentMethod { get; set; }
    }

    public class BookingDto
    {
        public int Id { get; set; }
        public string ClientId { get; set; } = "";
        public string ProviderId { get; set; } = "";
        public int ServiceId { get; set; }
        public DateTime BookingDate { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Status { get; set; } = "";
        public decimal TotalPrice { get; set; }
        public string? Notes { get; set; }
        public int DurationMinutes { get; set; }
        public string? PaymentMethod { get; set; }
    }

    public class ScheduleSlotDto
    {
        public string Id { get; set; } = "";
        public string ClientName { get; set; } = "";
        public string ClientPhone { get; set; } = "";
        public string ServiceName { get; set; } = "";
        public string StartTime { get; set; } = "";
        public string EndTime { get; set; } = "";
        public int Duration { get; set; }
        public string Status { get; set; } = "";
        public decimal TotalPrice { get; set; }
        public string Notes { get; set; } = "";
    }

    public class BlockTimeDto
    {
        public string Date { get; set; } = "";
        public string StartTime { get; set; } = "";
        public string EndTime { get; set; } = "";
        public string Reason { get; set; } = "";
    }

    // Advanced Analytics DTOs
    public class ProviderAnalyticsDto
    {
        public string ProviderId { get; set; } = "";
        public string ProviderName { get; set; } = "";
        public decimal TotalRevenue { get; set; }
        public int TotalBookings { get; set; }
        public int CompletedBookings { get; set; }
        public int CancelledBookings { get; set; }
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public decimal RevenueGrowth { get; set; }
        public double BookingGrowth { get; set; }
        public List<ServiceAnalyticsDto> TopServices { get; set; } = new();
        public List<RevenueDataPoint> RevenueHistory { get; set; } = new();
        public List<BookingDataPoint> BookingHistory { get; set; } = new();
        public List<ClientInsightDto> TopClients { get; set; } = new();
    }

    public class ServiceAnalyticsDto
    {
        public string ServiceId { get; set; } = "";
        public string ServiceName { get; set; } = "";
        public int BookingCount { get; set; }
        public decimal Revenue { get; set; }
        public double AverageRating { get; set; }
        public decimal AveragePrice { get; set; }
    }

    public class RevenueDataPoint
    {
        public string Date { get; set; } = "";
        public decimal Amount { get; set; }
    }

    public class BookingDataPoint
    {
        public string Date { get; set; } = "";
        public int Count { get; set; }
    }

    public class ClientInsightDto
    {
        public string ClientId { get; set; } = "";
        public string ClientName { get; set; } = "";
        public string ClientImage { get; set; } = "";
        public int TotalBookings { get; set; }
        public decimal TotalSpent { get; set; }
        public string LastBookingDate { get; set; } = "";
        public string PreferredService { get; set; } = "";
    }

    public class ClientAnalyticsDto
    {
        public string ClientId { get; set; } = "";
        public string ClientName { get; set; } = "";
        public decimal TotalSpent { get; set; }
        public int TotalBookings { get; set; }
        public int CompletedBookings { get; set; }
        public int CancelledBookings { get; set; }
        public string FavoriteProvider { get; set; } = "";
        public string FavoriteService { get; set; } = "";
        public List<BookingHistoryDto> RecentBookings { get; set; } = new();
        public List<SpendingDataPoint> SpendingHistory { get; set; } = new();
        public List<ServicePreferenceDto> ServicePreferences { get; set; } = new();
    }

    public class BookingHistoryDto
    {
        public string BookingId { get; set; } = "";
        public string ServiceName { get; set; } = "";
        public string ProviderName { get; set; } = "";
        public string Date { get; set; } = "";
        public string Status { get; set; } = "";
        public decimal Price { get; set; }
    }

    public class SpendingDataPoint
    {
        public string Month { get; set; } = "";
        public decimal Amount { get; set; }
    }

    public class ServicePreferenceDto
    {
        public string ServiceCategory { get; set; } = "";
        public int BookingCount { get; set; }
        public decimal TotalSpent { get; set; }
        public double Percentage { get; set; }
    }

    // File Upload DTOs
    public class FileUploadDto
    {
        public string Id { get; set; } = "";
        public string FileName { get; set; } = "";
        public string ContentType { get; set; } = "";
        public long Size { get; set; }
        public string Url { get; set; } = "";
        public string ThumbnailUrl { get; set; } = "";
        public DateTime UploadedAt { get; set; }
    }

    public class ImageUploadRequestDto
    {
        public string Base64Data { get; set; } = "";
        public string FileName { get; set; } = "";
        public string ContentType { get; set; } = "image/jpeg";
        public string Category { get; set; } = "general"; // profile, post, service, portfolio
        public string? Description { get; set; }
    }

    public class BulkImageUploadDto
    {
        public List<ImageUploadRequestDto> Images { get; set; } = new();
    }

    public class FileUploadResponseDto
    {
        public string Id { get; set; } = "";
        public string FileName { get; set; } = "";
        public string FileUrl { get; set; } = "";
        public string? ThumbnailUrl { get; set; }
        public long FileSize { get; set; }
        public string Category { get; set; } = "";
        public DateTime UploadedAt { get; set; }
    }

    public class BulkUploadRequestDto
    {
        public List<ImageUploadRequestDto> Files { get; set; } = new();
    }

    public class ServiceStatsDto
    {
        public string ServiceName { get; set; } = "";
        public int BookingCount { get; set; }
        public decimal Revenue { get; set; }
    }

    public class MonthlyRevenueDto
    {
        public string Month { get; set; } = "";
        public decimal Revenue { get; set; }
        public int BookingCount { get; set; }
    }

    public class MonthlySpendingDto
    {
        public string Month { get; set; } = "";
        public decimal Amount { get; set; }
        public int BookingCount { get; set; }
    }

    public class DashboardDataDto
    {
        public List<BookingDto> RecentBookings { get; set; } = new();
        public List<BookingDto> UpcomingBookings { get; set; } = new();
    }

    public class AvailableTimeSlotDto
    {
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public bool IsAvailable { get; set; }
        public decimal Price { get; set; }
        public int Duration { get; set; }
        public string? UnavailableReason { get; set; }
    }

    public class UpdateBookingStatusDto
    {
        public string Status { get; set; } = "";
    }
}
