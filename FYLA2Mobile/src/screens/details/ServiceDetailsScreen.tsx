import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Service, ServiceProvider, RootStackParamList, CreateBookingRequest } from '../../types';
import ApiService from '../../services/api';

type ServiceDetailsScreenRouteProp = {
  key: string;
  name: 'ServiceDetails';
  params: { 
    serviceId: string;
    providerId: string;
    service: Service;
    provider: ServiceProvider;
  };
};

type ServiceDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ServiceDetailsScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  
  const route = useRoute<ServiceDetailsScreenRouteProp>();
  const navigation = useNavigation<ServiceDetailsScreenNavigationProp>();
  const { service, provider } = route.params;

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      if (Platform.OS === 'ios') {
        // Keep picker open on iOS until user taps Done
      }
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (time) {
      setSelectedTime(time);
      if (Platform.OS === 'ios') {
        // Keep picker open on iOS until user taps Done
      }
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

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBookService = async () => {
    try {
      setIsBooking(true);

      // Format date and time properly
      const bookingDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const startTime = `${hours}:${minutes}`; // HH:MM

      // Prepare booking data - ensure serviceId is a number
      const bookingData: CreateBookingRequest = {
        serviceProviderId: provider.id,
        serviceId: parseInt(service.id), // Convert to number
        bookingDate: bookingDate,
        startTime: startTime,
        notes: `Booking for ${service.name} via mobile app`,
      };

      console.log('Creating booking with data:', bookingData);
      console.log('Provider ID:', provider.id);
      console.log('Service ID:', service.id, 'Type:', typeof service.id);

      // Create the booking
      const booking = await ApiService.createBooking(bookingData);

      console.log('Booking created successfully:', booking);

      Alert.alert(
        'Booking Confirmed!',
        `Your appointment for ${service.name} with ${provider.businessName} has been booked for ${formatDate(selectedDate)} at ${formatTime(selectedTime)}.`,
        [
          {
            text: 'View Bookings',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
              navigation.navigate('Main');
            },
          },
          {
            text: 'OK',
            style: 'default',
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating booking:', error);
      
      // More detailed error logging
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
      
      Alert.alert(
        'Booking Failed',
        'Sorry, we couldn\'t complete your booking. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsBooking(false);
    }
  };

  const getEndTime = () => {
    const endTime = new Date(selectedTime);
    endTime.setMinutes(endTime.getMinutes() + service.duration);
    return endTime;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Service Header */}
      <LinearGradient
        colors={['#FF6B6B', '#FFE66D']}
        style={styles.header}
      >
        <View style={styles.serviceHeader}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceDescription}>{service.description}</Text>
            <View style={styles.serviceDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={18} color="#fff" />
                <Text style={styles.detailText}>{service.duration} minutes</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="pricetag-outline" size={18} color="#fff" />
                <Text style={styles.detailText}>${service.price}</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Provider Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Provider</Text>
        <View style={styles.providerCard}>
          <Image
            source={{
              uri: provider.profilePictureUrl || 'https://via.placeholder.com/60',
            }}
            style={styles.providerImage}
          />
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{provider.businessName}</Text>
            <View style={styles.providerStats}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.providerRating}>{provider.averageRating || 'New'}</Text>
              <Text style={styles.providerReviews}>({provider.totalReviews} reviews)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Date Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Date</Text>
        <TouchableOpacity
          style={styles.dateTimeButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color="#FF6B6B" />
          <Text style={styles.dateTimeText}>{formatDate(selectedDate)}</Text>
          <Ionicons name="chevron-forward-outline" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Time Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Time</Text>
        <TouchableOpacity
          style={styles.dateTimeButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Ionicons name="time-outline" size={20} color="#FF6B6B" />
          <Text style={styles.dateTimeText}>
            {formatTime(selectedTime)} - {formatTime(getEndTime())}
          </Text>
          <Ionicons name="chevron-forward-outline" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Booking Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booking Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service:</Text>
            <Text style={styles.summaryValue}>{service.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Provider:</Text>
            <Text style={styles.summaryValue}>{provider.businessName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date:</Text>
            <Text style={styles.summaryValue}>{formatDate(selectedDate)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time:</Text>
            <Text style={styles.summaryValue}>
              {formatTime(selectedTime)} - {formatTime(getEndTime())}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>${service.price}</Text>
          </View>
        </View>
      </View>

      {/* Book Button */}
      <View style={styles.bookingSection}>
        <TouchableOpacity
          style={[styles.bookButton, isBooking && styles.bookButtonDisabled]}
          onPress={handleBookService}
          disabled={isBooking}
        >
          <Text style={styles.bookButtonText}>
            {isBooking ? 'Booking...' : `Book for $${service.price}`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.pickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          </View>
        </View>
      )}

      {showTimePicker && (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Time</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={styles.pickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          </View>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  serviceHeader: {
    alignItems: 'center',
  },
  serviceInfo: {
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  detailText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  providerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  providerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  providerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerRating: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  providerReviews: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dateTimeText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  bookingSection: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  bookButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 24,
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  pickerDone: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
});

export default ServiceDetailsScreen;
