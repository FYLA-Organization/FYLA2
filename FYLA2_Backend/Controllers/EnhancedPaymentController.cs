using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using FYLA2_Backend.Services;
using FYLA2_Backend.DTOs;
using System.Security.Claims;

namespace FYLA2_Backend.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  [Authorize]
  public class EnhancedPaymentController : ControllerBase
  {
    private readonly IEnhancedPaymentService _paymentService;
    private readonly IPaymentCalculationService _calculationService;

    public EnhancedPaymentController(
      IEnhancedPaymentService paymentService,
      IPaymentCalculationService calculationService)
    {
      _paymentService = paymentService;
      _calculationService = calculationService;
    }

    [HttpGet("calculation/{serviceId}/{providerId}")]
    public async Task<ActionResult<PaymentCalculationDto>> GetPaymentCalculation(int serviceId, string providerId)
    {
      try
      {
        var calculation = await _calculationService.CalculatePaymentAsync(serviceId, providerId);
        return Ok(calculation);
      }
      catch (ArgumentException ex)
      {
        return BadRequest(new { message = ex.Message });
      }
      catch (Exception ex)
      {
        return StatusCode(500, new { message = "Internal server error", details = ex.Message });
      }
    }

    [HttpPost("intent")]
    public async Task<ActionResult<PaymentIntentResponseDto>> CreatePaymentIntent([FromBody] EnhancedCreatePaymentIntentDto dto)
    {
      try
      {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
          return Unauthorized(new { message = "User not authenticated" });

        var result = await _paymentService.CreatePaymentIntentAsync(dto, userId);
        return Ok(result);
      }
      catch (ArgumentException ex)
      {
        return BadRequest(new { message = ex.Message });
      }
      catch (NotSupportedException ex)
      {
        return BadRequest(new { message = ex.Message });
      }
      catch (Exception ex)
      {
        return StatusCode(500, new { message = "Internal server error", details = ex.Message });
      }
    }

    [HttpPost("process/{paymentIntentId}")]
    public async Task<ActionResult<PaymentTransactionDto>> ProcessPayment(
      string paymentIntentId, 
      [FromQuery] string paymentMethod)
    {
      try
      {
        if (!Enum.TryParse<FYLA2_Backend.Models.PaymentMethod>(paymentMethod, true, out var method))
          return BadRequest(new { message = "Invalid payment method" });

        var result = await _paymentService.ProcessPaymentAsync(paymentIntentId, method);
        return Ok(result);
      }
      catch (InvalidOperationException ex)
      {
        return BadRequest(new { message = ex.Message });
      }
      catch (ArgumentException ex)
      {
        return BadRequest(new { message = ex.Message });
      }
      catch (Exception ex)
      {
        return StatusCode(500, new { message = "Internal server error", details = ex.Message });
      }
    }

    [HttpPost("refund")]
    public async Task<ActionResult<PaymentTransactionDto>> ProcessRefund([FromBody] RefundRequestDto dto)
    {
      try
      {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
          return Unauthorized(new { message = "User not authenticated" });

        var result = await _paymentService.ProcessRefundAsync(dto, userId);
        return Ok(result);
      }
      catch (ArgumentException ex)
      {
        return BadRequest(new { message = ex.Message });
      }
      catch (InvalidOperationException ex)
      {
        return BadRequest(new { message = ex.Message });
      }
      catch (Exception ex)
      {
        return StatusCode(500, new { message = "Internal server error", details = ex.Message });
      }
    }

    [HttpGet("booking/{bookingId}/transactions")]
    public async Task<ActionResult<List<PaymentTransactionDto>>> GetBookingTransactions(int bookingId)
    {
      try
      {
        var transactions = await _paymentService.GetBookingTransactionsAsync(bookingId);
        return Ok(transactions);
      }
      catch (Exception ex)
      {
        return StatusCode(500, new { message = "Internal server error", details = ex.Message });
      }
    }

    [HttpGet("transaction/{transactionId}/can-refund")]
    public async Task<ActionResult<bool>> CanRefund(int transactionId)
    {
      try
      {
        var canRefund = await _paymentService.CanRefundAsync(transactionId);
        return Ok(canRefund);
      }
      catch (Exception ex)
      {
        return StatusCode(500, new { message = "Internal server error", details = ex.Message });
      }
    }

    [HttpGet("settings")]
    public async Task<ActionResult<PaymentSettingsDto>> GetPaymentSettings()
    {
      try
      {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
          return Unauthorized(new { message = "User not authenticated" });

        var settings = await _calculationService.GetPaymentSettingsAsync(userId);
        if (settings == null)
          return NotFound(new { message = "Payment settings not found" });

        return Ok(settings);
      }
      catch (Exception ex)
      {
        return StatusCode(500, new { message = "Internal server error", details = ex.Message });
      }
    }

    [HttpPut("settings")]
    public async Task<ActionResult<PaymentSettingsDto>> UpdatePaymentSettings([FromBody] UpdatePaymentSettingsDto dto)
    {
      try
      {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
          return Unauthorized(new { message = "User not authenticated" });

        var settings = await _calculationService.UpdatePaymentSettingsAsync(userId, dto);
        return Ok(settings);
      }
      catch (Exception ex)
      {
        return StatusCode(500, new { message = "Internal server error", details = ex.Message });
      }
    }

    [HttpGet("methods/{providerId}")]
    public async Task<ActionResult<List<FYLA2_Backend.Models.PaymentMethod>>> GetAvailablePaymentMethods(string providerId)
    {
      try
      {
        var methods = await _calculationService.GetAvailablePaymentMethodsAsync(providerId);
        return Ok(methods);
      }
      catch (Exception ex)
      {
        return StatusCode(500, new { message = "Internal server error", details = ex.Message });
      }
    }
  }
}
