#!/bin/bash

# Auto IP Detection Script for FYLA2 Backend
# This script automatically detects your computer's IP address and updates the mobile app configuration

echo "🔍 Detecting your computer's IP address..."

# Try different methods to get the local IP address
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
    if [ -z "$IP" ]; then
        IP=$(route get default | grep interface | awk '{print $2}' | xargs ifconfig | grep "inet " | head -1 | awk '{print $2}')
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    IP=$(hostname -I | awk '{print $1}')
    if [ -z "$IP" ]; then
        IP=$(ip route get 1 | awk '{print $7}' | head -1)
    fi
else
    echo "❌ Unsupported operating system"
    exit 1
fi

if [ -z "$IP" ]; then
    echo "❌ Could not detect IP address automatically"
    echo "📝 Please manually set your IP address in the .env file"
    echo "   Example: EXPO_PUBLIC_API_URL=http://YOUR_IP:5224/api"
    exit 1
fi

echo "✅ Detected IP address: $IP"

# Create or update .env file
ENV_FILE="$(dirname "$0")/.env"
API_URL="http://$IP:5224/api"

echo "📝 Updating .env file..."

# Create .env file if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    cp "$(dirname "$0")/.env.example" "$ENV_FILE"
fi

# Update or add the API URL
if grep -q "EXPO_PUBLIC_API_URL=" "$ENV_FILE"; then
    # Update existing line
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=$API_URL|" "$ENV_FILE"
    else
        sed -i "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=$API_URL|" "$ENV_FILE"
    fi
else
    # Add new line
    echo "EXPO_PUBLIC_API_URL=$API_URL" >> "$ENV_FILE"
fi

echo "✅ Updated .env file with API URL: $API_URL"
echo ""
echo "🚀 You can now start your React Native app!"
echo "   The app will automatically connect to your backend at $IP:5224"
echo ""
echo "💡 Tip: Run this script whenever your WiFi network changes"
echo "💡 Alternatively, you can manually update the IP in the .env file"
