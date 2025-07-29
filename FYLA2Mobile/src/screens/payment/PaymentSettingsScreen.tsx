import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ModernButton } from '../../components/ui/ModernButton';
import { ModernCard } from '../../components/ui/ModernCard';
import * as Haptics from 'expo-haptics';
import ApiService from '../../services/api';
import {
  PaymentSettings,
  PaymentStructure,
  PaymentMethod,
} from '../../types';

interface PaymentSettingsScreenProps {
  providerId: string;
  onBack: () => void;
}

const PAYMENT_STRUCTURE_OPTIONS = [
  {
    value: PaymentStructure.FullPaymentUpfront,
    title: 'Full Payment Upfront',
    description: 'Client pays the full amount when booking',
  },
  {
    value: PaymentStructure.DepositThenRemainder,
    title: 'Deposit + Remainder',
    description: 'Client pays a deposit upfront, remainder after service',
  },
  {
    value: PaymentStructure.PaymentAfterService,
    title: 'Payment After Service',
    description: 'Client pays after service completion',
  },
];

const PAYMENT_METHOD_OPTIONS = [
  { key: 'acceptStripe', method: PaymentMethod.Stripe, title: 'Credit/Debit Cards', icon: 'card-outline' },
  { key: 'acceptPayPal', method: PaymentMethod.PayPal, title: 'PayPal', icon: 'logo-paypal' },
  { key: 'acceptApplePay', method: PaymentMethod.ApplePay, title: 'Apple Pay', icon: 'logo-apple' },
  { key: 'acceptGooglePay', method: PaymentMethod.GooglePay, title: 'Google Pay', icon: 'logo-google' },
  { key: 'acceptKlarna', method: PaymentMethod.Klarna, title: 'Klarna', icon: 'card-outline' },
  { key: 'acceptBankTransfer', method: PaymentMethod.BankTransfer, title: 'Bank Transfer', icon: 'business-outline' },
];

export const PaymentSettingsScreen: React.FC<PaymentSettingsScreenProps> = ({
  providerId,
  onBack,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);

  useEffect(() => {
    loadPaymentSettings();
  }, [providerId]);

  const loadPaymentSettings = async () => {
    try {
      setLoading(true);
      const paymentSettings = await ApiService.getPaymentSettings(providerId);
      setSettings(paymentSettings);
    } catch (error) {
      console.error('Error loading payment settings:', error);
      // If settings don't exist, create default settings
      setSettings({
        id: 0,
        providerId,
        paymentStructure: PaymentStructure.FullPaymentUpfront,
        depositPercentage: 50,
        taxRate: 8.5,
        acceptStripe: true,
        acceptPayPal: false,
        acceptApplePay: false,
        acceptGooglePay: false,
        acceptKlarna: false,
        acceptBankTransfer: false,
        autoRefundEnabled: false,
        refundTimeoutHours: 24,
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await ApiService.updatePaymentSettings(providerId, settings);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Payment settings saved successfully');
    } catch (error) {
      console.error('Error saving payment settings:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (updates: Partial<PaymentSettings>) => {
    if (settings) {
      setSettings({ ...settings, ...updates });
    }
  };

  const togglePaymentMethod = (key: keyof PaymentSettings) => {
    if (settings) {
      setSettings({ ...settings, [key]: !settings[key] });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Loading payment settings...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!settings) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load payment settings</Text>
            <ModernButton title="Try Again" onPress={loadPaymentSettings} />
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Settings</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Payment Structure */}
          <ModernCard style={styles.card}>
            <Text style={styles.sectionTitle}>Payment Structure</Text>
            {PAYMENT_STRUCTURE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionItem,
                  settings.paymentStructure === option.value && styles.selectedOption,
                ]}
                onPress={() => updateSettings({ paymentStructure: option.value })}
              >
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionTitle,
                    settings.paymentStructure === option.value && styles.selectedOptionText,
                  ]}>
                    {option.title}
                  </Text>
                  <Text style={[
                    styles.optionDescription,
                    settings.paymentStructure === option.value && styles.selectedOptionDescription,
                  ]}>
                    {option.description}
                  </Text>
                </View>
                {settings.paymentStructure === option.value && (
                  <Ionicons name="checkmark-circle" size={24} color="#667eea" />
                )}
              </TouchableOpacity>
            ))}
          </ModernCard>

          {/* Deposit Settings */}
          {settings.paymentStructure === PaymentStructure.DepositThenRemainder && (
            <ModernCard style={styles.card}>
              <Text style={styles.sectionTitle}>Deposit Settings</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Deposit Percentage</Text>
                <TextInput
                  style={styles.textInput}
                  value={settings.depositPercentage.toString()}
                  onChangeText={(text) => {
                    const value = parseFloat(text) || 0;
                    if (value >= 0 && value <= 100) {
                      updateSettings({ depositPercentage: value });
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="50"
                />
                <Text style={styles.inputHint}>Percentage of total amount for deposit (0-100%)</Text>
              </View>
            </ModernCard>
          )}

          {/* Tax Settings */}
          <ModernCard style={styles.card}>
            <Text style={styles.sectionTitle}>Tax Settings</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tax Rate (%)</Text>
              <TextInput
                style={styles.textInput}
                value={settings.taxRate.toString()}
                onChangeText={(text) => {
                  const value = parseFloat(text) || 0;
                  if (value >= 0 && value <= 100) {
                    updateSettings({ taxRate: value });
                  }
                }}
                keyboardType="numeric"
                placeholder="8.5"
              />
              <Text style={styles.inputHint}>Local tax rate applied to services</Text>
            </View>
          </ModernCard>

          {/* Payment Methods */}
          <ModernCard style={styles.card}>
            <Text style={styles.sectionTitle}>Accepted Payment Methods</Text>
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <View key={option.key} style={styles.paymentMethodItem}>
                <View style={styles.paymentMethodInfo}>
                  <Ionicons name={option.icon as any} size={24} color="#667eea" />
                  <Text style={styles.paymentMethodTitle}>{option.title}</Text>
                </View>
                <Switch
                  value={settings[option.key as keyof PaymentSettings] as boolean}
                  onValueChange={() => togglePaymentMethod(option.key as keyof PaymentSettings)}
                  trackColor={{ false: '#d1d5db', true: '#ddd6fe' }}
                  thumbColor={settings[option.key as keyof PaymentSettings] ? '#667eea' : '#ffffff'}
                />
              </View>
            ))}
          </ModernCard>

          {/* Refund Settings */}
          <ModernCard style={styles.card}>
            <Text style={styles.sectionTitle}>Refund Settings</Text>
            
            <View style={styles.paymentMethodItem}>
              <Text style={styles.paymentMethodTitle}>Enable Automatic Refunds</Text>
              <Switch
                value={settings.autoRefundEnabled}
                onValueChange={(value) => updateSettings({ autoRefundEnabled: value })}
                trackColor={{ false: '#d1d5db', true: '#ddd6fe' }}
                thumbColor={settings.autoRefundEnabled ? '#667eea' : '#ffffff'}
              />
            </View>

            {settings.autoRefundEnabled && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Refund Timeout (Hours)</Text>
                <TextInput
                  style={styles.textInput}
                  value={settings.refundTimeoutHours.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 0;
                    if (value >= 0) {
                      updateSettings({ refundTimeoutHours: value });
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="24"
                />
                <Text style={styles.inputHint}>Hours after booking when automatic refunds are allowed</Text>
              </View>
            )}
          </ModernCard>

          {/* Save Button */}
          <View style={styles.buttonContainer}>
            <ModernButton
              title={saving ? 'Saving...' : 'Save Settings'}
              onPress={saveSettings}
              disabled={saving}
            />
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  card: {
    margin: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  selectedOption: {
    borderColor: '#667eea',
    backgroundColor: '#f8faff',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  selectedOptionText: {
    color: '#667eea',
  },
  optionDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  selectedOptionDescription: {
    color: '#4c63d2',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  inputHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 12,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
});
