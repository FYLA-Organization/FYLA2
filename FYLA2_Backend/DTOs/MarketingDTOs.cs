using System.ComponentModel.DataAnnotations;
using FYLA2_Backend.Models;

namespace FYLA2_Backend.DTOs
{
    // Campaign DTOs
    public class CreateCampaignDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal Budget { get; set; }

        public List<string> TargetAudience { get; set; } = new();

        [Required]
        public string CampaignType { get; set; } = string.Empty; // email, sms, push

        public string? TargetSegment { get; set; }

        public DateTime? ScheduledDate { get; set; }

        public string? EmailSubject { get; set; }

        public string? EmailContent { get; set; }

        public string? SmsContent { get; set; }

        public string? PushTitle { get; set; }

        public string? PushContent { get; set; }

        public object Content { get; set; } = new();
    }

    public class UpdateCampaignDto : CreateCampaignDto
    {
        public string Status { get; set; } = string.Empty;
    }

    public class CampaignSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string CampaignType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal Budget { get; set; }
        public decimal SpentAmount { get; set; }
        public DateTime? ScheduledDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public int RecipientsCount { get; set; }
        public int DeliveredCount { get; set; }
        public int OpenedCount { get; set; }
        public int ClickedCount { get; set; }
        public int TotalSent { get; set; }
        public int TotalOpened { get; set; }
        public int TotalClicked { get; set; }
        public int TotalConverted { get; set; }
        public decimal Revenue { get; set; }
    }

    public class CampaignDetailDto : CampaignSummaryDto
    {
        public string TargetAudience { get; set; } = string.Empty;
        public string? TargetSegment { get; set; }
        public string? EmailSubject { get; set; }
        public string? EmailContent { get; set; }
        public string? SmsContent { get; set; }
        public string? PushTitle { get; set; }
        public string? PushContent { get; set; }
        public object Content { get; set; } = new();
        public DateTime? SentAt { get; set; }
        public decimal ConversionRate { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CampaignAnalyticsDto
    {
        public int CampaignId { get; set; }
        public string CampaignName { get; set; } = string.Empty;
        public int TotalRecipients { get; set; }
        public int DeliveredCount { get; set; }
        public int OpenedCount { get; set; }
        public int ClickedCount { get; set; }
        public int ConvertedCount { get; set; }
        public int TotalSent { get; set; }
        public int TotalOpened { get; set; }
        public int TotalClicked { get; set; }
        public int TotalConverted { get; set; }
        public decimal OpenRate { get; set; }
        public decimal ClickRate { get; set; }
        public decimal ConversionRate { get; set; }
        public decimal Revenue { get; set; }
        public decimal ROI { get; set; }
        public decimal CostPerConversion { get; set; }
        public decimal RevenuePerRecipient { get; set; }
    }

    // Segment DTOs
    public class CreateSegmentDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string Criteria { get; set; } = string.Empty; // JSON criteria

        public bool IsActive { get; set; } = true;
    }

    public class SegmentSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int CustomerCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class SegmentCustomerDto
    {
        public string CustomerId { get; set; } = string.Empty;
        public string ClientId { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public DateTime JoinedSegmentAt { get; set; }
        public DateTime AddedDate { get; set; }
        public decimal LifetimeValue { get; set; }
        public int TotalBookings { get; set; }
    }

    // Automation DTOs
    public class CreateAutomationDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string TriggerType { get; set; } = string.Empty; // booking_completed, signup, birthday

        [Required]
        public string ActionType { get; set; } = string.Empty; // send_email, send_sms, award_points

        public string? TriggerConditions { get; set; } // JSON conditions

        public string? ActionData { get; set; } // JSON action data

        public object Content { get; set; } = new();

        public int DelayMinutes { get; set; } = 0;

        public bool IsActive { get; set; } = true;
    }

    public class AutomationSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string TriggerType { get; set; } = string.Empty;
        public string ActionType { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int ExecutionCount { get; set; }
        public int TimesTriggered { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastExecutedAt { get; set; }
    }

    // Loyalty Program DTOs
    public class CreateLoyaltyProgramDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public int PointsPerDollar { get; set; } = 1;

        public decimal EarnRate { get; set; } = 1.0m;

        [Required]
        public int MinimumRedemption { get; set; } = 100;

        public decimal MinimumEarn { get; set; } = 0m;
        public decimal MinimumRedeem { get; set; } = 0m;
        public string RewardType { get; set; } = string.Empty;

        public decimal RedemptionValue { get; set; } = 0.01m;

        public bool IsActive { get; set; } = true;
    }

    public class LoyaltyProgramSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int PointsPerDollar { get; set; }
        public decimal EarnRate { get; set; }
        public int MinimumRedemption { get; set; }
        public decimal RedemptionValue { get; set; }
        public bool IsActive { get; set; }
        public int MembersCount { get; set; }
        public int MemberCount { get; set; }
        public int TotalPointsIssued { get; set; }
        public int TotalPointsRedeemed { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class LoyaltyMemberDto
    {
        public int Id { get; set; }
        public string ClientId { get; set; } = string.Empty;
        public string ClientEmail { get; set; } = string.Empty;
        public string ClientName { get; set; } = string.Empty;
        public int CurrentPoints { get; set; }
        public int TotalPointsEarned { get; set; }
        public int TotalEarned { get; set; }
        public int TotalPointsRedeemed { get; set; }
        public int TotalRedeemed { get; set; }
        public bool IsActive { get; set; }
        public DateTime JoinedAt { get; set; }
        public DateTime JoinedDate { get; set; }
        public DateTime? LastActivity { get; set; }
        public DateTime LastActivityDate { get; set; }
    }

    // Referral Program DTOs
    public class CreateReferralProgramDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string ReferrerRewardType { get; set; } = "discount";

        [Required]
        public decimal ReferrerRewardValue { get; set; } = 0;

        [Required]
        public string RefereeRewardType { get; set; } = "discount";

        [Required]
        public decimal RefereeRewardValue { get; set; } = 0;

        public int MaxReferrals { get; set; } = 0;

        public int ValidityDays { get; set; } = 365;

        public bool IsActive { get; set; } = true;
    }

    public class ReferralProgramSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ReferrerRewardType { get; set; } = string.Empty;
        public decimal ReferrerRewardValue { get; set; }
        public string RefereeRewardType { get; set; } = string.Empty;
        public decimal RefereeRewardValue { get; set; }
        public int MaxReferrals { get; set; }
        public int ValidityDays { get; set; }
        public bool IsActive { get; set; }
        public int TotalReferrals { get; set; }
        public decimal TotalRewardsPaid { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class GenerateReferralCodeDto
    {
        public int ReferralProgramId { get; set; }
        public string ReferrerId { get; set; } = string.Empty;
        public string? CustomCode { get; set; } // Optional custom code
    }

    public class ReferralCodeDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string ReferralCode { get; set; } = string.Empty;
        public int ReferralProgramId { get; set; }
        public string ReferrerUserId { get; set; } = string.Empty;
        public string ReferrerId { get; set; } = string.Empty;
        public string ProgramName { get; set; } = string.Empty;
        public decimal ReferrerReward { get; set; }
        public decimal RefereeReward { get; set; }
        public int UsageCount { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }

    // Promotion DTOs
    public class CreatePromotionDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;

        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string PromoCode { get; set; } = string.Empty;

        [Required]
        public string DiscountType { get; set; } = "percentage"; // percentage, fixed_amount

        public string Type { get; set; } = string.Empty;

        [Required]
        public decimal DiscountValue { get; set; }

        public decimal Value { get; set; }

        public decimal? MinimumOrderAmount { get; set; }

        public decimal MinimumSpend { get; set; }

        public int? MaxRedemptions { get; set; }

        public int MaxUses { get; set; }

        public List<int> ApplicableServiceIds { get; set; } = new();

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public bool IsActive { get; set; } = true;

        public bool IsPublic { get; set; } = true;

        public string? TargetSegment { get; set; }
    }

    public class PromotionSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string PromoCode { get; set; } = string.Empty;
        public string DiscountType { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public decimal DiscountValue { get; set; }
        public decimal Value { get; set; }
        public decimal? MinimumOrderAmount { get; set; }
        public int? MaxRedemptions { get; set; }
        public int MaxUses { get; set; }
        public int CurrentRedemptions { get; set; }
        public int CurrentUses { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }
        public bool IsPublic { get; set; }
        public string? TargetSegment { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class PublicPromotionDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string PromoCode { get; set; } = string.Empty;
        public string DiscountType { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public decimal DiscountValue { get; set; }
        public decimal Value { get; set; }
        public decimal? MinimumOrderAmount { get; set; }
        public decimal MinimumSpend { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }
        public bool IsPublic { get; set; }
    }

    // Overview DTOs
    public class MarketingOverviewDto
    {
        public int TotalCampaigns { get; set; }
        public int ActiveCampaigns { get; set; }
        public int TotalEmailsSent { get; set; }
        public decimal AverageOpenRate { get; set; }
        public decimal AverageClickRate { get; set; }
        public int TotalCustomers { get; set; }
        public int LoyaltyMembers { get; set; }
        public int ActivePromotions { get; set; }
        public int TotalReferrals { get; set; }
        public int NewSubscribers { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalROI { get; set; }
        public decimal MarketingROI { get; set; }
        public List<CampaignSummaryDto> RecentCampaigns { get; set; } = new List<CampaignSummaryDto>();
        public List<PromotionSummaryDto> ActivePromotionsList { get; set; } = new List<PromotionSummaryDto>();
    }
}
