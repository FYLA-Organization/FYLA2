# Stripe Integration Setup Guide

## Step 1: Get Stripe Test Keys

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/
2. **Create an account** if you don't have one
3. **Switch to Test Mode** (toggle in the top right)
4. **Get your keys**:
   - Go to Developers > API keys
   - Copy your **Publishable key** (starts with `pk_test_`)
   - Copy your **Secret key** (starts with `sk_test_`)

## Step 2: Update Configuration

Update `/FYLA2_Backend/appsettings.Development.json` with your actual keys:

```json
{
  "Stripe": {
    "PublishableKey": "pk_test_YOUR_ACTUAL_KEY_HERE",
    "SecretKey": "sk_test_YOUR_ACTUAL_KEY_HERE",
    "WebhookSecret": "whsec_test_webhook_secret",
    "PriceIds": {
      "ProfessionalMonthly": "price_professional_monthly",
      "ProfessionalAnnual": "price_professional_annual",
      "BusinessMonthly": "price_business_monthly",
      "BusinessAnnual": "price_business_annual"
    }
  }
}
```

## Step 3: Create Products and Prices Automatically

Once you have your keys set up, the backend will automatically create the products and prices for you when you call the setup endpoint.

## Step 4: Test the Integration

1. Start the backend server
2. Call `POST /api/stripesetup/setup-plans` to create Stripe products and prices
3. Call `GET /api/payment/subscription-tiers` to see available plans
4. Test creating a subscription with the mobile app

## Pricing Structure

- **Starter (Free)**: $0/month
  - 3 services, 5 photos per service
  - Basic features only

- **Professional**: $19.99/month or $199.99/year
  - 15 services, 15 photos per service
  - Advanced analytics, payment processing

- **Business**: $49.99/month or $499.99/year
  - Unlimited services and photos
  - All premium features

## Next Steps

1. Add Stripe to your mobile app
2. Implement subscription selection UI
3. Set up webhook endpoints for production
4. Test payment flows
5. Implement feature gating based on subscription tiers

## Important Notes

- Always use test keys in development
- Webhook secrets will be different for each environment
- Products and prices will be created automatically
- All payments in test mode use fake card numbers
