using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.DTOs.Marketing
{
    public class MarketingCampaignDto
    {
        public int Id { get; set; }
        public string ServiceProviderId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // email, sms, social_media, google_ads, promotion
        public string Status { get; set; } = string.Empty; // draft, active, paused, completed
        public string TargetAudience { get; set; } = string.Empty; // all_clients, new_clients, returning_clients, vip_clients
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal Budget { get; set; }
        public decimal SpentAmount { get; set; }
        public string Content { get; set; } = string.Empty; // JSON content for different campaign types
        public int TotalSent { get; set; }
        public int TotalOpened { get; set; }
        public int TotalClicked { get; set; }
        public int TotalConverted { get; set; }
        public decimal Revenue { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateMarketingCampaignDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Type { get; set; } = string.Empty;

        [Required]
        public string TargetAudience { get; set; } = string.Empty;

        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        [Range(0, 100000)]
        public decimal Budget { get; set; }

        [Required]
        public CampaignContentDto Content { get; set; } = new CampaignContentDto();
    }

    public class UpdateMarketingCampaignDto : CreateMarketingCampaignDto
    {
        public string Status { get; set; } = string.Empty;
    }

    public class CampaignContentDto
    {
        public string Subject { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string CallToAction { get; set; } = string.Empty;
        public string LandingPageUrl { get; set; } = string.Empty;
        public Dictionary<string, object> CustomFields { get; set; } = new Dictionary<string, object>();
    }

    // Missing DTOs for MarketingController
    public class CreateCampaignDto
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal Budget { get; set; }
        public List<string> TargetAudience { get; set; } = new();
        public List<string> Channels { get; set; } = new();
        public Dictionary<string, object> Settings { get; set; } = new();
        public object Content { get; set; } = new();
    }

    public class CampaignSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal Budget { get; set; }
        public decimal SpentAmount { get; set; }
        public int TotalSent { get; set; }
        public int TotalOpened { get; set; }
        public int TotalClicked { get; set; }
        public int TotalConverted { get; set; }
        public decimal Revenue { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CampaignDetailDto : CampaignSummaryDto
    {
        public string TargetAudience { get; set; } = string.Empty;
        public object Content { get; set; } = new();
        public DateTime UpdatedAt { get; set; }
    }

    public class UpdateCampaignDto : CreateCampaignDto
    {
        public string Status { get; set; } = string.Empty;
    }

    public class CreateSegmentDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public object Criteria { get; set; } = new();
    }

    public class SegmentSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int CustomerCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class SegmentCustomerDto
    {
        public string UserId { get; set; } = string.Empty;
        public string ClientId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime LastBooking { get; set; }
        public DateTime AddedDate { get; set; }
        public decimal TotalSpent { get; set; }
        public int BookingCount { get; set; }
    }

    public class CreateAutomationDto
    {
        public string Name { get; set; } = string.Empty;
        public string TriggerType { get; set; } = string.Empty;
        public object TriggerConfig { get; set; } = new();
        public object ActionConfig { get; set; } = new();
        public object Content { get; set; } = new();
    }

    public class AutomationSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string TriggerType { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int TotalTriggered { get; set; }
        public int TimesTriggered { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class LoyaltyProgramSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int PointsPerDollar { get; set; }
        public decimal EarnRate { get; set; }
        public int ActiveMembers { get; set; }
        public int MemberCount { get; set; }
        public decimal TotalPointsIssued { get; set; }
        public decimal TotalPointsRedeemed { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class LoyaltyMemberDto
    {
        public string UserId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string ClientEmail { get; set; } = string.Empty;
        public int CurrentPoints { get; set; }
        public int TotalPointsEarned { get; set; }
        public int TotalEarned { get; set; }
        public int TotalRedeemed { get; set; }
        public string CurrentTier { get; set; } = string.Empty;
        public DateTime JoinedAt { get; set; }
        public DateTime JoinedDate { get; set; }
        public DateTime LastActivityDate { get; set; }
    }

    public class ReferralProgramSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal ReferrerReward { get; set; }
        public decimal RefereeReward { get; set; }
        public int TotalReferrals { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class GenerateReferralCodeDto
    {
        public string CustomCode { get; set; } = string.Empty;
        public string ReferrerId { get; set; } = string.Empty;
        public DateTime? ExpiryDate { get; set; }
        public int? MaxUses { get; set; }
    }

    public class ReferralCodeDto
    {
        public string Code { get; set; } = string.Empty;
        public string ReferralCode { get; set; } = string.Empty;
        public string ReferrerId { get; set; } = string.Empty;
        public string ProgramName { get; set; } = string.Empty;
        public decimal ReferrerReward { get; set; }
        public decimal RefereeReward { get; set; }
        public DateTime ExpiryDate { get; set; }
        public int MaxUses { get; set; }
        public int CurrentUses { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class PromotionSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string DiscountType { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public decimal DiscountValue { get; set; }
        public decimal Value { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int CurrentUses { get; set; }
        public int MaxUses { get; set; }
        public bool IsActive { get; set; }
        public bool IsPublic { get; set; }
    }

    public class PublicPromotionDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string DiscountType { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public decimal DiscountValue { get; set; }
        public decimal Value { get; set; }
        public DateTime EndDate { get; set; }
        public decimal MinimumSpend { get; set; }
        public bool IsPublic { get; set; }
    }

    public class MarketingOverviewDto
    {
        public int ActiveCampaigns { get; set; }
        public int TotalEmailsSent { get; set; }
        public decimal AverageOpenRate { get; set; }
        public decimal AverageClickRate { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalROI { get; set; }
        public int ActivePromotions { get; set; }
        public int LoyaltyMembers { get; set; }
        public int TotalReferrals { get; set; }
        public int NewSubscribers { get; set; }
    }

    // Standard DTOs (kept for completeness)
    public class LoyaltyProgramDto
    {
        public int Id { get; set; }
        public string ServiceProviderId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int PointsPerDollar { get; set; }
        public int WelcomeBonus { get; set; }
        public string TierStructure { get; set; } = string.Empty; // JSON
        public string RewardStructure { get; set; } = string.Empty; // JSON
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateLoyaltyProgramDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Range(1, 10)]
        public int PointsPerDollar { get; set; } = 1;

        public decimal EarnRate { get; set; }

        [Range(0, 1000)]
        public int WelcomeBonus { get; set; } = 50;

        public decimal MinimumEarn { get; set; }
        public decimal MinimumRedeem { get; set; }
        public string RewardType { get; set; } = string.Empty;

        public List<LoyaltyTierDto> Tiers { get; set; } = new List<LoyaltyTierDto>();
        public List<LoyaltyRewardDto> Rewards { get; set; } = new List<LoyaltyRewardDto>();
    }

    public class LoyaltyTierDto
    {
        public string Name { get; set; } = string.Empty;
        public int MinPoints { get; set; }
        public int MaxPoints { get; set; }
        public decimal PointsMultiplier { get; set; } = 1.0m;
        public List<string> Benefits { get; set; } = new List<string>();
    }

    public class LoyaltyRewardDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int PointsCost { get; set; }
        public string RewardType { get; set; } = string.Empty; // discount, free_service, upgrade
        public decimal Value { get; set; }
    }

    public class PromotionDto
    {
        public int Id { get; set; }
        public string ServiceProviderId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string DiscountType { get; set; } = string.Empty; // percentage, fixed_amount
        public decimal DiscountValue { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int MaxUses { get; set; }
        public int CurrentUses { get; set; }
        public decimal MinimumSpend { get; set; }
        public string TargetAudience { get; set; } = string.Empty;
        public List<int> ApplicableServiceIds { get; set; } = new List<int>();
        public bool IsActive { get; set; }
        public bool IsPublic { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreatePromotionDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;

        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [StringLength(20)]
        public string Code { get; set; } = string.Empty;

        [Required]
        public string DiscountType { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        [Range(0, 10000)]
        public decimal DiscountValue { get; set; }

        public decimal Value { get; set; }

        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime EndDate { get; set; } = DateTime.UtcNow.AddMonths(1);

        [Range(1, 10000)]
        public int MaxUses { get; set; } = 100;

        [Range(0, 10000)]
        public decimal MinimumSpend { get; set; } = 0;

        public List<int> ApplicableServiceIds { get; set; } = new List<int>();

        public bool IsPublic { get; set; } = true;
    }

    // Additional DTOs needed by MarketingController
    public class CampaignAnalyticsDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int TotalSent { get; set; }
        public int TotalOpened { get; set; }
        public int TotalClicked { get; set; }
        public int TotalConverted { get; set; }
        public decimal Revenue { get; set; }
        public decimal OpenRate { get; set; }
        public decimal ClickRate { get; set; }
        public decimal ConversionRate { get; set; }
        public decimal ROI { get; set; }
        public decimal CostPerConversion { get; set; }
        public decimal RevenuePerRecipient { get; set; }
    }
}
