import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ChatProvider } from './src/contexts/ChatContext';
import AppNavigator from './src/navigation/AppNavigator';
import { notificationService } from './src/services/notificationService';

export default function App() {
  useEffect(() => {
    // Initialize push notifications when app starts
    notificationService.initialize().catch((error: any) => {
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
