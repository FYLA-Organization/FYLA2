#!/bin/bash

# FYLA2 Stripe Setup Script
# This script helps you set up Stripe integration with real test keys

echo "🚀 FYLA2 Stripe Integration Setup"
echo "================================="
echo ""

# Check if backend is running
echo "📡 Checking if backend is running..."
if curl -s http://localhost:5224/ > /dev/null; then
    echo "✅ Backend is running on localhost:5224"
else
    echo "❌ Backend is not running. Please start the backend first:"
    echo "   cd FYLA2_Backend && dotnet run"
    exit 1
fi

echo ""
echo "🔑 Setting up Stripe products and prices..."
echo ""

# Call the setup endpoint
response=$(curl -s -X POST "http://localhost:5224/api/stripesetup/setup-plans")

if echo "$response" | grep -q "successfully"; then
    echo "✅ Stripe products and prices created successfully!"
    echo ""
    echo "📋 Price IDs created:"
    echo "$response" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'priceIds' in data:
        for key, value in data['priceIds'].items():
            print(f'   {key}: {value}')
    else:
        print('   Check the backend logs for details')
except:
    print('   Raw response:', '$response')
"
else
    echo "❌ Failed to create Stripe products and prices"
    echo "Response: $response"
    echo ""
    echo "💡 Make sure you have:"
    echo "   1. Added your real Stripe test keys to appsettings.Development.json"
    echo "   2. Started the backend server"
    exit 1
fi

echo ""
echo "🧪 Testing subscription endpoints..."

# Test subscription tiers
echo "   • Testing subscription tiers endpoint..."
tiers_response=$(curl -s "http://localhost:5224/api/payment/subscription-tiers")
tiers_count=$(echo "$tiers_response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data) if isinstance(data, list) else 0)")

if [ "$tiers_count" -eq 3 ]; then
    echo "   ✅ Subscription tiers loaded successfully (3 tiers found)"
else
    echo "   ❌ Failed to load subscription tiers"
fi

# Test Stripe config
echo "   • Testing Stripe configuration..."
config_response=$(curl -s "http://localhost:5224/api/stripesetup/config")
if echo "$config_response" | grep -q "publishableKey"; then
    echo "   ✅ Stripe configuration available"
else
    echo "   ❌ Stripe configuration not available"
fi

echo ""
echo "📱 Mobile App Integration:"
echo "   1. The subscription endpoints are ready"
echo "   2. SubscriptionPlansScreen.tsx is created"
echo "   3. Feature gating service is implemented"
echo "   4. Subscription components are ready"
echo ""

echo "🔄 Next Steps:"
echo "   1. Add your real Stripe test keys to appsettings.Development.json:"
echo "      - Get keys from: https://dashboard.stripe.com/test/apikeys"
echo "      - Update: FYLA2_Backend/appsettings.Development.json"
echo ""
echo "   2. Test the mobile subscription flow:"
echo "      - Navigate to SubscriptionPlansScreen"
echo "      - Try upgrading plans"
echo "      - Test feature gating"
echo ""
echo "   3. Set up webhooks for production:"
echo "      - Configure webhook URL in Stripe Dashboard"
echo "      - Update webhook secret in configuration"
echo ""

echo "✨ Stripe integration setup complete!"
echo "   Documentation: STRIPE_SETUP_GUIDE.md"
