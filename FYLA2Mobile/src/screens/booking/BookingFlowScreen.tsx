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
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <View style={[
            styles.stepCircle,
            currentStep >= step && styles.activeStepCircle
          ]}>
            <Text style={[
              styles.stepNumber,
              currentStep >= step && styles.activeStepNumber
            ]}>
              {step}
            </Text>
          </View>
          {step < 3 && (
            <View style={[
              styles.stepLine,
              currentStep > step && styles.activeStepLine
            ]} />
          )}
        </React.Fragment>
      ))}
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
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
        {generateDateOptions().map((date, index) => {
          const isSelected = selectedDate.toDateString() === date.toDateString();
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <TouchableOpacity
              key={index}
              style={[styles.dateCard, isSelected && styles.selectedDateCard]}
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
                  <Text style={styles.todayText}>Today</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading available times...</Text>
        </View>
      ) : (
        <View style={styles.timeSlotsContainer}>
          {availableSlots.length === 0 ? (
            <View style={styles.noSlotsContainer}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
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
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.detailText}>{formatDate(selectedDate)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.detailText}>
              {formatTime(selectedTimeSlot)} - {formatTime(getEndTime(selectedTimeSlot))}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time" size={20} color="#666" />
            <Text style={styles.detailText}>{service.duration} minutes</Text>
          </View>
          
          <View style={[styles.detailRow, styles.priceRow]}>
            <Ionicons name="card-outline" size={20} color="#FF6B6B" />
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
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#FF6B6B', '#FFE66D']} style={styles.header}>
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
    marginBottom: 20,
  },
  headerBackButton: {
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
  testButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStepCircle: {
    backgroundColor: 'white',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  activeStepNumber: {
    color: '#FF6B6B',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
  activeStepLine: {
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  dateScroll: {
    marginBottom: 20,
  },
  dateCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  selectedDateCard: {
    backgroundColor: '#FF6B6B',
  },
  dateDay: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dateMonth: {
    fontSize: 12,
    color: '#666',
  },
  selectedDateText: {
    color: 'white',
  },
  todayBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#27AE60',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  todayText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  timeSlotsContainer: {
    flex: 1,
  },
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noSlotsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 20,
  },
  changeDateButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  changeDateText: {
    color: 'white',
    fontWeight: 'bold',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedTimeSlot: {
    backgroundColor: '#FF6B6B',
  },
  unavailableTimeSlot: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedTimeSlotText: {
    color: 'white',
  },
  unavailableTimeSlotText: {
    color: '#999',
  },
  timeSlotPrice: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 4,
  },
  selectedTimeSlotPrice: {
    color: 'white',
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceInfo: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  serviceName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 16,
    color: '#666',
  },
  bookingDetails: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  priceRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginLeft: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  successDetails: {
    gap: 8,
  },
  successDetailText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});

export default BookingFlowScreen;
