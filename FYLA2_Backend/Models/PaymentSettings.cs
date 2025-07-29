using System.ComponentModel.DataAnnotations;

namespace FYLA2_Backend.Models
{
  public enum PaymentMethod
  {
    Stripe = 0,
    PayPal = 1,
    ApplePay = 2,
    GooglePay = 3,
    Klarna = 4,
    BankTransfer = 5
  }

  public enum PaymentStructure
  {
    FullPaymentUpfront = 0,      // Default: 100% on booking
    DepositThenRemainder = 1,    // Partial upfront, rest after completion
    PaymentAfterService = 2      // Pay after service completion
  }

  public class PaymentSettings
  {
    public int Id { get; set; }

    [Required]
    public string ProviderId { get; set; } = string.Empty;

    [Required]
    public PaymentStructure PaymentStructure { get; set; } = PaymentStructure.FullPaymentUpfront;

    [Range(0, 100)]
    public decimal DepositPercentage { get; set; } = 0; // For DepositThenRemainder structure

    [Range(0, 50)]
    public decimal TaxRate { get; set; } = 0; // Tax percentage (e.g., 8.5 for 8.5%)

    public bool AcceptStripe { get; set; } = true;
    public bool AcceptPayPal { get; set; } = false;
    public bool AcceptApplePay { get; set; } = false;
    public bool AcceptGooglePay { get; set; } = false;
    public bool AcceptKlarna { get; set; } = false;
    public bool AcceptBankTransfer { get; set; } = false;

    public bool AutoRefundEnabled { get; set; } = true;
    public int RefundTimeoutHours { get; set; } = 24; // Hours after which auto-refund is not available

    // Stripe Connect account for receiving payments
    public string? StripeConnectAccountId { get; set; }
    
    // PayPal business account email
    public string? PayPalBusinessEmail { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual User Provider { get; set; } = null!;
  }
}
