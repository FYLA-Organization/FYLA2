import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Service, ServiceProvider, RootStackParamList, CreateBookingRequest } from '../../types';
import ApiService from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PushNotificationService from '../../services/pushNotificationService';

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

  const route = useRoute<BookingFlowScreenRouteProp>();
  const navigation = useNavigation<BookingFlowScreenNavigationProp>();
  const { service, provider } = route.params;
  const { isAuthenticated, devLoginClient } = useAuth();

  // Auto-login for testing purposes
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
    
    ensureAuthenticated();
  }, [isAuthenticated, devLoginClient]);

  useEffect(() => {
    if (currentStep === 2) {
      loadAvailableSlots();
    }
  }, [selectedDate, currentStep]);

  const loadAvailableSlots = async () => {
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
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(':');
    const start = new Date();
    start.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    start.setMinutes(start.getMinutes() + service.duration);
    
    const endHours = start.getHours().toString().padStart(2, '0');
    const endMinutes = start.getMinutes().toString().padStart(2, '0');
    return `${endHours}:${endMinutes}`;
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot('');
    if (currentStep < 2) {
      setCurrentStep(2);
    }
  };

  const handleTimeSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    setCurrentStep(3);
  };

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
        notes: notes || `Booking for ${service.name} via Enhanced Booking Flow`,
      };

      console.log('Booking data:', bookingData);
      const booking = await ApiService.createBooking(bookingData);
      console.log('Booking created successfully:', booking);

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
          booking.id || 'unknown',
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
      
      // Auto-navigate after showing confirmation
      setTimeout(() => {
        setShowConfirmation(false);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
        navigation.navigate('Bookings');
      }, 3000);

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
      <View style={styles.stepIndicator}>
        {[1, 2, 3].map((step) => (
          <React.Fragment key={step}>
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
            {step < 3 && (
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
      
      {/* Step Labels */}
      <View style={styles.stepLabels}>
        <Text style={[styles.stepLabel, currentStep >= 1 && styles.activeStepLabel]}>
          Date
        </Text>
        <Text style={[styles.stepLabel, currentStep >= 2 && styles.activeStepLabel]}>
          Time
        </Text>
        <Text style={[styles.stepLabel, currentStep >= 3 && styles.activeStepLabel]}>
          Review
        </Text>
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
      default:
        return renderDateSelection();
    }
  };

  const renderDateSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Date</Text>
      <Text style={styles.stepSubtitle}>Choose your preferred appointment date</Text>
      
      <View style={styles.dateGrid}>
        {generateDateOptions().map((date, index) => {
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
          style={[
            styles.confirmButton, 
            (isBooking || !isAuthenticated) && styles.confirmButtonDisabled
          ]}
          onPress={handleConfirmBooking}
          disabled={isBooking || !isAuthenticated}
        >
          {isBooking ? (
            <ActivityIndicator size="small" color="white" />
          ) : !isAuthenticated ? (
            <Text style={styles.confirmButtonText}>Authenticating...</Text>
          ) : (
            <Text style={styles.confirmButtonText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

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
    paddingVertical: 8,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
    paddingHorizontal: 20,
    alignItems: 'center',
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
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    paddingHorizontal: 20,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
    textAlign: 'center',
    flex: 1,
  },
  activeStepLabel: {
    color: 'white',
    fontWeight: '800',
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
});

export default BookingFlowScreen;
