import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './api';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private pushToken: string | null = null;
  private notificationListeners: ((notification: Notifications.Notification) => void)[] = [];
  private responseListeners: ((response: Notifications.NotificationResponse) => void)[] = [];

  async initialize(): Promise<void> {
    // Check if device supports push notifications
    if (!Device.isDevice) {
      console.log('Push notifications are only supported on physical devices');
      return;
    }

    // Get permission to send push notifications
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission to send push notifications was denied');
      return;
    }

    // Get the push token
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
      if (!projectId) {
        console.log('Project ID not found. Push notifications may not work in development.');
        return;
      }

      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      
      this.pushToken = pushTokenData.data;
      console.log('Push token:', this.pushToken);

      // Store token locally
      await AsyncStorage.setItem('pushToken', this.pushToken);

      // Send token to backend
      await this.registerPushToken();
    } catch (error) {
      console.error('Error getting push token:', error);
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('chat-messages', {
        name: 'Chat Messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#667eea',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('booking-updates', {
        name: 'Booking Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#667eea',
        sound: 'default',
      });
    }

    // Set up notification listeners
    this.setupNotificationListeners();
  }

  private setupNotificationListeners(): void {
    // Listen for notifications received while app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      this.notificationListeners.forEach(handler => handler(notification));
    });

    // Listen for user interactions with notifications
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.responseListeners.forEach(handler => handler(response));
    });
  }

  async registerPushToken(): Promise<void> {
    if (!this.pushToken) return;

    try {
      await ApiService.registerPushToken(this.pushToken);
      console.log('Push token registered with backend');
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  }

  onNotificationReceived(handler: (notification: Notifications.Notification) => void): () => void {
    this.notificationListeners.push(handler);
    return () => {
      const index = this.notificationListeners.indexOf(handler);
      if (index > -1) {
        this.notificationListeners.splice(index, 1);
      }
    };
  }

  onNotificationResponse(handler: (response: Notifications.NotificationResponse) => void): () => void {
    this.responseListeners.push(handler);
    return () => {
      const index = this.responseListeners.indexOf(handler);
      if (index > -1) {
        this.responseListeners.splice(index, 1);
      }
    };
  }

  async scheduleLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  }

  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  getPushToken(): string | null {
    return this.pushToken;
  }
}

export const notificationService = new NotificationService();
