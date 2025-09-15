using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Checkout;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;
using FYLA2_Backend.DTOs;
using System.Security.Claims;

namespace FYLA2_Backend.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  [Authorize]
  public class PaymentController : ControllerBase
  {
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PaymentController> _logger;
    private readonly IConfiguration _configuration;

    public PaymentController(
        ApplicationDbContext context,
        ILogger<PaymentController> logger,
        IConfiguration configuration)
    {
      _context = context;
      _logger = logger;
      _configuration = configuration;

      // Configure Stripe
      StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"];
    }

    private string GetUserId()
    {
      return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new UnauthorizedAccessException();
    }

    [HttpPost("create-subscription")]
    public async Task<IActionResult> CreateSubscription([FromBody] CreateSubscriptionDto request)
    {
      try
      {
        var userId = GetUserId();
        var user = await _context.Users.FindAsync(userId);

        if (user == null)
          return NotFound("User not found");

        // Check if user already has an active subscription
        var existingSubscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId && 
                (s.Status == SubscriptionStatus.Active || 
                 (s.Status == SubscriptionStatus.Trialing && s.TrialEndDate > DateTime.UtcNow)));

        if (existingSubscription != null)
          return BadRequest("User already has an active subscription");

        // Get subscription tier configuration
        var tierConfig = SubscriptionTierConfig.Configs[request.Tier];

        // Create Stripe customer if doesn't exist
        var customerService = new CustomerService();
        var customer = await customerService.CreateAsync(new CustomerCreateOptions
        {
          Email = user.Email,
          Name = $"{user.FirstName} {user.LastName}",
          Metadata = new Dictionary<string, string>
                    {
                        { "user_id", userId }
                    }
        });

        // Create checkout session
        var sessionService = new SessionService();
        var options = new SessionCreateOptions
        {
          Customer = customer.Id,
          PaymentMethodTypes = new List<string> { "card" },
          Mode = "subscription",
          LineItems = new List<SessionLineItemOptions>
                    {
                        new SessionLineItemOptions
                        {
                            Price = GetStripePriceId(request.Tier, request.BillingInterval),
                            Quantity = 1,
                        }
                    },
          SuccessUrl = $"{request.SuccessUrl}?session_id={{CHECKOUT_SESSION_ID}}",
          CancelUrl = request.CancelUrl,
          Metadata = new Dictionary<string, string>
                    {
                        { "user_id", userId },
                        { "subscription_tier", request.Tier.ToString() }
                    }
        };

        var session = await sessionService.CreateAsync(options);

        // Create pending subscription record
        var subscription = new FYLA2_Backend.Models.Subscription
        {
          UserId = userId,
          Tier = request.Tier,
          Status = SubscriptionStatus.Inactive,
          StripeCustomerId = customer.Id,
          MonthlyPrice = tierConfig.MonthlyPrice,
          AnnualPrice = tierConfig.AnnualPrice,
          MaxServices = tierConfig.MaxServices,
          MaxPhotosPerService = tierConfig.MaxPhotosPerService,
          CanUseAdvancedAnalytics = tierConfig.CanUseAdvancedAnalytics,
          CanUseCustomBranding = tierConfig.CanUseCustomBranding,
          CanUseAutomatedMarketing = tierConfig.CanUseAutomatedMarketing,
          CanAcceptOnlinePayments = tierConfig.CanAcceptOnlinePayments,
          HasPrioritySupport = tierConfig.HasPrioritySupport
        };

        _context.Subscriptions.Add(subscription);
        await _context.SaveChangesAsync();

        return Ok(new
        {
          sessionId = session.Id,
          sessionUrl = session.Url,
          subscriptionId = subscription.Id
        });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error creating subscription for user {UserId}", GetUserId());
        return StatusCode(500, new { error = "Failed to create subscription", details = ex.Message });
      }
    }

    [HttpPost("create-booking-payment")]
    public async Task<IActionResult> CreateBookingPayment([FromBody] CreateBookingPaymentDto request)
    {
      try
      {
        var userId = GetUserId();
        var booking = await _context.Bookings
            .Include(b => b.Service)
            .Include(b => b.Provider)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId);

        if (booking == null)
          return NotFound("Booking not found");

        if (booking.ClientId != userId && booking.ProviderId != userId)
          return Forbid("Not authorized to process payment for this booking");

        // Create payment intent
        var paymentIntentService = new PaymentIntentService();
        var amount = (long)(booking.TotalPrice * 100); // Convert to cents

        var paymentIntent = await paymentIntentService.CreateAsync(new PaymentIntentCreateOptions
        {
          Amount = amount,
          Currency = "usd",
          Metadata = new Dictionary<string, string>
                    {
                        { "booking_id", request.BookingId.ToString() },
                        { "user_id", userId },
                        { "type", "booking" }
                    }
        });

        // Create payment record
        var paymentRecord = new PaymentRecord
        {
          UserId = userId,
          BookingId = request.BookingId,
          StripePaymentIntentId = paymentIntent.Id,
          Amount = booking.TotalPrice,
          Currency = "USD",
          Status = PaymentStatus.Pending,
          Type = PaymentType.Booking,
          Description = $"Payment for {booking.Service?.Name ?? "Service"}"
        };

        _context.PaymentRecords.Add(paymentRecord);
        await _context.SaveChangesAsync();

        return Ok(new
        {
          clientSecret = paymentIntent.ClientSecret,
          paymentIntentId = paymentIntent.Id,
          paymentRecordId = paymentRecord.Id
        });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error creating booking payment for booking {BookingId}", request.BookingId);
        return StatusCode(500, new { error = "Failed to create payment", details = ex.Message });
      }
    }

    [HttpGet("subscription")]
    public async Task<IActionResult> GetUserSubscription()
    {
      try
      {
        var userId = GetUserId();
        var subscription = await _context.Subscriptions
            .Include(s => s.Features)
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)  // Get the most recent subscription
            .FirstOrDefaultAsync();

        if (subscription == null)
        {
          // Return free tier configuration
          var freeConfig = SubscriptionTierConfig.Configs[SubscriptionTier.Free];
          return Ok(new
          {
            tier = SubscriptionTier.Free,
            status = SubscriptionStatus.Active,
            isActive = true,
            config = freeConfig,
            features = freeConfig.Features
          });
        }

        var config = SubscriptionTierConfig.Configs[subscription.Tier];

        return Ok(new
        {
          id = subscription.Id,
          tier = subscription.Tier,
          status = subscription.Status,
          isActive = subscription.IsActive,
          isTrialing = subscription.IsTrialing,
          startDate = subscription.StartDate,
          endDate = subscription.EndDate,
          trialEndDate = subscription.TrialEndDate,
          monthlyPrice = subscription.MonthlyPrice,
          annualPrice = subscription.AnnualPrice,
          config = config,
          features = config.Features,
          limits = new
          {
            maxServices = subscription.MaxServices,
            maxPhotosPerService = subscription.MaxPhotosPerService,
            canUseAdvancedAnalytics = subscription.CanUseAdvancedAnalytics,
            canUseCustomBranding = subscription.CanUseCustomBranding,
            canUseAutomatedMarketing = subscription.CanUseAutomatedMarketing,
            canAcceptOnlinePayments = subscription.CanAcceptOnlinePayments,
            hasPrioritySupport = subscription.HasPrioritySupport,
            canManageMultipleLocations = subscription.CanManageMultipleLocations,
            maxTeamMembers = subscription.MaxTeamMembers
          }
        });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting subscription for user {UserId}", GetUserId());
        return StatusCode(500, new { error = "Failed to get subscription", details = ex.Message });
      }
    }

    [HttpPost("activate-subscription")]
    public async Task<IActionResult> ActivateSubscription([FromBody] ActivateSubscriptionDto request)
    {
      try
      {
        var userId = GetUserId();
        
        // Find the most recent inactive subscription for this user
        var subscription = await _context.Subscriptions
            .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Inactive)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync();

        if (subscription == null)
        {
          return NotFound("No inactive subscription found for user");
        }

        // Activate the subscription
        subscription.Status = SubscriptionStatus.Active;
        subscription.StartDate = DateTime.UtcNow;
        subscription.UpdatedAt = DateTime.UtcNow;

        // Cancel any other active subscriptions for this user
        var otherActiveSubscriptions = await _context.Subscriptions
            .Where(s => s.UserId == userId && s.Id != subscription.Id && s.Status == SubscriptionStatus.Active)
            .ToListAsync();

        foreach (var oldSub in otherActiveSubscriptions)
        {
          oldSub.Status = SubscriptionStatus.Cancelled;
          oldSub.EndDate = DateTime.UtcNow;
          oldSub.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Manually activated subscription {SubscriptionId} for user {UserId}", subscription.Id, userId);
        
        return Ok(new { success = true, message = "Subscription activated successfully" });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error activating subscription for user {UserId}", GetUserId());
        return StatusCode(500, new { error = "Failed to activate subscription", details = ex.Message });
      }
    }

    [HttpGet("debug-subscription")]
    public async Task<IActionResult> DebugSubscription()
    {
      try
      {
        var userId = GetUserId();
        
        var allSubscriptions = await _context.Subscriptions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new {
              s.Id,
              s.Tier,
              s.Status,
              s.CreatedAt,
              s.StartDate,
              s.EndDate,
              s.StripeSubscriptionId,
              s.StripeCustomerId
            })
            .ToListAsync();

        var user = await _context.Users.FindAsync(userId);
        
        return Ok(new { 
          userId = userId,
          subscriptions = allSubscriptions,
          totalCount = allSubscriptions.Count
        });
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error debugging subscription for user {UserId}", GetUserId());
        return StatusCode(500, new { error = "Failed to debug subscription", details = ex.Message });
      }
    }

    [HttpPost("cancel-subscription")]
    public async Task<IActionResult> CancelSubscription()
    {
        try
        {
            var userId = GetUserId();
            
            var activeSubscription = await _context.Subscriptions
                .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active)
                .FirstOrDefaultAsync();

            if (activeSubscription == null)
            {
                return BadRequest(new { error = "No active subscription found to cancel" });
            }

            // Cancel the subscription
            activeSubscription.Status = SubscriptionStatus.Cancelled;
            activeSubscription.EndDate = DateTime.UtcNow;
            activeSubscription.UpdatedAt = DateTime.UtcNow;

            // If it's a Stripe subscription, cancel it there too
            if (!string.IsNullOrEmpty(activeSubscription.StripeSubscriptionId))
            {
                try
                {
                    var subscriptionService = new SubscriptionService();
                    await subscriptionService.CancelAsync(activeSubscription.StripeSubscriptionId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to cancel Stripe subscription {SubscriptionId}", activeSubscription.StripeSubscriptionId);
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Cancelled subscription {SubscriptionId} for user {UserId}", activeSubscription.Id, userId);

            return Ok(new { 
                message = "Subscription cancelled successfully",
                subscriptionId = activeSubscription.Id,
                cancelledAt = activeSubscription.EndDate
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling subscription");
            return StatusCode(500, new { error = "Failed to cancel subscription" });
        }
    }

    [HttpPost("change-subscription")]
    public async Task<IActionResult> ChangeSubscription([FromBody] ChangeSubscriptionDto request)
    {
        try
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found");

            // Get current active subscription
            var currentSubscription = await _context.Subscriptions
                .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active)
                .FirstOrDefaultAsync();

            // Validate tier
            if (request.NewTier < SubscriptionTier.Free || request.NewTier > SubscriptionTier.Business)
                return BadRequest("Invalid subscription tier");

            // If changing to Free tier (downgrade)
            if (request.NewTier == SubscriptionTier.Free)
            {
                if (currentSubscription != null)
                {
                    currentSubscription.Status = SubscriptionStatus.Cancelled;
                    currentSubscription.EndDate = DateTime.UtcNow;
                    currentSubscription.UpdatedAt = DateTime.UtcNow;

                    // Cancel Stripe subscription if exists
                    if (!string.IsNullOrEmpty(currentSubscription.StripeSubscriptionId))
                    {
                        try
                        {
                            var subscriptionService = new SubscriptionService();
                            await subscriptionService.CancelAsync(currentSubscription.StripeSubscriptionId);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to cancel Stripe subscription {SubscriptionId}", currentSubscription.StripeSubscriptionId);
                        }
                    }

                    await _context.SaveChangesAsync();
                }

                return Ok(new { 
                    message = "Successfully downgraded to Free tier",
                    newTier = 0,
                    tierName = "Free"
                });
            }

            // For paid tiers, create Stripe checkout session
            var tierConfig = GetSubscriptionTierConfig(request.NewTier);
            if (tierConfig == null)
                return BadRequest("Invalid subscription tier configuration");

            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            UnitAmount = (long)(request.BillingInterval == "year" ? tierConfig.AnnualPrice * 100 : tierConfig.MonthlyPrice * 100),
                            Currency = "usd",
                            Recurring = new SessionLineItemPriceDataRecurringOptions
                            {
                                Interval = request.BillingInterval == "year" ? "year" : "month",
                            },
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = $"FYLA2 {tierConfig.Name} Plan",
                                Description = tierConfig.Description,
                            },
                        },
                        Quantity = 1,
                    },
                },
                Mode = "subscription",
                SuccessUrl = request.SuccessUrl,
                CancelUrl = request.CancelUrl,
                CustomerEmail = user.Email,
                Metadata = new Dictionary<string, string>
                {
                    { "user_id", userId },
                    { "tier", request.NewTier.ToString() },
                    { "billing_interval", request.BillingInterval },
                    { "change_type", currentSubscription == null ? "new" : "change" }
                }
            };

            var service = new SessionService();
            var session = await service.CreateAsync(options);

            // Store pending subscription change
            var pendingSubscription = new Models.Subscription
            {
                UserId = userId,
                Tier = request.NewTier,
                Status = SubscriptionStatus.Pending,
                MonthlyPrice = tierConfig.MonthlyPrice,
                AnnualPrice = tierConfig.AnnualPrice,
                StartDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Subscriptions.Add(pendingSubscription);
            await _context.SaveChangesAsync();

            return Ok(new { 
                sessionId = session.Id, 
                sessionUrl = session.Url,
                message = "Subscription change initiated"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing subscription");
            return StatusCode(500, new { error = "Failed to change subscription" });
        }
    }

    [HttpGet("subscription-history")]
    public async Task<IActionResult> GetSubscriptionHistory()
    {
        try
        {
            var userId = GetUserId();
            
            var subscriptions = await _context.Subscriptions
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new {
                    Id = s.Id,
                    Tier = s.Tier,
                    TierName = GetTierName((int)s.Tier),
                    Status = s.Status,
                    MonthlyPrice = s.MonthlyPrice,
                    AnnualPrice = s.AnnualPrice,
                    StartDate = s.StartDate,
                    EndDate = s.EndDate,
                    CreatedAt = s.CreatedAt
                })
                .ToListAsync();

            return Ok(subscriptions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching subscription history");
            return StatusCode(500, new { error = "Failed to fetch subscription history" });
        }
    }

    private string GetTierName(int tier)
    {
        return tier switch
        {
            0 => "Free",
            1 => "Professional", 
            2 => "Business",
            _ => "Unknown"
        };
    }

    [HttpPost("debug-multi-location")]
    public async Task<IActionResult> DebugMultiLocation()
    {
        try
        {
            // Allow unauthenticated access for debugging
            var allSubscriptions = await _context.Subscriptions
                .Where(s => s.Status == SubscriptionStatus.Active)
                .Select(s => new {
                    Id = s.Id,
                    UserId = s.UserId,
                    Tier = s.Tier,
                    CanManageMultipleLocations = s.CanManageMultipleLocations,
                    Status = s.Status
                })
                .ToListAsync();

            return Ok(new { 
                message = "Debug info for multi-location access",
                activeSubscriptions = allSubscriptions,
                totalActive = allSubscriptions.Count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in debug multi-location");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("test-multi-location-access")]
    public async Task<IActionResult> TestMultiLocationAccess()
    {
        try
        {
            var userId = GetUserId();
            
            var subscription = await _context.Subscriptions
                .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active)
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();

            if (subscription == null)
            {
                return Ok(new { 
                    hasAccess = false, 
                    reason = "No active subscription found",
                    userId = userId
                });
            }

            var hasAccess = subscription.CanManageMultipleLocations;
            
            return Ok(new { 
                hasAccess = hasAccess,
                subscriptionId = subscription.Id,
                tier = subscription.Tier,
                canManageMultipleLocations = subscription.CanManageMultipleLocations,
                userId = userId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking multi-location access");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("fix-subscription-permissions")]
    public async Task<IActionResult> FixSubscriptionPermissions()
    {
      try
      {
        var userId = GetUserId();
        
        // Find the current active subscription
        var subscription = await _context.Subscriptions
            .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync();

        if (subscription == null)
        {
          return NotFound("No active subscription found for user");
        }

        // Get the correct configuration for the tier
        if (SubscriptionTierConfig.Configs.TryGetValue(subscription.Tier, out var config))
        {
          // Update subscription with correct permissions from config
          subscription.CanUseAdvancedAnalytics = config.CanUseAdvancedAnalytics;
          subscription.CanUseCustomBranding = config.CanUseCustomBranding;
          subscription.CanUseAutomatedMarketing = config.CanUseAutomatedMarketing;
          subscription.CanAcceptOnlinePayments = config.CanAcceptOnlinePayments;
          subscription.HasPrioritySupport = config.HasPrioritySupport;
          subscription.CanManageMultipleLocations = config.CanManageMultipleLocations;
          subscription.MaxServices = config.MaxServices;
          subscription.MaxPhotosPerService = config.MaxPhotosPerService;
          subscription.MaxTeamMembers = config.MaxTeamMembers;
          subscription.UpdatedAt = DateTime.UtcNow;

          await _context.SaveChangesAsync();
          
          _logger.LogInformation("Fixed subscription permissions for subscription {SubscriptionId} tier {Tier}", subscription.Id, subscription.Tier);
          
          return Ok(new { 
            success = true, 
            message = "Subscription permissions fixed successfully",
            tier = subscription.Tier,
            permissions = new {
              canManageMultipleLocations = subscription.CanManageMultipleLocations,
              canUseCustomBranding = subscription.CanUseCustomBranding,
              canUseAutomatedMarketing = subscription.CanUseAutomatedMarketing,
              canAcceptOnlinePayments = subscription.CanAcceptOnlinePayments,
              hasPrioritySupport = subscription.HasPrioritySupport,
              maxTeamMembers = subscription.MaxTeamMembers
            }
          });
        }
        else
        {
          return BadRequest($"Invalid subscription tier: {subscription.Tier}");
        }
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error fixing subscription permissions for user {UserId}", GetUserId());
        return StatusCode(500, new { error = "Failed to fix subscription permissions", details = ex.Message });
      }
    }

    [HttpGet("subscription-tiers")]
    [AllowAnonymous]
    public IActionResult GetSubscriptionTiers()
    {
      try
      {
        var tiers = SubscriptionTierConfig.Configs.Select(kvp => new
        {
          tier = kvp.Key,
          name = kvp.Value.Name,
          description = kvp.Value.Description,
          monthlyPrice = kvp.Value.MonthlyPrice,
          annualPrice = kvp.Value.AnnualPrice,
          features = kvp.Value.Features,
          limits = new
          {
            maxServices = kvp.Value.MaxServices == int.MaxValue ? "Unlimited" : kvp.Value.MaxServices.ToString(),
            maxPhotosPerService = kvp.Value.MaxPhotosPerService == int.MaxValue ? "Unlimited" : kvp.Value.MaxPhotosPerService.ToString(),
            canUseAdvancedAnalytics = kvp.Value.CanUseAdvancedAnalytics,
            canUseCustomBranding = kvp.Value.CanUseCustomBranding,
            canUseAutomatedMarketing = kvp.Value.CanUseAutomatedMarketing,
            canAcceptOnlinePayments = kvp.Value.CanAcceptOnlinePayments,
            hasPrioritySupport = kvp.Value.HasPrioritySupport
          }
        }).ToList();

        return Ok(tiers);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error getting subscription tiers");
        return StatusCode(500, new { error = "Failed to get subscription tiers", details = ex.Message });
      }
    }

    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> StripeWebhook()
    {
      try
      {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var endpointSecret = _configuration["Stripe:WebhookSecret"];

        var stripeEvent = EventUtility.ConstructEvent(
            json,
            Request.Headers["Stripe-Signature"],
            endpointSecret
        );

        _logger.LogInformation("Received Stripe webhook: {EventType}", stripeEvent.Type);

        switch (stripeEvent.Type)
        {
          case "checkout.session.completed":
            await HandleCheckoutSessionCompleted(stripeEvent);
            break;
          case "invoice.payment_succeeded":
            await HandleInvoicePaymentSucceeded(stripeEvent);
            break;
          case "invoice.payment_failed":
            await HandleInvoicePaymentFailed(stripeEvent);
            break;
          case "customer.subscription.deleted":
            await HandleSubscriptionDeleted(stripeEvent);
            break;
          case "payment_intent.succeeded":
            await HandlePaymentIntentSucceeded(stripeEvent);
            break;
          default:
            _logger.LogInformation("Unhandled webhook event type: {EventType}", stripeEvent.Type);
            break;
        }

        return Ok();
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error processing Stripe webhook");
        return BadRequest();
      }
    }

    private async Task HandleCheckoutSessionCompleted(Stripe.Event stripeEvent)
    {
      try
      {
        var session = stripeEvent.Data.Object as Session;
        if (session == null)
        {
          _logger.LogError("Could not parse session from webhook event");
          return;
        }

        _logger.LogInformation("Processing checkout session completed: {SessionId}", session.Id);

        string? userId = null;
        
        // Try to get user ID from metadata first
        if (session.Metadata?.TryGetValue("user_id", out userId) == true)
        {
          _logger.LogInformation("Found user ID in metadata: {UserId}", userId);
        }
        else
        {
          // Fallback: Find user by Stripe customer ID in their subscription
          var userSubscription = await _context.Subscriptions.FirstOrDefaultAsync(s => s.StripeCustomerId == session.CustomerId);
          if (userSubscription != null)
          {
            userId = userSubscription.UserId;
            _logger.LogInformation("Found user by customer ID: {UserId}", userId);
          }
        }

        if (string.IsNullOrEmpty(userId))
        {
          _logger.LogError("Could not determine user ID for session {SessionId}", session.Id);
          return;
        }

        // Find subscription by user ID and customer ID (since we don't store session ID)
        var subscription = await _context.Subscriptions
            .Where(s => s.UserId == userId && s.StripeCustomerId == session.CustomerId && s.Status == SubscriptionStatus.Inactive)
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefaultAsync();

        if (subscription == null)
        {
          _logger.LogError("No subscription found for session {SessionId}, user {UserId}", session.Id, userId);
          return;
        }

        _logger.LogInformation("Found subscription {SubscriptionId} for user {UserId}", subscription.Id, userId);

        // Cancel any other active subscriptions for this user
        var otherActiveSubscriptions = await _context.Subscriptions
            .Where(s => s.UserId == userId && s.Id != subscription.Id && s.Status == SubscriptionStatus.Active)
            .ToListAsync();

        foreach (var oldSub in otherActiveSubscriptions)
        {
          oldSub.Status = SubscriptionStatus.Cancelled;
          oldSub.EndDate = DateTime.UtcNow;
          oldSub.UpdatedAt = DateTime.UtcNow;
          _logger.LogInformation("Cancelled old subscription {OldSubscriptionId} for user {UserId}", oldSub.Id, userId);
        }

        // Activate the new subscription
        subscription.Status = SubscriptionStatus.Active;
        subscription.StartDate = DateTime.UtcNow;
        subscription.StripeSubscriptionId = session.SubscriptionId;
        subscription.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Successfully activated subscription {SubscriptionId} for user {UserId} with tier {Tier}", 
            subscription.Id, userId, subscription.Tier);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error handling checkout session completed for event {EventId}", stripeEvent.Id);
        throw; // Re-throw to ensure webhook processing fails and Stripe retries
      }
    }

    private async Task HandlePaymentIntentSucceeded(Stripe.Event stripeEvent)
    {
      var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
      if (paymentIntent != null)
      {
        var paymentRecord = await _context.PaymentRecords
            .FirstOrDefaultAsync(p => p.StripePaymentIntentId == paymentIntent.Id);

        if (paymentRecord != null)
        {
          paymentRecord.Status = PaymentStatus.Succeeded;
          paymentRecord.UpdatedAt = DateTime.UtcNow;

          // Update booking status if it's a booking payment
          if (paymentRecord.BookingId.HasValue)
          {
            var booking = await _context.Bookings.FindAsync(paymentRecord.BookingId.Value);
            if (booking != null)
            {
              booking.Status = BookingStatus.Confirmed;
              booking.UpdatedAt = DateTime.UtcNow;
            }
          }

          await _context.SaveChangesAsync();
          _logger.LogInformation("Payment succeeded for PaymentIntent {PaymentIntentId}", paymentIntent.Id);
        }
      }
    }

    private async Task HandleInvoicePaymentSucceeded(Stripe.Event stripeEvent)
    {
      // Handle recurring subscription payments
      _logger.LogInformation("Invoice payment succeeded");
    }

    private async Task HandleInvoicePaymentFailed(Stripe.Event stripeEvent)
    {
      // Handle failed subscription payments
      _logger.LogWarning("Invoice payment failed");
    }

    private async Task HandleSubscriptionDeleted(Stripe.Event stripeEvent)
    {
      var stripeSubscription = stripeEvent.Data.Object as Stripe.Subscription;
      if (stripeSubscription != null)
      {
        var subscription = await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.StripeSubscriptionId == stripeSubscription.Id);

        if (subscription != null)
        {
          subscription.Status = SubscriptionStatus.Cancelled;
          subscription.EndDate = DateTime.UtcNow;
          subscription.UpdatedAt = DateTime.UtcNow;

          await _context.SaveChangesAsync();
          _logger.LogInformation("Cancelled subscription {SubscriptionId}", subscription.Id);
        }
      }
    }

    private string GetStripePriceId(SubscriptionTier tier, string billingInterval)
    {
      var priceIdsSection = _configuration.GetSection("Stripe:PriceIds");
      
      return tier switch
      {
        // Pro (tier 1) 
        SubscriptionTier.Pro => billingInterval == "year" 
          ? priceIdsSection["ProAnnual"] ?? "price_pro_annual"
          : priceIdsSection["ProMonthly"] ?? "price_pro_monthly",
        // Business (tier 2) = Business Plan (ALL FEATURES)
        SubscriptionTier.Business => billingInterval == "year" 
          ? priceIdsSection["BusinessAnnual"] ?? "price_business_annual"
          : priceIdsSection["BusinessMonthly"] ?? "price_business_monthly",
        _ => throw new ArgumentException("Invalid subscription tier for paid plans")
      };
    }

    private SubscriptionTierConfigDto GetSubscriptionTierConfig(SubscriptionTier tier)
    {
      return tier switch
      {
        SubscriptionTier.Free => new SubscriptionTierConfigDto { MonthlyPrice = 0m, AnnualPrice = 0m, Name = "Free", Description = "Basic features" },
        SubscriptionTier.Pro => new SubscriptionTierConfigDto { MonthlyPrice = 19.99m, AnnualPrice = 199.99m, Name = "Pro", Description = "Professional features" },
        SubscriptionTier.Business => new SubscriptionTierConfigDto { MonthlyPrice = 49.99m, AnnualPrice = 499.99m, Name = "Business", Description = "Business features" },
        _ => throw new ArgumentException("Invalid subscription tier")
      };
    }
  }
}
