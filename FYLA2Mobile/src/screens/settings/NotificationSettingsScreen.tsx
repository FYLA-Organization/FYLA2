import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../types';
import PushNotificationService, { NotificationSettings } from '../../services/pushNotificationService';

type NotificationSettingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const NotificationSettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    bookingConfirmations: true,
    bookingReminders: true,
    messageAlerts: true,
    promotionalOffers: false,
    availabilityAlerts: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const navigation = useNavigation<NotificationSettingsScreenNavigationProp>();

  useEffect(() => {
    loadSettings();
    checkPermissions();
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = await PushNotificationService.getNotificationSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const checkPermissions = async () => {
    const permission = await PushNotificationService.checkPermissions();
    setHasPermission(permission);
  };

  const handleSettingChange = async (key: keyof NotificationSettings, value: boolean) => {
    if (!hasPermission && value) {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications in your device settings to use this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => {
            // In a real app, you'd open device settings
            Alert.alert('Info', 'Please go to Settings > Notifications > FYLA to enable notifications');
          }}
        ]
      );
      return;
    }

    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);
    
    setIsSaving(true);
    try {
      await PushNotificationService.saveNotificationSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save notification settings');
      // Revert the change
      setSettings(settings);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestPermissions = async () => {
    try {
      await PushNotificationService.registerForPushNotificationsAsync();
      const permission = await PushNotificationService.checkPermissions();
      setHasPermission(permission);
      
      if (permission) {
        Alert.alert('Success', 'Notifications have been enabled!');
      } else {
        Alert.alert(
          'Permission Denied',
          'Notifications were not enabled. You can enable them later in your device settings.'
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request notification permissions');
    }
  };

  const testNotification = async () => {
    try {
      await PushNotificationService.scheduleLocalNotification(
        'Test Notification 🧪',
        'This is a test notification to check if everything is working properly!',
        { type: 'test' }
      );
      Alert.alert('Test Sent', 'A test notification has been sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const renderSettingItem = (
    key: keyof NotificationSettings,
    title: string,
    description: string,
    icon: string,
    iconColor: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={24} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={settings[key]}
        onValueChange={(value) => handleSettingChange(key, value)}
        trackColor={{ false: '#ddd', true: '#FF6B6B' }}
        thumbColor="#fff"
        disabled={isSaving || !hasPermission}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading notification settings...</Text>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Notification Settings</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Permission Status */}
        <View style={[styles.statusCard, hasPermission ? styles.statusEnabled : styles.statusDisabled]}>
          <View style={styles.statusIcon}>
            <Ionicons 
              name={hasPermission ? "notifications" : "notifications-off"} 
              size={32} 
              color={hasPermission ? "#27AE60" : "#E74C3C"} 
            />
          </View>
          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>
              {hasPermission ? 'Notifications Enabled' : 'Notifications Disabled'}
            </Text>
            <Text style={styles.statusDescription}>
              {hasPermission 
                ? 'You will receive notifications based on your preferences below'
                : 'Enable notifications to stay updated with your bookings and messages'
              }
            </Text>
            {!hasPermission && (
              <TouchableOpacity style={styles.enableButton} onPress={handleRequestPermissions}>
                <Text style={styles.enableButtonText}>Enable Notifications</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Settings Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Notifications</Text>
          <View style={styles.settingsContainer}>
            {renderSettingItem(
              'bookingConfirmations',
              'Booking Confirmations',
              'Get notified when your booking is confirmed',
              'checkmark-circle-outline',
              '#27AE60'
            )}
            {renderSettingItem(
              'bookingReminders',
              'Appointment Reminders',
              'Receive reminders before your appointments',
              'time-outline',
              '#3498DB'
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Communication</Text>
          <View style={styles.settingsContainer}>
            {renderSettingItem(
              'messageAlerts',
              'Message Alerts',
              'Get notified when you receive new messages',
              'chatbubble-outline',
              '#9B59B6'
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discover & Updates</Text>
          <View style={styles.settingsContainer}>
            {renderSettingItem(
              'availabilityAlerts',
              'Availability Alerts',
              'Know when your favorite providers have new openings',
              'calendar-outline',
              '#E67E22'
            )}
            {renderSettingItem(
              'promotionalOffers',
              'Promotional Offers',
              'Receive special deals and discounts',
              'pricetag-outline',
              '#F39C12'
            )}
          </View>
        </View>

        {/* Test Section */}
        {hasPermission && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Testing</Text>
            <TouchableOpacity style={styles.testButton} onPress={testNotification}>
              <Ionicons name="flask-outline" size={20} color="#666" />
              <Text style={styles.testButtonText}>Send Test Notification</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.testButton, styles.advancedTestButton]} 
              onPress={() => navigation.navigate('NotificationTest')}
            >
              <Ionicons name="build-outline" size={20} color="#3498DB" />
              <Text style={[styles.testButtonText, styles.advancedTestButtonText]}>
                Advanced Testing Suite
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>About Notifications</Text>
              <Text style={styles.infoText}>
                You can always change these settings later. Some notifications like booking confirmations 
                are highly recommended to ensure you don't miss important updates about your appointments.
              </Text>
            </View>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusEnabled: {
    borderLeftWidth: 4,
    borderLeftColor: '#27AE60',
  },
  statusDisabled: {
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
  },
  statusIcon: {
    marginRight: 16,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  enableButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  enableButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  settingsContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  testButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  advancedTestButton: {
    borderWidth: 1,
    borderColor: '#3498DB',
    backgroundColor: '#E3F2FD',
  },
  advancedTestButtonText: {
    color: '#3498DB',
    fontWeight: 'bold',
  },
  infoSection: {
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

export default NotificationSettingsScreen;
