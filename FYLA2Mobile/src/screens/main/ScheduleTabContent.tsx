import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Modal,
  Alert,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/index';
import ApiService from '../../services/apiService';
import { MODERN_COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../../constants/modernDesign';

const { width, height } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface Booking {
  id: string;
  serviceName: string;
  clientName: string;
  clientImage?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  status: 'pending' | 'confirmed' | 'inprogress' | 'completed' | 'cancelled' | 'no-show';
  price: number;
  location: string;
  notes?: string;
  serviceColor?: string;
}

interface TimeSlot {
  hour: number;
  minute: number;
  label: string;
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  bookings: Booking[];
}

const COLORS = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  white: '#FFFFFF',
  background: '#FAFAFA',
};

const SERVICE_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B',
  '#10B981', '#06B6D4', '#84CC16', '#F97316', '#8B5A2B'
];

const STATUS_COLORS = {
  pending: '#F59E0B',     // Orange for pending
  confirmed: '#3B82F6',   // Blue for confirmed blocks
  inprogress: '#8B5CF6',  // Purple for in progress  
  completed: '#10B981',   // Green for completed blocks
  cancelled: '#EF4444',   // Red for cancelled
  'no-show': '#9CA3AF',   // Gray for no-show
};

// Helper function to convert numeric status to string
const getStatusString = (status: number | string): string => {
  if (typeof status === 'string') return status.toLowerCase();
  
  const statusMap: {[key: number]: string} = {
    0: 'pending',
    1: 'confirmed', 
    2: 'inprogress',
    3: 'completed',
    4: 'cancelled',
    5: 'no-show'
  };
  
  return statusMap[status] || 'pending';
};

// Helper function to parse time from various formats
const parseTimeFromString = (timeStr: string): [number, number] => {
  try {
    if (timeStr.includes('T')) {
      // ISO datetime format: "2025-09-13T09:30:00"
      const date = new Date(timeStr);
      const hour = date.getHours();
      const minute = date.getMinutes();
      return [hour, minute];
    } else {
      // Time only format: "09:30"
      const [hourStr, minuteStr] = timeStr.split(':');
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);
      return [hour, minute];
    }
  } catch (error) {
    console.error('❌ Error parsing time:', timeStr, error);
    return [0, 0]; // Default to midnight
  }
};

// Helper function to format time consistently across the app
const formatTimeDisplay = (timeStr: string, format: 'slot' | 'detail' | 'compact' = 'slot'): string => {
  try {
    let hour: number, minute: number;
    
    if (timeStr.includes('T')) {
      // ISO datetime format
      const date = new Date(timeStr);
      hour = date.getHours();
      minute = date.getMinutes();
    } else {
      // Time only format
      [hour, minute] = parseTimeFromString(timeStr);
    }
    
    const time = new Date();
    time.setHours(hour, minute, 0, 0);
    
    switch (format) {
      case 'slot':
        // For time slots: "9:30 AM" (standard format)
        return time.toLocaleTimeString([], { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        });
      case 'detail':
        // For booking details: "9:30 AM" (same as slot for consistency)
        return time.toLocaleTimeString([], { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        });
      case 'compact':
        // For compact displays in appointment blocks: "9:30a" (space-saving)
        return time.toLocaleTimeString([], { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        }).replace(' ', '').toLowerCase();
      default:
        return time.toLocaleTimeString([], { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        });
    }
  } catch (error) {
    console.error('❌ Error formatting time:', timeStr, error);
    return timeStr; // Return original if formatting fails
  }
};

interface ScheduleTabContentProps {
  tabBar?: React.ReactElement;
}

const ScheduleTabContent: React.FC<ScheduleTabContentProps> = ({ tabBar }) => {
  const navigation = useNavigation<NavigationProp>();
  
  // State management
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState<any>(null);
  const [providerSchedule, setProviderSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string[]>(['pending', 'confirmed', 'completed']); // Include pending for status management
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);

  // Get working hours for a specific day
  const getWorkingHours = (date: Date): { start: string; end: string } | null => {
    if (!providerSchedule) return { start: '09:00', end: '17:00' }; // Default hours
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    const daySchedule = providerSchedule[dayName];
    
    if (!daySchedule?.isAvailable) return null;
    
    return {
      start: daySchedule.startTime || '09:00',
      end: daySchedule.endTime || '17:00'
    };
  };

  // Generate time slots based on provider availability
  const generateAvailableTimeSlots = (date: Date): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const workingHours = getWorkingHours(date);
    
    // Check if this is a past day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDay = new Date(date);
    selectedDay.setHours(0, 0, 0, 0);
    const isPastDay = selectedDay < today;
    
    // For past days, show all hours (8 AM to 8 PM) regardless of working hours
    if (isPastDay || !workingHours) {
      const startTime = isPastDay ? 8 * 60 : 480; // 8 AM for past days, 8 AM default for non-working
      const endTime = isPastDay ? 20 * 60 : 1080; // 8 PM for past days, 6 PM default for non-working
      
      // Generate 30-minute slots
      for (let time = startTime; time < endTime; time += 30) {
        const hour = Math.floor(time / 60);
        const minute = time % 60;
        
        slots.push({
          hour,
          minute,
          label: formatTimeDisplay(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`, 'slot')
        });
      }
      
      return slots;
    }
    
    // For current/future working days, use provider working hours
    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute; // Convert to minutes
    const endTime = endHour * 60 + endMinute;
    
    // Generate 30-minute slots within working hours
    for (let time = startTime; time < endTime; time += 30) {
      const hour = Math.floor(time / 60);
      const minute = time % 60;
      
      slots.push({
        hour,
        minute,
        label: formatTimeDisplay(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`, 'slot')
      });
    }
    
    return slots;
  };

  // Time slots for day view - now based on provider availability
  const timeSlots: TimeSlot[] = useMemo(() => {
    return generateAvailableTimeSlots(selectedDate);
  }, [selectedDate, providerSchedule]);

  // Status update functionality
  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    if (updatingStatus) return;
    
    try {
      setUpdatingStatus(true);
      console.log('Updating booking status:', { bookingId, newStatus });
      
      await ApiService.updateBookingStatus(bookingId, newStatus);
      
      // Update the booking in local state
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: newStatus.toLowerCase() as any }
            : booking
        )
      );
      
      // Update selected booking if it's the same one
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking(prev => prev ? { ...prev, status: newStatus.toLowerCase() as any } : null);
      }
      
      Alert.alert('Success', `Appointment ${newStatus.toLowerCase()} successfully`);
      
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      Alert.alert('Error', `Failed to update booking status: ${error.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Get next valid status for progression
  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow = {
      'pending': 'Confirmed',
      'confirmed': 'InProgress', 
      'inprogress': 'Completed',
      'completed': null, // No next status
      'cancelled': null, // No next status
      'no-show': null   // No next status
    };
    
    return statusFlow[currentStatus as keyof typeof statusFlow] || null;
  };

  // Get status display text and icon
  const getStatusInfo = (status: string) => {
    const statusInfo = {
      'pending': { text: 'PENDING', icon: 'time-outline', color: STATUS_COLORS.pending },
      'confirmed': { text: 'CONFIRMED', icon: 'checkmark-outline', color: STATUS_COLORS.confirmed },
      'inprogress': { text: 'IN PROGRESS', icon: 'play-outline', color: STATUS_COLORS.inprogress },
      'completed': { text: 'COMPLETED', icon: 'checkmark-done-outline', color: STATUS_COLORS.completed },
      'cancelled': { text: 'CANCELLED', icon: 'close-outline', color: STATUS_COLORS.cancelled },
      'no-show': { text: 'NO SHOW', icon: 'person-remove-outline', color: STATUS_COLORS['no-show'] }
    };
    
    return statusInfo[status as keyof typeof statusInfo] || statusInfo.pending;
  };

  // Load provider schedule/availability
  const loadProviderSchedule = async () => {
    try {
      console.log('🔄 Loading provider schedule...');
      
      // Get the provider's actual configured schedule
      const scheduleResult = await ApiService.getMySchedule();
      
      if (scheduleResult.success && scheduleResult.data) {
        // Convert the schedule data to our format
        const schedule: any = {};
        
        // Process the array of schedule items
        scheduleResult.data.forEach((item: any) => {
          const dayName = item.dayOfWeek; // Already a string like "Monday", "Tuesday", etc.
          schedule[dayName] = {
            isAvailable: item.isAvailable,
            startTime: item.startTime || '09:00',
            endTime: item.endTime || '17:00'
          };
        });
        
        setProviderSchedule(schedule);
        console.log('✅ Provider schedule loaded:', schedule);
      } else {
        throw new Error('No schedule data available');
      }
    } catch (error) {
      console.error('Error loading provider schedule:', error);
      // Set default business hours if no schedule found
      setProviderSchedule({
        Monday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        Tuesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        Wednesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        Thursday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        Friday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        Saturday: { isAvailable: false, startTime: '09:00', endTime: '17:00' },
        Sunday: { isAvailable: false, startTime: '09:00', endTime: '17:00' }
      });
    }
  };

  // Check if a day is a working day based on provider schedule
  const isWorkingDay = (date: Date): boolean => {
    if (!providerSchedule) return true; // Default to true if no schedule loaded
    
    // Check if this is a past day - always allow viewing past days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDay = new Date(date);
    selectedDay.setHours(0, 0, 0, 0);
    const isPastDay = selectedDay < today;
    
    if (isPastDay) return true; // Always allow viewing past days
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    
    return providerSchedule[dayName]?.isAvailable || false;
  };





  // Calendar helpers
  const getCalendarDays = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate.toDateString() === currentDate.toDateString() &&
               filterStatus.includes(booking.status);
      });
      
      days.push({
        date: currentDate,
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === today.toDateString(),
        isSelected: currentDate.toDateString() === selectedDate.toDateString(),
        bookings: dayBookings,
      });
    }
    
    return days;
  };

  // Get bookings for selected date
  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate.toDateString() === date.toDateString() &&
             filterStatus.includes(booking.status);
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // Get week dates
  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Refresh data when screen comes into focus (e.g., after accepting appointments)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedDate])
  );

  const loadData = async () => {
    await Promise.all([
      loadBookings(),
      loadAvailability(),
      loadProviderSchedule()
    ]);
  };

  const loadAvailability = async () => {
    try {
      // Get current user as provider (use user ID as provider ID for now)
      const user = await ApiService.getCurrentUser();
      if (user && user.isServiceProvider) {
        const result = await ApiService.getProviderAvailability(
          user.id, // Use user ID as provider ID
          selectedDate.toISOString().split('T')[0]
        );
        
        if (result.success) {
          setAvailability(result.data);
          console.log('✅ Loaded provider availability:', result.data);
        } else {
          console.log('⚠️ Provider availability not available, using appointment data for calendar view');
        }
      }
    } catch (error) {
      console.log('⚠️ Provider availability endpoint not available, using appointment data for calendar view');
      // Not critical - we can show the calendar with just appointment data
    }
  };

  // Helper function to check if a time slot is available
  const isTimeSlotAvailable = (hour: number, minute: number): boolean => {
    // First, check if there's an existing booking at this time slot
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const selectedDateString = selectedDate.toISOString().split('T')[0];
    
    // Debug: Only log for specific times to avoid spam
    if (hour === 9 && minute === 30) {
      console.log(`🔍 Debug check for ${timeString} on ${selectedDateString}`);
      console.log(`📊 Total bookings: ${bookings.length}`);
      
      // Log bookings for the selected date
      const selectedDateBookings = bookings.filter(b => b.date === selectedDateString);
      console.log(`📅 Bookings for ${selectedDateString}:`, selectedDateBookings.map(b => ({
        id: b.id,
        client: b.clientName,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
        date: b.date
      })));
    }
    const isBooked = bookings.some(booking => {
      // Only check confirmed, pending, or completed appointments (not cancelled)
      if (!['confirmed', 'pending', 'completed'].includes(booking.status)) {
        return false;
      }
      
      // Check if the booking is on the selected date
      const bookingDate = booking.date;
      if (bookingDate !== selectedDateString) {
        return false;
      }
      
      try {
        // Parse start and end times from the booking
        // Handle different time formats from API
        let startTime: Date;
        let endTime: Date;
        
        if (booking.startTime.includes('T')) {
          // ISO format: "2025-09-13T09:30:00"
          startTime = new Date(booking.startTime);
          endTime = new Date(booking.endTime);
        } else {
          // Time only format: "09:30"
          startTime = new Date(selectedDate);
          const [startHour, startMinute] = booking.startTime.split(':').map(Number);
          startTime.setHours(startHour, startMinute, 0, 0);
          
          endTime = new Date(selectedDate);
          const [endHour, endMinute] = booking.endTime.split(':').map(Number);
          endTime.setHours(endHour, endMinute, 0, 0);
        }
        
        // Create a date object for the current time slot
        const slotTime = new Date(selectedDate);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Check if the slot time falls within the booking time range
        const isOverlapping = slotTime >= startTime && slotTime < endTime;
        
        if (isOverlapping) {
          console.log(`🚫 Time slot ${timeString} is blocked by booking:`, {
            id: booking.id,
            client: booking.clientName,
            service: booking.serviceName,
            status: booking.status,
            startTime: booking.startTime,
            endTime: booking.endTime
          });
        }
        
        return isOverlapping;
      } catch (error) {
        console.error('Error parsing booking times:', error, booking);
        return false;
      }
    });
    
    if (isBooked) {
      return false; // Time slot is booked
    }
    
    // If no availability data, assume available (unless booked)
    if (!availability) return true; 
    
    // Check if the time slot falls within provider's working hours
    if (availability.workingHours) {
      const startTime = availability.workingHours.start || '09:00';
      const endTime = availability.workingHours.end || '17:00';
      
      return timeString >= startTime && timeString <= endTime;
    }
    
    return true; // Default to available
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Loading appointments from API...');
      
      // Load provider schedule first
      await loadProviderSchedule();
      
      // Load real appointment data from API
      const result = await ApiService.getProviderAppointments({
        startDate: new Date(selectedDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week before
        endDate: new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week after
        pageSize: 100
      });
      
      console.log('📊 API Result:', result);
      
      if (result.success && result.data) {
        console.log('✅ Raw API data:', result.data);
        
        // Transform API data to match our Booking interface  
        const appointments = result.data.appointments || result.data;
        const transformedBookings: Booking[] = appointments.map((appointment: any, index: number) => {
          console.log('🔄 Transforming appointment:', appointment);
          
          // Extract the date from bookingDate (API field) or fallback to other fields
          let appointmentDate = appointment.bookingDate || appointment.appointmentDate || appointment.date;
          if (appointmentDate && appointmentDate.includes('T')) {
            appointmentDate = appointmentDate.split('T')[0]; // Extract just the date part
          }
          
          return {
            id: appointment.id?.toString() || `booking-${index}`,
            serviceName: appointment.serviceName || appointment.service?.name || 'Service',
            clientName: appointment.clientName || `${appointment.client?.firstName || ''} ${appointment.client?.lastName || ''}`.trim() || 'Client',
            clientImage: appointment.client?.profileImage || appointment.clientImage || 'https://images.unsplash.com/photo-1494790108755-2616b156d9b6?w=100',
            date: appointmentDate || new Date().toISOString().split('T')[0],
            startTime: appointment.startTime || '09:00',
            endTime: appointment.endTime || '10:00',
            duration: appointment.duration || 60,
            status: getStatusString(appointment.status) || 'confirmed',
            price: appointment.totalAmount || appointment.price || 0,
            location: appointment.location || 'Studio',
            notes: appointment.notes || appointment.specialRequests || '',
            serviceColor: SERVICE_COLORS[index % SERVICE_COLORS.length],
          };
        });
        
        setBookings(transformedBookings);
        console.log('✅ Loaded real appointment data:', transformedBookings.length, 'appointments');
        console.log('📋 Transformed bookings:', transformedBookings);
        
        // Debug: Log bookings for today's date
        const todayStr = selectedDate.toISOString().split('T')[0];
        const todaysBookings = transformedBookings.filter(b => b.date === todayStr);
        console.log(`📅 Bookings for ${todayStr}:`, todaysBookings.map(b => ({
          id: b.id,
          time: `${b.startTime} - ${b.endTime}`,
          client: b.clientName,
          status: b.status
        })));
      } else {
        // Fallback to mock data if API fails
        console.log('⚠️ API failed, using fallback mock data. Result:', result);
        const mockBookings: Booking[] = [
          {
            id: '1',
            serviceName: 'Haircut & Style',
            clientName: 'John Doe',
            clientImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
            date: new Date().toISOString().split('T')[0],
            startTime: '09:00',
            endTime: '10:00',
            duration: 60,
            status: 'confirmed',
            price: 85,
            location: 'Main Studio',
            serviceColor: SERVICE_COLORS[0],
          },
          {
            id: '2',
            serviceName: 'Hair Color',
            clientName: 'Sarah Johnson',
            clientImage: 'https://images.unsplash.com/photo-1494790108755-2616b156d9b6?w=100',
            date: new Date().toISOString().split('T')[0],
            startTime: '14:00',
            endTime: '16:30',
            duration: 150,
            status: 'confirmed',
            price: 250,
            location: 'Color Station',
            serviceColor: SERVICE_COLORS[1],
          },
          {
            id: '3',
            serviceName: 'Facial Treatment',
            clientName: 'Emily Brown',
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            startTime: '11:00',
            endTime: '12:30',
            duration: 90,
            status: 'pending',
            price: 120,
            location: 'Treatment Room',
            serviceColor: SERVICE_COLORS[2],
          },
        ];
        
        setBookings(mockBookings);
      }
    } catch (error) {
      console.error('❌ Error loading bookings:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      
      // Use mock data as fallback
      const mockBookings: Booking[] = [
        {
          id: '1',
          serviceName: 'Haircut & Style',
          clientName: 'John Doe',
          clientImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
          date: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '10:00',
          duration: 60,
          status: 'confirmed',
          price: 85,
          location: 'Main Studio',
          serviceColor: SERVICE_COLORS[0],
        },
      ];
      setBookings(mockBookings);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleBookingPress = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const renderHeader = () => (
    <LinearGradient
      colors={['#6366F1', '#8B5CF6']}
      style={styles.header}
    >
      <SafeAreaView>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>My Schedule</Text>
              <Text style={styles.headerSubtitle}>
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  const renderViewModeSelector = () => (
    <View style={styles.viewModeSelectorContainer}>
      <View style={styles.viewModeSelector}>
        {(['day', 'week', 'month'] as const).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.viewModeButton,
              viewMode === mode && styles.viewModeButtonActive
            ]}
            onPress={() => {
              if (mode === 'day') {
                console.log(`\n\n🔥 DEBUG MODE: Switching to Day View 🔥`);
                console.log(`===========================================`);
              }
              setViewMode(mode);
            }}
          >
            <Ionicons 
              name={mode === 'day' ? 'calendar-outline' : mode === 'week' ? 'grid-outline' : 'apps-outline'} 
              size={18} 
              color={viewMode === mode ? COLORS.primary : COLORS.gray500} 
            />
            <Text style={[
              styles.viewModeText,
              viewMode === mode && styles.viewModeTextActive
            ]}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFilterBar = () => (
    <View style={styles.modernFilterContainer}>
      <TouchableOpacity 
        style={[
          styles.filterHeader,
          isFilterCollapsed && styles.filterHeaderCollapsed
        ]}
        onPress={() => setIsFilterCollapsed(!isFilterCollapsed)}
        activeOpacity={0.7}
      >
        <View style={styles.filterHeaderContent}>
          <Text style={styles.filterTitle}>Filter Appointments</Text>
          <Ionicons 
            name={isFilterCollapsed ? "chevron-down" : "chevron-up"} 
            size={20} 
            color={COLORS.gray600} 
          />
        </View>
        {!isFilterCollapsed && (
          <TouchableOpacity 
            style={styles.clearFiltersButton}
            onPress={() => setFilterStatus(['pending', 'confirmed', 'inprogress', 'completed', 'cancelled', 'no-show'])}
          >
            <Text style={styles.clearFiltersText}>Show All</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      
      {!isFilterCollapsed && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {Object.entries(STATUS_COLORS).map(([status, color]) => {
            const isActive = filterStatus.includes(status);
            const statusLabels = {
              'pending': 'Pending',
              'confirmed': 'Confirmed', 
              'inprogress': 'In Progress',
              'completed': 'Completed',
              'cancelled': 'Cancelled',
              'no-show': 'No Show'
            };
            
            return (
              <TouchableOpacity 
                key={status}
                style={[
                  styles.modernFilterChip,
                  isActive && styles.modernFilterChipActive,
                  { borderColor: color }
                ]}
                onPress={() => {
                  setFilterStatus(prev => 
                    prev.includes(status) 
                      ? prev.filter(s => s !== status)
                      : [...prev, status]
                  );
                }}
              >
                <View style={[
                  styles.modernFilterDot, 
                  { backgroundColor: color },
                  isActive && styles.modernFilterDotActive
                ]} />
                <Text style={[
                  styles.modernFilterText,
                  isActive && styles.modernFilterTextActive
                ]}>
                  {statusLabels[status as keyof typeof statusLabels]}
                </Text>
                {isActive && (
                  <Ionicons name="checkmark" size={14} color={color} style={styles.filterCheckmark} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  const renderDayView = () => {
    const dayBookings = getBookingsForDate(selectedDate);
    
    console.log(`\n🌅 === DAY VIEW RENDER START ===`);
    console.log(`📅 Selected date: ${selectedDate.toISOString().split('T')[0]}`);
    console.log(`📊 Found ${dayBookings.length} bookings for this date`);
    
    // Check if this is a working day
    if (!isWorkingDay(selectedDate)) {
      return (
        <View style={styles.nonWorkingDayContainer}>
          <Ionicons name="business-outline" size={48} color={COLORS.gray400} />
          <Text style={styles.nonWorkingDayTitle}>Closed Today</Text>
          <Text style={styles.nonWorkingDaySubtitle}>
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          <Text style={styles.nonWorkingDayMessage}>
            This day is not in your working schedule. Check your availability settings to modify your working days.
          </Text>
        </View>
      );
    }
    
    if (dayBookings.length === 0) {
      console.log(`📭 No bookings found for ${selectedDate.toDateString()}`);
      console.log(`📋 Available bookings on other dates:`, bookings.map(b => ({
        client: b.clientName,
        date: b.date,
        time: b.startTime
      })));
    }
    
    // Calculate positions for appointment blocks
    console.log(`🚀 DEBUG: Starting position calculation for ${dayBookings.length} appointments`);
    
    const appointmentBlocks = dayBookings.map((booking, index) => {
      console.log(`\n--- APPOINTMENT ${index + 1} ---`);
      console.log(`📍 Processing: ${booking.clientName} - ${booking.serviceName}`);
      console.log(`📅 Raw booking data:`, {
        startTime: booking.startTime,
        endTime: booking.endTime,
        duration: booking.duration,
        date: booking.date,
        status: booking.status
      });
      
      const [startHour, startMinute] = parseTimeFromString(booking.startTime);
      console.log(`⏰ Parsed start time: ${startHour}:${startMinute.toString().padStart(2, '0')} (hour=${startHour}, minute=${startMinute})`);
      
      // Show available time slots for reference
      if (index === 0) {
        console.log(`📋 First 10 time slots:`, timeSlots.slice(0, 10).map(s => `${s.hour}:${s.minute.toString().padStart(2, '0')}`));
      }
      
      // Find the start slot index (each slot is 30 minutes)
      // First try exact match
      let startSlotIndex = timeSlots.findIndex(slot => 
        slot.hour === startHour && slot.minute === startMinute
      );
      
      console.log(`🔍 Exact match search result: ${startSlotIndex}`);
      
      // If no exact match, find the closest slot before this time
      if (startSlotIndex === -1) {
        console.log(`❌ No exact match found for ${startHour}:${startMinute}`);
        const appointmentMinutes = startHour * 60 + startMinute;
        console.log(`🔢 Appointment in minutes since midnight: ${appointmentMinutes}`);
        
        let bestSlotIndex = -1;
        let smallestDiff = Infinity;
        
        for (let i = 0; i < timeSlots.length; i++) {
          const slot = timeSlots[i];
          const slotMinutes = slot.hour * 60 + slot.minute;
          
          // Only consider slots that are at or before the appointment time
          if (slotMinutes <= appointmentMinutes) {
            const diff = appointmentMinutes - slotMinutes;
            if (diff < smallestDiff) {
              smallestDiff = diff;
              bestSlotIndex = i;
            }
          }
        }
        
        startSlotIndex = bestSlotIndex >= 0 ? bestSlotIndex : 0;
        const selectedSlot = timeSlots[startSlotIndex];
        console.log(`✅ Found best slot: index ${startSlotIndex} = ${selectedSlot?.hour}:${selectedSlot?.minute.toString().padStart(2, '0')} (diff: ${smallestDiff} minutes)`);
      } else {
        console.log(`✅ Found exact match at slot index: ${startSlotIndex}`);
      }
      
      console.log(`🔍 Found slot index: ${startSlotIndex} for time ${startHour}:${startMinute}`);
      
      // Ensure we have a valid slot index
      const finalSlotIndex = Math.max(0, startSlotIndex);
      
      // Calculate height based on duration (each slot is 30 minutes = 60px)
      const slotHeight = 60;
      const durationInMinutes = booking.duration;
      const height = Math.max(slotHeight, (durationInMinutes / 30) * slotHeight);
      
      // Calculate top position
      const top = finalSlotIndex * slotHeight;
      
      console.log(`📐 FINAL CALCULATION:`);
      console.log(`   - Final slot index: ${finalSlotIndex}`);
      console.log(`   - Slot height: ${slotHeight}px`);
      console.log(`   - Duration: ${durationInMinutes} minutes`);
      console.log(`   - Calculated height: ${height}px`);
      console.log(`   - Calculated top position: ${top}px`);
      console.log(`   - This should place appointment at time slot: ${timeSlots[finalSlotIndex]?.hour}:${timeSlots[finalSlotIndex]?.minute.toString().padStart(2, '0')}`);
      
      return {
        booking,
        top,
        height,
        startSlotIndex: finalSlotIndex,
        duration: durationInMinutes,
        hasConflict: false
      };
    });
    
    console.log(`\n🏁 POSITIONING SUMMARY:`);
    appointmentBlocks.forEach((block, index) => {
      const slot = timeSlots[block.startSlotIndex];
      console.log(`${index + 1}. ${block.booking.clientName}: ${block.booking.startTime} → slot ${block.startSlotIndex} (${slot?.hour}:${slot?.minute.toString().padStart(2, '0')}) → top: ${block.top}px`);
    });
    
    // Check for overlapping appointments and adjust positioning to prevent visual conflicts
    console.log(`\n🔍 CONFLICT DETECTION:`);
    const processedBlocks = [];
    const occupiedSlots = new Set();
    
    // Sort appointments by start time to process them in order
    appointmentBlocks.sort((a, b) => a.top - b.top);
    
    for (const block of appointmentBlocks) {
      const startSlot = Math.floor(block.top / 60);
      const endSlot = Math.floor((block.top + block.height) / 60);
      
      console.log(`\n🔍 Checking ${block.booking.clientName}:`);
      console.log(`   - Time: ${block.booking.startTime} - ${block.booking.endTime}`);
      console.log(`   - Will occupy slots ${startSlot} to ${endSlot}`);
      
      // Check if any of the slots this appointment needs are already occupied
      let hasConflict = false;
      const conflictingSlots = [];
      for (let slot = startSlot; slot <= endSlot; slot++) {
        if (occupiedSlots.has(slot)) {
          hasConflict = true;
          conflictingSlots.push(slot);
        }
      }
      
      if (hasConflict) {
        console.log(`🚨 DOUBLE BOOKING DETECTED!`);
        console.log(`   - Conflicting slots: ${conflictingSlots.join(', ')}`);
        console.log(`   - Already occupied slots: ${Array.from(occupiedSlots).join(', ')}`);
        block.hasConflict = true;
      } else {
        console.log(`✅ No conflicts found`);
        // Mark these slots as occupied
        for (let slot = startSlot; slot <= endSlot; slot++) {
          occupiedSlots.add(slot);
        }
        console.log(`   - Marking slots ${startSlot}-${endSlot} as occupied`);
      }
      
      processedBlocks.push(block);
    }
    
    console.log(`\n📊 CONFLICT SUMMARY:`);
    console.log(`   - Total appointments: ${processedBlocks.length}`);
    console.log(`   - Conflicts detected: ${processedBlocks.filter(b => b.hasConflict).length}`);
    const sortedSlots = Array.from(occupiedSlots).map(Number).sort((a, b) => a - b);
    console.log(`   - Occupied time slots: ${sortedSlots.join(', ')}`);
    
    return (
      <View style={styles.dayView}>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.dayScrollView}>
          <View style={styles.timeGrid}>
            {/* Render time slots background */}
            {timeSlots.map((slot, index) => {
              const isAvailable = isTimeSlotAvailable(slot.hour, slot.minute);
              
              return (
                <View key={`${slot.hour}-${slot.minute}`} style={[
                  styles.timeSlot,
                  !isAvailable && styles.timeSlotUnavailable
                ]}>
                  <View style={styles.timeLabel}>
                    <Text style={[
                      styles.timeLabelText,
                      !isAvailable && styles.timeLabelUnavailable
                    ]}>
                      {slot.label}
                    </Text>
                  </View>
                  <View style={[
                    styles.timeSlotContent,
                    !isAvailable && styles.timeSlotContentUnavailable
                  ]}>
                    <View style={styles.emptySlot} />
                  </View>
                </View>
              );
            })}
            
            {/* Render appointment blocks as overlays */}
            {processedBlocks.map(({ booking, top, height, hasConflict }) => (
              <TouchableOpacity
                key={booking.id}
                style={[
                  styles.appointmentBlock,
                  {
                    position: 'absolute',
                    top: top,
                    left: 80, // Match timeLabel width
                    right: 16,
                    height: height,
                    backgroundColor: hasConflict 
                      ? '#FF6B6B' // Red for conflicts
                      : booking.serviceColor || STATUS_COLORS[booking.status],
                    borderWidth: hasConflict ? 2 : 0,
                    borderColor: hasConflict ? '#FF0000' : 'transparent',
                  }
                ]}
                onPress={() => handleBookingPress(booking)}
              >
                <View style={styles.appointmentBlockContent}>
                  {hasConflict && (
                    <Text style={[styles.appointmentTitle, { color: 'white', fontWeight: 'bold' }]}>
                      ⚠️ CONFLICT
                    </Text>
                  )}
                  <Text style={styles.appointmentTitle} numberOfLines={1}>
                    {booking.serviceName}
                  </Text>
                  <Text style={styles.appointmentClient} numberOfLines={1}>
                    {booking.clientName}
                  </Text>
                  <Text style={styles.appointmentTime}>
                    {formatTimeDisplay(booking.startTime, 'compact')} - {formatTimeDisplay(booking.endTime, 'compact')}
                  </Text>
                  <Text style={styles.appointmentDuration}>
                    {booking.duration} min
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates(selectedDate);
    // Only show working days for a cleaner view
    const workingDays = weekDates.filter(date => isWorkingDay(date));
    
    // Determine if we need horizontal scrolling (more than 2 working days)
    const needsHorizontalScroll = workingDays.length > 2;
    
    // Calculate day slot width based on screen width and number of days
    const screenWidth = 350; // Approximate screen width minus time column
    const daySlotWidth = needsHorizontalScroll ? 120 : (screenWidth / workingDays.length);
    
    const WeekContent = () => (
      <View style={styles.weekContentContainer}>
        {/* Week header with day navigation */}
        <View style={styles.weekHeader}>
          <View style={styles.timeColumnHeader} />
          {workingDays.map((date) => (
            <TouchableOpacity
              key={date.toISOString()}
              style={[
                styles.weekDayHeader,
                { width: daySlotWidth },
                date.toDateString() === selectedDate.toDateString() && styles.weekDayHeaderActive
              ]}
              onPress={() => {
                setSelectedDate(date);
                setViewMode('day');
              }}
            >
              <Text style={[
                styles.weekDayName,
                date.toDateString() === selectedDate.toDateString() && styles.weekDayNameActive
              ]}>
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text style={[
                styles.weekDayNumber,
                date.toDateString() === selectedDate.toDateString() && styles.weekDayNumberActive
              ]}>
                {date.getDate()}
              </Text>
              {/* Show booking count indicators */}
              {(() => {
                const dayBookings = getBookingsForDate(date);
                const visibleBookings = dayBookings.filter(b => filterStatus.includes(b.status));
                return visibleBookings.length > 0 && (
                  <View style={styles.bookingCountIndicator}>
                    <Text style={styles.bookingCountText}>{visibleBookings.length}</Text>
                  </View>
                );
              })()}
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Week content with time slots */}
        <ScrollView 
          style={styles.weekContent} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.weekScrollContent}
        >
          {timeSlots.map((slot) => (
            <View key={`${slot.hour}-${slot.minute}`} style={styles.weekTimeRow}>
              <View style={styles.weekTimeLabel}>
                <Text style={styles.weekTimeLabelText}>{slot.label}</Text>
              </View>
              {workingDays.map((date) => {
                const dayBookings = getBookingsForDate(date).filter(b => filterStatus.includes(b.status));
                const slotBookings = dayBookings.filter(booking => {
                  const [hour, minute] = parseTimeFromString(booking.startTime);
                  return hour === slot.hour && minute === slot.minute;
                });
                
                return (
                  <View 
                    key={date.toISOString()} 
                    style={[
                      styles.weekDaySlot,
                      { width: daySlotWidth }
                    ]}
                  >
                    {slotBookings.map((booking) => (
                      <TouchableOpacity
                        key={booking.id}
                        style={[
                          styles.weekBookingCard,
                          { backgroundColor: booking.serviceColor || STATUS_COLORS[booking.status] }
                        ]}
                        onPress={() => handleBookingPress(booking)}
                      >
                        <Text style={styles.weekBookingText} numberOfLines={1}>
                          {booking.serviceName}
                        </Text>
                        <Text style={styles.weekBookingClient} numberOfLines={1}>
                          {booking.clientName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>
    );
    
    return (
      <View style={styles.weekView}>
        {needsHorizontalScroll ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.weekHorizontalScroll}
            contentContainerStyle={styles.weekHorizontalScrollContent}
          >
            <WeekContent />
          </ScrollView>
        ) : (
          <WeekContent />
        )}
      </View>
    );
  };

  const renderMonthView = () => {
    const calendarDays = getCalendarDays(selectedDate);
    const monthName = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    return (
      <View style={styles.monthView}>
        <View style={styles.monthHeader}>
          <TouchableOpacity
            style={styles.monthNavButton}
            onPress={() => {
              const prevMonth = new Date(selectedDate);
              prevMonth.setMonth(prevMonth.getMonth() - 1);
              setSelectedDate(prevMonth);
            }}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.gray600} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.monthTitleContainer}
            onPress={() => setSelectedDate(new Date())} // Quick jump to today
          >
            <Text style={styles.monthTitle}>{monthName}</Text>
            <Text style={styles.monthSubtitle}>Tap to go to today</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.monthNavButton}
            onPress={() => {
              const nextMonth = new Date(selectedDate);
              nextMonth.setMonth(nextMonth.getMonth() + 1);
              setSelectedDate(nextMonth);
            }}
          >
            <Ionicons name="chevron-forward" size={24} color={COLORS.gray600} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.weekDaysRow}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Text key={day} style={styles.weekDayLabel}>{day}</Text>
          ))}
        </View>
        
        <ScrollView 
          style={styles.monthScrollView}
          contentContainerStyle={styles.monthScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => {
              const isWorking = isWorkingDay(day.date);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDay,
                    !day.isCurrentMonth && styles.calendarDayInactive,
                    day.isToday && styles.calendarDayToday,
                    day.isSelected && styles.calendarDaySelected,
                    !isWorking && styles.calendarDayNonWorking, // Dim non-working days
                  ]}
                  onPress={() => {
                    // Allow navigation to any day - past days should always be viewable
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // Set to start of day for comparison
                    const selectedDay = new Date(day.date);
                    selectedDay.setHours(0, 0, 0, 0);
                    
                    // Always allow past days, current day, and future working days/appointments
                    if (selectedDay < today || day.isToday || isWorking || day.bookings.length > 0 || !day.isCurrentMonth) {
                      setSelectedDate(day.date);
                      setViewMode('day');
                    }
                  }}
                  disabled={false} // Never disable - always allow viewing past days
                >
                  <Text style={[
                    styles.calendarDayText,
                    !day.isCurrentMonth && styles.calendarDayTextInactive,
                    day.isToday && styles.calendarDayTextToday,
                    day.isSelected && styles.calendarDayTextSelected,
                    !isWorking && styles.calendarDayTextNonWorking, // Gray out text for non-working days
                  ]}>
                    {day.day}
                  </Text>
                  {/* Show bookings on all days if they exist */}
                  {day.bookings.length > 0 && (
                    <View style={styles.bookingIndicators}>
                      {day.bookings.slice(0, 3).map((booking, i) => (
                        <View
                          key={booking.id}
                          style={[
                            styles.bookingIndicator,
                            { backgroundColor: booking.serviceColor || STATUS_COLORS[booking.status] }
                          ]}
                        />
                      ))}
                      {day.bookings.length > 3 && (
                        <Text style={styles.moreIndicator}>+{day.bookings.length - 3}</Text>
                      )}
                    </View>
                  )}
                  {/* Show "Closed" indicator on non-working days when there are no bookings */}
                  {!isWorking && day.isCurrentMonth && day.bookings.length === 0 && (
                    <Text style={styles.closedIndicator}>Closed</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderBookingModal = () => (
    <Modal
      visible={showBookingModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        {/* Modern Header */}
        <View style={styles.modernModalHeader}>
          <TouchableOpacity 
            style={styles.modernCloseButton}
            onPress={() => setShowBookingModal(false)}
          >
            <Ionicons name="close" size={24} color={COLORS.gray600} />
          </TouchableOpacity>
          <View style={styles.modalHeaderCenter}>
            <Text style={styles.modernModalTitle}>Appointment Details</Text>
            {selectedBooking && (
              <View style={[styles.modernStatusBadge, { backgroundColor: getStatusInfo(selectedBooking.status).color }]}>
                <Ionicons name={getStatusInfo(selectedBooking.status).icon as any} size={12} color="white" />
                <Text style={styles.modernStatusText}>{getStatusInfo(selectedBooking.status).text}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.modernMenuButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.gray600} />
          </TouchableOpacity>
        </View>
        
        {selectedBooking && (
          <ScrollView style={styles.modernModalContent} showsVerticalScrollIndicator={false}>
            {/* Service Info Card */}
            <View style={styles.modernServiceCard}>
              <View style={[styles.modernColorAccent, { backgroundColor: selectedBooking.serviceColor || STATUS_COLORS[selectedBooking.status] }]} />
              <View style={styles.modernServiceInfo}>
                <Text style={styles.modernServiceTitle}>{selectedBooking.serviceName}</Text>
                <Text style={styles.modernServicePrice}>${selectedBooking.price}</Text>
              </View>
            </View>

            {/* Client & Time Info */}
            <View style={styles.modernInfoSection}>
              <View style={styles.modernInfoRow}>
                <View style={styles.modernInfoIcon}>
                  <Ionicons name="person-circle" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.modernInfoContent}>
                  <Text style={styles.modernInfoLabel}>Client</Text>
                  <Text style={styles.modernInfoValue}>{selectedBooking.clientName}</Text>
                </View>
                <TouchableOpacity style={styles.modernQuickAction}>
                  <Ionicons name="call" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modernInfoRow}>
                <View style={styles.modernInfoIcon}>
                  <Ionicons name="calendar" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.modernInfoContent}>
                  <Text style={styles.modernInfoLabel}>Date & Time</Text>
                  <Text style={styles.modernInfoValue}>
                    {new Date(selectedBooking.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Text>
                  <Text style={styles.modernInfoSubValue}>
                    {formatTimeDisplay(selectedBooking.startTime, 'detail')} - {formatTimeDisplay(selectedBooking.endTime, 'detail')} ({selectedBooking.duration}m)
                  </Text>
                </View>
                <TouchableOpacity style={styles.modernQuickAction}>
                  <Ionicons name="create" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.modernInfoRow, !selectedBooking.notes && { borderBottomWidth: 0 }]}>
                <View style={styles.modernInfoIcon}>
                  <Ionicons name="location" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.modernInfoContent}>
                  <Text style={styles.modernInfoLabel}>Location</Text>
                  <Text style={styles.modernInfoValue}>{selectedBooking.location}</Text>
                </View>
              </View>

              {selectedBooking.notes && (
                <View style={[styles.modernInfoRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.modernInfoIcon}>
                    <Ionicons name="document-text" size={24} color={COLORS.primary} />
                  </View>
                  <View style={styles.modernInfoContent}>
                    <Text style={styles.modernInfoLabel}>Notes</Text>
                    <Text style={styles.modernInfoValue}>{selectedBooking.notes}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Primary Action Section */}
            {getNextStatus(selectedBooking.status) && (
              <View style={styles.modernActionSection}>
                <TouchableOpacity 
                  style={[
                    styles.modernPrimaryButton,
                    { backgroundColor: getStatusInfo(getNextStatus(selectedBooking.status)!).color },
                    updatingStatus && styles.modernButtonDisabled
                  ]}
                  onPress={() => {
                    const nextStatus = getNextStatus(selectedBooking.status);
                    if (nextStatus) {
                      handleStatusUpdate(selectedBooking.id, nextStatus);
                    }
                  }}
                  disabled={updatingStatus}
                >
                  <View style={styles.modernButtonContent}>
                    {updatingStatus ? (
                      <ActivityIndicator size={20} color="white" />
                    ) : (
                      <Ionicons name={getStatusInfo(getNextStatus(selectedBooking.status)!).icon as any} size={20} color="white" />
                    )}
                    <Text style={styles.modernPrimaryButtonText}>
                      {updatingStatus ? 'Updating...' : 
                       selectedBooking.status === 'pending' ? 'Accept Appointment' :
                       selectedBooking.status === 'confirmed' ? 'Start Service' :
                       selectedBooking.status === 'inprogress' ? 'Mark Complete' :
                       'Update Status'
                      }
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Secondary Actions - Compact Row */}
            {selectedBooking.status !== 'completed' && selectedBooking.status !== 'cancelled' && (
              <View style={styles.modernSecondaryActions}>
                <TouchableOpacity style={styles.modernSecondaryButton}>
                  <Ionicons name="calendar-outline" size={16} color={COLORS.gray600} />
                  <Text style={styles.modernSecondaryButtonText}>Reschedule</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.modernSecondaryButton}
                  onPress={() => {
                    Alert.alert(
                      'Cancel Appointment',
                      'Are you sure you want to cancel this appointment?',
                      [
                        { text: 'No', style: 'cancel' },
                        { 
                          text: 'Yes, Cancel', 
                          style: 'destructive',
                          onPress: () => handleStatusUpdate(selectedBooking.id, 'Cancelled')
                        }
                      ]
                    );
                  }}
                >
                  <Ionicons name="close-outline" size={16} color={COLORS.error} />
                  <Text style={[styles.modernSecondaryButtonText, { color: COLORS.error }]}>Cancel</Text>
                </TouchableOpacity>

                {selectedBooking.status === 'confirmed' && (
                  <TouchableOpacity 
                    style={styles.modernSecondaryButton}
                    onPress={() => {
                      Alert.alert(
                        'Mark as No-Show',
                        'Mark this appointment as a no-show? This action cannot be undone.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Mark No-Show', 
                            style: 'destructive',
                            onPress: () => handleStatusUpdate(selectedBooking.id, 'Cancelled')
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="person-remove-outline" size={16} color={COLORS.gray600} />
                    <Text style={styles.modernSecondaryButtonText}>No Show</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading schedule...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {tabBar}
      {renderViewModeSelector()}
      {renderFilterBar()}
      
      <View style={styles.content}>
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}
      </View>
      
      {renderBookingModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray600,
  },
  header: {
    paddingBottom: 12, // Reduced from 20
  },
  headerContent: {
    paddingHorizontal: 16, // Reduced from 20
    paddingTop: 12, // Reduced from 20
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12, // Reduced from 20
  },
  headerTitle: {
    fontSize: 24, // Reduced from 28
    fontWeight: '700',
    color: 'white',
    marginBottom: 2, // Reduced from 4
  },
  headerSubtitle: {
    fontSize: 14, // Reduced from 16
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  
  // Modern View Mode Selector
  viewModeSelectorContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16, // Reduced from 20
    paddingVertical: 12, // Reduced from 16
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  viewModeSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray50,
    borderRadius: 10, // Reduced from 12
    padding: 3, // Reduced from 4
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8, // Reduced from 10
    paddingHorizontal: 12, // Reduced from 16
    borderRadius: 7, // Reduced from 8
    gap: 4, // Reduced from 6
  },
  viewModeButtonActive: {
    backgroundColor: 'white',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewModeText: {
    fontSize: 12, // Reduced from 14
    fontWeight: '600',
    color: COLORS.gray500,
  },
  viewModeTextActive: {
    color: COLORS.primary,
  },
  
  // Modern Filter Styles
  modernFilterContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16, // Reduced from 20
    paddingVertical: 12, // Reduced from 16
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Reduced from 12
    paddingVertical: 6, // Reduced from 8
    paddingHorizontal: 4,
    borderRadius: 6, // Reduced from 8
  },
  filterHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterHeaderCollapsed: {
    backgroundColor: COLORS.gray50,
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 14, // Reduced from 16
    fontWeight: '600',
    color: COLORS.gray800,
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.gray100,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  filterScrollContent: {
    paddingRight: 16, // Reduced from 20
  },
  modernFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10, // Reduced from 14
    paddingVertical: 7, // Reduced from 10
    borderRadius: 20, // Reduced from 24
    backgroundColor: 'white',
    marginRight: 8, // Reduced from 10
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modernFilterChipActive: {
    backgroundColor: COLORS.gray50,
    borderWidth: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modernFilterDot: {
    width: 8, // Reduced from 10
    height: 8, // Reduced from 10
    borderRadius: 4, // Reduced from 5
    marginRight: 6, // Reduced from 8
    opacity: 0.7,
  },
  modernFilterDotActive: {
    opacity: 1,
    shadowColor: 'currentColor',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  modernFilterText: {
    fontSize: 11, // Reduced from 13
    fontWeight: '600',
    color: COLORS.gray600,
  },
  modernFilterTextActive: {
    color: COLORS.gray800,
  },
  filterCheckmark: {
    marginLeft: 6,
  },
  
  content: {
    flex: 1,
  },
  
  // Day View Styles
  dayView: {
    flex: 1,
    backgroundColor: 'white',
  },
  dayScrollView: {
    flex: 1,
  },
  timeGrid: {
    position: 'relative',
  },
  timeSlot: {
    flexDirection: 'row',
    height: 60, // Fixed height for consistent positioning
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  timeLabel: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRightWidth: 1,
    borderRightColor: COLORS.gray200,
  },
  timeLabelText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray500,
  },
  timeSlotContent: {
    flex: 1,
    padding: 4,
  },
  timeSlotUnavailable: {
    opacity: 0.5,
    backgroundColor: COLORS.gray50,
  },
  timeLabelUnavailable: {
    color: COLORS.gray400,
  },
  unavailableIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    padding: 2,
  },
  timeSlotContentUnavailable: {
    backgroundColor: COLORS.gray50,
  },
  bookingCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
  },
  bookingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  bookingClient: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  bookingTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  emptySlot: {
    height: 1,
  },
  
  // Week View Styles
  weekView: {
    flex: 1,
    backgroundColor: 'white',
  },
  weekContentContainer: {
    flex: 1,
  },
  weekHorizontalScroll: {
    flex: 1,
  },
  weekHorizontalScrollContent: {
    minWidth: '100%',
  },
  weekHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    backgroundColor: COLORS.gray50,
  },
  timeColumnHeader: {
    width: 60,
    borderRightWidth: 1,
    borderRightColor: COLORS.gray200,
  },
  weekDayHeader: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.gray200,
    minWidth: 80,
  },
  weekDayHeaderActive: {
    backgroundColor: COLORS.primary,
  },
  weekDayName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray600,
    marginBottom: 2,
  },
  weekDayNameActive: {
    color: 'white',
  },
  weekDayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray800,
  },
  weekDayNumberActive: {
    color: 'white',
  },
  weekContent: {
    flex: 1,
  },
  weekTimeRow: {
    flexDirection: 'row',
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  weekTimeLabel: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRightWidth: 1,
    borderRightColor: COLORS.gray200,
  },
  weekTimeLabelText: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.gray500,
  },
  weekDaySlot: {
    height: 50,
    padding: 2,
    borderRightWidth: 1,
    borderRightColor: COLORS.gray200,
    justifyContent: 'center',
  },
  weekBookingCard: {
    borderRadius: 4,
    padding: 4,
    marginBottom: 2,
    flex: 1,
    justifyContent: 'center',
  },
  weekBookingText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  weekBookingClient: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    textAlign: 'center',
  },
  weekScrollContent: {
    paddingBottom: 100,
  },
  bookingCountIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingCountText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  
  // Month View Styles
  monthView: {
    flex: 1,
    backgroundColor: 'white',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16, // Reduced from 20
    paddingVertical: 12, // Reduced from 16
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  monthTitle: {
    fontSize: 16, // Reduced from 18
    fontWeight: '700',
    color: COLORS.gray800,
  },
  monthNavButton: {
    padding: 6, // Reduced from 8
    borderRadius: 6, // Reduced from 8
    backgroundColor: COLORS.gray100,
  },
  monthTitleContainer: {
    alignItems: 'center',
  },
  monthSubtitle: {
    fontSize: 11, // Reduced from 12
    color: COLORS.gray500,
    marginTop: 1, // Reduced from 2
  },
  monthScrollView: {
    flex: 1,
  },
  monthScrollContent: {
    paddingBottom: 80, // Reduced from 100
  },
  weekDaysRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray50,
    paddingVertical: 6, // Reduced from 8
  },
  weekDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11, // Reduced from 12
    fontWeight: '600',
    color: COLORS.gray600,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: (width - 6) / 7, // Subtract total border width (6px for 6 internal borders) and divide by 7
    height: 75, // Reduced from 90 for more compact view
    padding: 3, // Reduced from 4
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderBottomColor: COLORS.gray200,
    borderRightColor: COLORS.gray200,
  },
  calendarDayInactive: {
    backgroundColor: COLORS.gray50,
  },
  calendarDayToday: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  calendarDaySelected: {
    backgroundColor: COLORS.primary,
  },
  calendarDayText: {
    fontSize: 12, // Reduced from 14
    fontWeight: '600',
    color: COLORS.gray800,
    textAlign: 'center',
    marginBottom: 2, // Reduced from 4
  },
  calendarDayTextInactive: {
    color: COLORS.gray400,
  },
  calendarDayTextToday: {
    color: COLORS.primary,
  },
  calendarDayTextSelected: {
    color: 'white',
  },
  bookingIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  bookingIndicator: {
    width: 5, // Reduced from 6
    height: 5, // Reduced from 6
    borderRadius: 2.5, // Reduced from 3
    marginHorizontal: 0.5, // Reduced from 1
    marginVertical: 0.5, // Reduced from 1
  },
  moreIndicator: {
    fontSize: 7, // Reduced from 8
    color: COLORS.gray500,
    fontWeight: '600',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  modalCancel: {
    fontSize: 16,
    color: COLORS.gray600,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray800,
  },
  modalEdit: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  bookingDetailCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    marginBottom: 20,
  },
  serviceColorBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  bookingDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  bookingDetailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray800,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  bookingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bookingDetailText: {
    fontSize: 16,
    color: COLORS.gray700,
    marginLeft: 12,
    flex: 1,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  contactButton: {
    backgroundColor: COLORS.primary,
  },
  rescheduleButton: {
    backgroundColor: COLORS.warning,
  },
  completeButton: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  statusProgressButton: {
    backgroundColor: COLORS.primary,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    backgroundColor: COLORS.error,
  },
  noShowButton: {
    backgroundColor: COLORS.gray500,
  },
  appointmentBlock: {
    borderRadius: 8,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  appointmentBlockContent: {
    padding: 12,
    flex: 1,
    justifyContent: 'center',
  },
  appointmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  appointmentClient: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  appointmentTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  appointmentDuration: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  
  // New styles for working days/availability
  calendarDayNonWorking: {
    backgroundColor: COLORS.gray50,
    opacity: 0.6,
  },
  calendarDayTextNonWorking: {
    color: COLORS.gray400,
  },
  closedIndicator: {
    fontSize: 10,
    color: COLORS.gray400,
    textAlign: 'center',
    marginTop: 2,
    fontStyle: 'italic',
  },
  
  // Non-working day view styles
  nonWorkingDayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    padding: 32,
  },
  nonWorkingDayTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.gray600,
    marginTop: 16,
    marginBottom: 8,
  },
  nonWorkingDaySubtitle: {
    fontSize: 16,
    color: COLORS.gray500,
    marginBottom: 16,
  },
  nonWorkingDayMessage: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Modern Modal Styles
  modernModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    backgroundColor: 'white',
  },
  modernCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  modernModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray800,
  },
  modernStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  modernStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  modernMenuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernModalContent: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  modernServiceCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modernColorAccent: {
    height: 4,
  },
  modernServiceInfo: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modernServiceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray800,
    flex: 1,
  },
  modernServicePrice: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  modernInfoSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modernInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  modernInfoIcon: {
    width: 40,
    alignItems: 'center',
  },
  modernInfoContent: {
    flex: 1,
    marginLeft: 12,
  },
  modernInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modernInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray800,
  },
  modernInfoSubValue: {
    fontSize: 14,
    color: COLORS.gray600,
    marginTop: 2,
  },
  modernQuickAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernActionSection: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  modernPrimaryButton: {
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modernButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  modernPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  modernButtonDisabled: {
    opacity: 0.6,
  },
  modernSecondaryActions: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  modernSecondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    gap: 6,
  },
  modernSecondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray600,
  },
});

export default ScheduleTabContent;
