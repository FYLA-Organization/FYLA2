#!/bin/bash

# Quick IP Update Script for FYLA2
# Usage: ./update-ip.sh [IP_ADDRESS]
# If no IP is provided, it will auto-detect

if [ $# -eq 1 ]; then
    # Use provided IP
    IP="$1"
    echo "📝 Using provided IP address: $IP"
else
    # Auto-detect IP
    echo "🔍 Auto-detecting IP address..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        IP=$(hostname -I | awk '{print $1}')
    fi
    
    if [ -z "$IP" ]; then
        echo "❌ Could not auto-detect IP. Please provide it manually:"
        echo "   Usage: $0 YOUR_IP_ADDRESS"
        echo "   Example: $0 192.168.1.100"
        exit 1
    fi
    echo "✅ Detected IP: $IP"
fi

# Validate IP format
if [[ ! $IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    echo "❌ Invalid IP address format: $IP"
    exit 1
fi

# Update .env file
ENV_FILE="$(dirname "$0")/../.env"
API_URL="http://$IP:5224/api"

# Create .env if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    echo "EXPO_PUBLIC_API_URL=$API_URL" > "$ENV_FILE"
    echo "EXPO_PUBLIC_ENABLE_DEBUG=true" >> "$ENV_FILE"
    echo "EXPO_PUBLIC_API_TIMEOUT=15000" >> "$ENV_FILE"
else
    # Update existing file
    if grep -q "EXPO_PUBLIC_API_URL=" "$ENV_FILE"; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=$API_URL|" "$ENV_FILE"
        else
            sed -i "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=$API_URL|" "$ENV_FILE"
        fi
    else
        echo "EXPO_PUBLIC_API_URL=$API_URL" >> "$ENV_FILE"
    fi
fi

echo "✅ Updated API URL to: $API_URL"
echo "🚀 Ready to start the app with the new IP!"

# Show current .env content
echo ""
echo "📄 Current .env configuration:"
cat "$ENV_FILE"
