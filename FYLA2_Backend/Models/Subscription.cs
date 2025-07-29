using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
  public enum SubscriptionTier
  {
    Free = 0,
    Basic = 1,
    Premium = 2,
    Enterprise = 3
  }

  public enum SubscriptionStatus
  {
    Active = 0,
    Inactive = 1,
    Cancelled = 2,
    PastDue = 3,
    Trialing = 4
  }

  public class Subscription
  {
    [Key]
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public SubscriptionTier Tier { get; set; } = SubscriptionTier.Free;

    [Required]
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Inactive;

    public string? StripeSubscriptionId { get; set; }
    public string? StripeCustomerId { get; set; }
    public string? StripePriceId { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? TrialEndDate { get; set; }

    public decimal MonthlyPrice { get; set; }
    public decimal? AnnualPrice { get; set; }

    public bool IsTrialing => Status == SubscriptionStatus.Trialing && TrialEndDate > DateTime.UtcNow;
    public bool IsActive => Status == SubscriptionStatus.Active || IsTrialing;

    // Feature limits based on subscription tier
    public int MaxServices { get; set; }
    public int MaxPhotosPerService { get; set; }
    public bool CanUseAdvancedAnalytics { get; set; }
    public bool CanUseCustomBranding { get; set; }
    public bool CanUseAutomatedMarketing { get; set; }
    public bool CanAcceptOnlinePayments { get; set; }
    public bool HasPrioritySupport { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<SubscriptionFeature> Features { get; set; } = new List<SubscriptionFeature>();
    public ICollection<PaymentRecord> PaymentRecords { get; set; } = new List<PaymentRecord>();
  }

  public class SubscriptionFeature
  {
    [Key]
    public int Id { get; set; }

    [Required]
    public int SubscriptionId { get; set; }

    [Required]
    public string FeatureName { get; set; } = string.Empty;

    [Required]
    public bool IsEnabled { get; set; }

    public int? FeatureLimit { get; set; }
    public string? FeatureValue { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Subscription Subscription { get; set; } = null!;
  }

  // Subscription tier configurations
  public static class SubscriptionTierConfig
  {
    public static readonly Dictionary<SubscriptionTier, SubscriptionConfig> Configs = new()
        {
            {
                SubscriptionTier.Free,
                new SubscriptionConfig
                {
                    Name = "Free",
                    Description = "Basic features to get started",
                    MonthlyPrice = 0,
                    MaxServices = 2,
                    MaxPhotosPerService = 3,
                    CanUseAdvancedAnalytics = false,
                    CanUseCustomBranding = false,
                    CanUseAutomatedMarketing = false,
                    CanAcceptOnlinePayments = false,
                    HasPrioritySupport = false,
                    Features = new List<string>
                    {
                        "Basic profile setup",
                        "Up to 2 services",
                        "3 photos per service",
                        "Basic booking management",
                        "Client messaging"
                    }
                }
            },
            {
                SubscriptionTier.Basic,
                new SubscriptionConfig
                {
                    Name = "Basic",
                    Description = "Perfect for growing service providers",
                    MonthlyPrice = 19.99m,
                    AnnualPrice = 199.99m,
                    MaxServices = 10,
                    MaxPhotosPerService = 10,
                    CanUseAdvancedAnalytics = false,
                    CanUseCustomBranding = false,
                    CanUseAutomatedMarketing = false,
                    CanAcceptOnlinePayments = true,
                    HasPrioritySupport = false,
                    Features = new List<string>
                    {
                        "Up to 10 services",
                        "10 photos per service",
                        "Online payment processing",
                        "Basic analytics",
                        "Client reviews & ratings",
                        "Social media integration"
                    }
                }
            },
            {
                SubscriptionTier.Premium,
                new SubscriptionConfig
                {
                    Name = "Premium",
                    Description = "Advanced features for established businesses",
                    MonthlyPrice = 49.99m,
                    AnnualPrice = 499.99m,
                    MaxServices = 50,
                    MaxPhotosPerService = 25,
                    CanUseAdvancedAnalytics = true,
                    CanUseCustomBranding = true,
                    CanUseAutomatedMarketing = true,
                    CanAcceptOnlinePayments = true,
                    HasPrioritySupport = true,
                    Features = new List<string>
                    {
                        "Unlimited services",
                        "25 photos per service",
                        "Advanced analytics & insights",
                        "Custom branding",
                        "Automated marketing tools",
                        "Priority customer support",
                        "Advanced booking features"
                    }
                }
            },
            {
                SubscriptionTier.Enterprise,
                new SubscriptionConfig
                {
                    Name = "Enterprise",
                    Description = "Complete solution for large businesses",
                    MonthlyPrice = 99.99m,
                    AnnualPrice = 999.99m,
                    MaxServices = int.MaxValue,
                    MaxPhotosPerService = int.MaxValue,
                    CanUseAdvancedAnalytics = true,
                    CanUseCustomBranding = true,
                    CanUseAutomatedMarketing = true,
                    CanAcceptOnlinePayments = true,
                    HasPrioritySupport = true,
                    Features = new List<string>
                    {
                        "Unlimited everything",
                        "White-label solution",
                        "API access",
                        "Multi-location support",
                        "Advanced team management",
                        "Custom integrations",
                        "Dedicated account manager"
                    }
                }
            }
        };
  }

  public class SubscriptionConfig
  {
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal MonthlyPrice { get; set; }
    public decimal? AnnualPrice { get; set; }
    public int MaxServices { get; set; }
    public int MaxPhotosPerService { get; set; }
    public bool CanUseAdvancedAnalytics { get; set; }
    public bool CanUseCustomBranding { get; set; }
    public bool CanUseAutomatedMarketing { get; set; }
    public bool CanAcceptOnlinePayments { get; set; }
    public bool HasPrioritySupport { get; set; }
    public List<string> Features { get; set; } = new();
  }
}
