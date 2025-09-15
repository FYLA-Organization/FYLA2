namespace FYLA2_Backend.DTOs.ChairRental
{
    public class ChairRentalDto
    {
        public int Id { get; set; }
        public string OwnerId { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
        public string LocationId { get; set; } = string.Empty;
        public string LocationName { get; set; } = string.Empty;
        public string ChairNumber { get; set; } = string.Empty;
        public decimal MonthlyRent { get; set; }
        public decimal DepositAmount { get; set; }
        public string? RenterId { get; set; }
        public string? RenterName { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? RentalStartDate { get; set; }
        public DateTime? RentalEndDate { get; set; }
        public string Description { get; set; } = string.Empty;
        public List<string> Amenities { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }

    public class CreateChairRentalDto
    {
        public string LocationId { get; set; } = string.Empty;
        public string ChairNumber { get; set; } = string.Empty;
        public decimal MonthlyRent { get; set; }
        public decimal DepositAmount { get; set; }
        public string Description { get; set; } = string.Empty;
        public List<string> Amenities { get; set; } = new();
    }

    public class RentChairDto
    {
        public int ChairRentalId { get; set; }
        public DateTime RentalStartDate { get; set; }
        public DateTime RentalEndDate { get; set; }
    }

    public class ChairRentalPaymentDto
    {
        public int Id { get; set; }
        public int ChairRentalId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentType { get; set; } = string.Empty;
        public DateTime DueDate { get; set; }
        public DateTime? PaidDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }

    public class ChairRentalAnalyticsDto
    {
        public int TotalChairs { get; set; }
        public int RentedChairs { get; set; }
        public int AvailableChairs { get; set; }
        public decimal MonthlyRevenue { get; set; }
        public decimal YearlyRevenue { get; set; }
        public decimal AverageRent { get; set; }
        public double OccupancyRate { get; set; }
        public List<ChairRentalDto> RecentRentals { get; set; } = new();
        public List<ChairRentalPaymentDto> PendingPayments { get; set; } = new();
    }
}

namespace FYLA2_Backend.DTOs.BusinessLocation
{
    public class BusinessLocationDto
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string ZipCode { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Website { get; set; } = string.Empty;
        public Dictionary<string, object> BusinessHours { get; set; } = new();
        public string Description { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; }
        public int ChairCount { get; set; }
        public int RentedChairCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateBusinessLocationDto
    {
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string ZipCode { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Website { get; set; } = string.Empty;
        public Dictionary<string, object> BusinessHours { get; set; } = new();
        public string Description { get; set; } = string.Empty;
    }
}

namespace FYLA2_Backend.DTOs.CustomBranding
{
    public class CustomBrandingDto
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string? BannerUrl { get; set; }
        public string PrimaryColor { get; set; } = "#007AFF";
        public string SecondaryColor { get; set; } = "#5856D6";
        public string AccentColor { get; set; } = "#FF9500";
        public string BusinessName { get; set; } = string.Empty;
        public string Tagline { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? CustomDomain { get; set; }
        public Dictionary<string, string> SocialMediaLinks { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }

    public class UpdateCustomBrandingDto
    {
        public string? LogoUrl { get; set; }
        public string? BannerUrl { get; set; }
        public string PrimaryColor { get; set; } = "#007AFF";
        public string SecondaryColor { get; set; } = "#5856D6";
        public string AccentColor { get; set; } = "#FF9500";
        public string BusinessName { get; set; } = string.Empty;
        public string Tagline { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? CustomDomain { get; set; }
        public Dictionary<string, string> SocialMediaLinks { get; set; } = new();
    }
}

namespace FYLA2_Backend.DTOs.Marketing
{
    public class MarketingCampaignDto
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Subject { get; set; }
        public string? Content { get; set; }
        public DateTime? ScheduledDate { get; set; }
        public DateTime? SentDate { get; set; }
        public Dictionary<string, object> TargetAudience { get; set; } = new();
        public int EmailsSent { get; set; }
        public int EmailsOpened { get; set; }
        public int EmailsClicked { get; set; }
        public int BookingsGenerated { get; set; }
        public DateTime CreatedAt { get; set; }
        
        // Calculated fields
        public double OpenRate => EmailsSent > 0 ? (double)EmailsOpened / EmailsSent * 100 : 0;
        public double ClickRate => EmailsSent > 0 ? (double)EmailsClicked / EmailsSent * 100 : 0;
        public double ConversionRate => EmailsSent > 0 ? (double)BookingsGenerated / EmailsSent * 100 : 0;
    }

    public class CreateMarketingCampaignDto
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string? Subject { get; set; }
        public string? Content { get; set; }
        public DateTime? ScheduledDate { get; set; }
        public Dictionary<string, object> TargetAudience { get; set; } = new();
    }

    public class MarketingAnalyticsDto
    {
        public int TotalCampaigns { get; set; }
        public int ActiveCampaigns { get; set; }
        public int TotalEmailsSent { get; set; }
        public int TotalEmailsOpened { get; set; }
        public int TotalEmailsClicked { get; set; }
        public int TotalBookingsGenerated { get; set; }
        public double AverageOpenRate { get; set; }
        public double AverageClickRate { get; set; }
        public double AverageConversionRate { get; set; }
        public decimal RevenueFromCampaigns { get; set; }
        public List<MarketingCampaignDto> RecentCampaigns { get; set; } = new();
    }
}

namespace FYLA2_Backend.DTOs.Support
{
    public class SupportTicketDto
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string? AssignedToAgent { get; set; }
        public DateTime? FirstResponseDate { get; set; }
        public DateTime? ResolvedDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<SupportTicketMessageDto> Messages { get; set; } = new();
        
        // Calculated fields
        public TimeSpan? ResponseTime => FirstResponseDate?.Subtract(CreatedAt);
        public TimeSpan? ResolutionTime => ResolvedDate?.Subtract(CreatedAt);
    }

    public class CreateSupportTicketDto
    {
        public string Subject { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = "Normal";
        public string Category { get; set; } = string.Empty;
    }

    public class SupportTicketMessageDto
    {
        public int Id { get; set; }
        public int SupportTicketId { get; set; }
        public string SenderId { get; set; } = string.Empty;
        public string SenderName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public bool IsFromAgent { get; set; }
        public string? AttachmentUrl { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateSupportTicketMessageDto
    {
        public int SupportTicketId { get; set; }
        public string Content { get; set; } = string.Empty;
        public string? AttachmentUrl { get; set; }
    }

    public class SupportAnalyticsDto
    {
        public int TotalTickets { get; set; }
        public int OpenTickets { get; set; }
        public int ResolvedTickets { get; set; }
        public double AverageResponseTimeHours { get; set; }
        public double AverageResolutionTimeHours { get; set; }
        public Dictionary<string, int> TicketsByCategory { get; set; } = new();
        public Dictionary<string, int> TicketsByPriority { get; set; } = new();
        public List<SupportTicketDto> RecentTickets { get; set; } = new();
    }

    // Branding DTOs
    public class SocialMediaKitDto
    {
        public List<string> InstagramPosts { get; set; } = new();
        public List<string> FacebookCovers { get; set; } = new();
        public List<string> TwitterHeaders { get; set; } = new();
        public List<string> LinkedInBanners { get; set; } = new();
        public List<string> LogoVariations { get; set; } = new();
    }

    public class PublicBrandProfileDto
    {
        public int Id { get; set; }
        public string ServiceProviderId { get; set; } = string.Empty;
        public string BusinessName { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string PrimaryColor { get; set; } = "#4CAF50";
        public string SecondaryColor { get; set; } = "#45a049";
        public string AccentColor { get; set; } = "#FF5722";
        public string FontFamily { get; set; } = "Arial";
        public string? Tagline { get; set; }
        public string? Description { get; set; }
        public object SocialMediaLinks { get; set; } = new();
    }
}
