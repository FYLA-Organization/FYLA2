import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Service, ServiceProvider, RootStackParamList, CreateBookingRequest } from '../../types';
import ApiService from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PushNotificationService from '../../services/pushNotificationService';
import FeatureGatingService from '../../services/featureGatingService';

type BookingFlowScreenRouteProp = {
  key: string;
  name: 'BookingFlow';
  params: {
    service: Service;
    provider: ServiceProvider;
  };
};

type BookingFlowScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface TimeSlot {
  time: string;
  available: boolean;
  price?: number;
}

const BookingFlowScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [notes, setNotes] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('credit-card');
  const [loyaltyPointsEarned, setLoyaltyPointsEarned] = useState<any>(null);
  const [canAcceptOnlinePayments, setCanAcceptOnlinePayments] = useState(true);
  const [paymentUpgradeMessage, setPaymentUpgradeMessage] = useState('');
  
  // Card details state
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isCardValid, setIsCardValid] = useState(false);

  const route = useRoute<BookingFlowScreenRouteProp>();
  const navigation = useNavigation<BookingFlowScreenNavigationProp>();
  const { service, provider } = route.params;
  const { isAuthenticated, devLoginClient } = useAuth();

  // Pricing calculations
  const pricing = useMemo(() => {
    const basePrice = service.price;
    const platformFeeRate = 0.05; // 5%
    const taxRate = 0.085; // 8.5% (varies by location)
    
    const platformFee = basePrice * platformFeeRate;
    const subtotal = basePrice + platformFee;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    return {
      basePrice,
      platformFee,
      subtotal,
      tax,
      total,
      platformFeeRate,
      taxRate
    };
  }, [service.price]);

  // Helper function to get payment method display name
  const getPaymentMethodName = useCallback((method: string) => {
    const paymentMethods: { [key: string]: string } = {
      'credit-card': 'Credit/Debit Card',
      'paypal': 'PayPal',
      'apple-pay': 'Apple Pay',
      'google-pay': 'Google Pay',
      'klarna': 'Klarna',
      'bank-transfer': 'Bank Transfer'
    };
    return paymentMethods[method] || 'Credit/Debit Card';
  }, []);

  // Auto-login for testing purposes and check payment permissions
  useEffect(() => {
    const ensureAuthenticated = async () => {
      console.log('=== AUTHENTICATION CHECK ===');
      console.log('isAuthenticated:', isAuthenticated);
      
      if (!isAuthenticated) {
        try {
          console.log('Auto-logging in test user for booking...');
          await devLoginClient();
          console.log('Auto-login completed successfully');
        } catch (error) {
          console.error('Auto-login failed:', error);
          Alert.alert('Authentication Required', 'Please log in to book appointments.');
        }
      } else {
        console.log('User already authenticated');
      }
    };

    const checkPaymentPermissions = async () => {
      try {
        const paymentCheck = await FeatureGatingService.canAcceptOnlinePayments();
        setCanAcceptOnlinePayments(paymentCheck.allowed);
        if (!paymentCheck.allowed) {
          setPaymentUpgradeMessage(paymentCheck.message || '');
          setSelectedPaymentMethod('cash'); // Default to cash if online payments not available
        }
      } catch (error) {
        console.error('Error checking payment permissions:', error);
      }
    };
    
    ensureAuthenticated();
    checkPaymentPermissions();
  }, [isAuthenticated, devLoginClient]);

  const loadAvailableSlots = useCallback(async () => {
    setIsLoadingSlots(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const slots = await ApiService.getAvailability(provider.id, dateStr);
      
      // Transform slots into TimeSlot objects with pricing
      const timeSlots: TimeSlot[] = slots.map(time => ({
        time,
        available: true,
        price: service.price
      }));
      
      setAvailableSlots(timeSlots);
    } catch (error) {
      console.error('Error loading availability:', error);
      Alert.alert('Error', 'Failed to load available time slots');
    } finally {
      setIsLoadingSlots(false);
    }
  }, [selectedDate, provider.id, service.price]);

  useEffect(() => {
    if (currentStep === 2) {
      loadAvailableSlots();
    }
  }, [currentStep, loadAvailableSlots]);

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const formatTime = useCallback((time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }, []);

  const getEndTime = useCallback((startTime: string) => {
    const [hours, minutes] = startTime.split(':');
    const start = new Date();
    start.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    start.setMinutes(start.getMinutes() + service.duration);
    
    const endHours = start.getHours().toString().padStart(2, '0');
    const endMinutes = start.getMinutes().toString().padStart(2, '0');
    return `${endHours}:${endMinutes}`;
  }, [service.duration]);

  const generateDateOptions = useMemo(() => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  }, []);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot('');
    if (currentStep < 2) {
      setCurrentStep(2);
    }
  }, [currentStep]);

  const handleTimeSelect = useCallback((timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    setCurrentStep(3);
  }, []);

  const handleConfirmBooking = async () => {
    if (!selectedTimeSlot) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    console.log('=== BOOKING CREATION DEBUG ===');
    console.log('isAuthenticated:', isAuthenticated);
    
    // Ensure user is authenticated before proceeding
    if (!isAuthenticated) {
      Alert.alert('Authentication Required', 'Please wait for authentication to complete.');
      return;
    }
    
    // Check if we have auth token
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const token = await AsyncStorage.getItem('authToken');
    console.log('Auth token exists:', !!token);
    console.log('Auth token preview:', token ? token.substring(0, 20) + '...' : 'none');

    setIsBooking(true);
    try {
      const bookingData: CreateBookingRequest = {
        serviceProviderId: provider.id,
        serviceId: parseInt(service.id),
        bookingDate: selectedDate.toISOString().split('T')[0],
        startTime: selectedTimeSlot,
        notes: notes || `Booking for ${service.name} via Enhanced Booking Flow. Payment method: ${getPaymentMethodName(selectedPaymentMethod)}. Total amount: $${pricing.total.toFixed(2)}`,
      };

      console.log('Booking data:', bookingData);
      console.log('Selected payment method:', selectedPaymentMethod);
      console.log('Total amount:', pricing.total.toFixed(2));
      const bookingResponse = await ApiService.createBooking(bookingData);
      console.log('Booking created successfully:', bookingResponse);

      // Check if loyalty points were earned
      if (bookingResponse.loyaltyPoints) {
        setLoyaltyPointsEarned(bookingResponse.loyaltyPoints);
        console.log('🎉 Loyalty points earned:', bookingResponse.loyaltyPoints);
        
        // Show loyalty points notification
        Alert.alert(
          'Booking Confirmed! 🎉',
          `Your booking has been confirmed!\n\n🏆 You earned ${bookingResponse.loyaltyPoints.pointsEarned} loyalty points!\nTotal Points: ${bookingResponse.loyaltyPoints.totalPoints}\nMembership: ${bookingResponse.loyaltyPoints.membershipTier}`,
          [
            {
              text: 'Awesome!',
              onPress: () => {
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        // Standard confirmation without loyalty points
        Alert.alert(
          'Booking Confirmed!',
          'Your booking has been confirmed successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              }
            }
          ]
        );
      }

      // Show immediate confirmation notification
      await PushNotificationService.showBookingConfirmation(
        provider.businessName,
        service.name,
        `${formatDate(selectedDate)} at ${formatTime(selectedTimeSlot)}`
      );

      // Schedule reminder notification (1 hour before appointment)
      const appointmentDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTimeSlot.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      try {
        await PushNotificationService.scheduleBookingReminder(
          bookingResponse.booking?.id || bookingResponse.id || 'unknown',
          provider.businessName,
          service.name,
          appointmentDateTime,
          60 // 60 minutes before
        );
        console.log('📅 Booking reminder scheduled');
      } catch (reminderError) {
        console.warn('⚠️ Failed to schedule reminder:', reminderError);
      }

      setShowConfirmation(true);
      
      // Don't auto-navigate - let the user dismiss the alert to navigate

    } catch (error: any) {
      console.error('Error creating booking:', error);
      console.error('Error details:', error.response?.data);
      Alert.alert('Booking Failed', 'Sorry, we couldn\'t complete your booking. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      {/* Step Circles and Lines */}
      <View style={styles.stepIndicator}>
        {[1, 2, 3, 4].map((step) => (
          <React.Fragment key={step}>
            <View style={styles.stepItemContainer}>
              <View style={[
                styles.stepCircle,
                currentStep >= step && styles.activeStepCircle
              ]}>
                {currentStep > step ? (
                  <Ionicons name="checkmark" size={20} color="#667eea" />
                ) : (
                  <Text style={[
                    styles.stepNumber,
                    currentStep >= step && styles.activeStepNumber
                  ]}>
                    {step}
                  </Text>
                )}
              </View>
              <Text style={[styles.stepLabel, currentStep >= step && styles.activeStepLabel]}>
                {step === 1 ? 'Date' : step === 2 ? 'Time' : step === 3 ? 'Review' : 'Payment'}
              </Text>
            </View>
            {step < 4 && (
              <View style={styles.stepLineContainer}>
                <View style={[
                  styles.stepLine,
                  currentStep > step && styles.activeStepLine
                ]} />
              </View>
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderDateSelection();
      case 2:
        return renderTimeSelection();
      case 3:
        return renderBookingReview();
      case 4:
        return renderPaymentStep();
      default:
        return renderDateSelection();
    }
  };

  const renderDateSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Date</Text>
      <Text style={styles.stepSubtitle}>Choose your preferred appointment date</Text>
      
      <View style={styles.dateGrid}>
        {generateDateOptions.map((date, index) => {
          const isSelected = selectedDate.toDateString() === date.toDateString();
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateCard, 
                isSelected && styles.selectedDateCard,
                (index + 1) % 3 === 0 && styles.dateCardLastInRow
              ]}
              onPress={() => handleDateSelect(date)}
            >
              <Text style={[styles.dateDay, isSelected && styles.selectedDateText]}>
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text style={[styles.dateNumber, isSelected && styles.selectedDateText]}>
                {date.getDate()}
              </Text>
              <Text style={[styles.dateMonth, isSelected && styles.selectedDateText]}>
                {date.toLocaleDateString('en-US', { month: 'short' })}
              </Text>
              {isToday && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayText}>TODAY</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderTimeSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Time</Text>
      <Text style={styles.stepSubtitle}>
        Available slots for {formatDate(selectedDate)}
      </Text>
      
      {isLoadingSlots ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading available times...</Text>
        </View>
      ) : (
        <View style={styles.timeSlotsContainer}>
          {availableSlots.length === 0 ? (
            <View style={styles.noSlotsContainer}>
              <Ionicons name="calendar-outline" size={48} color="rgba(255, 255, 255, 0.6)" />
              <Text style={styles.noSlotsText}>No available slots for this date</Text>
              <TouchableOpacity 
                style={styles.changeDateButton}
                onPress={() => setCurrentStep(1)}
              >
                <Text style={styles.changeDateText}>Choose Different Date</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.timeGrid}>
              {availableSlots.map((slot, index) => {
                const isSelected = selectedTimeSlot === slot.time;
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeSlot,
                      isSelected && styles.selectedTimeSlot,
                      !slot.available && styles.unavailableTimeSlot
                    ]}
                    onPress={() => slot.available && handleTimeSelect(slot.time)}
                    disabled={!slot.available}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      isSelected && styles.selectedTimeSlotText,
                      !slot.available && styles.unavailableTimeSlotText
                    ]}>
                      {formatTime(slot.time)}
                    </Text>
                    {slot.available && (
                      <Text style={[
                        styles.timeSlotPrice,
                        isSelected && styles.selectedTimeSlotPrice
                      ]}>
                        ${slot.price}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderBookingReview = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review Booking</Text>
      <Text style={styles.stepSubtitle}>Confirm your appointment details</Text>
      
      <View style={styles.reviewCard}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.providerName}>{provider.businessName}</Text>
        </View>
        
        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color="white" />
            <Text style={styles.detailText}>{formatDate(selectedDate)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color="white" />
            <Text style={styles.detailText}>
              {formatTime(selectedTimeSlot)} - {formatTime(getEndTime(selectedTimeSlot))}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time" size={20} color="white" />
            <Text style={styles.detailText}>{service.duration} minutes</Text>
          </View>
          
          <View style={[styles.detailRow, styles.priceRow]}>
            <Ionicons name="card-outline" size={20} color="#FFD700" />
            <Text style={styles.priceText}>${service.price}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setCurrentStep(2)}
        >
          <Text style={styles.backButtonText}>Change Time</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => setCurrentStep(4)}
        >
          <Text style={styles.confirmButtonText}>Continue to Payment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handlePaymentSelection = useCallback((paymentMethod: string) => {
    setSelectedPaymentMethod(paymentMethod);
  }, []);

  // Card formatting and validation functions
  const formatCardNumber = useCallback((value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  }, []);

  const formatExpiryDate = useCallback((value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  }, []);

  const validateCard = useMemo(() => {
    const isCardNumberValid = cardNumber.replace(/\s/g, '').length >= 13;
    const isExpiryValid = expiryDate.length === 5;
    const isCvvValid = cvv.length >= 3;
    const isNameValid = cardholderName.trim().length >= 2;
    
    return isCardNumberValid && isExpiryValid && isCvvValid && isNameValid;
  }, [cardNumber, expiryDate, cvv, cardholderName]);

  // Update isCardValid when validation changes
  useEffect(() => {
    setIsCardValid(validateCard);
  }, [validateCard]);

  const handleCardNumberChange = useCallback((value: string) => {
    const formatted = formatCardNumber(value);
    if (formatted.length <= 19) { // 16 digits + 3 spaces
      setCardNumber(formatted);
    }
  }, [formatCardNumber]);

  const handleExpiryChange = useCallback((value: string) => {
    const formatted = formatExpiryDate(value);
    if (formatted.length <= 5) {
      setExpiryDate(formatted);
    }
  }, [formatExpiryDate]);

  const handleCvvChange = useCallback((value: string) => {
    const v = value.replace(/[^0-9]/gi, '');
    if (v.length <= 4) {
      setCvv(v);
    }
  }, []);

  const renderPaymentMethod = (id: string, icon: string, name: string, description: string, color: string = "#666") => (
    <TouchableOpacity 
      key={id}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: selectedPaymentMethod === id ? '#007AFF' : '#E0E0E0',
          backgroundColor: selectedPaymentMethod === id ? '#E8F4FF' : 'white',
        }
      ]}
      onPress={() => handlePaymentSelection(id)}
    >
      <Ionicons name={icon as any} size={20} color={color} />
      <View style={{ marginLeft: 8, flex: 1 }}>
        <Text style={{ 
          fontSize: 14, 
          fontWeight: selectedPaymentMethod === id ? '600' : 'normal',
          color: '#333'
        }}>
          {name}
        </Text>
        <Text style={{ fontSize: 11, color: '#666' }}>{description}</Text>
      </View>
      {selectedPaymentMethod === id && (
        <Ionicons name="checkmark-circle" size={18} color="#007AFF" />
      )}
    </TouchableOpacity>
  );

  const renderEnhancedPaymentMethod = (id: string, icon: string, name: string, description: string, color: string = "#666") => (
    <TouchableOpacity 
      key={id}
      style={[
        styles.enhancedPaymentMethodCard,
        selectedPaymentMethod === id && styles.selectedPaymentMethodCard
      ]}
      onPress={() => handlePaymentSelection(id)}
    >
      <View style={styles.paymentMethodIcon}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={[
        styles.paymentMethodName,
        selectedPaymentMethod === id && styles.selectedPaymentMethodName
      ]}>
        {name}
      </Text>
      <Text style={styles.paymentMethodDescription}>{description}</Text>
      {selectedPaymentMethod === id && (
        <View style={styles.selectedIndicator}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderPaymentStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      {/* Enhanced Header with Gradient */}
      <LinearGradient 
        colors={['#667eea', '#764ba2']} 
        style={styles.enhancedPaymentHeader}
      >
        <View style={styles.serviceHeaderRow}>
          <View style={styles.serviceInfo}>
            <Text style={styles.enhancedServiceName}>{service.name}</Text>
            <Text style={styles.enhancedProviderName}>{provider.businessName}</Text>
          </View>
          <View style={styles.totalDisplayEnhanced}>
            <Text style={styles.totalLabelEnhanced}>Total</Text>
            <Text style={styles.totalAmountEnhanced}>${pricing.total.toFixed(2)}</Text>
          </View>
        </View>
        
        <View style={styles.appointmentRowEnhanced}>
          <View style={styles.appointmentDetailEnhanced}>
            <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.9)" />
            <Text style={styles.appointmentTextEnhanced}>{formatDate(selectedDate)}</Text>
          </View>
          <View style={styles.appointmentDetailEnhanced}>
            <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.9)" />
            <Text style={styles.appointmentTextEnhanced}>{formatTime(selectedTimeSlot)}</Text>
          </View>
          <View style={styles.appointmentDetailEnhanced}>
            <Ionicons name="hourglass-outline" size={16} color="rgba(255,255,255,0.9)" />
            <Text style={styles.appointmentTextEnhanced}>{service.duration}min</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Payment Methods Section */}
      <View style={styles.enhancedPaymentSection}>
        <Text style={styles.enhancedSectionTitle}>💳 Select Payment Method</Text>
        
        {!canAcceptOnlinePayments && paymentUpgradeMessage && (
          <View style={styles.upgradeNotice}>
            <View style={styles.upgradeNoticeContent}>
              <Ionicons name="lock-closed" size={20} color="#F59E0B" />
              <Text style={styles.upgradeNoticeText}>{paymentUpgradeMessage}</Text>
            </View>
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => navigation.navigate('SubscriptionPlans')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.paymentMethodsGridContainer}>
          {/* Always show cash payment */}
          {renderEnhancedPaymentMethod('cash', 'cash-outline', 'Cash Payment', 'Pay at appointment', '#10B981')}
          
          {/* Online payment methods - gated by subscription */}
          {canAcceptOnlinePayments && (
            <>
              {renderEnhancedPaymentMethod('credit-card', 'card-outline', 'Credit/Debit Card', 'Visa, Mastercard, Amex', '#007AFF')}
              {renderEnhancedPaymentMethod('paypal', 'logo-paypal', 'PayPal', 'PayPal account', '#0070BA')}
              {renderEnhancedPaymentMethod('apple-pay', 'logo-apple', 'Apple Pay', 'Touch/Face ID', '#000')}
              {renderEnhancedPaymentMethod('google-pay', 'logo-google', 'Google Pay', 'Google account', '#4285F4')}
            </>
          )}
        </View>
      </View>

      {/* Card Details Form - Only show when credit card is selected */}
      {selectedPaymentMethod === 'credit-card' && (
        <View style={styles.cardDetailsSection}>
          <Text style={styles.enhancedSectionTitle}>💳 Card Details</Text>
          
          <View style={styles.cardForm}>
            <View style={styles.cardInputContainer}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.cardInput}
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChangeText={handleCardNumberChange}
                keyboardType="numeric"
                maxLength={19}
              />
              <Ionicons name="card-outline" size={20} color="#666" style={styles.inputIcon} />
            </View>

            <View style={styles.cardRowInputs}>
              <View style={[styles.cardInputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Expiry Date</Text>
                <TextInput
                  style={styles.cardInput}
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChangeText={handleExpiryChange}
                  keyboardType="numeric"
                  maxLength={5}
                />
                <Ionicons name="calendar-outline" size={16} color="#666" style={styles.inputIcon} />
              </View>

              <View style={[styles.cardInputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>CVV</Text>
                <TextInput
                  style={styles.cardInput}
                  placeholder="123"
                  value={cvv}
                  onChangeText={handleCvvChange}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
                <Ionicons name="lock-closed-outline" size={16} color="#666" style={styles.inputIcon} />
              </View>
            </View>

            <View style={styles.cardInputContainer}>
              <Text style={styles.inputLabel}>Cardholder Name</Text>
              <TextInput
                style={styles.cardInput}
                placeholder="John Doe"
                value={cardholderName}
                onChangeText={setCardholderName}
                autoCapitalize="words"
              />
              <Ionicons name="person-outline" size={16} color="#666" style={styles.inputIcon} />
            </View>
          </View>
        </View>
      )}

      {/* Price Breakdown */}
      <View style={styles.enhancedPriceSection}>
        <Text style={styles.enhancedSectionTitle}>💰 Price Breakdown</Text>
        <View style={styles.priceBreakdownCard}>
          <View style={styles.priceRowEnhanced}>
            <Text style={styles.priceLabelEnhanced}>Service Fee</Text>
            <Text style={styles.priceValueEnhanced}>${pricing.basePrice.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRowEnhanced}>
            <Text style={styles.priceLabelEnhanced}>Platform Fee ({(pricing.platformFeeRate * 100).toFixed(1)}%)</Text>
            <Text style={styles.priceValueEnhanced}>${pricing.platformFee.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRowEnhanced}>
            <Text style={styles.priceLabelEnhanced}>Tax ({(pricing.taxRate * 100).toFixed(1)}%)</Text>
            <Text style={styles.priceValueEnhanced}>${pricing.tax.toFixed(2)}</Text>
          </View>
          <View style={[styles.priceRowEnhanced, styles.totalPriceRowEnhanced]}>
            <Text style={styles.totalPriceLabelEnhanced}>Total Amount</Text>
            <Text style={styles.totalPriceValueEnhanced}>${pricing.total.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Security & Policy Notice */}
      <View style={styles.enhancedSecurityNotice}>
        <View style={styles.securityRow}>
          <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
          <Text style={styles.securityText}>Your payment is secured with 256-bit SSL encryption</Text>
        </View>
        <View style={styles.securityRow}>
          <Ionicons name="refresh" size={20} color="#FF9800" />
          <Text style={styles.securityText}>Free cancellation up to 24 hours before appointment</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.enhancedActionButtons}>
        <TouchableOpacity 
          style={styles.enhancedBackButton}
          onPress={() => setCurrentStep(3)}
        >
          <Ionicons name="arrow-back" size={20} color="#666" />
          <Text style={styles.enhancedBackButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.enhancedPayButton,
            (!selectedPaymentMethod || isBooking || (selectedPaymentMethod === 'credit-card' && !validateCard)) && styles.disabledPayButton
          ]}
          onPress={handleConfirmBooking}
          disabled={!selectedPaymentMethod || isBooking || (selectedPaymentMethod === 'credit-card' && !validateCard)}
        >
          <LinearGradient 
            colors={['#667eea', '#764ba2']} 
            style={styles.payButtonGradient}
          >
            {isBooking ? (
              <View style={styles.paymentLoadingContainer}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.enhancedPayButtonText}>Processing...</Text>
              </View>
            ) : (
              <View style={styles.payButtonContent}>
                <Ionicons name="card-outline" size={24} color="white" />
                <Text style={styles.enhancedPayButtonText}>
                  Pay ${pricing.total.toFixed(2)}
                </Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const handlePaymentSuccess = async () => {
    // Create the actual booking after successful payment
    await handleConfirmBooking();
  };

  // Quick test function for notifications
  const testNotification = async () => {
    try {
      // Test immediate notification
      await PushNotificationService.showBookingConfirmation(
        'Test Spa',
        'Test Service',
        'Today at 3:00 PM'
      );
      
      // Test scheduled notification (5 seconds from now)
      const testTime = new Date();
      testTime.setSeconds(testTime.getSeconds() + 5);
      
      await PushNotificationService.scheduleBookingReminder(
        'test-123',
        'Test Spa',
        'Test Reminder',
        testTime,
        0 // 0 minutes before = immediate when time hits
      );
      
      Alert.alert('Test Sent!', 'Check for immediate notification + reminder in 5 seconds');
    } catch (error) {
      console.error('Test failed:', error);
      Alert.alert('Test Failed', 'Check console for details');
    }
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.headerBackButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Appointment</Text>
          <TouchableOpacity 
            style={styles.testButton}
            onPress={testNotification}
          >
            <Ionicons name="flask" size={20} color="white" />
          </TouchableOpacity>
        </View>
        
        {renderStepIndicator()}
      </LinearGradient>

      {/* Step Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showConfirmation}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#27AE60" />
            </View>
            <Text style={styles.successTitle}>Booking Confirmed!</Text>
            <Text style={styles.successMessage}>
              Your appointment with {provider.businessName} has been successfully booked.
            </Text>
            <View style={styles.successDetails}>
              <Text style={styles.successDetailText}>
                📅 {formatDate(selectedDate)}
              </Text>
              <Text style={styles.successDetailText}>
                ⏰ {formatTime(selectedTimeSlot)}
              </Text>
              <Text style={styles.successDetailText}>
                💰 ${service.price}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerBackButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 40,
  },
  testButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  stepIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
  },
  stepItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 8,
  },
  activeStepCircle: {
    backgroundColor: 'white',
    borderColor: 'white',
    shadowColor: 'rgba(255, 255, 255, 0.4)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
    transform: [{ scale: 1.1 }],
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.3,
  },
  activeStepNumber: {
    color: '#667eea',
    fontSize: 20,
  },
  stepLineContainer: {
    flex: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22, // Half of circle height to center line with circles
  },
  stepLine: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
  },
  activeStepLine: {
    backgroundColor: 'white',
    shadowColor: 'rgba(255, 255, 255, 0.6)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  stepLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  stepLabelItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    flex: 1,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    paddingHorizontal: 20,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 14,
    minWidth: 44,
  },
  activeStepLabel: {
    color: 'white',
    fontWeight: '800',
    fontSize: 13,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  stepSubtitle: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 32,
    fontWeight: '500',
    lineHeight: 24,
  },
  dateScroll: {
    marginBottom: 24,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 24,
  },
  dateCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    width: '31%',
    minHeight: 100,
    marginRight: '3.5%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
    justifyContent: 'center',
  },
  dateCardLastInRow: {
    marginRight: 0,
  },
  selectedDateCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'white',
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  dateDay: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  dateNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  dateMonth: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  selectedDateText: {
    color: 'white',
  },
  todayBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  todayText: {
    fontSize: 9,
    color: 'white',
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  timeSlotsContainer: {
    flex: 1,
  },
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 4,
  },
  noSlotsText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 16,
    marginBottom: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  changeDateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  changeDateText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  timeSlot: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    width: '47%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  selectedTimeSlot: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'white',
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  unavailableTimeSlot: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.2,
  },
  selectedTimeSlotText: {
    color: 'white',
    fontWeight: '800',
  },
  unavailableTimeSlotText: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  timeSlotPrice: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 6,
    fontWeight: '600',
  },
  selectedTimeSlotPrice: {
    color: 'white',
    fontWeight: '700',
  },
  reviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 28,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  serviceInfo: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  serviceName: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  providerName: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  bookingDetails: {
    gap: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 17,
    color: 'white',
    marginLeft: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  priceRow: {
    marginTop: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  priceText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFD700',
    marginLeft: 16,
    letterSpacing: 0.2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.3,
    opacity: 0.9,
  },
  confirmButton: {
    flex: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
    shadowColor: 'rgba(255, 215, 0, 0.3)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 32,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 20,
    maxWidth: '90%',
    minWidth: 300,
  },
  successIcon: {
    marginBottom: 24,
    shadowColor: 'rgba(39, 174, 96, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    marginBottom: 16,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 17,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 26,
    fontWeight: '500',
  },
  successDetails: {
    gap: 12,
    alignItems: 'center',
  },
  successDetailText: {
    fontSize: 17,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  // Payment Step Styles
  paymentHeader: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  totalDisplay: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  appointmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  appointmentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appointmentText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  paymentContentContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  paymentMethodsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceBreakdownContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  paymentMethodsList: {
    gap: 8,
  },
  priceList: {
    gap: 8,
  },
  priceRowNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalPriceRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
    marginTop: 4,
  },
  totalPriceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalPriceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  compactNotice: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  noticeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  compactBackButton: {
    flex: 0,
    minWidth: 80,
    paddingHorizontal: 16,
  },
  expandedPayButton: {
    flex: 1,
    marginLeft: 12,
  },
  paymentLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Enhanced Payment Step Styles
  enhancedPaymentHeader: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  enhancedServiceName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  enhancedProviderName: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  totalDisplayEnhanced: {
    alignItems: 'flex-end',
  },
  totalLabelEnhanced: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  totalAmountEnhanced: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  appointmentRowEnhanced: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  appointmentDetailEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appointmentTextEnhanced: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 6,
    fontWeight: '500',
  },
  enhancedPaymentSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  enhancedSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  paymentMethodsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  enhancedPaymentMethodCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    position: 'relative',
  },
  selectedPaymentMethodCard: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  paymentMethodIcon: {
    marginBottom: 8,
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  selectedPaymentMethodName: {
    color: '#2E7D32',
  },
  paymentMethodDescription: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  cardDetailsSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardForm: {
    gap: 16,
  },
  cardInputContainer: {
    position: 'relative',
  },
  cardRowInputs: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  cardInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 16,
    paddingRight: 44,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    fontWeight: '500',
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
    top: 36,
  },
  enhancedPriceSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  priceBreakdownCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  priceRowEnhanced: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabelEnhanced: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  priceValueEnhanced: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalPriceRowEnhanced: {
    borderTopWidth: 2,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginTop: 8,
  },
  totalPriceLabelEnhanced: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalPriceValueEnhanced: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  enhancedSecurityNotice: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 12,
    fontWeight: '500',
    flex: 1,
  },
  enhancedActionButtons: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 20,
  },
  enhancedBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 16,
    minWidth: 100,
  },
  enhancedBackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  enhancedPayButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledPayButton: {
    opacity: 0.5,
  },
  payButtonGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enhancedPayButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  
  // Feature gating styles
  upgradeNotice: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  upgradeNoticeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeNoticeText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  upgradeButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BookingFlowScreen;
