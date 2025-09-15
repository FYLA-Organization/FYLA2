using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.DTOs
{
    // Provider Profile DTOs
    public class ProviderProfileDto
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string BusinessName { get; set; } = string.Empty;
        public string? BusinessDescription { get; set; }
        public string? BusinessAddress { get; set; }
        public string? BusinessPhone { get; set; }
        public string? BusinessEmail { get; set; }
        public string? BusinessWebsite { get; set; }
        public bool IsVerified { get; set; }
        public List<string> Specialties { get; set; } = new List<string>();
        public List<PortfolioImageDto> Portfolio { get; set; } = new List<PortfolioImageDto>();
        public List<BusinessHoursDto> BusinessHours { get; set; } = new List<BusinessHoursDto>();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateProviderProfileDto
    {
        [Required]
        [MaxLength(200)]
        public string BusinessName { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? BusinessDescription { get; set; }

        [MaxLength(500)]
        public string? BusinessAddress { get; set; }

        public string? BusinessPhone { get; set; }

        public string? BusinessEmail { get; set; }

        public string? BusinessWebsite { get; set; }

        public List<string> Specialties { get; set; } = new List<string>();
    }

    public class UpdateProviderProfileDto
    {
        [MaxLength(200)]
        public string? BusinessName { get; set; }

        [MaxLength(1000)]
        public string? BusinessDescription { get; set; }

        [MaxLength(500)]
        public string? BusinessAddress { get; set; }

        public string? BusinessPhone { get; set; }

        public string? BusinessEmail { get; set; }

        public string? BusinessWebsite { get; set; }

        public List<string>? Specialties { get; set; }
    }

    // Portfolio DTOs
    public class PortfolioImageDto
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string? Caption { get; set; }
        public string? Category { get; set; }
        public int DisplayOrder { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreatePortfolioImageDto
    {
        [Required]
        public IFormFile Image { get; set; } = null!;

        [MaxLength(200)]
        public string? Caption { get; set; }

        [MaxLength(100)]
        public string? Category { get; set; }

        public int DisplayOrder { get; set; } = 0;
    }

    // Business Hours DTOs
    public class BusinessHoursDto
    {
        public int Id { get; set; }
        public int DayOfWeek { get; set; }
        public bool IsOpen { get; set; }
        public string? OpenTime { get; set; }
        public string? CloseTime { get; set; }
    }

    public class UpdateBusinessHoursDto
    {
        [Required]
        public List<BusinessHoursDto> BusinessHours { get; set; } = new List<BusinessHoursDto>();
    }

    // Service DTOs
    public class ServiceDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int DurationMinutes { get; set; }
        public string? ImageUrl { get; set; }
        public string Category { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public string ProviderId { get; set; } = string.Empty;
        public List<ServiceAddOnDto> AddOns { get; set; } = new List<ServiceAddOnDto>();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateServiceDto
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Price { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int DurationMinutes { get; set; }

        [Required]
        public string Category { get; set; } = string.Empty;

        public IFormFile? Image { get; set; }

        public List<CreateServiceAddOnDto> AddOns { get; set; } = new List<CreateServiceAddOnDto>();
    }

    public class UpdateServiceDto
    {
        [MaxLength(200)]
        public string? Name { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Range(0.01, double.MaxValue)]
        public decimal? Price { get; set; }

        [Range(1, int.MaxValue)]
        public int? DurationMinutes { get; set; }

        public string? Category { get; set; }

        public IFormFile? Image { get; set; }

        public bool? IsActive { get; set; }

        public List<CreateServiceAddOnDto>? AddOns { get; set; }
    }

    // Service Add-On DTOs
    public class ServiceAddOnDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int? DurationMinutes { get; set; }
        public bool IsRequired { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateServiceAddOnDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal Price { get; set; }

        public int? DurationMinutes { get; set; }

        public bool IsRequired { get; set; } = false;
    }

    // Availability DTOs
    public class ProviderAvailabilityDto
    {
        public List<DayAvailabilityDto> WeeklySchedule { get; set; } = new List<DayAvailabilityDto>();
        public List<SpecialDateDto> SpecialDates { get; set; } = new List<SpecialDateDto>();
    }

    public class DayAvailabilityDto
    {
        public int DayOfWeek { get; set; }
        public bool IsAvailable { get; set; }
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
        public List<BreakDto> Breaks { get; set; } = new List<BreakDto>();
        // Keep these for backward compatibility with requests that still use them
        public string? BreakStartTime { get; set; }
        public string? BreakEndTime { get; set; }
    }

    public class BreakDto
    {
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
    }

    public class SpecialDateDto
    {
        public DateTime Date { get; set; }
        public bool IsAvailable { get; set; }
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
        public string? Reason { get; set; }
    }

    public class UpdateAvailabilityDto
    {
        [Required]
        public List<DayAvailabilityDto> WeeklySchedule { get; set; } = new List<DayAvailabilityDto>();
        
        public List<SpecialDateDto>? SpecialDates { get; set; }
    }

    // Promotion DTOs
    public class PromotionDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string DiscountType { get; set; } = string.Empty;
        public decimal DiscountValue { get; set; }
        public DateTime ValidFrom { get; set; }
        public DateTime ValidUntil { get; set; }
        public int? MaxUses { get; set; }
        public int CurrentUses { get; set; }
        public bool IsActive { get; set; }
        public List<int> ApplicableServiceIds { get; set; } = new List<int>();
    }
}
