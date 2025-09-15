using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
    public class ProviderPortfolio
    {
        public int Id { get; set; }

        [Required]
        public string ProviderId { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string ImageUrl { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Caption { get; set; }

        [MaxLength(100)]
        public string? Category { get; set; }

        public int DisplayOrder { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User Provider { get; set; } = null!;
    }

    public class ProviderBusinessHours
    {
        public int Id { get; set; }

        [Required]
        public string ProviderId { get; set; } = string.Empty;

        [Required]
        public DayOfWeekEnum DayOfWeek { get; set; }

        public bool IsOpen { get; set; } = false;

        public TimeSpan? OpenTime { get; set; }

        public TimeSpan? CloseTime { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User Provider { get; set; } = null!;
    }

    public class ServiceAddOn
    {
        public int Id { get; set; }

        [Required]
        public int ServiceId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        public decimal Price { get; set; }

        public int? DurationMinutes { get; set; }

        public bool IsRequired { get; set; } = false;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Service Service { get; set; } = null!;
    }

    public class ProviderSpecialty
    {
        public int Id { get; set; }

        [Required]
        public string ProviderId { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public bool IsVerified { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User Provider { get; set; } = null!;
    }

    public class ProviderPromotion
    {
        public int Id { get; set; }

        [Required]
        public string ProviderId { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Required]
        public string DiscountType { get; set; } = string.Empty; // "percentage" or "fixed"

        [Required]
        public decimal DiscountValue { get; set; }

        [Required]
        public DateTime ValidFrom { get; set; }

        [Required]
        public DateTime ValidUntil { get; set; }

        public int? MaxUses { get; set; }

        public int CurrentUses { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public string? ApplicableServiceIds { get; set; } // JSON array of service IDs

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User Provider { get; set; } = null!;
    }
}
