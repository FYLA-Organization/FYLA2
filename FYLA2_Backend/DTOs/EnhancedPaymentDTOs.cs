using FYLA2_Backend.Models;

namespace FYLA2_Backend.DTOs
{
  public class PaymentSettingsDto
  {
    public int Id { get; set; }
    public string ProviderId { get; set; } = string.Empty;
    public PaymentStructure PaymentStructure { get; set; }
    public decimal DepositPercentage { get; set; }
    public decimal TaxRate { get; set; }
    public bool AcceptStripe { get; set; }
    public bool AcceptPayPal { get; set; }
    public bool AcceptApplePay { get; set; }
    public bool AcceptGooglePay { get; set; }
    public bool AcceptKlarna { get; set; }
    public bool AcceptBankTransfer { get; set; }
    public bool AutoRefundEnabled { get; set; }
    public int RefundTimeoutHours { get; set; }
    public string? StripeConnectAccountId { get; set; }
    public string? PayPalBusinessEmail { get; set; }
  }

  public class UpdatePaymentSettingsDto
  {
    public PaymentStructure PaymentStructure { get; set; }
    public decimal DepositPercentage { get; set; }
    public decimal TaxRate { get; set; }
    public bool AcceptStripe { get; set; }
    public bool AcceptPayPal { get; set; }
    public bool AcceptApplePay { get; set; }
    public bool AcceptGooglePay { get; set; }
    public bool AcceptKlarna { get; set; }
    public bool AcceptBankTransfer { get; set; }
    public bool AutoRefundEnabled { get; set; }
    public int RefundTimeoutHours { get; set; }
    public string? PayPalBusinessEmail { get; set; }
  }

  public class PaymentCalculationDto
  {
    public decimal ServiceAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal PlatformFeeAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public PaymentStructure PaymentStructure { get; set; }
    public decimal? DepositAmount { get; set; }
    public decimal? RemainingAmount { get; set; }
    public List<PaymentMethod> AvailablePaymentMethods { get; set; } = new();
  }

  public class EnhancedCreatePaymentIntentDto
  {
    public int BookingId { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public TransactionType TransactionType { get; set; } = TransactionType.Payment;
    public string? ReturnUrl { get; set; } // For payment methods that require redirects
  }

  public class PaymentTransactionDto
  {
    public int Id { get; set; }
    public int BookingId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string ProviderId { get; set; } = string.Empty;
    public TransactionType Type { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public decimal Amount { get; set; }
    public decimal ServiceAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal PlatformFeeAmount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public PaymentStatus Status { get; set; }
    public string? ExternalTransactionId { get; set; }
    public string? Description { get; set; }
    public string? FailureReason { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime CreatedAt { get; set; }
  }

  public class RefundRequestDto
  {
    public int TransactionId { get; set; }
    public decimal? RefundAmount { get; set; } // If null, full refund
    public string Reason { get; set; } = string.Empty;
  }

  public class PaymentIntentResponseDto
  {
    public string PaymentIntentId { get; set; } = string.Empty;
    public string? ClientSecret { get; set; } // For Stripe
    public string? RedirectUrl { get; set; } // For PayPal, etc.
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public PaymentMethod PaymentMethod { get; set; }
    public object? AdditionalData { get; set; } // Method-specific data
  }
}
