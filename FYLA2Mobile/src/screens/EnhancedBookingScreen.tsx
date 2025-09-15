import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import CustomBrandedHeader from '../components/CustomBrandedHeader';
import LoyaltyPointsWidget from '../components/LoyaltyPointsWidget';
import PromotionDisplay from '../components/PromotionDisplay';
import apiService from '../services/apiService';

const { width } = Dimensions.get('window');

interface BookingData {
  serviceId: string;
  serviceName: string;
  providerId: string;
  providerName: string;
  price: number;
  duration: number;
  selectedDate: string;
  selectedTime: string;
}

interface SelectedPromotion {
  id: number;
  title: string;
  type: string;
  value: number;
  promoCode?: string;
  minimumSpend: number;
}

interface BrandProfile {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
}

const EnhancedBookingScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingData } = route.params as { bookingData: BookingData };

  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<SelectedPromotion | null>(null);
  const [specialRequests, setSpecialRequests] = useState('');
  const [totalPrice, setTotalPrice] = useState(bookingData.price);
  const [loyaltyPointsToEarn, setLoyaltyPointsToEarn] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBrandProfile();
    calculateLoyaltyPoints();
  }, []);

  useEffect(() => {
    calculateTotalPrice();
  }, [selectedPromotion]);

  const loadBrandProfile = async () => {
    try {
      const profile = await apiService.getPublicBrandProfile(bookingData.providerId);
      setBrandProfile(profile);
    } catch (error) {
      console.log('No custom branding found');
    }
  };

  const calculateLoyaltyPoints = () => {
    // Typically 1 point per dollar spent
    setLoyaltyPointsToEarn(Math.floor(bookingData.price));
  };

  const calculateTotalPrice = () => {
    let price = bookingData.price;

    if (selectedPromotion) {
      if (price >= selectedPromotion.minimumSpend) {
        switch (selectedPromotion.type) {
          case 'percentage':
            price = price * (1 - selectedPromotion.value / 100);
            break;
          case 'fixed_amount':
            price = Math.max(0, price - selectedPromotion.value);
            break;
          case 'buy_one_get_one':
            price = price * 0.5; // 50% off for BOGO
            break;
        }
      }
    }

    setTotalPrice(price);
  };

  const handlePromotionSelect = (promotion: any) => {
    if (bookingData.price >= promotion.minimumSpend) {
      setSelectedPromotion(promotion);
      Alert.alert(
        'Promotion Applied!',
        `"${promotion.title}" has been applied to your booking.`
      );
    } else {
      Alert.alert(
        'Minimum Spend Not Met',
        `This promotion requires a minimum spend of $${promotion.minimumSpend.toFixed(2)}.`
      );
    }
  };

  const handleRemovePromotion = () => {
    setSelectedPromotion(null);
    Alert.alert('Promotion Removed', 'The promotion has been removed from your booking.');
  };

  const handleBookingConfirm = async () => {
    try {
      setLoading(true);

      const bookingPayload = {
        serviceProviderId: bookingData.providerId,
        serviceId: parseInt(bookingData.serviceId),
        bookingDate: bookingData.selectedDate,
        startTime: bookingData.selectedTime,
        specialRequests,
        appliedPromotionId: selectedPromotion?.id,
        promoCode: selectedPromotion?.promoCode,
        finalPrice: totalPrice,
      };

      const response = await apiService.createBooking(bookingPayload);

      Alert.alert(
        'Booking Confirmed!',
        `Your appointment has been scheduled. ${loyaltyPointsToEarn > 0 ? `You'll earn ${loyaltyPointsToEarn} loyalty points!` : ''}`,
        [
          {
            text: 'OK',
            onPress: () => (navigation as any).navigate('BookingConfirmation', { bookingId: response.id }),
          },
        ]
      );
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const brandColors = brandProfile ? {
    primary: brandProfile.primaryColor,
    secondary: brandProfile.secondaryColor,
    accent: brandProfile.accentColor,
  } : undefined;

  const gradientColors: [string, string] = brandColors ? 
    [brandColors.primary, brandColors.secondary] as [string, string] : 
    ['#4CAF50', '#45a049'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Branded Header */}
      <CustomBrandedHeader
        serviceProviderId={bookingData.providerId}
        defaultName={bookingData.providerName}
        onPromotionPress={handlePromotionSelect}
      />

      <ScrollView style={styles.content}>
        {/* Booking Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <View style={styles.bookingCard}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{bookingData.serviceName}</Text>
              <Text style={styles.providerName}>with {bookingData.providerName}</Text>
            </View>
            
            <View style={styles.bookingMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.metaText}>{bookingData.selectedDate}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.metaText}>{bookingData.selectedTime}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="timer-outline" size={16} color="#666" />
                <Text style={styles.metaText}>{bookingData.duration} minutes</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Loyalty Points Widget */}
        <LoyaltyPointsWidget
          serviceProviderId={bookingData.providerId}
          clientId="current-user-id" // Would come from auth context
        />

        {/* Promotions Display */}
        <PromotionDisplay
          serviceProviderId={bookingData.providerId}
          onPromotionSelect={handlePromotionSelect}
          brandColors={brandColors}
        />

        {/* Applied Promotion */}
        {selectedPromotion && (
          <View style={styles.section}>
            <View style={[styles.appliedPromoCard, { borderLeftColor: brandColors?.accent || '#FF5722' }]}>
              <View style={styles.appliedPromoHeader}>
                <Ionicons name="checkmark-circle" size={20} color={brandColors?.accent || '#FF5722'} />
                <Text style={styles.appliedPromoTitle}>Promotion Applied</Text>
                <TouchableOpacity onPress={handleRemovePromotion}>
                  <Ionicons name="close-circle-outline" size={20} color="#999" />
                </TouchableOpacity>
              </View>
              <Text style={styles.appliedPromoName}>{selectedPromotion.title}</Text>
              <Text style={styles.appliedPromoSavings}>
                You're saving $
                {selectedPromotion.type === 'percentage' 
                  ? (bookingData.price * selectedPromotion.value / 100).toFixed(2)
                  : selectedPromotion.value.toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* Special Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Requests (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Any special requests or preferences?"
            value={specialRequests}
            onChangeText={setSpecialRequests}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Service Price</Text>
              <Text style={styles.priceValue}>${bookingData.price.toFixed(2)}</Text>
            </View>
            
            {selectedPromotion && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: brandColors?.accent || '#FF5722' }]}>
                  Promotion Discount
                </Text>
                <Text style={[styles.priceValue, { color: brandColors?.accent || '#FF5722' }]}>
                  -${(bookingData.price - totalPrice).toFixed(2)}
                </Text>
              </View>
            )}
            
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
            </View>

            {loyaltyPointsToEarn > 0 && (
              <View style={styles.loyaltyEarnRow}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.loyaltyEarnText}>
                  You'll earn {loyaltyPointsToEarn} loyalty points
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Confirm Booking Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, loading && styles.disabledButton]}
          onPress={handleBookingConfirm}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ['#ccc', '#999'] as [string, string] : gradientColors}
            style={styles.confirmButtonGradient}
          >
            <Text style={styles.confirmButtonText}>
              {loading ? 'Processing...' : `Confirm Booking - $${totalPrice.toFixed(2)}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  bookingCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  serviceInfo: {
    marginBottom: 15,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  providerName: {
    fontSize: 14,
    color: '#666',
  },
  bookingMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  appliedPromoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  appliedPromoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  appliedPromoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  appliedPromoName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  appliedPromoSavings: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  textInput: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    textAlignVertical: 'top',
  },
  priceCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loyaltyEarnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  loyaltyEarnText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
  },
  confirmButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EnhancedBookingScreen;
