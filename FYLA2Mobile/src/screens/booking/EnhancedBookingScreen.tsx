import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, ServiceProvider, Service } from '../../types';
import ApiService from '../../services/api';

const { width } = Dimensions.get('window');

type EnhancedBookingScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface RouteParams {
  providerId?: string;
  serviceId?: string;
}

const EnhancedBookingScreen: React.FC = () => {
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  
  const navigation = useNavigation<EnhancedBookingScreenNavigationProp>();
  const route = useRoute();
  const { providerId, serviceId } = (route.params as RouteParams) || {};

  useEffect(() => {
    loadBookingData();
  }, [providerId]);

  const loadBookingData = async () => {
    try {
      if (providerId) {
        // Load provider details
        const providerData = await ApiService.getProviderById(providerId);
        setProvider(providerData);
        
        // Load provider's services
        const servicesData = await ApiService.getServicesByProvider(providerId);
        setServices(servicesData);
        
        // Pre-select service if provided
        if (serviceId) {
          const service = servicesData.find(s => s.id === parseInt(serviceId));
          if (service) {
            setSelectedService(service);
          }
        }
      }
    } catch (error) {
      console.error('Error loading booking data:', error);
      Alert.alert('Error', 'Unable to load booking information');
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableTimeSlots = () => {
    // Generate time slots from 9 AM to 6 PM
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
      slots.push(`${hour}:00`);
      if (hour < 18) {
        slots.push(`${hour}:30`);
      }
    }
    return slots;
  };

  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isTomorrow = (date: Date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return formatDate(date);
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedTime) {
      Alert.alert('Error', 'Please select a service and time slot');
      return;
    }

    setIsBooking(true);
    try {
      const bookingDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      bookingDateTime.setHours(parseInt(hours), parseInt(minutes));

      const bookingRequest = {
        serviceId: selectedService.id,
        providerId: provider?.id || '',
        bookingDate: bookingDateTime.toISOString(),
        notes: notes.trim() || undefined,
      };

      await ApiService.createBooking(bookingRequest);
      
      Alert.alert(
        'Booking Confirmed!',
        `Your appointment with ${provider?.firstName} ${provider?.lastName} has been scheduled for ${getDateLabel(selectedDate)} at ${selectedTime}.`,
        [
          {
            text: 'View Bookings',
            onPress: () => navigation.navigate('Bookings')
          },
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Error', 'Unable to create booking. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const renderServiceCard = (service: Service) => (
    <TouchableOpacity
      key={service.id}
      style={[
        styles.serviceCard,
        selectedService?.id === service.id && styles.selectedServiceCard
      ]}
      onPress={() => setSelectedService(service)}
    >
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceName}>{service.name}</Text>
        <Text style={styles.servicePrice}>${service.price}</Text>
      </View>
      <Text style={styles.serviceDescription}>{service.description}</Text>
      <View style={styles.serviceDetails}>
        <View style={styles.serviceDetail}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.serviceDetailText}>{service.duration} min</Text>
        </View>
        {selectedService?.id === service.id && (
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderDateCard = (date: Date) => (
    <TouchableOpacity
      key={date.toISOString()}
      style={[
        styles.dateCard,
        selectedDate.toDateString() === date.toDateString() && styles.selectedDateCard
      ]}
      onPress={() => setSelectedDate(date)}
    >
      <Text style={[
        styles.dateLabel,
        selectedDate.toDateString() === date.toDateString() && styles.selectedDateLabel
      ]}>
        {getDateLabel(date)}
      </Text>
      <Text style={[
        styles.dateNumber,
        selectedDate.toDateString() === date.toDateString() && styles.selectedDateNumber
      ]}>
        {date.getDate()}
      </Text>
    </TouchableOpacity>
  );

  const renderTimeSlot = (time: string) => (
    <TouchableOpacity
      key={time}
      style={[
        styles.timeSlot,
        selectedTime === time && styles.selectedTimeSlot
      ]}
      onPress={() => setSelectedTime(time)}
    >
      <Text style={[
        styles.timeText,
        selectedTime === time && styles.selectedTimeText
      ]}>
        {time}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B46C1" />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
        <Text style={styles.errorText}>Provider not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#6B46C1', '#9333EA']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Image
            source={{ uri: provider.profileImageUrl || 'https://via.placeholder.com/80' }}
            style={styles.providerImage}
          />
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>
              {provider.firstName} {provider.lastName}
            </Text>
            <Text style={styles.providerTitle}>Beauty Professional</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>4.8 (127 reviews)</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Service Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Service</Text>
          {services.map(renderServiceCard)}
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
            {getNext7Days().map(renderDateCard)}
          </ScrollView>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Times</Text>
          <View style={styles.timeSlotsGrid}>
            {getAvailableTimeSlots().map(renderTimeSlot)}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Requests (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Any special requests or notes for your appointment..."
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>

        {/* Booking Summary */}
        {selectedService && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service</Text>
              <Text style={styles.summaryValue}>{selectedService.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date & Time</Text>
              <Text style={styles.summaryValue}>
                {selectedTime ? `${getDateLabel(selectedDate)} at ${selectedTime}` : 'Select time'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{selectedService.duration} minutes</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${selectedService.price}</Text>
            </View>
          </View>
        )}

        {/* Book Button */}
        <TouchableOpacity
          style={[
            styles.bookButton,
            (!selectedService || !selectedTime) && styles.disabledButton
          ]}
          onPress={handleBooking}
          disabled={!selectedService || !selectedTime || isBooking}
        >
          {isBooking ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.bookButtonText}>
              Book Appointment {selectedService ? `- $${selectedService.price}` : ''}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  providerTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rating: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedServiceCard: {
    borderColor: '#6B46C1',
    backgroundColor: '#F8F6FF',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B46C1',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  datesScroll: {
    marginBottom: 16,
  },
  dateCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedDateCard: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  selectedDateLabel: {
    color: 'white',
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  selectedDateNumber: {
    color: 'white',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: (width - 80) / 4,
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  timeText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  selectedTimeText: {
    color: 'white',
  },
  notesInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 100,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: 16,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B46C1',
  },
  bookButton: {
    backgroundColor: '#6B46C1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B46C1',
  },
  bottomPadding: {
    height: 80,
  },
});

export default EnhancedBookingScreen;
