import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CardField, useStripe, StripeProvider } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';
import { modernTheme } from '../../theme/modernTheme';
import { ModernButton } from '../../components/ui/ModernButton';
import { ModernCard } from '../../components/ui/ModernCard';
import * as Haptics from 'expo-haptics';

interface PaymentScreenProps {
  amount: number;
  description: string;
  bookingId?: number;
  onSuccess: (paymentResult: any) => void;
  onCancel: () => void;
}

export const ModernPaymentScreen: React.FC<PaymentScreenProps> = ({
  amount,
  description,
  bookingId,
  onSuccess,
  onCancel,
}) => {
  const { confirmPayment } = useStripe();
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);

  useEffect(() => {
    createPaymentIntent();
  }, [amount, bookingId]);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);

      const endpoint = bookingId ? '/api/payment/create-booking-payment' : '/api/payment/create-payment-intent';
      const payload = bookingId 
        ? { bookingId, amount, description }
        : { amount, description };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.clientSecret) {
        setPaymentIntent(data);
      } else {
        throw new Error(data.error || 'Failed to create payment intent');
      }
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      Alert.alert('Error', 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = async () => {
    // Implement your auth token retrieval logic
    return 'your-jwt-token';
  };

  const handlePayment = async () => {
    if (!paymentIntent?.clientSecret || !cardComplete) {
      Alert.alert('Error', 'Please complete the card information');
      return;
    }

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { error, paymentIntent: confirmedPayment } = await confirmPayment(
        paymentIntent.clientSecret,
        {
          paymentMethodType: 'Card',
        }
      );

      if (error) {
        console.error('Payment confirmation error:', error);
        Alert.alert('Payment Failed', error.message || 'An error occurred during payment');
      } else if (confirmedPayment) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess(confirmedPayment);
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Failed', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentSummary = () => (
    <ModernCard variant="elevated" style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Ionicons
          name="card-outline"
          size={24}
          color={modernTheme.colors.primary.main}
        />
        <Text style={styles.summaryTitle}>Payment Summary</Text>
      </View>

      <View style={styles.summaryContent}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Service</Text>
          <Text style={styles.summaryValue}>{description}</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabelTotal}>Total</Text>
          <Text style={styles.summaryValueTotal}>
            ${amount.toFixed(2)}
          </Text>
        </View>
      </View>
    </ModernCard>
  );

  const renderCardInput = () => (
    <ModernCard variant="elevated" style={styles.cardInputCard}>
      <View style={styles.cardInputHeader}>
        <Ionicons
          name="lock-closed"
          size={20}
          color={modernTheme.colors.success.main}
        />
        <Text style={styles.cardInputTitle}>Secure Payment</Text>
      </View>

      <View style={styles.cardFieldContainer}>
        <CardField
          postalCodeEnabled={false}
          placeholders={{
            number: '4242 4242 4242 4242',
          }}
          cardStyle={{
            backgroundColor: modernTheme.colors.surface.primary,
            textColor: modernTheme.colors.text.primary,
            fontSize: 16,
            placeholderColor: modernTheme.colors.text.tertiary,
            borderColor: modernTheme.colors.border.primary,
            borderWidth: 1,
            borderRadius: modernTheme.borderRadius.md,
          }}
          style={styles.cardField}
          onCardChange={(cardDetails) => {
            setCardComplete(cardDetails.complete);
          }}
        />
      </View>

      <View style={styles.securityInfo}>
        <Ionicons
          name="shield-checkmark"
          size={16}
          color={modernTheme.colors.success.main}
        />
        <Text style={styles.securityText}>
          Your payment information is encrypted and secure
        </Text>
      </View>
    </ModernCard>
  );

  if (loading && !paymentIntent) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={modernTheme.colors.primary.main} />
        <Text style={styles.loadingText}>Preparing payment...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#f8fafc', '#e2e8f0']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Complete Payment</Text>
            <Text style={styles.subtitle}>
              Secure checkout powered by Stripe
            </Text>
          </View>

          {renderPaymentSummary()}
          {renderCardInput()}

          <View style={styles.actions}>
            <ModernButton
              title="Cancel"
              variant="outline"
              onPress={onCancel}
              style={styles.cancelButton}
              disabled={loading}
            />
            
            <ModernButton
              title={`Pay $${amount.toFixed(2)}`}
              variant="gradient"
              onPress={handlePayment}
              loading={loading}
              disabled={!cardComplete}
              style={styles.payButton}
              icon={
                <Ionicons
                  name="card"
                  size={20}
                  color={modernTheme.colors.text.inverse}
                />
              }
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

// Wrapper component with Stripe provider
export const StripePaymentScreen: React.FC<PaymentScreenProps> = (props) => {
  const [stripeKey, setStripeKey] = useState<string>('');

  useEffect(() => {
    // Fetch Stripe publishable key from your backend
    fetchStripeKey();
  }, []);

  const fetchStripeKey = async () => {
    try {
      const response = await fetch('/api/payment/config');
      const data = await response.json();
      setStripeKey(data.publishableKey);
    } catch (error) {
      console.error('Failed to fetch Stripe key:', error);
    }
  };

  if (!stripeKey) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={modernTheme.colors.primary.main} />
        <Text style={styles.loadingText}>Loading payment system...</Text>
      </View>
    );
  }

  return (
    <StripeProvider publishableKey={stripeKey}>
      <ModernPaymentScreen {...props} />
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: modernTheme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: modernTheme.colors.background.primary,
  },
  loadingText: {
    marginTop: modernTheme.spacing.md,
    fontSize: modernTheme.typography.fontSize.base,
    color: modernTheme.colors.text.secondary,
    fontFamily: modernTheme.typography.fontFamily.medium,
  },
  header: {
    alignItems: 'center',
    marginBottom: modernTheme.spacing.xl,
  },
  title: {
    fontSize: modernTheme.typography.fontSize['2xl'],
    fontFamily: modernTheme.typography.fontFamily.bold,
    color: modernTheme.colors.text.primary,
    marginBottom: modernTheme.spacing.xs,
  },
  subtitle: {
    fontSize: modernTheme.typography.fontSize.base,
    fontFamily: modernTheme.typography.fontFamily.regular,
    color: modernTheme.colors.text.secondary,
    textAlign: 'center',
  },
  summaryCard: {
    marginBottom: modernTheme.spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: modernTheme.spacing.md,
  },
  summaryTitle: {
    marginLeft: modernTheme.spacing.sm,
    fontSize: modernTheme.typography.fontSize.lg,
    fontFamily: modernTheme.typography.fontFamily.semiBold,
    color: modernTheme.colors.text.primary,
  },
  summaryContent: {
    gap: modernTheme.spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: modernTheme.typography.fontSize.base,
    fontFamily: modernTheme.typography.fontFamily.regular,
    color: modernTheme.colors.text.secondary,
  },
  summaryValue: {
    fontSize: modernTheme.typography.fontSize.base,
    fontFamily: modernTheme.typography.fontFamily.medium,
    color: modernTheme.colors.text.primary,
  },
  summaryLabelTotal: {
    fontSize: modernTheme.typography.fontSize.lg,
    fontFamily: modernTheme.typography.fontFamily.semiBold,
    color: modernTheme.colors.text.primary,
  },
  summaryValueTotal: {
    fontSize: modernTheme.typography.fontSize.lg,
    fontFamily: modernTheme.typography.fontFamily.bold,
    color: modernTheme.colors.primary.main,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: modernTheme.colors.border.primary,
    marginVertical: modernTheme.spacing.sm,
  },
  cardInputCard: {
    marginBottom: modernTheme.spacing.xl,
  },
  cardInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: modernTheme.spacing.md,
  },
  cardInputTitle: {
    marginLeft: modernTheme.spacing.sm,
    fontSize: modernTheme.typography.fontSize.lg,
    fontFamily: modernTheme.typography.fontFamily.semiBold,
    color: modernTheme.colors.text.primary,
  },
  cardFieldContainer: {
    marginBottom: modernTheme.spacing.md,
  },
  cardField: {
    height: 50,
    marginVertical: modernTheme.spacing.sm,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityText: {
    marginLeft: modernTheme.spacing.xs,
    fontSize: modernTheme.typography.fontSize.sm,
    fontFamily: modernTheme.typography.fontFamily.regular,
    color: modernTheme.colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    gap: modernTheme.spacing.md,
    marginTop: 'auto',
    paddingTop: modernTheme.spacing.lg,
  },
  cancelButton: {
    flex: 1,
  },
  payButton: {
    flex: 2,
  },
});

export default StripePaymentScreen;
