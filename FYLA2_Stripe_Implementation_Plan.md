# Stripe Payment Integration Technical Plan
*Technical Implementation Roadmap*

## 🏗️ Backend Implementation (ASP.NET Core)

### 1. Stripe Configuration & Models

```csharp
// Models/Subscription.cs
public class Subscription
{
    public int Id { get; set; }
    public string UserId { get; set; }
    public string StripeSubscriptionId { get; set; }
    public string StripePriceId { get; set; }
    public SubscriptionPlan Plan { get; set; }
    public SubscriptionStatus Status { get; set; }
    public DateTime CurrentPeriodStart { get; set; }
    public DateTime CurrentPeriodEnd { get; set; }
    public decimal Amount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    
    public User User { get; set; }
}

public enum SubscriptionPlan
{
    Free = 0,
    Professional = 1,
    Business = 2
}

public enum SubscriptionStatus
{
    Active,
    Cancelled,
    PastDue,
    Unpaid,
    Trialing
}

// Models/PaymentTransaction.cs
public class PaymentTransaction
{
    public int Id { get; set; }
    public string UserId { get; set; }
    public int BookingId { get; set; }
    public string StripePaymentIntentId { get; set; }
    public decimal Amount { get; set; }
    public decimal ApplicationFee { get; set; }
    public string Currency { get; set; }
    public PaymentStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public User User { get; set; }
    public Booking Booking { get; set; }
}
```

### 2. Stripe Service Implementation

```csharp
// Services/StripeService.cs
public interface IStripeService
{
    Task<Customer> CreateCustomerAsync(string email, string name);
    Task<Stripe.Subscription> CreateSubscriptionAsync(string customerId, string priceId);
    Task<Stripe.Subscription> UpdateSubscriptionAsync(string subscriptionId, string newPriceId);
    Task<Stripe.Subscription> CancelSubscriptionAsync(string subscriptionId);
    Task<PaymentIntent> CreatePaymentIntentAsync(decimal amount, string currency, string customerId);
    Task<bool> VerifyWebhookAsync(string payload, string signature);
}

public class StripeService : IStripeService
{
    private readonly IConfiguration _configuration;
    
    public StripeService(IConfiguration configuration)
    {
        _configuration = configuration;
        StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"];
    }
    
    public async Task<Customer> CreateCustomerAsync(string email, string name)
    {
        var options = new CustomerCreateOptions
        {
            Email = email,
            Name = name,
        };
        
        var service = new CustomerService();
        return await service.CreateAsync(options);
    }
    
    // Additional methods implementation...
}
```

### 3. Subscription Controller

```csharp
// Controllers/SubscriptionController.cs
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SubscriptionController : ControllerBase
{
    private readonly IStripeService _stripeService;
    private readonly ApplicationDbContext _context;
    
    [HttpPost("create")]
    public async Task<IActionResult> CreateSubscription([FromBody] CreateSubscriptionRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var user = await _context.Users.FindAsync(userId);
        
        if (user == null) return NotFound();
        
        try
        {
            // Create Stripe customer if doesn't exist
            if (string.IsNullOrEmpty(user.StripeCustomerId))
            {
                var customer = await _stripeService.CreateCustomerAsync(user.Email, $"{user.FirstName} {user.LastName}");
                user.StripeCustomerId = customer.Id;
                await _context.SaveChangesAsync();
            }
            
            // Create subscription
            var subscription = await _stripeService.CreateSubscriptionAsync(user.StripeCustomerId, request.PriceId);
            
            // Save to database
            var dbSubscription = new Subscription
            {
                UserId = userId,
                StripeSubscriptionId = subscription.Id,
                StripePriceId = request.PriceId,
                Plan = GetPlanFromPriceId(request.PriceId),
                Status = SubscriptionStatus.Active,
                CurrentPeriodStart = subscription.CurrentPeriodStart,
                CurrentPeriodEnd = subscription.CurrentPeriodEnd,
                Amount = subscription.Items.Data[0].Price.UnitAmount ?? 0,
                CreatedAt = DateTime.UtcNow
            };
            
            _context.Subscriptions.Add(dbSubscription);
            await _context.SaveChangesAsync();
            
            return Ok(new { subscriptionId = subscription.Id });
        }
        catch (StripeException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
    
    [HttpPost("upgrade")]
    public async Task<IActionResult> UpgradeSubscription([FromBody] UpgradeSubscriptionRequest request)
    {
        // Implementation for upgrading subscription
    }
    
    [HttpPost("cancel")]
    public async Task<IActionResult> CancelSubscription()
    {
        // Implementation for cancelling subscription
    }
    
    [HttpGet("status")]
    public async Task<IActionResult> GetSubscriptionStatus()
    {
        // Get current user's subscription status
    }
}
```

### 4. Feature Gating Middleware

```csharp
// Middleware/FeatureGatingMiddleware.cs
public class FeatureGatingAttribute : ActionFilterAttribute
{
    private readonly SubscriptionPlan _requiredPlan;
    
    public FeatureGatingAttribute(SubscriptionPlan requiredPlan)
    {
        _requiredPlan = requiredPlan;
    }
    
    public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var userId = context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            context.Result = new UnauthorizedResult();
            return;
        }
        
        var dbContext = context.HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
        var userSubscription = await dbContext.Subscriptions
            .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active)
            .FirstOrDefaultAsync();
        
        var userPlan = userSubscription?.Plan ?? SubscriptionPlan.Free;
        
        if (userPlan < _requiredPlan)
        {
            context.Result = new ObjectResult(new { error = "This feature requires a premium subscription" })
            {
                StatusCode = 402 // Payment Required
            };
            return;
        }
        
        await next();
    }
}

// Usage in controllers:
[FeatureGating(SubscriptionPlan.Professional)]
[HttpGet("advanced-analytics")]
public async Task<IActionResult> GetAdvancedAnalytics()
{
    // This endpoint requires Professional plan or higher
}
```

### 5. Webhook Handler

```csharp
// Controllers/StripeWebhookController.cs
[ApiController]
[Route("api/stripe/webhook")]
public class StripeWebhookController : ControllerBase
{
    private readonly IStripeService _stripeService;
    private readonly ApplicationDbContext _context;
    
    [HttpPost]
    public async Task<IActionResult> HandleWebhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"];
        
        try
        {
            var isValid = await _stripeService.VerifyWebhookAsync(json, signature);
            if (!isValid) return BadRequest();
            
            var stripeEvent = EventUtility.ParseEvent(json);
            
            switch (stripeEvent.Type)
            {
                case "customer.subscription.updated":
                    await HandleSubscriptionUpdated(stripeEvent);
                    break;
                case "customer.subscription.deleted":
                    await HandleSubscriptionCancelled(stripeEvent);
                    break;
                case "invoice.payment_failed":
                    await HandlePaymentFailed(stripeEvent);
                    break;
            }
            
            return Ok();
        }
        catch (StripeException ex)
        {
            return BadRequest();
        }
    }
}
```

## 📱 Mobile Implementation (React Native)

### 1. Stripe Setup & Components

```typescript
// services/stripeService.ts
import { loadStripe } from '@stripe/stripe-js';

class StripePaymentService {
  private stripe: any;
  
  async initialize() {
    this.stripe = await loadStripe(Config.STRIPE_PUBLISHABLE_KEY);
  }
  
  async createPaymentMethod(cardElement: any) {
    const { error, paymentMethod } = await this.stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });
    
    if (error) throw error;
    return paymentMethod;
  }
  
  async confirmPayment(clientSecret: string, paymentMethod: any) {
    const { error } = await this.stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod.id
    });
    
    if (error) throw error;
  }
}

export const stripeService = new StripePaymentService();
```

### 2. Subscription Selection Screen

```typescript
// screens/subscription/SubscriptionPlansScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  priceId: string;
  features: string[];
  popular?: boolean;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Starter',
    price: 0,
    priceId: '',
    features: [
      'Up to 5 services',
      'Up to 50 clients',
      'Basic booking system',
      'Mobile app access',
      'Email support'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 19.99,
    priceId: 'price_professional_monthly',
    features: [
      'Unlimited services',
      'Unlimited clients',
      'Advanced booking features',
      'Custom branding',
      'Portfolio management',
      'Basic analytics',
      'Priority support'
    ],
    popular: true
  },
  {
    id: 'business',
    name: 'Business',
    price: 49.99,
    priceId: 'price_business_monthly',
    features: [
      'Everything in Professional',
      'Multi-location support',
      'Advanced analytics',
      'Marketing suite',
      'API access',
      'Dedicated account manager'
    ]
  }
];

export const SubscriptionPlansScreen: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>('professional');
  const [loading, setLoading] = useState(false);
  
  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (plan.id === 'free') {
      // Handle free plan selection
      return;
    }
    
    setLoading(true);
    try {
      const response = await ApiService.createSubscription({
        priceId: plan.priceId
      });
      
      // Handle successful subscription
      Alert.alert('Success', 'Subscription created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };
  
  const renderPlan = (plan: SubscriptionPlan) => (
    <View key={plan.id} style={[
      styles.planCard,
      plan.popular && styles.popularPlan,
      selectedPlan === plan.id && styles.selectedPlan
    ]}>
      {plan.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>Most Popular</Text>
        </View>
      )}
      
      <Text style={styles.planName}>{plan.name}</Text>
      <View style={styles.priceContainer}>
        <Text style={styles.price}>
          {plan.price === 0 ? 'Free' : `$${plan.price}`}
        </Text>
        {plan.price > 0 && (
          <Text style={styles.priceSubtext}>/month</Text>
        )}
      </View>
      
      <View style={styles.featuresList}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons name="checkmark" size={16} color="#4CAF50" />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      
      <TouchableOpacity
        style={[
          styles.selectButton,
          selectedPlan === plan.id && styles.selectedButton
        ]}
        onPress={() => handleSubscribe(plan)}
        disabled={loading}
      >
        <Text style={[
          styles.selectButtonText,
          selectedPlan === plan.id && styles.selectedButtonText
        ]}>
          {plan.price === 0 ? 'Current Plan' : 'Choose Plan'}
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Choose Your Plan</Text>
      <Text style={styles.subtitle}>
        Select the perfect plan for your business needs
      </Text>
      
      {SUBSCRIPTION_PLANS.map(renderPlan)}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          All plans include secure payment processing and 24/7 support
        </Text>
      </View>
    </ScrollView>
  );
};
```

### 3. Payment Form Component

```typescript
// components/PaymentForm.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  onSuccess,
  onError
}) => {
  const { confirmPayment } = useStripe();
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  
  const handlePayment = async () => {
    if (!cardComplete) {
      Alert.alert('Error', 'Please complete your card information');
      return;
    }
    
    setLoading(true);
    try {
      // Create payment intent on backend
      const { clientSecret } = await ApiService.createPaymentIntent({
        amount: amount * 100, // Convert to cents
        currency: 'usd'
      });
      
      // Confirm payment with Stripe
      const { error } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card'
      });
      
      if (error) {
        onError(error.message || 'Payment failed');
      } else {
        onSuccess();
      }
    } catch (error) {
      onError('Payment processing failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Information</Text>
      
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Total Amount:</Text>
        <Text style={styles.amount}>${amount.toFixed(2)}</Text>
      </View>
      
      <CardField
        postalCodeEnabled={true}
        placeholders={{
          number: '4242 4242 4242 4242',
        }}
        cardStyle={styles.cardField}
        style={styles.cardContainer}
        onCardChange={(cardDetails) => {
          setCardComplete(cardDetails.complete);
        }}
      />
      
      <TouchableOpacity
        style={[
          styles.payButton,
          (!cardComplete || loading) && styles.payButtonDisabled
        ]}
        onPress={handlePayment}
        disabled={!cardComplete || loading}
      >
        <Text style={styles.payButtonText}>
          {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.securityText}>
        🔒 Your payment information is secure and encrypted
      </Text>
    </View>
  );
};
```

## 🔒 Security & Compliance

### 1. PCI Compliance
- Never store card information on our servers
- Use Stripe Elements for secure card input
- Implement proper webhook signature verification
- Use HTTPS for all payment-related communications

### 2. Data Security
- Encrypt sensitive subscription data
- Implement proper access controls
- Regular security audits
- GDPR compliance for EU users

### 3. Error Handling
- Graceful payment failure handling
- Retry mechanisms for failed payments
- Clear error messages for users
- Proper logging for debugging

## 📊 Implementation Timeline

### Week 1: Backend Foundation
- [ ] Stripe account setup and configuration
- [ ] Subscription models and database schema
- [ ] Basic Stripe service implementation
- [ ] Subscription controller endpoints

### Week 2: Mobile Integration
- [ ] Stripe React Native setup
- [ ] Subscription plans screen
- [ ] Payment form components
- [ ] API integration for payments

### Week 3: Feature Gating
- [ ] Feature gating middleware
- [ ] Plan-based restrictions
- [ ] Upgrade/downgrade flows
- [ ] Usage tracking and limits

### Week 4: Testing & Launch
- [ ] End-to-end payment testing
- [ ] Webhook testing and validation
- [ ] Security audit
- [ ] Launch preparation

This comprehensive plan provides a solid foundation for implementing a successful freemium SaaS model with Stripe payments. Ready to start implementation? 🚀
