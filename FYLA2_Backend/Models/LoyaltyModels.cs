using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FYLA2_Backend.Models
{
    public class LoyaltyProgram
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string ServiceProviderId { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        public int PointsPerDollar { get; set; } = 1;

        public decimal EarnRate { get; set; } = 1.0m;

        [Required]
        public int MinimumRedemption { get; set; } = 100;

        public decimal MinimumEarn { get; set; } = 0m;
        public decimal MinimumRedeem { get; set; } = 0m;
        public string RewardType { get; set; } = string.Empty;

        public decimal RedemptionValue { get; set; } = 0.01m; // $0.01 per point

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual User ServiceProvider { get; set; } = null!;
        public virtual ICollection<LoyaltyMember> Members { get; set; } = new List<LoyaltyMember>();
        public virtual ICollection<LoyaltyTransaction> Transactions { get; set; } = new List<LoyaltyTransaction>();
    }

    public class LoyaltyMember
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string ClientId { get; set; } = string.Empty;

        [Required]
        public int LoyaltyProgramId { get; set; }

        [Required]
        public int CurrentPoints { get; set; } = 0;

        [Required]
        public int TotalPointsEarned { get; set; } = 0;

        [Required]
        public int TotalPointsRedeemed { get; set; } = 0;

        public int TotalEarned { get; set; } = 0;
        public int TotalRedeemed { get; set; } = 0;
        public DateTime JoinedDate { get; set; } = DateTime.UtcNow;
        public DateTime LastActivityDate { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;

        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        public DateTime? LastActivity { get; set; }

        // Navigation properties
        public virtual User Client { get; set; } = null!;
        public virtual LoyaltyProgram LoyaltyProgram { get; set; } = null!;
        public virtual ICollection<LoyaltyTransaction> Transactions { get; set; } = new List<LoyaltyTransaction>();
    }
}
