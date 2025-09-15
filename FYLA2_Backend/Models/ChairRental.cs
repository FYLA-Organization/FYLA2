using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FYLA2_Backend.Models
{
    public class ChairRental
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string OwnerId { get; set; } = string.Empty; // Business owner renting out chairs
        
        [Required]
        public string LocationId { get; set; } = string.Empty; // Which location/business
        
        [Required]
        public string ChairNumber { get; set; } = string.Empty; // Chair identifier
        
        [Required]
        [Column(TypeName = "decimal(10, 2)")]
        public decimal MonthlyRent { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(10, 2)")]
        public decimal DepositAmount { get; set; }
        
        public string? RenterId { get; set; } // Service provider renting the chair
        
        [Required]
        public ChairRentalStatus Status { get; set; } = ChairRentalStatus.Available;
        
        public DateTime? RentalStartDate { get; set; }
        public DateTime? RentalEndDate { get; set; }
        
        public string Description { get; set; } = string.Empty;
        public string Amenities { get; set; } = string.Empty; // JSON array of amenities
        
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        [ForeignKey("OwnerId")]
        public virtual User Owner { get; set; } = null!;
        
        [ForeignKey("RenterId")]
        public virtual User? Renter { get; set; }
        
        public virtual BusinessLocation Location { get; set; } = null!;
        public virtual ICollection<ChairRentalPayment> Payments { get; set; } = new List<ChairRentalPayment>();
    }

    public class ChairRentalPayment
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int ChairRentalId { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(10, 2)")]
        public decimal Amount { get; set; }
        
        [Required]
        public ChairRentalPaymentType PaymentType { get; set; }
        
        [Required]
        public DateTime DueDate { get; set; }
        
        public DateTime? PaidDate { get; set; }
        
        [Required]
        public ChairRentalPaymentStatus Status { get; set; } = ChairRentalPaymentStatus.Pending;
        
        public string? StripePaymentIntentId { get; set; }
        public string? Notes { get; set; }
        
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        [ForeignKey("ChairRentalId")]
        public virtual ChairRental ChairRental { get; set; } = null!;
    }

    public class BusinessLocation
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string UserId { get; set; } = string.Empty; // Business owner
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
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
        
        public string BusinessHours { get; set; } = string.Empty; // JSON object
        public string Description { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        
        [Required]
        public bool IsActive { get; set; } = true;
        
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;
        
        public virtual ICollection<ChairRental> ChairRentals { get; set; } = new List<ChairRental>();
    }

    public class CustomBranding
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        public string? LogoUrl { get; set; }
        public string? BannerUrl { get; set; }
        
        public string PrimaryColor { get; set; } = "#007AFF"; // Default blue
        public string SecondaryColor { get; set; } = "#5856D6"; // Default purple
        public string AccentColor { get; set; } = "#FF9500"; // Default orange
        
        public string BusinessName { get; set; } = string.Empty;
        public string Tagline { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        
        public string? CustomDomain { get; set; }
        public string? SocialMediaLinks { get; set; } // JSON object
        
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;
    }

    public class MarketingCampaign
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public MarketingCampaignType Type { get; set; }
        
        [Required]
        public MarketingCampaignStatus Status { get; set; } = MarketingCampaignStatus.Draft;
        
        public string? Subject { get; set; }
        public string? Content { get; set; }
        
        public DateTime? ScheduledDate { get; set; }
        public DateTime? SentDate { get; set; }
        
        public string? TargetAudience { get; set; } // JSON criteria
        
        public int EmailsSent { get; set; } = 0;
        public int EmailsOpened { get; set; } = 0;
        public int EmailsClicked { get; set; } = 0;
        public int BookingsGenerated { get; set; } = 0;
        
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;
    }

    public class SupportTicket
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        public string Subject { get; set; } = string.Empty;
        
        [Required]
        public string Description { get; set; } = string.Empty;
        
        [Required]
        public SupportTicketPriority Priority { get; set; } = SupportTicketPriority.Normal;
        
        [Required]
        public SupportTicketStatus Status { get; set; } = SupportTicketStatus.Open;
        
        [Required]
        public SupportTicketCategory Category { get; set; }
        
        public string? AssignedToAgent { get; set; }
        public DateTime? FirstResponseDate { get; set; }
        public DateTime? ResolvedDate { get; set; }
        
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;
        
        public virtual ICollection<SupportTicketMessage> Messages { get; set; } = new List<SupportTicketMessage>();
    }

    public class SupportTicketMessage
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int SupportTicketId { get; set; }
        
        [Required]
        public string SenderId { get; set; } = string.Empty;
        
        [Required]
        public string Content { get; set; } = string.Empty;
        
        [Required]
        public bool IsFromAgent { get; set; } = false;
        
        public string? AttachmentUrl { get; set; }
        
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        [ForeignKey("SupportTicketId")]
        public virtual SupportTicket SupportTicket { get; set; } = null!;
        
        [ForeignKey("SenderId")]
        public virtual User Sender { get; set; } = null!;
    }

    // Enums
    public enum ChairRentalStatus
    {
        Available = 0,
        Rented = 1,
        Maintenance = 2,
        Inactive = 3
    }

    public enum ChairRentalPaymentType
    {
        MonthlyRent = 0,
        Deposit = 1,
        LateFee = 2,
        Refund = 3
    }

    public enum ChairRentalPaymentStatus
    {
        Pending = 0,
        Paid = 1,
        Overdue = 2,
        Cancelled = 3
    }

    public enum MarketingCampaignType
    {
        Email = 0,
        SMS = 1,
        PushNotification = 2,
        SocialMedia = 3
    }

    public enum MarketingCampaignStatus
    {
        Draft = 0,
        Scheduled = 1,
        Sending = 2,
        Sent = 3,
        Cancelled = 4
    }

    public enum SupportTicketPriority
    {
        Low = 0,
        Normal = 1,
        High = 2,
        Critical = 3
    }

    public enum SupportTicketStatus
    {
        Open = 0,
        InProgress = 1,
        Resolved = 2,
        Closed = 3,
        Cancelled = 4
    }

    public enum SupportTicketCategory
    {
        Technical = 0,
        Billing = 1,
        FeatureRequest = 2,
        Account = 3,
        Booking = 4,
        Payment = 5,
        Other = 6
    }
}
