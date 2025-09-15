using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.DTOs.Branding
{
    public class BrandProfileDto
    {
        public int Id { get; set; }
        public string ServiceProviderId { get; set; } = string.Empty;
        public string BusinessName { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string PrimaryColor { get; set; } = "#1f2937";
        public string SecondaryColor { get; set; } = "#3b82f6";
        public string AccentColor { get; set; } = "#10b981";
        public string FontFamily { get; set; } = "Inter";
        public string? Tagline { get; set; }
        public string? Description { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? InstagramHandle { get; set; }
        public string? FacebookPage { get; set; }
        public string? TwitterHandle { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateBrandProfileDto
    {
        [Required]
        [StringLength(100)]
        public string BusinessName { get; set; } = string.Empty;

        [RegularExpression(@"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")]
        public string PrimaryColor { get; set; } = "#1f2937";

        [RegularExpression(@"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")]
        public string SecondaryColor { get; set; } = "#3b82f6";

        [RegularExpression(@"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")]
        public string AccentColor { get; set; } = "#10b981";

        [StringLength(50)]
        public string FontFamily { get; set; } = "Inter";

        [StringLength(200)]
        public string? Tagline { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        [Url]
        public string? WebsiteUrl { get; set; }

        [StringLength(50)]
        public string? InstagramHandle { get; set; }

        [StringLength(100)]
        public string? FacebookPage { get; set; }

        [StringLength(50)]
        public string? TwitterHandle { get; set; }
    }

    public class UpdateBrandProfileDto : CreateBrandProfileDto
    {
        public int Id { get; set; }
    }

    public class BrandThemeDto
    {
        public string PrimaryColor { get; set; } = string.Empty;
        public string SecondaryColor { get; set; } = string.Empty;
        public string AccentColor { get; set; } = string.Empty;
        public string FontFamily { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string BusinessName { get; set; } = string.Empty;
    }

    public class BrandedEmailTemplateDto
    {
        public int Id { get; set; }
        public string TemplateType { get; set; } = string.Empty; // "booking_confirmation", "reminder", "receipt"
        public string Subject { get; set; } = string.Empty;
        public string HtmlContent { get; set; } = string.Empty;
        public string TextContent { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
    }

    public class CreateEmailTemplateDto
    {
        [Required]
        [StringLength(50)]
        public string TemplateType { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        public string HtmlContent { get; set; } = string.Empty;

        [Required]
        public string TextContent { get; set; } = string.Empty;
    }
}
