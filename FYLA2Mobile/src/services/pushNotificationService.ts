import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUSH_TOKEN_KEY = 'expoPushToken';
const NOTIFICATION_SETTINGS_KEY = 'notificationSettings';

export interface NotificationSettings {
  bookingConfirmations: boolean;
  bookingReminders: boolean;
  messageAlerts: boolean;
  promotionalOffers: boolean;
  availabilityAlerts: boolean;
}

export interface PushNotificationData {
  type: 'booking_confirmation' | 'booking_reminder' | 'new_message' | 'promotional' | 'availability_alert';
  bookingId?: string;
  messageId?: string;
  providerId?: string;
  title: string;
  body: string;
  data?: any;
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class PushNotificationService {
  private static expoPushToken: string | null = null;

  // Initialize the notification service
  static async initialize(): Promise<void> {
    try {
      console.log('🔔 Initializing Push Notification Service...');
      
      // Register for push notifications
      await this.registerForPushNotificationsAsync();
      
      // Set up notification listeners
      this.setupNotificationListeners();
      
      // Load and apply notification settings
      await this.loadNotificationSettings();
      
      console.log('✅ Push Notification Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Push Notification Service:', error);
    }
  }

  // Register for push notifications and get token
  static async registerForPushNotificationsAsync(): Promise<string | null> {
    let token = null;

    try {
      // Check if we're on a physical device
      if (!Device.isDevice) {
        console.warn('📱 Push notifications require a physical device');
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('🚫 Push notification permissions denied');
        return null;
      }

      // Get the push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
      if (!projectId) {
        console.warn('⚠️ Project ID not found for push notifications');
        return null;
      }

      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      
      if (token) {
        this.expoPushToken = token;
        await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token);
        console.log('🎯 Push token obtained:', token.substring(0, 20) + '...');
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'FYLA Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B6B',
          sound: 'default',
        });

        // Create specific channels for different notification types
        await this.createNotificationChannels();
      }

    } catch (error) {
      console.error('❌ Error registering for push notifications:', error);
    }

    return token;
  }

  // Create Android notification channels
  static async createNotificationChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    const channels = [
      {
        id: 'booking-confirmations',
        name: 'Booking Confirmations',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Notifications for booking confirmations',
      },
      {
        id: 'booking-reminders',
        name: 'Booking Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Reminders for upcoming appointments',
      },
      {
        id: 'messages',
        name: 'Messages',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'New message notifications',
      },
      {
        id: 'promotional',
        name: 'Promotional Offers',
        importance: Notifications.AndroidImportance.DEFAULT,
        description: 'Special offers and promotions',
      },
      {
        id: 'availability',
        name: 'Availability Alerts',
        importance: Notifications.AndroidImportance.DEFAULT,
        description: 'Provider availability notifications',
      },
    ];

    for (const channel of channels) {
      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        importance: channel.importance,
        description: channel.description,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B6B',
        sound: 'default',
      });
    }
  }

  // Set up notification listeners
  static setupNotificationListeners(): void {
    // Listener for when a notification is received while the app is foregrounded
    Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Listener for when a user taps on or interacts with a notification
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      this.handleNotificationResponse(response);
    });
  }

  // Handle received notifications
  static handleNotificationReceived(notification: Notifications.Notification): void {
    const { request } = notification;
    const data = request.content.data as PushNotificationData;

    // Update badge count
    this.updateBadgeCount();

    // Handle specific notification types
    switch (data?.type) {
      case 'new_message':
        // Could trigger a refresh of the chat screen
        console.log('📨 New message notification received');
        break;
      case 'booking_confirmation':
        // Could trigger a refresh of the bookings screen
        console.log('✅ Booking confirmation notification received');
        break;
      case 'booking_reminder':
        // Could show a more prominent reminder
        console.log('⏰ Booking reminder notification received');
        break;
      default:
        console.log('📣 General notification received');
    }
  }

  // Handle notification response (when user taps notification)
  static handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data as PushNotificationData;

    // Navigate to appropriate screen based on notification type
    switch (data?.type) {
      case 'new_message':
        // Navigate to chat screen
        console.log('🗨️ Navigating to chat for message:', data.messageId);
        break;
      case 'booking_confirmation':
      case 'booking_reminder':
        // Navigate to booking details
        console.log('📅 Navigating to booking:', data.bookingId);
        break;
      case 'availability_alert':
        // Navigate to provider profile
        console.log('👤 Navigating to provider:', data.providerId);
        break;
      default:
        console.log('🏠 Navigating to home screen');
    }
  }

  // Schedule local notifications
  static async scheduleLocalNotification(
    title: string,
    body: string,
    data: any = {},
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: trigger || null, // null means immediate
      });

      console.log('📅 Local notification scheduled:', id);
      return id;
    } catch (error) {
      console.error('❌ Error scheduling local notification:', error);
      throw error;
    }
  }

  // Schedule booking reminder
  static async scheduleBookingReminder(
    bookingId: string,
    providerName: string,
    serviceName: string,
    appointmentTime: Date,
    reminderMinutes: number = 60
  ): Promise<string> {
    const reminderTime = new Date(appointmentTime.getTime() - (reminderMinutes * 60 * 1000));
    
    // Don't schedule if reminder time is in the past
    if (reminderTime <= new Date()) {
      console.warn('⚠️ Reminder time is in the past, not scheduling');
      return '';
    }

    return await this.scheduleLocalNotification(
      `Upcoming Appointment Reminder`,
      `You have a ${serviceName} appointment with ${providerName} in ${reminderMinutes} minutes`,
      {
        type: 'booking_reminder',
        bookingId,
        providerName,
        serviceName,
      },
      {
        date: reminderTime,
      }
    );
  }

  // Cancel scheduled notification
  static async cancelScheduledNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('❌ Cancelled scheduled notification:', notificationId);
    } catch (error) {
      console.error('❌ Error cancelling notification:', error);
    }
  }

  // Get notification settings
  static async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Default settings
      return {
        bookingConfirmations: true,
        bookingReminders: true,
        messageAlerts: true,
        promotionalOffers: false,
        availabilityAlerts: true,
      };
    } catch (error) {
      console.error('❌ Error getting notification settings:', error);
      return {
        bookingConfirmations: true,
        bookingReminders: true,
        messageAlerts: true,
        promotionalOffers: false,
        availabilityAlerts: true,
      };
    }
  }

  // Save notification settings
  static async saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
      console.log('💾 Notification settings saved:', settings);
    } catch (error) {
      console.error('❌ Error saving notification settings:', error);
    }
  }

  // Load and apply notification settings
  static async loadNotificationSettings(): Promise<NotificationSettings> {
    const settings = await this.getNotificationSettings();
    // Here you could apply settings like enabling/disabling certain channels
    return settings;
  }

  // Update badge count
  static async updateBadgeCount(count?: number): Promise<void> {
    try {
      if (count !== undefined) {
        await Notifications.setBadgeCountAsync(count);
      } else {
        // Auto-increment badge
        const currentCount = await Notifications.getBadgeCountAsync();
        await Notifications.setBadgeCountAsync(currentCount + 1);
      }
    } catch (error) {
      console.error('❌ Error updating badge count:', error);
    }
  }

  // Clear badge count
  static async clearBadgeCount(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('❌ Error clearing badge count:', error);
    }
  }

  // Get push token
  static async getPushToken(): Promise<string | null> {
    if (this.expoPushToken) {
      return this.expoPushToken;
    }

    try {
      const stored = await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
      if (stored) {
        this.expoPushToken = stored;
        return stored;
      }
    } catch (error) {
      console.error('❌ Error getting stored push token:', error);
    }

    return null;
  }

  // Check notification permissions
  static async checkPermissions(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  // Quick notification helpers
  static async showBookingConfirmation(providerName: string, serviceName: string, appointmentTime: string): Promise<void> {
    const settings = await this.getNotificationSettings();
    if (!settings.bookingConfirmations) return;

    await this.scheduleLocalNotification(
      'Booking Confirmed! ✅',
      `Your ${serviceName} appointment with ${providerName} is confirmed for ${appointmentTime}`,
      { type: 'booking_confirmation' }
    );
  }

  static async showNewMessageAlert(senderName: string, messagePreview: string): Promise<void> {
    const settings = await this.getNotificationSettings();
    if (!settings.messageAlerts) return;

    await this.scheduleLocalNotification(
      `New message from ${senderName}`,
      messagePreview,
      { type: 'new_message' }
    );
  }

  static async showPromotionalOffer(title: string, description: string): Promise<void> {
    const settings = await this.getNotificationSettings();
    if (!settings.promotionalOffers) return;

    await this.scheduleLocalNotification(
      title,
      description,
      { type: 'promotional' }
    );
  }
}

export default PushNotificationService;
