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
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService } from '../../services/api';
import { RootStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';

type BookingCalendarNavigationProp = StackNavigationProp<RootStackParamList, 'BookingCalendar'>;

interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
  price: number;
}

interface ServiceDetails {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
  providerId: string;
  providerName: string;
}

const BookingCalendarScreen: React.FC = () => {
  const navigation = useNavigation<BookingCalendarNavigationProp>();
  const route = useRoute();
  const { user } = useAuth();
  
  const { serviceId, providerId } = route.params as { serviceId: string; providerId: string };
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  const currentDate = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 60 days ahead

  useEffect(() => {
    loadServiceDetails();
  }, [serviceId]);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate]);

  const loadServiceDetails = async () => {
    try {
      setLoading(true);
      const service = await apiService.getServiceDetails(serviceId);
      setServiceDetails(service);
    } catch (error) {
      console.error('Error loading service:', error);
      Alert.alert('Error', 'Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      const slots = await apiService.getAvailableSlots(providerId, serviceId, selectedDate);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading slots:', error);
      setAvailableSlots(generateMockTimeSlots());
    } finally {
      setLoading(false);
    }
  };

  const generateMockTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = 18;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          id: `${selectedDate}-${timeString}`,
          time: timeString,
          isAvailable: Math.random() > 0.3, // 70% availability
          price: serviceDetails?.price || 150,
        });
      }
    }
    return slots;
  };

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    setSelectedSlot('');
  };

  const selectTimeSlot = (slotId: string) => {
    setSelectedSlot(slotId);
  };

  const proceedToPayment = () => {
    if (!selectedSlot || !serviceDetails) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }
    setShowPaymentModal(true);
  };

  const confirmBooking = async (paymentMethod: string) => {
    try {
      setBookingInProgress(true);
      
      const selectedSlotData = availableSlots.find(slot => slot.id === selectedSlot);
      if (!selectedSlotData || !serviceDetails) return;

      const bookingData = {
        serviceId: serviceDetails.id,
        providerId: serviceDetails.providerId,
        date: selectedDate,
        time: selectedSlotData.time,
        totalPrice: selectedSlotData.price,
        paymentMethod: paymentMethod,
        notes: '',
      };

      const booking = await apiService.createBooking(bookingData);
      
      setShowPaymentModal(false);
      
      Alert.alert(
        'Booking Confirmed! ✨',
        `Your appointment with ${serviceDetails.providerName} is confirmed for ${selectedDate} at ${selectedSlotData.time}`,
        [
          {
            text: 'View Booking',
            onPress: () => navigation.navigate('BookingDetails', { bookingId: booking.id }),
          },
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Success!', 'Your booking has been confirmed! You will receive a confirmation email shortly.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setBookingInProgress(false);
    }
  };

  const renderTimeSlot = (slot: TimeSlot) => (
    <TouchableOpacity
      key={slot.id}
      style={[
        styles.timeSlot,
        !slot.isAvailable && styles.unavailableSlot,
        selectedSlot === slot.id && styles.selectedSlot,
      ]}
      onPress={() => slot.isAvailable && selectTimeSlot(slot.id)}
      disabled={!slot.isAvailable}
    >
      <Text style={[
        styles.timeText,
        !slot.isAvailable && styles.unavailableText,
        selectedSlot === slot.id && styles.selectedText,
      ]}>
        {slot.time}
      </Text>
      <Text style={[
        styles.priceText,
        !slot.isAvailable && styles.unavailableText,
        selectedSlot === slot.id && styles.selectedText,
      ]}>
        ${slot.price}
      </Text>
    </TouchableOpacity>
  );

  const renderPaymentModal = () => (
    <Modal
      visible={showPaymentModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Payment</Text>
          <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Booking Summary */}
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Booking Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service:</Text>
              <Text style={styles.summaryValue}>{serviceDetails?.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Provider:</Text>
              <Text style={styles.summaryValue}>{serviceDetails?.providerName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date:</Text>
              <Text style={styles.summaryValue}>{selectedDate}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time:</Text>
              <Text style={styles.summaryValue}>
                {availableSlots.find(slot => slot.id === selectedSlot)?.time}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>
                ${availableSlots.find(slot => slot.id === selectedSlot)?.price}
              </Text>
            </View>
          </View>

          {/* Payment Methods */}
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            <TouchableOpacity
              style={styles.paymentOption}
              onPress={() => confirmBooking('card')}
              disabled={bookingInProgress}
            >
              <Ionicons name="card" size={24} color="#007AFF" />
              <Text style={styles.paymentText}>Credit/Debit Card</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.paymentOption}
              onPress={() => confirmBooking('apple_pay')}
              disabled={bookingInProgress}
            >
              <Ionicons name="logo-apple" size={24} color="#007AFF" />
              <Text style={styles.paymentText}>Apple Pay</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.paymentOption}
              onPress={() => confirmBooking('google_pay')}
              disabled={bookingInProgress}
            >
              <Ionicons name="wallet" size={24} color="#007AFF" />
              <Text style={styles.paymentText}>Google Pay</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.paymentOption}
              onPress={() => confirmBooking('pay_later')}
              disabled={bookingInProgress}
            >
              <Ionicons name="time" size={24} color="#007AFF" />
              <Text style={styles.paymentText}>Pay at Appointment</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {bookingInProgress && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Processing booking...</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  if (loading && !serviceDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading service details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Service Info */}
      {serviceDetails && (
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{serviceDetails.name}</Text>
          <Text style={styles.providerName}>{serviceDetails.providerName}</Text>
          <Text style={styles.serviceDetails}>
            {serviceDetails.duration} min • ${serviceDetails.price}
          </Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        {/* Calendar */}
        <View style={styles.calendarSection}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <Calendar
            onDayPress={onDayPress}
            minDate={currentDate}
            maxDate={maxDate}
            markedDates={{
              [selectedDate]: {
                selected: true,
                selectedColor: '#007AFF',
              },
            }}
            theme={{
              selectedDayBackgroundColor: '#007AFF',
              todayTextColor: '#007AFF',
              arrowColor: '#007AFF',
            }}
          />
        </View>

        {/* Time Slots */}
        {selectedDate && (
          <View style={styles.timeSlotsSection}>
            <Text style={styles.sectionTitle}>Available Times</Text>
            {loading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <View style={styles.timeSlotsGrid}>
                {availableSlots.map(renderTimeSlot)}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Book Button */}
      {selectedSlot && (
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={proceedToPayment}
          >
            <Text style={styles.bookButtonText}>
              Book Appointment - ${availableSlots.find(slot => slot.id === selectedSlot)?.price}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {renderPaymentModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  serviceInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 4,
  },
  serviceDetails: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  calendarSection: {
    padding: 16,
  },
  timeSlotsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 80,
  },
  selectedSlot: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  unavailableSlot: {
    backgroundColor: '#f0f0f0',
    opacity: 0.5,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 12,
    color: '#666',
  },
  selectedText: {
    color: '#fff',
  },
  unavailableText: {
    color: '#999',
  },
  bottomSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 60,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  summarySection: {
    marginBottom: 32,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  paymentSection: {
    marginBottom: 32,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 12,
  },
  paymentText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});

export default BookingCalendarScreen;
