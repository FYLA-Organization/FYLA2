using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using FYLA2_Backend.Services;

namespace FYLA2_Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StripeSetupController : ControllerBase
    {
        private readonly IStripeSetupService _stripeSetupService;
        private readonly ILogger<StripeSetupController> _logger;
        private readonly IConfiguration _configuration;

        public StripeSetupController(
            IStripeSetupService stripeSetupService,
            ILogger<StripeSetupController> logger,
            IConfiguration configuration)
        {
            _stripeSetupService = stripeSetupService;
            _logger = logger;
            _configuration = configuration;
        }

        [HttpPost("setup-plans")]
        [AllowAnonymous] // Remove this in production - this should be admin only
        public async Task<IActionResult> SetupSubscriptionPlans()
        {
            try
            {
                // Only allow this in development
                if (!_configuration.GetValue<bool>("IsDevelopment"))
                {
                    return BadRequest("This endpoint is only available in development mode");
                }

                await _stripeSetupService.SetupSubscriptionPlansAsync();
                var priceIds = await _stripeSetupService.GetOrCreateAllPricesAsync();

                return Ok(new
                {
                    message = "Stripe subscription plans setup completed successfully",
                    priceIds = priceIds
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting up Stripe subscription plans");
                return StatusCode(500, new { error = "Failed to setup subscription plans", details = ex.Message });
            }
        }

        [HttpGet("price-ids")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPriceIds()
        {
            try
            {
                var priceIds = await _stripeSetupService.GetOrCreateAllPricesAsync();
                return Ok(priceIds);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting price IDs");
                return StatusCode(500, new { error = "Failed to get price IDs", details = ex.Message });
            }
        }

        [HttpGet("config")]
        [AllowAnonymous]
        public IActionResult GetStripeConfig()
        {
            return Ok(new
            {
                publishableKey = _configuration["Stripe:PublishableKey"],
                isDevelopment = _configuration.GetValue<bool>("IsDevelopment")
            });
        }
    }
}
