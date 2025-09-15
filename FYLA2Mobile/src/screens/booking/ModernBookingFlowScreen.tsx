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
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Service, ServiceProvider, RootStackParamList, CreateBookingRequest, AvailableDay } from '../../types';
import ApiService from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/colors';
import { MODERN_COLORS } from '../../constants/modernDesign';

const { width } = Dimensions.get('window');

type ModernBookingFlowScreenRouteProp = {
  key: string;
  name: 'BookingFlow';
  params: {
    service: Service;
    provider: ServiceProvider;
  };
};

type ModernBookingFlowScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  price?: number;
  isPeakTime?: boolean;
  unavailableReason?: string;
}

interface DaySchedule {
  date: Date;
  isWorkingDay: boolean;
  startTime?: string;
  endTime?: string;
  timeSlots: TimeSlot[];
  totalAppointments: number;
  hasAvailableSlots: boolean;
}

const ModernBookingFlowScreen: React.FC = () => {
  // Navigation and route
  const route = useRoute<ModernBookingFlowScreenRouteProp>();
  const navigation = useNavigation<ModernBookingFlowScreenNavigationProp>();
  const { service, provider } = route.params;
  const { isAuthenticated, devLoginClient } = useAuth();

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [daySchedule, setDaySchedule] = useState<DaySchedule | null>(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [availableDays, setAvailableDays] = useState<AvailableDay[]>([]);
  const [isLoadingDays, setIsLoadingDays] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [notes, setNotes] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('credit-card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);

  // Pricing calculations with dynamic pricing
  const pricing = useMemo(() => {
    let basePrice = service.price;
    
    // Apply peak time pricing if selected slot is during peak hours
    if (selectedTimeSlot?.isPeakTime) {
      basePrice = basePrice * 1.2; // 20% surge for peak times
    }
    
    const platformFeeRate = 0.03; // Reduced to 3%
    const taxRate = 0.085; // 8.5%
    
    const platformFee = basePrice * platformFeeRate;
    const subtotal = basePrice + platformFee;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    return {
      basePrice,
      originalPrice: service.price,
      platformFee,
      subtotal,
      tax,
      total,
      platformFeeRate,
      taxRate,
      isPeakPricing: selectedTimeSlot?.isPeakTime || false
    };
  }, [service.price, selectedTimeSlot]);

  // Auto-authentication
  useEffect(() => {
    const ensureAuthenticated = async () => {
      if (!isAuthenticated) {
        try {
          await devLoginClient();
        } catch (error) {
          console.error('Auto-login failed:', error);
          Alert.alert('Authentication Required', 'Please log in to book appointments.');
        }
      }
    };
    ensureAuthenticated();
  }, [isAuthenticated, devLoginClient]);

  // Load provider schedule for selected date
  const loadProviderSchedule = useCallback(async (date: Date) => {
    setIsLoadingSchedule(true);
    try {
      // Use getAvailableSlots method from enhanced apiService
      const slots = await ApiService.getAvailableSlots(provider.id, service.id, date.toISOString().split('T')[0]);
      
      console.log('📊 Raw API response for slots:', slots);
      console.log('📊 Slots type:', typeof slots, 'Is array:', Array.isArray(slots));
      
      let timeSlots: TimeSlot[];
      
      // If no slots are returned from API, respect the backend decision
      if (!slots || slots.length === 0) {
                console.log("No slots returned from API - provider may be unavailable or done for the day");
        timeSlots = [];
      } else if (slots.length === 1 && slots[0].unavailableReason?.includes("Provider is done for today")) {
        // Handle the special case where backend returns a single "done for today" message
        console.log('Provider is done for today - backend returned special message slot');
        timeSlots = slots.map((slot: any) => ({
          startTime: '00:00', // Dummy time, won't be displayed
          endTime: '00:00',
          isAvailable: false,
          price: slot.price || service.price,
          isPeakTime: false,
          unavailableReason: slot.unavailableReason
        }));
      } else {
        console.log('📊 First slot sample:', slots[0]);
        // Process API response - slots are now objects with startTime, endTime, isAvailable, etc.
        timeSlots = slots.map((slot: any, index: number) => {
          console.log(`📊 Processing slot ${index}:`, slot);
          
          // Safely extract time string from DateTime object
          let startTimeStr: string;
          let endTimeStr: string;
          
          try {
            if (typeof slot.startTime === 'string' && slot.startTime.includes('T')) {
              // ISO DateTime format
              startTimeStr = new Date(slot.startTime).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false 
              });
            } else if (typeof slot.startTime === 'string') {
              // Already time format
              startTimeStr = slot.startTime;
            } else {
              console.warn('⚠️ Unexpected startTime format:', slot.startTime);
              startTimeStr = '09:00'; // fallback
            }
            
            if (typeof slot.endTime === 'string' && slot.endTime.includes('T')) {
              // ISO DateTime format
              endTimeStr = new Date(slot.endTime).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false 
              });
            } else if (typeof slot.endTime === 'string') {
              // Already time format
              endTimeStr = slot.endTime;
            } else {
              console.warn('⚠️ Unexpected endTime format:', slot.endTime);
              endTimeStr = getEndTime(startTimeStr); // fallback
            }
          } catch (error) {
            console.error('📊 Error processing slot times:', error, slot);
            startTimeStr = '09:00';
            endTimeStr = '10:00';
          }
          
          console.log(`📊 Converted times - Start: ${startTimeStr}, End: ${endTimeStr}`);
          
          return {
            startTime: startTimeStr,
            endTime: endTimeStr,
            isAvailable: slot.isAvailable,
            price: slot.price || service.price,
            isPeakTime: isPeakHour(startTimeStr),
            unavailableReason: slot.unavailableReason
          };
        });
      }
      
      setDaySchedule({
        date,
        isWorkingDay: timeSlots.length > 0,
        timeSlots,
        totalAppointments: 0,
        hasAvailableSlots: timeSlots.some(slot => slot.isAvailable)
      });
    } catch (error) {
      console.error('Error loading schedule:', error);
      Alert.alert('Error', 'Failed to load available time slots');
    } finally {
      setIsLoadingSchedule(false);
    }
  }, [provider.id, service.price]);

  // Helper function to determine peak hours
  const isPeakHour = (timeString: string): boolean => {
    if (!timeString || typeof timeString !== 'string') {
      console.warn('isPeakHour called with invalid timeString:', timeString);
      return false;
    }
    try {
      const hour = parseInt(timeString.split(':')[0]);
      // Peak hours: 10am-2pm and 6pm-8pm
      return (hour >= 10 && hour < 14) || (hour >= 18 && hour < 20);
    } catch (error) {
      console.error('Error in isPeakHour:', error, 'timeString:', timeString);
      return false;
    }
  };

  // Calculate end time based on service duration
  const getEndTime = useCallback((startTime: string) => {
    if (!startTime || typeof startTime !== 'string') {
      console.warn('getEndTime called with invalid startTime:', startTime);
      return '00:00';
    }
    try {
      const [hours, minutes] = startTime.split(':');
      const start = new Date();
      start.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      start.setMinutes(start.getMinutes() + service.duration);
      
      const endHours = start.getHours().toString().padStart(2, '0');
      const endMinutes = start.getMinutes().toString().padStart(2, '0');
      return `${endHours}:${endMinutes}`;
    } catch (error) {
      console.error('Error in getEndTime:', error, 'startTime:', startTime);
      return '00:00';
    }
  }, [service.duration]);

  // Load available days for the provider
  const loadAvailableDays = useCallback(async () => {
    setIsLoadingDays(true);
    try {
      const today = new Date();
      const startDateStr = today.toISOString().split('T')[0];
      
      const response = await ApiService.getAvailableDays(
        provider.id,
        service.id.toString(),
        startDateStr,
        14
      );
      
      console.log('Available days response:', response);
      
      // Convert date strings back to Date objects
      const daysWithDates = response.map((day: any) => ({
        ...day,
        date: new Date(day.date)
      }));
      
      setAvailableDays(daysWithDates);
      
      // If current selected date is not available, select first available date
      const selectedDateStr = selectedDate.toDateString();
      const isSelectedDateAvailable = daysWithDates.some((day: AvailableDay) => 
        day.date.toDateString() === selectedDateStr
      );
      
      if (!isSelectedDateAvailable && daysWithDates.length > 0) {
        setSelectedDate(daysWithDates[0].date);
      }
    } catch (error) {
      console.error('Error loading available days:', error);
      // Fallback to showing all days if API fails
      const dates = [];
      const today = new Date();
      
      for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push({
          date,
          dayOfWeek: date.toLocaleDateString('en', { weekday: 'long' }),
          isAvailable: true,
          workingHours: undefined
        });
      }
      setAvailableDays(dates);
    } finally {
      setIsLoadingDays(false);
    }
  }, [provider.id, service.id, selectedDate]);

  // Load schedule on initial load with today's date
  useEffect(() => {
    loadProviderSchedule(selectedDate);
  }, [loadProviderSchedule]); // Only run once on mount

  // Load available days on component mount
  useEffect(() => {
    loadAvailableDays();
  }, [loadAvailableDays]);

  // Generate date options from available days
  const dateOptions = useMemo(() => {
    return availableDays.map(day => day.date);
  }, [availableDays]);

  // Fallback date options for when availableDays is empty (loading state)
  const fallbackDateOptions = useMemo(() => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  }, []);

  // Format functions
  const formatDate = useCallback((date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  }, []);

  const formatTime = useCallback((time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }, []);

  // Event handlers
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    loadProviderSchedule(date);
  }, [loadProviderSchedule]);

  const handleTimeSelect = useCallback((timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
    // Automatically advance to payment when both date and time are selected
    if (currentStep === 1) {
      setTimeout(() => {
        setCurrentStep(2);
      }, 500); // Small delay for better UX
    }
  }, [currentStep]);

  const handleConfirmBooking = async () => {
    if (!selectedTimeSlot) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    if (!isAuthenticated) {
      Alert.alert('Authentication Required', 'Please wait for authentication to complete.');
      return;
    }

    // Prevent multiple submissions
    if (isBooking) {
      console.log('Already booking, ignoring duplicate request');
      return;
    }

    setIsBooking(true);
    try {
      const bookingData: CreateBookingRequest = {
        serviceId: parseInt(service.id),
        serviceProviderId: provider.id,
        bookingDate: selectedDate.toISOString().split('T')[0], // "2025-09-11"
        startTime: selectedTimeSlot.startTime, // "14:00"
        notes: notes || `Modern booking for ${service.name}. Payment: ${selectedPaymentMethod}. Total: $${pricing.total.toFixed(2)}`,
      };

      console.log('Creating booking:', bookingData);
      const result = await ApiService.createBooking(bookingData);
      
      console.log('✅ Booking created successfully:', result);
      
      // Check if this was a direct fetch success (indicating 405 workaround)
      if (result.isDirectFetch) {
        console.log('🎉 Direct fetch success - showing enhanced success message');
        setShowConfirmation(true);
        
        // Show enhanced success message with positive reinforcement
        setTimeout(() => {
          Alert.alert(
            '🎉 Booking Confirmed!',
            `Excellent! Your booking for "${service.name}" has been successfully created despite a network hiccup. You're all set! 🌟`,
            [
              { 
                text: '📋 View My Bookings', 
                onPress: () => {
                  setShowConfirmation(false);
                  navigation.navigate('Bookings');
                },
                style: 'default'
              },
              { text: 'Perfect!', style: 'cancel' }
            ]
          );
        }, 1500);
      } else {
        // Regular success
        setShowConfirmation(true);
        
        // Navigate to booking details if we have a booking ID
        if (result.booking?.id) {
          setTimeout(() => {
            navigation.navigate('BookingDetails', { bookingId: result.booking.id });
          }, 2000);
        } else {
          // Fallback to bookings list
          setTimeout(() => {
            navigation.navigate('Bookings');
          }, 2000);
        }
      }
      
    } catch (error: any) {
      console.error('Booking error:', error);
      
      // Check if this is our enhanced error indicating potential success
      if (error.isPotentialSuccess) {
        console.log('🎉 Detected potential success case - showing optimistic success message');
        
        // Show success confirmation but with a note about verification
        setShowConfirmation(true);
        setIsBooking(false);
        
        // Also show a secondary alert with instructions
        setTimeout(() => {
          Alert.alert(
            '🎉 Booking Likely Successful!',
            'Your booking has been submitted successfully! There was a minor network issue with the confirmation, but we believe your booking was created. You can verify this in your bookings list.',
            [
              { 
                text: '📋 View My Bookings', 
                onPress: () => {
                  setShowConfirmation(false);
                  navigation.navigate('Bookings');
                },
                style: 'default'
              },
              { text: '✅ Got It', style: 'cancel' }
            ]
          );
        }, 1000);
        
        return; // Exit early to prevent other error handling
      }
      
      setIsBooking(false);
      
      // Handle standard errors
      if (error.response?.status === 405) {
        console.log('Got 405 error, showing helpful message...');
        
        Alert.alert(
          '🤔 Booking Status Unclear',
          'There was a network issue during booking submission. Your booking may have been created successfully. Please check your bookings list to verify.',
          [
            { 
              text: '📋 Check My Bookings', 
              onPress: () => navigation.navigate('Bookings'),
              style: 'default'
            },
            { text: 'Try Again', style: 'cancel' }
          ]
        );
      } else {
        // Handle other errors
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
        Alert.alert(
          '❌ Booking Failed',
          `There was an error creating your booking: ${errorMessage}. Please try again.`,
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsBooking(false);
    }
  };

  const handleDismissConfirmation = () => {
    setShowConfirmation(false);
    navigation.goBack();
  };

  // Step navigation
  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBackPress = () => {
    if (currentStep > 1) {
      goToPreviousStep();
    } else {
      navigation.goBack();
    }
  };

  // Step indicator component
  const StepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            currentStep >= step ? styles.stepCircleActive : styles.stepCircleInactive
          ]}>
            {currentStep > step ? (
              <Ionicons name="checkmark" size={16} color="white" />
            ) : (
              <Text style={[
                styles.stepNumber,
                currentStep >= step ? styles.stepNumberActive : styles.stepNumberInactive
              ]}>
                {step}
              </Text>
            )}
          </View>
          <Text style={[
            styles.stepLabel,
            currentStep >= step ? styles.stepLabelActive : styles.stepLabelInactive
          ]}>
            {step === 1 ? 'Date & Time' : step === 2 ? 'Payment' : 'Confirm'}
          </Text>
        </View>
      ))}
    </View>
  );

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Select Date & Time</Text>
            <Text style={styles.stepDescription}>Choose when you'd like to book your appointment</Text>
            
            {/* Date Selection */}
            <Text style={styles.sectionTitle}>Select a Date</Text>
            {isLoadingDays ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={MODERN_COLORS.primary} />
                <Text style={styles.loadingText}>Loading available dates...</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateSelector}>
                {(dateOptions.length > 0 ? dateOptions : fallbackDateOptions).map((date, index) => {
                  const availableDay = availableDays.find(day => 
                    day.date.toDateString() === date.toDateString()
                  );
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dateOption,
                        selectedDate.toDateString() === date.toDateString() && styles.dateOptionSelected
                      ]}
                      onPress={() => handleDateSelect(date)}
                    >
                      <Text style={[
                        styles.dateDay,
                        selectedDate.toDateString() === date.toDateString() && styles.dateDaySelected
                      ]}>
                        {date.getDate()}
                      </Text>
                      <Text style={[
                        styles.dateLabel,
                        selectedDate.toDateString() === date.toDateString() && styles.dateLabelSelected
                      ]}>
                        {formatDate(date)}
                      </Text>
                      {availableDay?.workingHours && (
                        <Text style={[
                          styles.workingHours,
                          selectedDate.toDateString() === date.toDateString() && styles.workingHoursSelected
                        ]}>
                          {availableDay.workingHours}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            
            {/* Time Selection */}
            {selectedDate && (
              <View style={styles.timeSelectionContainer}>
                <Text style={styles.sectionTitle}>Available Times</Text>
                <Text style={styles.sectionDescription}>
                  {formatDate(selectedDate)} • {service.duration} minutes
                </Text>
                
                {isLoadingSchedule ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={MODERN_COLORS.primary} />
                    <Text style={styles.loadingText}>Loading available slots...</Text>
                  </View>
                ) : daySchedule && daySchedule.isWorkingDay ? (
                  <ScrollView style={styles.timeSlotsContainer}>
                    {daySchedule.timeSlots.length > 0 ? (
                      <View style={styles.timeSlotsGrid}>
                        {daySchedule.timeSlots.map((slot, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.timeSlot,
                              !slot.isAvailable && styles.timeSlotDisabled,
                              selectedTimeSlot?.startTime === slot.startTime && styles.timeSlotSelected,
                              slot.isPeakTime && styles.timeSlotPeak
                            ]}
                            onPress={() => slot.isAvailable && handleTimeSelect(slot)}
                            disabled={!slot.isAvailable}
                          >
                            <Text style={[
                              styles.timeSlotText,
                              !slot.isAvailable && styles.timeSlotTextDisabled,
                              selectedTimeSlot?.startTime === slot.startTime && styles.timeSlotTextSelected
                            ]}>
                              {formatTime(slot.startTime)}
                            </Text>
                            {slot.isPeakTime && (
                              <View style={styles.peakTimeIndicator}>
                                <Text style={styles.peakTimeText}>Peak</Text>
                              </View>
                            )}
                            {!slot.isAvailable && slot.unavailableReason && (
                              <Text style={styles.unavailableReasonText}>
                                {slot.unavailableReason}
                              </Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.noSlotsContainer}>
                        <Ionicons name="calendar-outline" size={48} color="#E0E0E0" />
                        {daySchedule.timeSlots.length === 1 && daySchedule.timeSlots[0].unavailableReason?.includes("Provider is done for today") ? (
                          <>
                            <Text style={styles.providerDoneText}>Provider is done for today</Text>
                            <Text style={styles.providerDoneSubtext}>
                              Try booking an appointment for another day.
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text style={styles.noSlotsText}>No available slots</Text>
                            <Text style={styles.noSlotsSubtext}>Please select a different date</Text>
                          </>
                        )}
                      </View>
                    )}
                  </ScrollView>
                ) : (
                  <View style={styles.noSlotsContainer}>
                    <Ionicons name="business-outline" size={48} color="#E0E0E0" />
                    <Text style={styles.noSlotsText}>Provider not available</Text>
                    <Text style={styles.noSlotsSubtext}>Please select a different date</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Payment Details</Text>
            <Text style={styles.stepDescription}>Enter your payment information</Text>
            
            {/* Booking Summary */}
            <View style={styles.paymentSummary}>
              <Text style={styles.paymentSummaryTitle}>Booking Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{service.name}</Text>
                <Text style={styles.summaryValue}>${pricing.total.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summarySecondaryLabel}>
                  {formatDate(selectedDate)} at {selectedTimeSlot && formatTime(selectedTimeSlot.startTime)}
                </Text>
              </View>
            </View>

            {/* Payment Method Selection */}
            <View style={styles.paymentMethodContainer}>
              <Text style={styles.paymentMethodTitle}>Payment Method</Text>
              
              <TouchableOpacity
                style={[
                  styles.paymentMethodOption,
                  selectedPaymentMethod === 'credit-card' && styles.paymentMethodSelected
                ]}
                onPress={() => setSelectedPaymentMethod('credit-card')}
              >
                <View style={styles.paymentMethodIcon}>
                  <Ionicons name="card-outline" size={24} color={MODERN_COLORS.primary} />
                </View>
                <Text style={styles.paymentMethodText}>Credit/Debit Card</Text>
                <View style={styles.paymentMethodRadio}>
                  {selectedPaymentMethod === 'credit-card' && (
                    <View style={styles.paymentMethodRadioSelected} />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethodOption,
                  selectedPaymentMethod === 'apple-pay' && styles.paymentMethodSelected
                ]}
                onPress={() => setSelectedPaymentMethod('apple-pay')}
              >
                <View style={styles.paymentMethodIcon}>
                  <Ionicons name="phone-portrait-outline" size={24} color={MODERN_COLORS.primary} />
                </View>
                <Text style={styles.paymentMethodText}>Apple Pay</Text>
                <View style={styles.paymentMethodRadio}>
                  {selectedPaymentMethod === 'apple-pay' && (
                    <View style={styles.paymentMethodRadioSelected} />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethodOption,
                  selectedPaymentMethod === 'paypal' && styles.paymentMethodSelected
                ]}
                onPress={() => setSelectedPaymentMethod('paypal')}
              >
                <View style={styles.paymentMethodIcon}>
                  <Ionicons name="logo-paypal" size={24} color={MODERN_COLORS.primary} />
                </View>
                <Text style={styles.paymentMethodText}>PayPal</Text>
                <View style={styles.paymentMethodRadio}>
                  {selectedPaymentMethod === 'paypal' && (
                    <View style={styles.paymentMethodRadioSelected} />
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Credit Card Form */}
            {selectedPaymentMethod === 'credit-card' && (
              <View style={styles.creditCardForm}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Card Number</Text>
                  <TextInput
                    style={styles.paymentInput}
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    keyboardType="numeric"
                    maxLength={19}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.inputLabel}>Expiry Date</Text>
                    <TextInput
                      style={styles.paymentInput}
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChangeText={setExpiryDate}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>

                  <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <TextInput
                      style={styles.paymentInput}
                      placeholder="123"
                      value={cvv}
                      onChangeText={setCvv}
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Name on Card</Text>
                  <TextInput
                    style={styles.paymentInput}
                    placeholder="John Doe"
                    value={nameOnCard}
                    onChangeText={setNameOnCard}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Billing Address</Text>
                  <TextInput
                    style={styles.paymentInput}
                    placeholder="123 Main St, City, State 12345"
                    value={billingAddress}
                    onChangeText={setBillingAddress}
                    multiline
                  />
                </View>

                <TouchableOpacity
                  style={styles.savePaymentContainer}
                  onPress={() => setSavePaymentMethod(!savePaymentMethod)}
                >
                  <View style={[styles.checkbox, savePaymentMethod && styles.checkboxSelected]}>
                    {savePaymentMethod && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                  <Text style={styles.savePaymentText}>Save payment method for future bookings</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Pay Button */}
            <TouchableOpacity
              style={[
                styles.payButton,
                (!selectedPaymentMethod || 
                 (selectedPaymentMethod === 'credit-card' && (!cardNumber || !expiryDate || !cvv || !nameOnCard))
                ) && styles.payButtonDisabled
              ]}
              onPress={goToNextStep}
              disabled={!selectedPaymentMethod || 
                       (selectedPaymentMethod === 'credit-card' && (!cardNumber || !expiryDate || !cvv || !nameOnCard))}
            >
              <Ionicons 
                name={
                  selectedPaymentMethod === 'apple-pay' ? 'phone-portrait' :
                  selectedPaymentMethod === 'paypal' ? 'logo-paypal' :
                  'card'
                } 
                size={20} 
                color="white" 
              />
              <Text style={styles.payButtonText}>
                {selectedPaymentMethod === 'apple-pay' ? 'Pay with Apple Pay' :
                 selectedPaymentMethod === 'paypal' ? 'Pay with PayPal' :
                 `Pay $${pricing.total.toFixed(2)}`}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Confirm Booking</Text>
            
            {/* Booking Summary */}
            <View style={styles.bookingSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service</Text>
                <Text style={styles.summaryValue}>{service.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Provider</Text>
                <Text style={styles.summaryValue}>{provider.businessName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date</Text>
                <Text style={styles.summaryValue}>{formatDate(selectedDate)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time</Text>
                <Text style={styles.summaryValue}>
                  {selectedTimeSlot && formatTime(selectedTimeSlot.startTime)} ({service.duration} min)
                </Text>
              </View>
            </View>

            {/* Pricing Breakdown */}
            <View style={styles.pricingBreakdown}>
              <Text style={styles.pricingTitle}>Pricing Details</Text>
              
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Service Price</Text>
                <Text style={styles.pricingValue}>${pricing.originalPrice.toFixed(2)}</Text>
              </View>
              
              {pricing.isPeakPricing && (
                <View style={styles.pricingRow}>
                  <Text style={[styles.pricingLabel, styles.peakPricingLabel]}>Peak Time Surcharge (20%)</Text>
                  <Text style={[styles.pricingValue, styles.peakPricingValue]}>
                    +${(pricing.basePrice - pricing.originalPrice).toFixed(2)}
                  </Text>
                </View>
              )}
              
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Platform Fee ({(pricing.platformFeeRate * 100).toFixed(1)}%)</Text>
                <Text style={styles.pricingValue}>${pricing.platformFee.toFixed(2)}</Text>
              </View>
              
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Tax ({(pricing.taxRate * 100).toFixed(1)}%)</Text>
                <Text style={styles.pricingValue}>${pricing.tax.toFixed(2)}</Text>
              </View>
              
              <View style={[styles.pricingRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${pricing.total.toFixed(2)}</Text>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Additional Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Any special requests or notes..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Book Button */}
            <TouchableOpacity
              style={[styles.bookButton, isBooking && styles.bookButtonDisabled]}
              onPress={handleConfirmBooking}
              disabled={isBooking}
            >
              {isBooking ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.bookButtonText}>Booking...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.bookButtonText}>Confirm Booking</Text>
                  <Ionicons name="checkmark" size={20} color="white" />
                </>
              )}
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Step Indicator */}
      <StepIndicator />

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmation} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={handleDismissConfirmation}
        >
          <TouchableOpacity 
            style={styles.confirmationModal}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleDismissConfirmation}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            </View>
            <Text style={styles.confirmationTitle}>Booking Confirmed!</Text>
            <Text style={styles.confirmationText}>
              Your appointment has been successfully booked. You'll receive a confirmation email shortly.
            </Text>
            <TouchableOpacity 
              style={styles.dismissButton}
              onPress={handleDismissConfirmation}
            >
              <Text style={styles.dismissButtonText}>OK</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: MODERN_COLORS.primary,
  },
  stepCircleInactive: {
    backgroundColor: '#E0E0E0',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  stepNumberActive: {
    color: 'white',
  },
  stepNumberInactive: {
    color: '#999',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: MODERN_COLORS.primary,
  },
  stepLabelInactive: {
    color: '#999',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  dateSelector: {
    marginBottom: 24,
  },
  dateOption: {
    alignItems: 'center',
    padding: 16,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 80,
  },
  dateOptionSelected: {
    backgroundColor: MODERN_COLORS.primary,
    borderColor: MODERN_COLORS.primary,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  dateDaySelected: {
    color: 'white',
  },
  dateLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  dateLabelSelected: {
    color: 'white',
  },
  workingHours: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  workingHoursSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MODERN_COLORS.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  timeSlotsContainer: {
    maxHeight: 400,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    flexBasis: '30%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    position: 'relative',
  },
  timeSlotSelected: {
    backgroundColor: MODERN_COLORS.primary,
    borderColor: MODERN_COLORS.primary,
  },
  timeSlotDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  timeSlotPeak: {
    borderColor: '#FF9800',
    borderWidth: 2,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  timeSlotTextSelected: {
    color: 'white',
  },
  timeSlotTextDisabled: {
    color: '#999',
  },
  unavailableReasonText: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  peakTimeIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF9800',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  peakTimeText: {
    fontSize: 8,
    fontWeight: '600',
    color: 'white',
  },
  noSlotsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noSlotsText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  noSlotsSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  providerDoneText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 28,
  },
  providerDoneSubtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 22,
  },
  bookingSummary: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  pricingBreakdown: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  pricingLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  pricingValue: {
    fontSize: 14,
    color: COLORS.text,
  },
  peakPricingLabel: {
    color: '#FF9800',
  },
  peakPricingValue: {
    color: '#FF9800',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: MODERN_COLORS.primary,
  },
  notesContainer: {
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MODERN_COLORS.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  bookButtonDisabled: {
    backgroundColor: '#999',
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  backNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  backNavButtonText: {
    fontSize: 16,
    color: MODERN_COLORS.primary,
  },
  nextNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MODERN_COLORS.primary,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  nextNavButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    margin: 20,
    maxWidth: 300,
  },
  successIcon: {
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // New styles for combined date/time and payment
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  timeSelectionContainer: {
    marginTop: 16,
  },
  paymentSummary: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  paymentSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  summarySecondaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  paymentMethodContainer: {
    marginBottom: 20,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  paymentMethodSelected: {
    borderColor: MODERN_COLORS.primary,
    borderWidth: 2,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  paymentMethodRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: MODERN_COLORS.primary,
  },
  creditCardForm: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  paymentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savePaymentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: MODERN_COLORS.primary,
    borderColor: MODERN_COLORS.primary,
  },
  savePaymentText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  continueButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MODERN_COLORS.primary,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  payButtonDisabled: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    zIndex: 1,
  },
  dismissButton: {
    backgroundColor: MODERN_COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    alignSelf: 'center',
  },
  dismissButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ModernBookingFlowScreen;
