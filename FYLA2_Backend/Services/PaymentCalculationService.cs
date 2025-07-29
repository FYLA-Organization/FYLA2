using FYLA2_Backend.Models;
using FYLA2_Backend.DTOs;
using FYLA2_Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace FYLA2_Backend.Services
{
  public interface IPaymentCalculationService
  {
    Task<PaymentCalculationDto> CalculatePaymentAsync(int serviceId, string providerId);
    Task<List<PaymentMethod>> GetAvailablePaymentMethodsAsync(string providerId);
    Task<PaymentSettingsDto?> GetPaymentSettingsAsync(string providerId);
    Task<PaymentSettingsDto> UpdatePaymentSettingsAsync(string providerId, UpdatePaymentSettingsDto dto);
  }

  public class PaymentCalculationService : IPaymentCalculationService
  {
    private readonly ApplicationDbContext _context;
    private const decimal PLATFORM_FEE_PERCENTAGE = 2.9m; // 2.9% platform fee

    public PaymentCalculationService(ApplicationDbContext context)
    {
      _context = context;
    }

    public async Task<PaymentCalculationDto> CalculatePaymentAsync(int serviceId, string providerId)
    {
      var service = await _context.Services.FindAsync(serviceId);
      if (service == null)
        throw new ArgumentException("Service not found");

      var paymentSettings = await GetOrCreateDefaultPaymentSettings(providerId);

      var serviceAmount = service.Price;
      var taxAmount = serviceAmount * (paymentSettings.TaxRate / 100);
      var platformFeeAmount = serviceAmount * (PLATFORM_FEE_PERCENTAGE / 100);
      var totalAmount = serviceAmount + taxAmount + platformFeeAmount;

      var result = new PaymentCalculationDto
      {
        ServiceAmount = serviceAmount,
        TaxAmount = taxAmount,
        PlatformFeeAmount = platformFeeAmount,
        TotalAmount = totalAmount,
        PaymentStructure = paymentSettings.PaymentStructure,
        AvailablePaymentMethods = await GetAvailablePaymentMethodsAsync(providerId)
      };

      // Calculate deposit and remaining amounts for two-step payments
      if (paymentSettings.PaymentStructure == PaymentStructure.DepositThenRemainder && paymentSettings.DepositPercentage > 0)
      {
        result.DepositAmount = totalAmount * (paymentSettings.DepositPercentage / 100);
        result.RemainingAmount = totalAmount - result.DepositAmount;
      }

      return result;
    }

    public async Task<List<PaymentMethod>> GetAvailablePaymentMethodsAsync(string providerId)
    {
      var settings = await GetOrCreateDefaultPaymentSettings(providerId);
      var methods = new List<PaymentMethod>();

      if (settings.AcceptStripe) methods.Add(PaymentMethod.Stripe);
      if (settings.AcceptPayPal) methods.Add(PaymentMethod.PayPal);
      if (settings.AcceptApplePay) methods.Add(PaymentMethod.ApplePay);
      if (settings.AcceptGooglePay) methods.Add(PaymentMethod.GooglePay);
      if (settings.AcceptKlarna) methods.Add(PaymentMethod.Klarna);
      if (settings.AcceptBankTransfer) methods.Add(PaymentMethod.BankTransfer);

      return methods;
    }

    public async Task<PaymentSettingsDto?> GetPaymentSettingsAsync(string providerId)
    {
      var settings = await _context.PaymentSettings
        .FirstOrDefaultAsync(ps => ps.ProviderId == providerId);

      if (settings == null) return null;

      return new PaymentSettingsDto
      {
        Id = settings.Id,
        ProviderId = settings.ProviderId,
        PaymentStructure = settings.PaymentStructure,
        DepositPercentage = settings.DepositPercentage,
        TaxRate = settings.TaxRate,
        AcceptStripe = settings.AcceptStripe,
        AcceptPayPal = settings.AcceptPayPal,
        AcceptApplePay = settings.AcceptApplePay,
        AcceptGooglePay = settings.AcceptGooglePay,
        AcceptKlarna = settings.AcceptKlarna,
        AcceptBankTransfer = settings.AcceptBankTransfer,
        AutoRefundEnabled = settings.AutoRefundEnabled,
        RefundTimeoutHours = settings.RefundTimeoutHours,
        StripeConnectAccountId = settings.StripeConnectAccountId,
        PayPalBusinessEmail = settings.PayPalBusinessEmail
      };
    }

    public async Task<PaymentSettingsDto> UpdatePaymentSettingsAsync(string providerId, UpdatePaymentSettingsDto dto)
    {
      var settings = await GetOrCreateDefaultPaymentSettings(providerId);

      settings.PaymentStructure = dto.PaymentStructure;
      settings.DepositPercentage = dto.DepositPercentage;
      settings.TaxRate = dto.TaxRate;
      settings.AcceptStripe = dto.AcceptStripe;
      settings.AcceptPayPal = dto.AcceptPayPal;
      settings.AcceptApplePay = dto.AcceptApplePay;
      settings.AcceptGooglePay = dto.AcceptGooglePay;
      settings.AcceptKlarna = dto.AcceptKlarna;
      settings.AcceptBankTransfer = dto.AcceptBankTransfer;
      settings.AutoRefundEnabled = dto.AutoRefundEnabled;
      settings.RefundTimeoutHours = dto.RefundTimeoutHours;
      settings.PayPalBusinessEmail = dto.PayPalBusinessEmail;
      settings.UpdatedAt = DateTime.UtcNow;

      await _context.SaveChangesAsync();

      return new PaymentSettingsDto
      {
        Id = settings.Id,
        ProviderId = settings.ProviderId,
        PaymentStructure = settings.PaymentStructure,
        DepositPercentage = settings.DepositPercentage,
        TaxRate = settings.TaxRate,
        AcceptStripe = settings.AcceptStripe,
        AcceptPayPal = settings.AcceptPayPal,
        AcceptApplePay = settings.AcceptApplePay,
        AcceptGooglePay = settings.AcceptGooglePay,
        AcceptKlarna = settings.AcceptKlarna,
        AcceptBankTransfer = settings.AcceptBankTransfer,
        AutoRefundEnabled = settings.AutoRefundEnabled,
        RefundTimeoutHours = settings.RefundTimeoutHours,
        StripeConnectAccountId = settings.StripeConnectAccountId,
        PayPalBusinessEmail = settings.PayPalBusinessEmail
      };
    }

    private async Task<PaymentSettings> GetOrCreateDefaultPaymentSettings(string providerId)
    {
      var settings = await _context.PaymentSettings
        .FirstOrDefaultAsync(ps => ps.ProviderId == providerId);

      if (settings == null)
      {
        settings = new PaymentSettings
        {
          ProviderId = providerId,
          PaymentStructure = PaymentStructure.FullPaymentUpfront,
          DepositPercentage = 0,
          TaxRate = 0,
          AcceptStripe = true,
          AcceptPayPal = false,
          AcceptApplePay = false,
          AcceptGooglePay = false,
          AcceptKlarna = false,
          AcceptBankTransfer = false,
          AutoRefundEnabled = true,
          RefundTimeoutHours = 24
        };

        _context.PaymentSettings.Add(settings);
        await _context.SaveChangesAsync();
      }

      return settings;
    }
  }
}
