import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, DateData } from 'react-native-calendars';
import { Service, ServiceProvider, RootStackParamList } from '../../types';
import ApiService from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

type ModernBookingCalendarRouteProp = {
  key: string;
  name: 'ModernBookingCalendar';
  params: {
    service: Service;
    provider: ServiceProvider;
  };
};

type ModernBookingCalendarNavigationProp = StackNavigationProp<RootStackParamList>;

interface AvailableTimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  price: number;
  duration: number;
  unavailableReason?: string;
}

interface TimeSlotDisplay {
  id: string;
  time: string;
  endTime: string;
  isAvailable: boolean;
  price: number;
  duration: number;
  reasonUnavailable?: string;
}

const ModernBookingCalendarScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlotDisplay[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);

  const route = useRoute<ModernBookingCalendarRouteProp>();
  const navigation = useNavigation<ModernBookingCalendarNavigationProp>();
  const { service, provider } = route.params;
  const { user } = useAuth();

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 90 days ahead

  // Initialize with today's date
  useEffect(() => {
    setSelectedDate(today);
  }, [today]);

  // Load available slots when date changes
  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate]);

  const loadAvailableSlots = useCallback(async () => {
    if (!selectedDate || !service?.id || !provider?.id) return;

    try {
      setLoading(true);
      const response = await ApiService.getAvailableSlots(
        provider.id, 
        service.id.toString(), 
        selectedDate
      );

      // Transform backend response to display format
      const transformedSlots: TimeSlotDisplay[] = response.map((slot: AvailableTimeSlot, index: number) => ({
        id: `${selectedDate}-${index}`,
        time: formatTimeFromDateTime(slot.startTime),
        endTime: formatTimeFromDateTime(slot.endTime),
        isAvailable: slot.isAvailable,
        price: slot.price,
        duration: slot.duration,
        reasonUnavailable: slot.unavailableReason
      }));

      setAvailableSlots(transformedSlots);
    } catch (error) {
      console.error('Error loading available slots:', error);
      Alert.alert('Error', 'Unable to load available time slots. Please try again.');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, service?.id, provider?.id]);

  const formatTimeFromDateTime = (dateTimeStr: string): string => {
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const onDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString);
    setSelectedSlot('');
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAvailableSlots();
    setRefreshing(false);
  }, [loadAvailableSlots]);

  const selectTimeSlot = useCallback((slotId: string) => {
    setSelectedSlot(slotId);
  }, []);

  const proceedToBooking = useCallback(() => {
    if (!selectedSlot || !selectedDate) {
      Alert.alert('Selection Required', 'Please select a date and time slot to continue.');
      return;
    }

    const slot = availableSlots.find(s => s.id === selectedSlot);
    if (!slot) {
      Alert.alert('Error', 'Selected time slot is no longer available.');
      return;
    }

    // Navigate to booking confirmation with selected details
    navigation.navigate('BookingFlow', {
      service,
      provider,
      selectedDate: selectedDate,
      selectedTimeSlot: slot.time,
      selectedEndTime: slot.endTime,
      price: slot.price,
      duration: slot.duration
    });
  }, [selectedSlot, selectedDate, availableSlots, navigation, service, provider]);

  const getMarkedDates = useMemo(() => {
    const marked: { [key: string]: any } = {};
    
    // Mark selected date
    if (selectedDate) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: '#5A4FCF',
        selectedTextColor: '#FFFFFF'
      };
    }

    return marked;
  }, [selectedDate]);

  const availableCount = useMemo(() => 
    availableSlots.filter(slot => slot.isAvailable).length, 
    [availableSlots]
  );

  const renderTimeSlot = useCallback((slot: TimeSlotDisplay) => {
    const isSelected = selectedSlot === slot.id;
    
    return (
      <TouchableOpacity
        key={slot.id}
        style={[
          styles.timeSlot,
          !slot.isAvailable && styles.unavailableSlot,
          isSelected && styles.selectedSlot,
        ]}
        onPress={() => slot.isAvailable && selectTimeSlot(slot.id)}
        disabled={!slot.isAvailable}
        activeOpacity={0.7}
      >
        <View style={styles.timeSlotContent}>
          <View style={styles.timeInfo}>
            <Text style={[
              styles.timeText,
              !slot.isAvailable && styles.unavailableText,
              isSelected && styles.selectedText,
            ]}>
              {slot.time}
            </Text>
            <Text style={[
              styles.durationText,
              !slot.isAvailable && styles.unavailableText,
              isSelected && styles.selectedText,
            ]}>
              {formatDuration(slot.duration)}
            </Text>
          </View>
          
          <View style={styles.priceInfo}>
            <Text style={[
              styles.priceText,
              !slot.isAvailable && styles.unavailableText,
              isSelected && styles.selectedText,
            ]}>
              ${slot.price}
            </Text>
            {!slot.isAvailable && slot.reasonUnavailable && (
              <Text style={styles.reasonText}>{slot.reasonUnavailable}</Text>
            )}
          </View>
        </View>
        
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [selectedSlot, selectTimeSlot]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#5A4FCF', '#7B6CE8']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Book Appointment</Text>
            <Text style={styles.headerSubtitle}>
              {service?.name} with {provider?.businessName}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#5A4FCF']}
          />
        }
      >
        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <Calendar
            current={today}
            minDate={today}
            maxDate={maxDate}
            onDayPress={onDayPress}
            markedDates={getMarkedDates}
            theme={{
              backgroundColor: '#FFFFFF',
              calendarBackground: '#FFFFFF',
              textSectionTitleColor: '#5A4FCF',
              selectedDayBackgroundColor: '#5A4FCF',
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: '#5A4FCF',
              dayTextColor: '#2D3748',
              textDisabledColor: '#C7C7CC',
              arrowColor: '#5A4FCF',
              disabledArrowColor: '#C7C7CC',
              monthTextColor: '#2D3748',
              indicatorColor: '#5A4FCF',
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14
            }}
          />
        </View>

        {/* Available Time Slots */}
        {selectedDate && (
          <View style={styles.slotsContainer}>
            <View style={styles.slotsHeader}>
              <Text style={styles.sectionTitle}>
                Available Times - {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
              {availableSlots.length > 0 && (
                <Text style={styles.availableCount}>
                  {availableCount} available
                </Text>
              )}
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5A4FCF" />
                <Text style={styles.loadingText}>Loading available times...</Text>
              </View>
            ) : availableSlots.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color="#C7C7CC" />
                <Text style={styles.emptyTitle}>No available times</Text>
                <Text style={styles.emptyText}>
                  {provider?.businessName} is not available on this date. Please select another date.
                </Text>
              </View>
            ) : (
              <View style={styles.slotsGrid}>
                {availableSlots.map(renderTimeSlot)}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Continue Button */}
      {selectedSlot && (
        <View style={styles.continueContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={proceedToBooking}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#5A4FCF', '#7B6CE8']}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>Continue to Booking</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 16,
  },
  slotsContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  slotsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  availableCount: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  unavailableSlot: {
    backgroundColor: '#F1F5F9',
    opacity: 0.6,
  },
  selectedSlot: {
    backgroundColor: '#5A4FCF',
    borderColor: '#5A4FCF',
  },
  timeSlotContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInfo: {
    flex: 1,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  reasonText: {
    fontSize: 10,
    color: '#EF4444',
    marginTop: 2,
    textAlign: 'right',
  },
  unavailableText: {
    color: '#9CA3AF',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  continueContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
});

export default ModernBookingCalendarScreen;
