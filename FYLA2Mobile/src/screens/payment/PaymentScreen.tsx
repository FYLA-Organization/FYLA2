import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ApiService } from '../../services/ApiService';

type PaymentStackParamList = {
  PaymentScreen: {
    bookingId: number;
    amount: number;
    serviceName: string;
    providerName: string;
    bookingDate: string;
  };
};

type Props = NativeStackScreenProps<PaymentStackParamList, 'PaymentScreen'>;

interface PaymentIntent {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  serviceAmount: number;
  platformFee: number;
  paymentId: number;
}

const PaymentScreen: React.FC<Props> = ({ navigation, route }) => {
  const { bookingId, amount, serviceName, providerName, bookingDate } = route.params;
  
  const [loading, setLoading] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');

  useEffect(() => {
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      const response = await ApiService.post('/enhancedpayment/create-booking-payment', {
        bookingId
      });
      
      setPaymentIntent(response.data);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      Alert.alert('Error', 'Failed to initialize payment. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    if (!paymentIntent) return;

    try {
      setLoading(true);
      
      // In a real app, you would integrate with Stripe SDK here
      // For demo purposes, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Confirm payment with backend
      const response = await ApiService.post('/enhancedpayment/confirm-payment', {
        paymentId: paymentIntent.paymentId
      });

      if (response.data.success) {
        Alert.alert(
          'Payment Successful!',
          'Your booking has been confirmed. You will receive a confirmation email shortly.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('BookingHistory' as any)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Payment Failed', 'There was an issue processing your payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !paymentIntent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Initializing payment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Booking Summary */}
        <View style={styles.bookingCard}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>
          <View style={styles.bookingDetails}>
            <View style={styles.bookingRow}>
              <Ionicons name="storefront-outline" size={20} color="#666" />
              <Text style={styles.bookingLabel}>Service:</Text>
              <Text style={styles.bookingValue}>{serviceName}</Text>
            </View>
            <View style={styles.bookingRow}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <Text style={styles.bookingLabel}>Provider:</Text>
              <Text style={styles.bookingValue}>{providerName}</Text>
            </View>
            <View style={styles.bookingRow}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.bookingLabel}>Date & Time:</Text>
              <Text style={styles.bookingValue}>{formatDate(bookingDate)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Summary */}
        {paymentIntent && (
          <View style={styles.paymentCard}>
            <Text style={styles.sectionTitle}>Payment Summary</Text>
            <View style={styles.paymentBreakdown}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Service Fee</Text>
                <Text style={styles.paymentAmount}>${paymentIntent.serviceAmount.toFixed(2)}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Platform Fee (3%)</Text>
                <Text style={styles.paymentAmount}>${paymentIntent.platformFee.toFixed(2)}</Text>
              </View>
              <View style={[styles.paymentRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>${paymentIntent.amount.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Payment Method */}
        <View style={styles.paymentMethodCard}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'card' && styles.selectedPaymentOption
            ]}
            onPress={() => setPaymentMethod('card')}
          >
            <View style={styles.paymentOptionContent}>
              <Ionicons name="card-outline" size={24} color="#007AFF" />
              <Text style={styles.paymentOptionText}>Credit/Debit Card</Text>
            </View>
            <View style={[
              styles.radioButton,
              paymentMethod === 'card' && styles.selectedRadio
            ]}>
              {paymentMethod === 'card' && (
                <View style={styles.radioInner} />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'paypal' && styles.selectedPaymentOption
            ]}
            onPress={() => setPaymentMethod('paypal')}
          >
            <View style={styles.paymentOptionContent}>
              <Ionicons name="logo-paypal" size={24} color="#0070BA" />
              <Text style={styles.paymentOptionText}>PayPal</Text>
            </View>
            <View style={[
              styles.radioButton,
              paymentMethod === 'paypal' && styles.selectedRadio
            ]}>
              {paymentMethod === 'paypal' && (
                <View style={styles.radioInner} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark" size={20} color="#00C851" />
          <Text style={styles.securityText}>
            Your payment information is encrypted and secure
          </Text>
        </View>
      </ScrollView>

      {/* Payment Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={processPayment}
          disabled={loading || !paymentIntent}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="lock-closed" size={20} color="#FFF" />
              <Text style={styles.payButtonText}>
                Pay ${paymentIntent?.amount.toFixed(2) || amount.toFixed(2)}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  bookingCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  bookingDetails: {
    gap: 12,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bookingLabel: {
    fontSize: 14,
    color: '#666',
    width: 80,
  },
  bookingValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  paymentCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentBreakdown: {
    gap: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentAmount: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  paymentMethodCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedPaymentOption: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadio: {
    borderColor: '#007AFF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 15,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    marginBottom: 20,
  },
  securityText: {
    fontSize: 14,
    color: '#2E7D32',
    flex: 1,
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  payButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  payButtonDisabled: {
    backgroundColor: '#CCC',
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentScreen;
