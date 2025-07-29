using FYLA2_Backend.Models;
using FYLA2_Backend.DTOs;
using FYLA2_Backend.Data;
using Microsoft.EntityFrameworkCore;
using Stripe;
using PaymentMethodEnum = FYLA2_Backend.Models.PaymentMethod;

namespace FYLA2_Backend.Services
{
  public interface IEnhancedPaymentService
  {
    Task<PaymentIntentResponseDto> CreatePaymentIntentAsync(EnhancedCreatePaymentIntentDto dto, string userId);
    Task<PaymentTransactionDto> ProcessPaymentAsync(string paymentIntentId, PaymentMethodEnum paymentMethod);
    Task<PaymentTransactionDto> ProcessRefundAsync(RefundRequestDto dto, string requestedBy);
    Task<List<PaymentTransactionDto>> GetBookingTransactionsAsync(int bookingId);
    Task<bool> CanRefundAsync(int transactionId);
  }

  public class EnhancedPaymentService : IEnhancedPaymentService
  {
    private readonly ApplicationDbContext _context;
    private readonly IPaymentCalculationService _calculationService;
    private readonly PaymentIntentService _stripePaymentIntentService;
    private readonly RefundService _stripeRefundService;

    public EnhancedPaymentService(
      ApplicationDbContext context,
      IPaymentCalculationService calculationService)
    {
      _context = context;
      _calculationService = calculationService;
      _stripePaymentIntentService = new PaymentIntentService();
      _stripeRefundService = new RefundService();
    }

    public async Task<PaymentIntentResponseDto> CreatePaymentIntentAsync(EnhancedCreatePaymentIntentDto dto, string userId)
    {
      var booking = await _context.Bookings
        .Include(b => b.Service)
        .FirstOrDefaultAsync(b => b.Id == dto.BookingId && b.ClientId == userId);

      if (booking == null)
        throw new ArgumentException("Booking not found or access denied");

      var calculation = await _calculationService.CalculatePaymentAsync(booking.ServiceId, booking.ProviderId);
      
      var amount = dto.TransactionType == TransactionType.Deposit 
        ? calculation.DepositAmount ?? calculation.TotalAmount
        : calculation.TotalAmount;

      return dto.PaymentMethod switch
      {
        PaymentMethodEnum.Stripe => await CreateStripePaymentIntentAsync(dto, userId, amount, calculation),
        PaymentMethodEnum.PayPal => await CreatePayPalPaymentIntentAsync(dto, userId, amount, calculation),
        PaymentMethodEnum.ApplePay => await CreateApplePayPaymentIntentAsync(dto, userId, amount, calculation),
        PaymentMethodEnum.GooglePay => await CreateGooglePayPaymentIntentAsync(dto, userId, amount, calculation),
        PaymentMethodEnum.Klarna => await CreateKlarnaPaymentIntentAsync(dto, userId, amount, calculation),
        _ => throw new NotSupportedException($"Payment method {dto.PaymentMethod} not supported")
      };
    }

    public async Task<PaymentTransactionDto> ProcessPaymentAsync(string paymentIntentId, PaymentMethodEnum paymentMethod)
    {
      return paymentMethod switch
      {
        PaymentMethodEnum.Stripe => await ProcessStripePaymentAsync(paymentIntentId),
        PaymentMethodEnum.PayPal => await ProcessPayPalPaymentAsync(paymentIntentId),
        PaymentMethodEnum.ApplePay => await ProcessApplePayPaymentAsync(paymentIntentId),
        PaymentMethodEnum.GooglePay => await ProcessGooglePayPaymentAsync(paymentIntentId),
        PaymentMethodEnum.Klarna => await ProcessKlarnaPaymentAsync(paymentIntentId),
        _ => throw new NotSupportedException($"Payment method {paymentMethod} not supported")
      };
    }

    public async Task<PaymentTransactionDto> ProcessRefundAsync(RefundRequestDto dto, string requestedBy)
    {
      var transaction = await _context.PaymentTransactions
        .Include(pt => pt.Booking)
        .FirstOrDefaultAsync(pt => pt.Id == dto.TransactionId);

      if (transaction == null)
        throw new ArgumentException("Transaction not found");

      if (!await CanRefundAsync(dto.TransactionId))
        throw new InvalidOperationException("Transaction cannot be refunded");

      var refundAmount = dto.RefundAmount ?? transaction.Amount;

      var refundTransaction = new PaymentTransaction
      {
        BookingId = transaction.BookingId,
        UserId = transaction.UserId,
        ProviderId = transaction.ProviderId,
        Type = refundAmount == transaction.Amount ? TransactionType.Refund : TransactionType.PartialRefund,
        PaymentMethod = transaction.PaymentMethod,
        Amount = -refundAmount,
        ServiceAmount = -(transaction.ServiceAmount * (refundAmount / transaction.Amount)),
        TaxAmount = -(transaction.TaxAmount * (refundAmount / transaction.Amount)),
        PlatformFeeAmount = -(transaction.PlatformFeeAmount * (refundAmount / transaction.Amount)),
        Currency = transaction.Currency,
        Status = PaymentStatus.Processing,
        OriginalTransactionId = transaction.Id,
        Description = $"Refund for transaction {transaction.Id}: {dto.Reason}"
      };

      _context.PaymentTransactions.Add(refundTransaction);

      try
      {
        var success = await ProcessExternalRefundAsync(transaction, refundAmount);

        if (success)
        {
          refundTransaction.Status = PaymentStatus.Succeeded;
          refundTransaction.ProcessedAt = DateTime.UtcNow;
          
          transaction.RefundedAt = DateTime.UtcNow;
          transaction.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
          refundTransaction.Status = PaymentStatus.Failed;
          refundTransaction.FailureReason = "External refund processing failed";
        }

        await _context.SaveChangesAsync();

        return new PaymentTransactionDto
        {
          Id = refundTransaction.Id,
          BookingId = refundTransaction.BookingId,
          UserId = refundTransaction.UserId,
          ProviderId = refundTransaction.ProviderId,
          Type = refundTransaction.Type,
          PaymentMethod = refundTransaction.PaymentMethod,
          Amount = refundTransaction.Amount,
          ServiceAmount = refundTransaction.ServiceAmount,
          TaxAmount = refundTransaction.TaxAmount,
          PlatformFeeAmount = refundTransaction.PlatformFeeAmount,
          Currency = refundTransaction.Currency,
          Status = refundTransaction.Status,
          ExternalTransactionId = refundTransaction.ExternalTransactionId,
          Description = refundTransaction.Description,
          FailureReason = refundTransaction.FailureReason,
          ProcessedAt = refundTransaction.ProcessedAt,
          CreatedAt = refundTransaction.CreatedAt
        };
      }
      catch (Exception ex)
      {
        refundTransaction.Status = PaymentStatus.Failed;
        refundTransaction.FailureReason = ex.Message;
        await _context.SaveChangesAsync();
        throw;
      }
    }

    public async Task<List<PaymentTransactionDto>> GetBookingTransactionsAsync(int bookingId)
    {
      var transactions = await _context.PaymentTransactions
        .Where(pt => pt.BookingId == bookingId)
        .OrderBy(pt => pt.CreatedAt)
        .ToListAsync();

      return transactions.Select(pt => new PaymentTransactionDto
      {
        Id = pt.Id,
        BookingId = pt.BookingId,
        UserId = pt.UserId,
        ProviderId = pt.ProviderId,
        Type = pt.Type,
        PaymentMethod = pt.PaymentMethod,
        Amount = pt.Amount,
        ServiceAmount = pt.ServiceAmount,
        TaxAmount = pt.TaxAmount,
        PlatformFeeAmount = pt.PlatformFeeAmount,
        Currency = pt.Currency,
        Status = pt.Status,
        ExternalTransactionId = pt.ExternalTransactionId,
        Description = pt.Description,
        FailureReason = pt.FailureReason,
        ProcessedAt = pt.ProcessedAt,
        CreatedAt = pt.CreatedAt
      }).ToList();
    }

    public async Task<bool> CanRefundAsync(int transactionId)
    {
      var transaction = await _context.PaymentTransactions
        .Include(pt => pt.Booking)
        .ThenInclude(b => b.Provider)
        .FirstOrDefaultAsync(pt => pt.Id == transactionId);

      if (transaction == null || transaction.Status != PaymentStatus.Succeeded)
        return false;

      var hasRefund = await _context.PaymentTransactions
        .AnyAsync(pt => pt.OriginalTransactionId == transactionId && 
                       (pt.Type == TransactionType.Refund || pt.Type == TransactionType.PartialRefund) &&
                       pt.Status == PaymentStatus.Succeeded);

      if (hasRefund) return false;

      var paymentSettings = await _calculationService.GetPaymentSettingsAsync(transaction.ProviderId);
      if (paymentSettings?.AutoRefundEnabled == true)
      {
        var hoursSinceBooking = (DateTime.UtcNow - transaction.Booking.CreatedAt).TotalHours;
        return hoursSinceBooking <= paymentSettings.RefundTimeoutHours;
      }

      return true;
    }

    private async Task<PaymentIntentResponseDto> CreateStripePaymentIntentAsync(
      EnhancedCreatePaymentIntentDto dto, string userId, decimal amount, PaymentCalculationDto calculation)
    {
      var options = new PaymentIntentCreateOptions
      {
        Amount = (long)(amount * 100),
        Currency = "usd",
        Metadata = new Dictionary<string, string>
        {
          { "booking_id", dto.BookingId.ToString() },
          { "user_id", userId },
          { "transaction_type", dto.TransactionType.ToString() }
        }
      };

      var paymentIntent = await _stripePaymentIntentService.CreateAsync(options);

      return new PaymentIntentResponseDto
      {
        PaymentIntentId = paymentIntent.Id,
        ClientSecret = paymentIntent.ClientSecret,
        Amount = amount,
        Currency = "USD",
        PaymentMethod = PaymentMethodEnum.Stripe
      };
    }

    private async Task<PaymentTransactionDto> ProcessStripePaymentAsync(string paymentIntentId)
    {
      var paymentIntent = await _stripePaymentIntentService.GetAsync(paymentIntentId);
      
      if (paymentIntent.Status != "succeeded")
        throw new InvalidOperationException("Payment not succeeded");

      var bookingId = int.Parse(paymentIntent.Metadata["booking_id"]);
      var userId = paymentIntent.Metadata["user_id"];
      var transactionType = Enum.Parse<TransactionType>(paymentIntent.Metadata["transaction_type"]);

      var booking = await _context.Bookings.FindAsync(bookingId);
      if (booking == null)
        throw new ArgumentException("Booking not found");

      var calculation = await _calculationService.CalculatePaymentAsync(booking.ServiceId, booking.ProviderId);
      var amount = paymentIntent.Amount / 100m;

      var transaction = new PaymentTransaction
      {
        BookingId = bookingId,
        UserId = userId,
        ProviderId = booking.ProviderId,
        Type = transactionType,
        PaymentMethod = PaymentMethodEnum.Stripe,
        Amount = amount,
        ServiceAmount = calculation.ServiceAmount,
        TaxAmount = calculation.TaxAmount,
        PlatformFeeAmount = calculation.PlatformFeeAmount,
        Currency = "USD",
        Status = PaymentStatus.Succeeded,
        StripePaymentIntentId = paymentIntentId,
        ProcessedAt = DateTime.UtcNow,
        Description = $"Stripe payment for booking {bookingId}"
      };

      _context.PaymentTransactions.Add(transaction);
      await _context.SaveChangesAsync();

      return new PaymentTransactionDto
      {
        Id = transaction.Id,
        BookingId = transaction.BookingId,
        UserId = transaction.UserId,
        ProviderId = transaction.ProviderId,
        Type = transaction.Type,
        PaymentMethod = transaction.PaymentMethod,
        Amount = transaction.Amount,
        ServiceAmount = transaction.ServiceAmount,
        TaxAmount = transaction.TaxAmount,
        PlatformFeeAmount = transaction.PlatformFeeAmount,
        Currency = transaction.Currency,
        Status = transaction.Status,
        ExternalTransactionId = paymentIntentId,
        Description = transaction.Description,
        ProcessedAt = transaction.ProcessedAt,
        CreatedAt = transaction.CreatedAt
      };
    }

    // Placeholder methods for other payment processors
    private async Task<PaymentIntentResponseDto> CreatePayPalPaymentIntentAsync(
      EnhancedCreatePaymentIntentDto dto, string userId, decimal amount, PaymentCalculationDto calculation)
    {
      await Task.Delay(1);
      throw new NotImplementedException("PayPal integration not yet implemented");
    }

    private async Task<PaymentIntentResponseDto> CreateApplePayPaymentIntentAsync(
      EnhancedCreatePaymentIntentDto dto, string userId, decimal amount, PaymentCalculationDto calculation)
    {
      await Task.Delay(1);
      throw new NotImplementedException("Apple Pay integration not yet implemented");
    }

    private async Task<PaymentIntentResponseDto> CreateGooglePayPaymentIntentAsync(
      EnhancedCreatePaymentIntentDto dto, string userId, decimal amount, PaymentCalculationDto calculation)
    {
      await Task.Delay(1);
      throw new NotImplementedException("Google Pay integration not yet implemented");
    }

    private async Task<PaymentIntentResponseDto> CreateKlarnaPaymentIntentAsync(
      EnhancedCreatePaymentIntentDto dto, string userId, decimal amount, PaymentCalculationDto calculation)
    {
      await Task.Delay(1);
      throw new NotImplementedException("Klarna integration not yet implemented");
    }

    private async Task<PaymentTransactionDto> ProcessPayPalPaymentAsync(string paymentIntentId)
    {
      await Task.Delay(1);
      throw new NotImplementedException("PayPal processing not yet implemented");
    }

    private async Task<PaymentTransactionDto> ProcessApplePayPaymentAsync(string paymentIntentId)
    {
      await Task.Delay(1);
      throw new NotImplementedException("Apple Pay processing not yet implemented");
    }

    private async Task<PaymentTransactionDto> ProcessGooglePayPaymentAsync(string paymentIntentId)
    {
      await Task.Delay(1);
      throw new NotImplementedException("Google Pay processing not yet implemented");
    }

    private async Task<PaymentTransactionDto> ProcessKlarnaPaymentAsync(string paymentIntentId)
    {
      await Task.Delay(1);
      throw new NotImplementedException("Klarna processing not yet implemented");
    }

    private async Task<bool> ProcessExternalRefundAsync(PaymentTransaction originalTransaction, decimal refundAmount)
    {
      return originalTransaction.PaymentMethod switch
      {
        PaymentMethodEnum.Stripe => await ProcessStripeRefundAsync(originalTransaction, refundAmount),
        PaymentMethodEnum.PayPal => await ProcessPayPalRefundAsync(originalTransaction, refundAmount),
        PaymentMethodEnum.ApplePay => await ProcessApplePayRefundAsync(originalTransaction, refundAmount),
        PaymentMethodEnum.GooglePay => await ProcessGooglePayRefundAsync(originalTransaction, refundAmount),
        PaymentMethodEnum.Klarna => await ProcessKlarnaRefundAsync(originalTransaction, refundAmount),
        _ => false
      };
    }

    private async Task<bool> ProcessStripeRefundAsync(PaymentTransaction originalTransaction, decimal refundAmount)
    {
      try
      {
        var options = new RefundCreateOptions
        {
          PaymentIntent = originalTransaction.StripePaymentIntentId,
          Amount = (long)(refundAmount * 100)
        };

        var refund = await _stripeRefundService.CreateAsync(options);
        return refund.Status == "succeeded";
      }
      catch
      {
        return false;
      }
    }

    private async Task<bool> ProcessPayPalRefundAsync(PaymentTransaction originalTransaction, decimal refundAmount)
    {
      await Task.Delay(1);
      throw new NotImplementedException("PayPal refund not yet implemented");
    }

    private async Task<bool> ProcessApplePayRefundAsync(PaymentTransaction originalTransaction, decimal refundAmount)
    {
      await Task.Delay(1);
      throw new NotImplementedException("Apple Pay refund not yet implemented");
    }

    private async Task<bool> ProcessGooglePayRefundAsync(PaymentTransaction originalTransaction, decimal refundAmount)
    {
      await Task.Delay(1);
      throw new NotImplementedException("Google Pay refund not yet implemented");
    }

    private async Task<bool> ProcessKlarnaRefundAsync(PaymentTransaction originalTransaction, decimal refundAmount)
    {
      await Task.Delay(1);
      throw new NotImplementedException("Klarna refund not yet implemented");
    }
  }
}
