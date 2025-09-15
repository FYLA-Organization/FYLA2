import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'no-show';
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
  confirmed: '#10B981',
  pending: '#F59E0B',
  completed: '#6366F1',
  cancelled: '#EF4444',
  'no-show': '#9CA3AF',
};

const EnhancedProviderBookingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  
  // State management
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string[]>(['confirmed', 'pending']);
  const [searchQuery, setSearchQuery] = useState('');

  // Time slots for day view (6 AM to 10 PM)
  const timeSlots: TimeSlot[] = useMemo(() => {
    const slots: TimeSlot[] = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = new Date();
        time.setHours(hour, minute, 0, 0);
        slots.push({
          hour,
          minute,
          label: time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        });
      }
    }
    return slots;
  }, []);

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
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration - replace with actual API call
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
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
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
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* View Mode Selector */}
          <View style={styles.viewModeSelector}>
            {(['day', 'week', 'month'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.viewModeButton,
                  viewMode === mode && styles.viewModeButtonActive
                ]}
                onPress={() => setViewMode(mode)}
              >
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
      </SafeAreaView>
    </LinearGradient>
  );

  const renderFilterBar = () => (
    <View style={styles.filterBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity 
          style={[
            styles.filterChip,
            filterStatus.includes('confirmed') && styles.filterChipActive
          ]}
          onPress={() => {
            setFilterStatus(prev => 
              prev.includes('confirmed') 
                ? prev.filter(s => s !== 'confirmed')
                : [...prev, 'confirmed']
            );
          }}
        >
          <View style={[styles.filterDot, { backgroundColor: STATUS_COLORS.confirmed }]} />
          <Text style={[
            styles.filterText,
            filterStatus.includes('confirmed') && styles.filterTextActive
          ]}>
            Confirmed
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterChip,
            filterStatus.includes('pending') && styles.filterChipActive
          ]}
          onPress={() => {
            setFilterStatus(prev => 
              prev.includes('pending') 
                ? prev.filter(s => s !== 'pending')
                : [...prev, 'pending']
            );
          }}
        >
          <View style={[styles.filterDot, { backgroundColor: STATUS_COLORS.pending }]} />
          <Text style={[
            styles.filterText,
            filterStatus.includes('pending') && styles.filterTextActive
          ]}>
            Pending
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterChip,
            filterStatus.includes('completed') && styles.filterChipActive
          ]}
          onPress={() => {
            setFilterStatus(prev => 
              prev.includes('completed') 
                ? prev.filter(s => s !== 'completed')
                : [...prev, 'completed']
            );
          }}
        >
          <View style={[styles.filterDot, { backgroundColor: STATUS_COLORS.completed }]} />
          <Text style={[
            styles.filterText,
            filterStatus.includes('completed') && styles.filterTextActive
          ]}>
            Completed
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderDayView = () => {
    const dayBookings = getBookingsForDate(selectedDate);
    
    return (
      <ScrollView style={styles.dayView} showsVerticalScrollIndicator={false}>
        {timeSlots.map((slot) => {
          const slotBookings = dayBookings.filter(booking => {
            const [hours, minutes] = booking.startTime.split(':').map(Number);
            return hours === slot.hour && minutes === slot.minute;
          });
          
          return (
            <View key={`${slot.hour}-${slot.minute}`} style={styles.timeSlot}>
              <View style={styles.timeLabel}>
                <Text style={styles.timeLabelText}>{slot.label}</Text>
              </View>
              <View style={styles.timeSlotContent}>
                {slotBookings.map((booking) => (
                  <TouchableOpacity
                    key={booking.id}
                    style={[
                      styles.bookingCard,
                      { 
                        backgroundColor: booking.serviceColor || STATUS_COLORS[booking.status],
                        height: Math.max(50, (booking.duration / 30) * 25) // 25px per 30 minutes
                      }
                    ]}
                    onPress={() => handleBookingPress(booking)}
                  >
                    <Text style={styles.bookingTitle} numberOfLines={1}>
                      {booking.serviceName}
                    </Text>
                    <Text style={styles.bookingClient} numberOfLines={1}>
                      {booking.clientName}
                    </Text>
                    <Text style={styles.bookingTime}>
                      {booking.startTime} - {booking.endTime}
                    </Text>
                  </TouchableOpacity>
                ))}
                {slotBookings.length === 0 && (
                  <View style={styles.emptySlot} />
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates(selectedDate);
    
    return (
      <View style={styles.weekView}>
        {/* Week header */}
        <View style={styles.weekHeader}>
          <View style={styles.timeColumnHeader} />
          {weekDates.map((date) => (
            <TouchableOpacity
              key={date.toISOString()}
              style={[
                styles.weekDayHeader,
                date.toDateString() === selectedDate.toDateString() && styles.weekDayHeaderActive
              ]}
              onPress={() => setSelectedDate(date)}
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
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Week content */}
        <ScrollView style={styles.weekContent} showsVerticalScrollIndicator={false}>
          {timeSlots.slice(0, 32).map((slot) => ( // Show fewer slots for week view
            <View key={`${slot.hour}-${slot.minute}`} style={styles.weekTimeRow}>
              <View style={styles.weekTimeLabel}>
                <Text style={styles.weekTimeLabelText}>{slot.label}</Text>
              </View>
              {weekDates.map((date) => {
                const dayBookings = getBookingsForDate(date);
                const slotBookings = dayBookings.filter(booking => {
                  const [hours, minutes] = booking.startTime.split(':').map(Number);
                  return hours === slot.hour && minutes === slot.minute;
                });
                
                return (
                  <View key={date.toISOString()} style={styles.weekDaySlot}>
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
  };

  const renderMonthView = () => {
    const calendarDays = getCalendarDays(selectedDate);
    const monthName = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    return (
      <View style={styles.monthView}>
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={() => {
              const prevMonth = new Date(selectedDate);
              prevMonth.setMonth(prevMonth.getMonth() - 1);
              setSelectedDate(prevMonth);
            }}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.gray600} />
          </TouchableOpacity>
          
          <Text style={styles.monthTitle}>{monthName}</Text>
          
          <TouchableOpacity
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
        
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.calendarDay,
                !day.isCurrentMonth && styles.calendarDayInactive,
                day.isToday && styles.calendarDayToday,
                day.isSelected && styles.calendarDaySelected,
              ]}
              onPress={() => {
                setSelectedDate(day.date);
                setViewMode('day');
              }}
            >
              <Text style={[
                styles.calendarDayText,
                !day.isCurrentMonth && styles.calendarDayTextInactive,
                day.isToday && styles.calendarDayTextToday,
                day.isSelected && styles.calendarDayTextSelected,
              ]}>
                {day.day}
              </Text>
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
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderBookingModal = () => (
    <Modal
      visible={showBookingModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowBookingModal(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Booking Details</Text>
          <TouchableOpacity>
            <Text style={styles.modalEdit}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        {selectedBooking && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.bookingDetailCard}>
              <View style={[styles.serviceColorBar, { backgroundColor: selectedBooking.serviceColor || STATUS_COLORS[selectedBooking.status] }]} />
              
              <View style={styles.bookingDetailHeader}>
                <Text style={styles.bookingDetailTitle}>{selectedBooking.serviceName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[selectedBooking.status] }]}>
                  <Text style={styles.statusText}>{selectedBooking.status.toUpperCase()}</Text>
                </View>
              </View>
              
              <View style={styles.bookingDetailRow}>
                <Ionicons name="person" size={16} color={COLORS.gray500} />
                <Text style={styles.bookingDetailText}>Client: {selectedBooking.clientName}</Text>
              </View>
              
              <View style={styles.bookingDetailRow}>
                <Ionicons name="calendar" size={16} color={COLORS.gray500} />
                <Text style={styles.bookingDetailText}>
                  {new Date(selectedBooking.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
              
              <View style={styles.bookingDetailRow}>
                <Ionicons name="time" size={16} color={COLORS.gray500} />
                <Text style={styles.bookingDetailText}>
                  {selectedBooking.startTime} - {selectedBooking.endTime} ({selectedBooking.duration}m)
                </Text>
              </View>
              
              <View style={styles.bookingDetailRow}>
                <Ionicons name="location" size={16} color={COLORS.gray500} />
                <Text style={styles.bookingDetailText}>{selectedBooking.location}</Text>
              </View>
              
              <View style={styles.bookingDetailRow}>
                <Ionicons name="card" size={16} color={COLORS.gray500} />
                <Text style={styles.bookingDetailText}>${selectedBooking.price}</Text>
              </View>
              
              {selectedBooking.notes && (
                <View style={styles.bookingDetailRow}>
                  <Ionicons name="document-text" size={16} color={COLORS.gray500} />
                  <Text style={styles.bookingDetailText}>{selectedBooking.notes}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity style={[styles.actionButton, styles.contactButton]}>
                <Ionicons name="call" size={16} color="white" />
                <Text style={styles.actionButtonText}>Contact Client</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.actionButton, styles.rescheduleButton]}>
                <Ionicons name="calendar" size={16} color="white" />
                <Text style={styles.actionButtonText}>Reschedule</Text>
              </TouchableOpacity>
              
              {selectedBooking.status === 'confirmed' && (
                <TouchableOpacity style={[styles.actionButton, styles.completeButton]}>
                  <Ionicons name="checkmark" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Mark Complete</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {renderHeader()}
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
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewModeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: 'white',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  viewModeTextActive: {
    color: COLORS.primary,
  },
  filterBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  filterTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  
  // Day View Styles
  dayView: {
    flex: 1,
    backgroundColor: 'white',
  },
  timeSlot: {
    flexDirection: 'row',
    minHeight: 50,
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
  weekHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    backgroundColor: COLORS.gray50,
  },
  timeColumnHeader: {
    width: 60,
  },
  weekDayHeader: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.gray200,
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
    minHeight: 40,
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
    flex: 1,
    padding: 2,
    borderRightWidth: 1,
    borderRightColor: COLORS.gray200,
  },
  weekBookingCard: {
    borderRadius: 4,
    padding: 4,
    marginBottom: 2,
  },
  weekBookingText: {
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray800,
  },
  weekDaysRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray50,
    paddingVertical: 8,
  },
  weekDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: width / 7,
    height: 80,
    padding: 4,
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
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray800,
    textAlign: 'center',
    marginBottom: 4,
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
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 1,
    marginVertical: 1,
  },
  moreIndicator: {
    fontSize: 8,
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
});

export default EnhancedProviderBookingsScreen;
