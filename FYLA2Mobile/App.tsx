import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ChatProvider } from './src/contexts/ChatContext';
import AppNavigator from './src/navigation/AppNavigator';
import PushNotificationService from './src/services/pushNotificationService';

export default function App() {
  useEffect(() => {
    // Initialize push notifications when app starts
    PushNotificationService.initialize().catch(error => {
      console.error('Failed to initialize push notifications:', error);
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
