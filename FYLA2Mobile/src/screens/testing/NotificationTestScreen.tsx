import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../types';
import PushNotificationService from '../../services/pushNotificationService';

type NotificationTestScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const NotificationTestScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<NotificationTestScreenNavigationProp>();

  const testNotifications = [
    {
      title: 'Booking Confirmation',
      description: 'Test a booking confirmation notification',
      icon: 'checkmark-circle',
      color: '#27AE60',
      action: async () => {
        await PushNotificationService.showBookingConfirmation(
          'Luxury Spa',
          'Deep Tissue Massage',
          'Tomorrow at 2:00 PM'
        );
        Alert.alert('Test Sent', 'Booking confirmation notification sent!');
      }
    },
    {
      title: 'Booking Reminder',
      description: 'Test a booking reminder (immediate)',
      icon: 'time',
      color: '#3498DB',
      action: async () => {
        const now = new Date();
        const reminderTime = new Date(now.getTime() + 5000); // 5 seconds from now
        
        await PushNotificationService.scheduleBookingReminder(
          'test-booking-123',
          'Beauty Salon',
          'Hair Cut & Style',
          reminderTime,
          0 // 0 minutes = immediate
        );
        Alert.alert('Test Scheduled', 'You should see a reminder notification in 5 seconds!');
      }
    },
    {
      title: 'New Message Alert',
      description: 'Test a new message notification',
      icon: 'chatbubble',
      color: '#9B59B6',
      action: async () => {
        await PushNotificationService.showNewMessageAlert(
          'Sarah Johnson',
          'Hey! Just wanted to confirm our appointment tomorrow. Looking forward to it! 😊'
        );
        Alert.alert('Test Sent', 'New message notification sent!');
      }
    },
    {
      title: 'Promotional Offer',
      description: 'Test a promotional notification',
      icon: 'pricetag',
      color: '#F39C12',
      action: async () => {
        await PushNotificationService.showPromotionalOffer(
          '🎉 Special Offer Just for You!',
          'Get 20% off your next massage booking. Valid for the next 24 hours only!'
        );
        Alert.alert('Test Sent', 'Promotional notification sent!');
      }
    },
    {
      title: 'Clear Badge Count',
      description: 'Reset the app badge to 0',
      icon: 'refresh',
      color: '#E67E22',
      action: async () => {
        await PushNotificationService.clearBadgeCount();
        Alert.alert('Badge Cleared', 'App badge count has been reset to 0');
      }
    },
    {
      title: 'Check Permissions',
      description: 'Verify notification permissions',
      icon: 'shield-checkmark',
      color: '#8E44AD',
      action: async () => {
        const hasPermission = await PushNotificationService.checkPermissions();
        const token = await PushNotificationService.getPushToken();
        
        Alert.alert(
          'Permission Status',
          `Notifications: ${hasPermission ? 'Enabled' : 'Disabled'}\nToken: ${token ? 'Available' : 'None'}`,
          [{ text: 'OK' }]
        );
      }
    }
  ];

  const handleTest = async (testAction: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await testAction();
    } catch (error) {
      console.error('Test failed:', error);
      Alert.alert('Test Failed', 'There was an error running the test. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#FF6B6B', '#FFE66D']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Testing</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#3498DB" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Testing Push Notifications</Text>
            <Text style={styles.infoText}>
              These tests will help you verify that push notifications are working correctly. 
              Make sure notifications are enabled in your device settings.
            </Text>
          </View>
        </View>

        <View style={styles.testsContainer}>
          {testNotifications.map((test, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.testCard, isLoading && styles.testCardDisabled]}
              onPress={() => handleTest(test.action)}
              disabled={isLoading}
            >
              <View style={[styles.testIcon, { backgroundColor: test.color }]}>
                <Ionicons name={test.icon as any} size={24} color="white" />
              </View>
              <View style={styles.testContent}>
                <Text style={styles.testTitle}>{test.title}</Text>
                <Text style={styles.testDescription}>{test.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>
            💡 Tip: If you don't see notifications, check your device's notification settings 
            and ensure FYLA has permission to send notifications.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
  testsContainer: {
    gap: 12,
  },
  testCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testCardDisabled: {
    opacity: 0.6,
  },
  testIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  testContent: {
    flex: 1,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  testDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  footerInfo: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 8,
    marginTop: 32,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#F57C00',
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default NotificationTestScreen;
