using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
  public class PaymentSettings
  {
    [Key]
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    public int? ProviderId { get; set; }

    public string? StripeAccountId { get; set; }

    public bool IsStripeConnected { get; set; } = false;

    public bool AcceptCreditCards { get; set; } = true;

    public bool AcceptDebitCards { get; set; } = true;

    public bool AcceptDigitalWallets { get; set; } = true;

    public decimal ServiceFeePercentage { get; set; } = 0.029m; // 2.9%

    public decimal FixedFeeAmount { get; set; } = 0.30m; // $0.30

    public decimal DepositPercentage { get; set; } = 0.50m; // 50% deposit

    public decimal TaxRate { get; set; } = 0.08m; // 8% tax

    public string Currency { get; set; } = "USD";

    public bool AutoPayoutEnabled { get; set; } = true;

    public string PayoutSchedule { get; set; } = "daily"; // daily, weekly, monthly

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Models.ServiceProvider? Provider { get; set; }
  }
}