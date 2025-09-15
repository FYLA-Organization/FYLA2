using Stripe;
using FYLA2_Backend.Models;

namespace FYLA2_Backend.Services
{
    public interface IStripeSetupService
    {
        Task<string> CreateOrGetProductAsync(string name, string description);
        Task<string> CreateOrGetPriceAsync(string productId, decimal amount, string currency = "usd", string interval = "month");
        Task SetupSubscriptionPlansAsync();
        Task<Dictionary<string, string>> GetOrCreateAllPricesAsync();
    }

    public class StripeSetupService : IStripeSetupService
    {
        private readonly ILogger<StripeSetupService> _logger;
        private readonly IConfiguration _configuration;

        public StripeSetupService(ILogger<StripeSetupService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
            StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"];
        }

        public async Task<string> CreateOrGetProductAsync(string name, string description)
        {
            try
            {
                var productService = new ProductService();
                
                // Check if product already exists
                var existingProducts = await productService.ListAsync(new ProductListOptions
                {
                    Active = true,
                    Limit = 100
                });

                var existingProduct = existingProducts.FirstOrDefault(p => p.Name == name);
                if (existingProduct != null)
                {
                    _logger.LogInformation($"Found existing product: {name} ({existingProduct.Id})");
                    return existingProduct.Id;
                }

                // Create new product
                var productOptions = new ProductCreateOptions
                {
                    Name = name,
                    Description = description,
                    Type = "service"
                };

                var product = await productService.CreateAsync(productOptions);
                _logger.LogInformation($"Created new product: {name} ({product.Id})");
                return product.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating/getting product: {name}");
                throw;
            }
        }

        public async Task<string> CreateOrGetPriceAsync(string productId, decimal amount, string currency = "usd", string interval = "month")
        {
            try
            {
                var priceService = new PriceService();
                
                // Check if price already exists for this product
                var existingPrices = await priceService.ListAsync(new PriceListOptions
                {
                    Product = productId,
                    Active = true,
                    Type = "recurring"
                });

                var existingPrice = existingPrices.FirstOrDefault(p => 
                    p.UnitAmount == (long)(amount * 100) && 
                    p.Recurring?.Interval == interval);

                if (existingPrice != null)
                {
                    _logger.LogInformation($"Found existing price: {amount} {currency} per {interval} ({existingPrice.Id})");
                    return existingPrice.Id;
                }

                // Create new price
                var priceOptions = new PriceCreateOptions
                {
                    Product = productId,
                    UnitAmount = (long)(amount * 100), // Convert to cents
                    Currency = currency,
                    Recurring = new PriceRecurringOptions
                    {
                        Interval = interval
                    }
                };

                var price = await priceService.CreateAsync(priceOptions);
                _logger.LogInformation($"Created new price: {amount} {currency} per {interval} ({price.Id})");
                return price.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating/getting price: {amount} {currency} per {interval}");
                throw;
            }
        }

        public async Task<Dictionary<string, string>> GetOrCreateAllPricesAsync()
        {
            var priceIds = new Dictionary<string, string>();

            try
            {
                // Professional Plan
                var professionalProductId = await CreateOrGetProductAsync(
                    "FYLA2 Professional Plan", 
                    "Perfect for growing service providers with advanced features");

                priceIds["ProfessionalMonthly"] = await CreateOrGetPriceAsync(professionalProductId, 19.99m, "usd", "month");
                priceIds["ProfessionalAnnual"] = await CreateOrGetPriceAsync(professionalProductId, 199.99m, "usd", "year");

                // Business Plan
                var businessProductId = await CreateOrGetProductAsync(
                    "FYLA2 Business Plan", 
                    "Complete solution for established businesses");

                priceIds["BusinessMonthly"] = await CreateOrGetPriceAsync(businessProductId, 49.99m, "usd", "month");
                priceIds["BusinessAnnual"] = await CreateOrGetPriceAsync(businessProductId, 499.99m, "usd", "year");

                _logger.LogInformation("Successfully created/verified all Stripe prices");
                return priceIds;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting up Stripe prices");
                throw;
            }
        }

        public async Task SetupSubscriptionPlansAsync()
        {
            try
            {
                var priceIds = await GetOrCreateAllPricesAsync();
                
                _logger.LogInformation("Stripe subscription plans setup completed:");
                foreach (var priceId in priceIds)
                {
                    _logger.LogInformation($"  {priceId.Key}: {priceId.Value}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to setup subscription plans");
                throw;
            }
        }
    }
}
