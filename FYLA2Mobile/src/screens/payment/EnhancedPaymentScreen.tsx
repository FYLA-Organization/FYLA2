import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';
import { modernTheme } from '../../theme/modernTheme';
import { ModernButton } from '../../components/ui/ModernButton';
import { ModernCard } from '../../components/ui/ModernCard';
import * as Haptics from 'expo-haptics';
import ApiService from '../../services/api';
import {
  PaymentMethod,
  PaymentCalculation,
  PaymentIntentResponse,
  TransactionType,
  CreatePaymentIntentRequest,
  PaymentStructure,
} from '../../types';

interface EnhancedPaymentScreenProps {
  bookingId: number;
  serviceId: number;
  providerId: string;
  onSuccess: (paymentResult: any) => void;
  onCancel: () => void;
}

const PAYMENT_METHOD_LABELS = {
  [PaymentMethod.Stripe]: 'Credit/Debit Card',
  [PaymentMethod.PayPal]: 'PayPal',
  [PaymentMethod.ApplePay]: 'Apple Pay',
  [PaymentMethod.GooglePay]: 'Google Pay',
  [PaymentMethod.Klarna]: 'Klarna',
  [PaymentMethod.BankTransfer]: 'Bank Transfer',
};

const PAYMENT_METHOD_ICONS = {
  [PaymentMethod.Stripe]: 'card-outline',
  [PaymentMethod.PayPal]: 'logo-paypal',
  [PaymentMethod.ApplePay]: 'logo-apple',
  [PaymentMethod.GooglePay]: 'logo-google',
  [PaymentMethod.Klarna]: 'card-outline',
  [PaymentMethod.BankTransfer]: 'business-outline',
};

export const EnhancedPaymentScreen: React.FC<EnhancedPaymentScreenProps> = ({
  bookingId,
  serviceId,
  providerId,
  onSuccess,
  onCancel,
}) => {
  const { confirmPayment } = useStripe();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [paymentCalculation, setPaymentCalculation] = useState<PaymentCalculation | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Stripe);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentResponse | null>(null);
  const [currentTransactionType, setCurrentTransactionType] = useState<TransactionType>(TransactionType.Payment);

  useEffect(() => {
    loadPaymentCalculation();
  }, [serviceId, providerId]);

  const loadPaymentCalculation = async () => {
    try {
      setLoading(true);
      const calculation = await ApiService.calculatePayment(serviceId, providerId);
      setPaymentCalculation(calculation);
      
      // Set initial transaction type based on payment structure
      if (calculation.paymentStructure === PaymentStructure.DepositThenRemainder) {
        setCurrentTransactionType(TransactionType.Deposit);
      } else if (calculation.paymentStructure === PaymentStructure.PaymentAfterService) {
        setCurrentTransactionType(TransactionType.Payment);
      } else {
        setCurrentTransactionType(TransactionType.Payment);
      }
    } catch (error) {
      console.error('Error loading payment calculation:', error);
      Alert.alert('Error', 'Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const createPaymentIntent = async () => {
    if (!paymentCalculation) return;

    try {
      setProcessing(true);
      
      const request: CreatePaymentIntentRequest = {
        bookingId,
        paymentMethod: selectedPaymentMethod,
        transactionType: currentTransactionType,
      };

      const intent = await ApiService.createPaymentIntent(request);
      setPaymentIntent(intent);
      
      return intent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      Alert.alert('Error', 'Failed to initialize payment');
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentCalculation) return;

    try {
      setProcessing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Create payment intent if not already created
      let intent = paymentIntent;
      if (!intent) {
        intent = await createPaymentIntent() || null;
      }

      if (!intent) {
        throw new Error('Failed to create payment intent');
      }

      if (selectedPaymentMethod === PaymentMethod.Stripe) {
        await handleStripePayment(intent);
      } else {
        // Handle other payment methods
        await handleAlternativePayment(intent);
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Failed', 'Please try again or select a different payment method.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setProcessing(false);
    }
  };

  const handleStripePayment = async (intent: PaymentIntentResponse) => {
    if (!intent.clientSecret || !cardComplete) {
      Alert.alert('Error', 'Please complete your card information');
      return;
    }

    const { error } = await confirmPayment(intent.clientSecret, {
      paymentMethodType: 'Card',
    });

    if (error) {
      console.error('Stripe payment error:', error);
      Alert.alert('Payment Failed', error.message || 'Please try again');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      // Process the payment through our backend
      const transaction = await ApiService.processPayment(intent.paymentIntentId, selectedPaymentMethod);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess(transaction);
    }
  };

  const handleAlternativePayment = async (intent: PaymentIntentResponse) => {
    // For now, show not implemented message
    Alert.alert('Coming Soon', `${PAYMENT_METHOD_LABELS[selectedPaymentMethod]} integration coming soon!`);
  };

  const getCurrentAmount = () => {
    if (!paymentCalculation) return 0;
    
    if (currentTransactionType === TransactionType.Deposit) {
      return paymentCalculation.depositAmount || paymentCalculation.totalAmount;
    }
    return paymentCalculation.totalAmount;
  };

  const getPaymentDescription = () => {
    if (!paymentCalculation) return '';
    
    if (paymentCalculation.paymentStructure === PaymentStructure.DepositThenRemainder) {
      if (currentTransactionType === TransactionType.Deposit) {
        return `Deposit (${paymentCalculation.depositAmount ? 
          ((paymentCalculation.depositAmount / paymentCalculation.totalAmount) * 100).toFixed(0) : 0}% of total)`;
      } else {
        return 'Remaining payment';
      }
    } else if (paymentCalculation.paymentStructure === PaymentStructure.PaymentAfterService) {
      return 'Pay after service completion';
    } else {
      return 'Full payment';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={modernTheme.colors.neutral[50]} />
            <Text style={styles.loadingText}>Loading payment information...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!paymentCalculation) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color={modernTheme.colors.neutral[50]} />
            <Text style={styles.errorText}>Failed to load payment information</Text>
            <ModernButton title="Try Again" onPress={loadPaymentCalculation} />
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={modernTheme.colors.neutral[50]} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Payment</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Payment Summary */}
          <ModernCard style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Payment Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service Amount:</Text>
              <Text style={styles.summaryValue}>${paymentCalculation.serviceAmount.toFixed(2)}</Text>
            </View>
            {paymentCalculation.taxAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax:</Text>
                <Text style={styles.summaryValue}>${paymentCalculation.taxAmount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Platform Fee:</Text>
              <Text style={styles.summaryValue}>${paymentCalculation.platformFeeAmount.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>${paymentCalculation.totalAmount.toFixed(2)}</Text>
            </View>
            
            {paymentCalculation.paymentStructure === PaymentStructure.DepositThenRemainder && (
              <View style={styles.paymentStructureInfo}>
                <Text style={styles.paymentStructureTitle}>Payment Structure: Deposit + Remainder</Text>
                <Text style={styles.paymentStructureText}>
                  Today: ${getCurrentAmount().toFixed(2)} ({getPaymentDescription()})
                </Text>
                {paymentCalculation.remainingAmount && (
                  <Text style={styles.paymentStructureText}>
                    After service: ${paymentCalculation.remainingAmount.toFixed(2)}
                  </Text>
                )}
              </View>
            )}
          </ModernCard>

          {/* Payment Methods */}
          <ModernCard style={styles.paymentMethodCard}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            {paymentCalculation.availablePaymentMethods.map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentMethodOption,
                  selectedPaymentMethod === method && styles.selectedPaymentMethod,
                ]}
                onPress={() => setSelectedPaymentMethod(method)}
              >
                <View style={styles.paymentMethodInfo}>
                  <Ionicons
                    name={PAYMENT_METHOD_ICONS[method] as any}
                    size={24}
                    color={selectedPaymentMethod === method ? modernTheme.colors.primary.main : modernTheme.colors.neutral[400]}
                  />
                  <Text
                    style={[
                      styles.paymentMethodLabel,
                      selectedPaymentMethod === method && styles.selectedPaymentMethodLabel,
                    ]}
                  >
                    {PAYMENT_METHOD_LABELS[method]}
                  </Text>
                </View>
                {selectedPaymentMethod === method && (
                  <Ionicons name="checkmark-circle" size={24} color={modernTheme.colors.primary.main} />
                )}
              </TouchableOpacity>
            ))}
          </ModernCard>

          {/* Card Input for Stripe */}
          {selectedPaymentMethod === PaymentMethod.Stripe && (
            <ModernCard style={styles.cardInputCard}>
              <Text style={styles.sectionTitle}>Card Information</Text>
              <CardField
                postalCodeEnabled={false}
                placeholders={{
                  number: '4242 4242 4242 4242',
                }}
                cardStyle={styles.cardField}
                style={styles.cardFieldContainer}
                onCardChange={(cardDetails: any) => {
                  setCardComplete(cardDetails.complete);
                }}
              />
            </ModernCard>
          )}

          {/* Payment Button */}
          <View style={styles.buttonContainer}>
            <ModernButton
              title={
                processing
                  ? 'Processing...'
                  : `Pay $${getCurrentAmount().toFixed(2)} - ${getPaymentDescription()}`
              }
              onPress={handlePayment}
              disabled={
                processing ||
                (selectedPaymentMethod === PaymentMethod.Stripe && !cardComplete)
              }
              style={styles.payButton}
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: modernTheme.colors.neutral[50],
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
    color: modernTheme.colors.neutral[50],
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: modernTheme.colors.neutral[50],
  },
  placeholder: {
    width: 40,
  },
  summaryCard: {
    margin: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: modernTheme.colors.text.primary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: modernTheme.colors.text.secondary,
  },
  summaryValue: {
    fontSize: 16,
    color: modernTheme.colors.text.primary,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: modernTheme.colors.border.primary,
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: modernTheme.colors.text.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: modernTheme.colors.primary.main,
  },
  paymentStructureInfo: {
    marginTop: 16,
    padding: 16,
    backgroundColor: modernTheme.colors.surface.secondary,
    borderRadius: 12,
  },
  paymentStructureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: modernTheme.colors.text.primary,
    marginBottom: 8,
  },
  paymentStructureText: {
    fontSize: 14,
    color: modernTheme.colors.text.secondary,
    marginBottom: 4,
  },
  paymentMethodCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: modernTheme.colors.border.primary,
    marginBottom: 12,
  },
  selectedPaymentMethod: {
    borderColor: modernTheme.colors.primary.main,
    backgroundColor: modernTheme.colors.primary.light + '20',
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodLabel: {
    fontSize: 16,
    color: modernTheme.colors.text.primary,
    marginLeft: 12,
  },
  selectedPaymentMethodLabel: {
    color: modernTheme.colors.primary.main,
    fontWeight: '600',
  },
  cardInputCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
  },
  cardFieldContainer: {
    height: 50,
  },
  cardField: {
    backgroundColor: '#FFFFFF',
    color: '#000000',
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  payButton: {
    marginTop: 8,
  },
});
