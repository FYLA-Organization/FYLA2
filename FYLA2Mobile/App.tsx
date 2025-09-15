import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ChatProvider } from './src/contexts/ChatContext';
import AppNavigator from './src/navigation/AppNavigator';
import { notificationService } from './src/services/notificationService';
import FeatureGatingService from './src/services/featureGatingService';

export default function App() {
  useEffect(() => {
    // Initialize push notifications when app starts
    notificationService.initialize().catch((error: any) => {
      console.error('Failed to initialize push notifications:', error);
    });

    // Force refresh subscription data on app start
    FeatureGatingService.refreshSubscription().catch((error: any) => {
      console.error('Failed to refresh subscription on app start:', error);
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ChatProvider>
            <AppNavigator />
          </ChatProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
