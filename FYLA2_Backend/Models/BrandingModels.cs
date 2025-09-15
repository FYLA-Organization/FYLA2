using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FYLA2_Backend.Models
{
    public class BrandProfile
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string ServiceProviderId { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string BusinessName { get; set; } = string.Empty;

        public string? LogoUrl { get; set; }

        [StringLength(7)]
        public string PrimaryColor { get; set; } = "#1f2937";

        [StringLength(7)]
        public string SecondaryColor { get; set; } = "#3b82f6";

        [StringLength(7)]
        public string AccentColor { get; set; } = "#10b981";

        [StringLength(50)]
        public string FontFamily { get; set; } = "Inter";

        [StringLength(200)]
        public string? Tagline { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        public string? WebsiteUrl { get; set; }

        [StringLength(50)]
        public string? InstagramHandle { get; set; }

        [StringLength(100)]
        public string? FacebookPage { get; set; }

        [StringLength(50)]
        public string? TwitterHandle { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("ServiceProviderId")]
        public virtual User ServiceProvider { get; set; } = null!;

        public virtual ICollection<BrandedEmailTemplate> EmailTemplates { get; set; } = new List<BrandedEmailTemplate>();
    }

    public class BrandedEmailTemplate
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int BrandProfileId { get; set; }

        [Required]
        [StringLength(50)]
        public string TemplateType { get; set; } = string.Empty; // "booking_confirmation", "reminder", "receipt", "welcome"

        [Required]
        [StringLength(200)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        public string HtmlContent { get; set; } = string.Empty;

        [Required]
        public string TextContent { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("BrandProfileId")]
        public virtual BrandProfile BrandProfile { get; set; } = null!;
    }

    public class SeatRental
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string OwnerId { get; set; } = string.Empty; // Business owner

        [Required]
        [StringLength(100)]
        public string Title { get; set; } = string.Empty;

        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string Address { get; set; } = string.Empty;

        [StringLength(50)]
        public string City { get; set; } = string.Empty;

        [StringLength(50)]
        public string State { get; set; } = string.Empty;

        [StringLength(20)]
        public string ZipCode { get; set; } = string.Empty;

        [Column(TypeName = "decimal(10,2)")]
        public decimal DailyRate { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal WeeklyRate { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal MonthlyRate { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal CommissionRate { get; set; } = 0.10m; // 10% default commission

        public string Amenities { get; set; } = string.Empty; // JSON array of amenities

        public string AvailableHours { get; set; } = string.Empty; // JSON object for schedule

        public string Photos { get; set; } = string.Empty; // JSON array of photo URLs

        public bool IsActive { get; set; } = true;

        public bool RequiresApproval { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("OwnerId")]
        public virtual User Owner { get; set; } = null!;

        public virtual ICollection<SeatRentalBooking> Bookings { get; set; } = new List<SeatRentalBooking>();
    }

    public class SeatRentalBooking
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int SeatRentalId { get; set; }

        [Required]
        public string RenterId { get; set; } = string.Empty; // Service provider renting the seat

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalAmount { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal CommissionAmount { get; set; }

        public string Status { get; set; } = "pending"; // pending, approved, rejected, active, completed

        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("SeatRentalId")]
        public virtual SeatRental SeatRental { get; set; } = null!;

        [ForeignKey("RenterId")]
        public virtual User Renter { get; set; } = null!;

        public virtual ICollection<Booking> ClientBookings { get; set; } = new List<Booking>();
    }
}
