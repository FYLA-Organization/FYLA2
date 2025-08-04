# IP Configuration Setup for FYLA2

This guide explains how to configure your FYLA2 mobile app to automatically connect to your backend server regardless of your WiFi network.

## 🚀 Quick Start

### Option 1: Automatic IP Detection (Recommended)
Run this command whenever your WiFi network changes:
```bash
npm run update-ip
```
or
```bash
./scripts/update-ip.sh
```

### Option 2: Manual IP Setting
If you know your computer's IP address:
```bash
./scripts/update-ip.sh 192.168.1.100
```

### Option 3: Edit Environment File Directly
1. Open `.env` file in the mobile app root
2. Update the API URL:
```
EXPO_PUBLIC_API_URL=http://YOUR_IP_ADDRESS:5224/api
```

## 🔧 How It Works

### Backend Configuration
Your .NET backend is already configured to accept connections from any IP address:
- **launchSettings.json**: Uses `0.0.0.0:5224` to listen on all network interfaces
- **Program.cs**: CORS policy allows any origin

### Mobile App Configuration
The mobile app now uses a dynamic configuration system:

1. **Environment Variables**: Checks `.env` file first
2. **Auto-detection**: Falls back to IP detection if no env var
3. **Hardcoded Fallback**: Uses last known working IP as final fallback

## 📁 Files Created/Modified

### New Files:
- `src/config/environment.ts` - Dynamic configuration manager
- `.env` - Environment variables (auto-generated)
- `.env.example` - Template for environment variables
- `scripts/update-ip.sh` - Quick IP update script
- `scripts/detect-ip.sh` - Comprehensive IP detection script

### Modified Files:
- `src/services/api.ts` - Uses dynamic configuration
- `src/services/chatService.ts` - Uses dynamic configuration  
- `src/screens/ChatScreen.tsx` - Uses dynamic configuration for images
- `package.json` - Added npm scripts for IP management

## 🛠️ Available Commands

```bash
# Auto-detect and update IP
npm run update-ip

# Detect IP and show information
npm run detect-ip

# Manually set specific IP
./scripts/update-ip.sh 192.168.1.100

# Start the app with current configuration
npm start
```

## 🔍 Troubleshooting

### Can't Connect to Backend?
1. Check if backend is running: `dotnet run` in backend folder
2. Verify IP address: `npm run detect-ip`
3. Update configuration: `npm run update-ip`
4. Check firewall settings on your computer

### IP Detection Not Working?
- **macOS**: Make sure you're connected to WiFi (not just Ethernet)
- **Windows**: Try running scripts in Git Bash or WSL
- **Manual override**: Use `./scripts/update-ip.sh YOUR_IP`

### Backend Not Accessible from Phone?
1. Make sure your phone and computer are on the same network
2. Check if backend is running on `0.0.0.0:5224` (not just `localhost`)
3. Disable any firewall blocking port 5224
4. For testing: `curl http://YOUR_IP:5224` should return "FYLA2 Beauty Booking API is running!"

## 📱 Testing the Setup

1. Update your IP: `npm run update-ip`
2. Start the backend: In backend folder, run `dotnet run --launch-profile http`
3. Start the mobile app: `npm start`
4. Test login functionality

The console should show:
```
Using environment variable for API URL: http://192.168.1.185:5224/api
API Service initialized with URL: http://192.168.1.185:5224/api
```

## 🔒 Security Notes

- The `.env` file contains your local IP and is gitignored
- Environment variables are only used in development
- Production apps should use proper domain names/SSL

## 🆘 Quick Fixes

If you're in a hurry and just need to update the IP:

1. **Find your IP**:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig | findstr "IPv4"
   ```

2. **Update manually**:
   Edit `.env` file and change:
   ```
   EXPO_PUBLIC_API_URL=http://YOUR_NEW_IP:5224/api
   ```

3. **Restart the app**

That's it! Your app will now connect to the backend regardless of WiFi network changes.
