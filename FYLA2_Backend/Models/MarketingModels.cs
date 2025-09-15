using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FYLA2_Backend.Models
{
    public class EnhancedMarketingCampaign
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string ServiceProviderId { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Type { get; set; } = string.Empty; // email, sms, social_media, google_ads, promotion

        [StringLength(20)]
        public string Status { get; set; } = "draft"; // draft, active, paused, completed

        [StringLength(50)]
        public string TargetAudience { get; set; } = "all_clients"; // all_clients, new_clients, returning_clients, vip_clients

        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal Budget { get; set; } = 0;

        [Column(TypeName = "decimal(10,2)")]
        public decimal SpentAmount { get; set; } = 0;

        public string Content { get; set; } = string.Empty; // JSON content for different campaign types

        public int TotalSent { get; set; } = 0;
        public int TotalOpened { get; set; } = 0;
        public int TotalClicked { get; set; } = 0;
        public int TotalConverted { get; set; } = 0;

        [Column(TypeName = "decimal(10,2)")]
        public decimal Revenue { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("ServiceProviderId")]
        public virtual User ServiceProvider { get; set; } = null!;

        public virtual ICollection<CampaignResult> Results { get; set; } = new List<CampaignResult>();
    }

    public class CampaignResult
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int CampaignId { get; set; }

        [Required]
        public string ClientId { get; set; } = string.Empty;

        [StringLength(20)]
        public string Action { get; set; } = string.Empty; // sent, opened, clicked, converted

        public DateTime ActionDate { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "decimal(10,2)")]
        public decimal? RevenueGenerated { get; set; }

        public string? Metadata { get; set; } // JSON for additional data

        // Navigation properties
        [ForeignKey("CampaignId")]
        public virtual EnhancedMarketingCampaign Campaign { get; set; } = null!;

        [ForeignKey("ClientId")]
        public virtual User Client { get; set; } = null!;
    }

    public class CustomerSegment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string ServiceProviderId { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        public string Criteria { get; set; } = string.Empty; // JSON criteria for filtering

        public int CustomerCount { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("ServiceProviderId")]
        public virtual User ServiceProvider { get; set; } = null!;

        public virtual ICollection<SegmentMember> Members { get; set; } = new List<SegmentMember>();
    }

    public class SegmentMember
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int SegmentId { get; set; }

        [Required]
        public string ClientId { get; set; } = string.Empty;

        public DateTime AddedDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("SegmentId")]
        public virtual CustomerSegment Segment { get; set; } = null!;

        [ForeignKey("ClientId")]
        public virtual User Client { get; set; } = null!;
    }

    public class MarketingAutomation
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string ServiceProviderId { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string TriggerType { get; set; } = string.Empty; // booking_confirmed, appointment_reminder, birthday, no_show, follow_up

        [Required]
        [StringLength(50)]
        public string ActionType { get; set; } = string.Empty; // send_email, send_sms, create_promotion

        public string Content { get; set; } = string.Empty; // JSON content

        public int DelayMinutes { get; set; } = 0; // Delay after trigger

        public bool IsActive { get; set; } = true;

        public int TimesTriggered { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("ServiceProviderId")]
        public virtual User ServiceProvider { get; set; } = null!;

        public virtual ICollection<AutomationExecution> Executions { get; set; } = new List<AutomationExecution>();
    }

    public class AutomationExecution
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int AutomationId { get; set; }

        [Required]
        public string ClientId { get; set; } = string.Empty;

        [Required]
        public string TriggerEvent { get; set; } = string.Empty;

        public DateTime ScheduledFor { get; set; }

        public DateTime? ExecutedAt { get; set; }

        [StringLength(20)]
        public string Status { get; set; } = "pending"; // pending, executed, failed

        public string? ErrorMessage { get; set; }

        // Navigation properties
        [ForeignKey("AutomationId")]
        public virtual MarketingAutomation Automation { get; set; } = null!;

        [ForeignKey("ClientId")]
        public virtual User Client { get; set; } = null!;
    }

    public class ReferralProgram
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string ServiceProviderId { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [StringLength(20)]
        public string ReferrerRewardType { get; set; } = "discount"; // discount, credit, free_service

        [Column(TypeName = "decimal(10,2)")]
        public decimal ReferrerRewardValue { get; set; } = 0;

        [StringLength(20)]
        public string RefereeRewardType { get; set; } = "discount";

        [Column(TypeName = "decimal(10,2)")]
        public decimal RefereeRewardValue { get; set; } = 0;

        public int MaxReferrals { get; set; } = 0; // 0 = unlimited
        public int ValidityDays { get; set; } = 365;

        public bool IsActive { get; set; } = true;

        public int TotalReferrals { get; set; } = 0;

        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalRewardsPaid { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("ServiceProviderId")]
        public virtual User ServiceProvider { get; set; } = null!;

        public virtual ICollection<Referral> Referrals { get; set; } = new List<Referral>();
    }

    public class Referral
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ReferralProgramId { get; set; }

        [Required]
        public string ReferrerId { get; set; } = string.Empty; // The person making the referral

        [Required]
        public string RefereeId { get; set; } = string.Empty; // The person being referred

        [StringLength(50)]
        public string ReferralCode { get; set; } = string.Empty;

        [StringLength(20)]
        public string Status { get; set; } = "pending"; // pending, completed, rewarded

        public DateTime ReferralDate { get; set; } = DateTime.UtcNow;
        public DateTime? CompletionDate { get; set; }
        public DateTime? RewardDate { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal ReferrerReward { get; set; } = 0;

        [Column(TypeName = "decimal(10,2)")]
        public decimal RefereeReward { get; set; } = 0;

        // Navigation properties
        [ForeignKey("ReferralProgramId")]
        public virtual ReferralProgram ReferralProgram { get; set; } = null!;

        [ForeignKey("ReferrerId")]
        public virtual User Referrer { get; set; } = null!;

        [ForeignKey("RefereeId")]
        public virtual User Referee { get; set; } = null!;
    }

    public class Promotion
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string ServiceProviderId { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Title { get; set; } = string.Empty;

        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [StringLength(20)]
        public string Type { get; set; } = "percentage"; // percentage, fixed_amount, buy_one_get_one, bundle

        [Column(TypeName = "decimal(10,2)")]
        public decimal Value { get; set; } = 0;

        [StringLength(20)]
        public string? PromoCode { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public int MaxUses { get; set; } = 100;
        public int CurrentUses { get; set; } = 0;

        [Column(TypeName = "decimal(10,2)")]
        public decimal MinimumSpend { get; set; } = 0;

        public string ApplicableServiceIds { get; set; } = string.Empty; // JSON array of service IDs

        public bool IsActive { get; set; } = true;
        public bool IsPublic { get; set; } = true; // Show to all clients vs targeted only

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("ServiceProviderId")]
        public virtual User ServiceProvider { get; set; } = null!;

        public virtual ICollection<PromotionUsage> Usages { get; set; } = new List<PromotionUsage>();
    }

    public class PromotionUsage
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PromotionId { get; set; }

        [Required]
        public string ClientId { get; set; } = string.Empty;

        [Required]
        public int BookingId { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal DiscountAmount { get; set; } = 0;

        public DateTime UsedDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("PromotionId")]
        public virtual Promotion Promotion { get; set; } = null!;

        [ForeignKey("ClientId")]
        public virtual User Client { get; set; } = null!;

        [ForeignKey("BookingId")]
        public virtual Booking Booking { get; set; } = null!;
    }
}
