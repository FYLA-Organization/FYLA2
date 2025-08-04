#!/bin/bash

# Test script to verify IP configuration is working
echo "🧪 Testing FYLA2 IP Configuration..."
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "📄 Current configuration:"
    cat .env
    echo ""
else
    echo "❌ .env file not found"
    echo "🔧 Creating one now..."
    ./scripts/update-ip.sh
    echo ""
fi

# Extract API URL from .env
if [ -f ".env" ]; then
    API_URL=$(grep "EXPO_PUBLIC_API_URL=" .env | cut -d'=' -f2)
    if [ -n "$API_URL" ]; then
        echo "🔗 API URL: $API_URL"
        
        # Extract IP and port
        IP=$(echo $API_URL | sed 's|http://||' | sed 's|:.*||')
        PORT=$(echo $API_URL | sed 's|.*:||' | sed 's|/.*||')
        
        echo "📍 Server IP: $IP"
        echo "🔌 Server Port: $PORT"
        echo ""
        
        # Test if the server is reachable
        echo "🏃 Testing server connectivity..."
        
        # Test basic connectivity (ping)
        if ping -c 1 -W 1000 "$IP" >/dev/null 2>&1; then
            echo "✅ Server IP is reachable (ping successful)"
        else
            echo "❌ Server IP is not reachable (ping failed)"
        fi
        
        # Test HTTP endpoint
        echo "🌐 Testing API endpoint..."
        HTTP_URL="http://$IP:$PORT"
        
        if curl -s --connect-timeout 3 "$HTTP_URL" >/dev/null 2>&1; then
            echo "✅ API server is running and accessible"
            
            # Get the actual response
            RESPONSE=$(curl -s --connect-timeout 3 "$HTTP_URL")
            echo "📱 Server response: $RESPONSE"
        else
            echo "❌ API server is not accessible"
            echo "💡 Make sure your backend is running with: dotnet run --launch-profile http"
        fi
    else
        echo "❌ No API URL found in .env file"
    fi
else
    echo "❌ Cannot read .env file"
fi

echo ""
echo "🎯 Summary:"
echo "- Configuration file: $([ -f ".env" ] && echo "✅ Found" || echo "❌ Missing")"
echo "- IP detection: $([ -x "./scripts/update-ip.sh" ] && echo "✅ Ready" || echo "❌ Missing")"
echo "- API connectivity: $(curl -s --connect-timeout 3 "$HTTP_URL" >/dev/null 2>&1 && echo "✅ Working" || echo "❌ Failed")"

echo ""
echo "📋 Next steps:"
echo "1. If backend is not running: cd ../FYLA2_Backend && dotnet run --launch-profile http"
echo "2. If IP is wrong: npm run update-ip"
echo "3. Start mobile app: npm start"
