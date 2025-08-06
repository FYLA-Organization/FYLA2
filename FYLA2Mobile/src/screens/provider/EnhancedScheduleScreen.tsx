import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/colors';
import { RootStackParamList } from '../../types';

const { width } = Dimensions.get('window');

type ScheduleNavigationProp = StackNavigationProp<RootStackParamList>;

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isBlocked: boolean;
  appointment?: {
    id: string;
    clientName: string;
    serviceName: string;
    status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
    duration: number;
  };
}

interface DaySchedule {
  dayOfWeek: string;
  date: string;
  isWorkingDay: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  timeSlots: TimeSlot[];
  appointmentCount: number;
  revenue: number;
}

interface WeekSchedule {
  weekStartDate: Date;
  weekEndDate: Date;
  days: DaySchedule[];
  totalAppointments: number;
  totalRevenue: number;
}

const EnhancedScheduleScreen: React.FC = () => {
  const navigation = useNavigation<ScheduleNavigationProp>();
  
  // State Management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule | null>(null);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Load schedule data
  const loadScheduleData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Calculate week dates
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1 + (currentWeekOffset * 7)); // Start on Monday
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Generate mock schedule data
      const mockSchedule: WeekSchedule = {
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        days: generateWeekDays(weekStart),
        totalAppointments: 0,
        totalRevenue: 0,
      };

      // Calculate totals
      mockSchedule.totalAppointments = mockSchedule.days.reduce((sum, day) => sum + day.appointmentCount, 0);
      mockSchedule.totalRevenue = mockSchedule.days.reduce((sum, day) => sum + day.revenue, 0);

      setWeekSchedule(mockSchedule);
    } catch (error) {
      console.error('Error loading schedule:', error);
      Alert.alert('Error', 'Failed to load schedule data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentWeekOffset]);

  // Generate week days with mock data
  const generateWeekDays = (weekStart: Date): DaySchedule[] => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const workingDays = [true, true, true, true, true, true, false];
    
    return days.map((dayName, index) => {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + index);
      
      const isWorking = workingDays[index];
      const timeSlots = isWorking ? generateDayTimeSlots(dayName) : [];
      const appointmentCount = timeSlots.filter(slot => slot.appointment).length;
      const revenue = timeSlots.reduce((sum, slot) => {
        if (slot.appointment) {
          return sum + (slot.appointment.duration === 30 ? 80 : slot.appointment.duration === 60 ? 120 : 180);
        }
        return sum;
      }, 0);

      return {
        dayOfWeek: dayName,
        date: currentDate.toISOString().split('T')[0],
        isWorkingDay: isWorking,
        startTime: isWorking ? '09:00' : '',
        endTime: isWorking ? (dayName === 'Saturday' ? '16:00' : '18:00') : '',
        breakStart: isWorking && dayName !== 'Saturday' ? '12:00' : undefined,
        breakEnd: isWorking && dayName !== 'Saturday' ? '13:00' : undefined,
        timeSlots,
        appointmentCount,
        revenue,
      };
    });
  };

  // Generate time slots for a day
  const generateDayTimeSlots = (dayName: string): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = dayName === 'Saturday' ? 16 : 18;
    const slotDuration = 30; // 30 minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        // Skip lunch break for weekdays
        if (dayName !== 'Saturday' && hour === 12) continue;

        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endMinute = minute + slotDuration;
        const endHour = endMinute >= 60 ? hour + 1 : hour;
        const endTime = `${endHour.toString().padStart(2, '0')}:${(endMinute % 60).toString().padStart(2, '0')}`;
        
        const slotId = `${dayName}-${startTime}`;
        const hasAppointment = Math.random() > 0.7; // 30% chance of appointment
        
        const slot: TimeSlot = {
          id: slotId,
          startTime,
          endTime,
          isAvailable: !hasAppointment,
          isBlocked: false,
          appointment: hasAppointment ? {
            id: `apt-${slotId}`,
            clientName: ['Sarah Johnson', 'Emma Wilson', 'Lisa Chen', 'Maria Garcia', 'Ashley Brown'][Math.floor(Math.random() * 5)],
            serviceName: ['Hair Cut & Style', 'Color Treatment', 'Facial Treatment', 'Manicure', 'Hair Wash'][Math.floor(Math.random() * 5)],
            status: ['confirmed', 'pending', 'completed'][Math.floor(Math.random() * 3)] as any,
            duration: [30, 60, 90][Math.floor(Math.random() * 3)],
          } : undefined,
        };

        slots.push(slot);
      }
    }

    return slots;
  };

  // Event handlers
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadScheduleData();
  }, [loadScheduleData]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekOffset(prev => prev + (direction === 'next' ? 1 : -1));
  };

  const handleSlotPress = (slot: TimeSlot) => {
    if (slot.appointment) {
      Alert.alert(
        'Appointment Details',
        `Client: ${slot.appointment.clientName}\nService: ${slot.appointment.serviceName}\nTime: ${slot.startTime} - ${slot.endTime}\nStatus: ${slot.appointment.status}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Edit', onPress: () => console.log('Edit appointment') },
          { text: 'Complete', onPress: () => handleCompleteAppointment(slot) },
        ]
      );
    } else {
      Alert.alert(
        'Time Slot',
        `${slot.startTime} - ${slot.endTime}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: slot.isBlocked ? 'Unblock' : 'Block', onPress: () => handleToggleBlock(slot) },
          { text: 'Add Appointment', onPress: () => handleAddAppointment(slot) },
        ]
      );
    }
  };

  const handleCompleteAppointment = (slot: TimeSlot) => {
    console.log('Completing appointment:', slot.appointment?.id);
    // In real app, call API to complete appointment
  };

  const handleToggleBlock = (slot: TimeSlot) => {
    console.log('Toggling block status for:', slot.id);
    // In real app, call API to block/unblock time slot
  };

  const handleAddAppointment = (slot: TimeSlot) => {
    console.log('Adding appointment for:', slot.id);
    // In real app, navigate to add appointment screen
  };

  const toggleWorkingDay = (dayIndex: number) => {
    if (!weekSchedule) return;
    
    setWeekSchedule(prev => ({
      ...prev!,
      days: prev!.days.map((day, index) => 
        index === dayIndex 
          ? { 
              ...day, 
              isWorkingDay: !day.isWorkingDay,
              timeSlots: !day.isWorkingDay ? generateDayTimeSlots(day.dayOfWeek) : []
            }
          : day
      ),
    }));
  };

  // Utility functions
  const formatWeekRange = (startDate: Date, endDate: Date) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const start = startDate.toLocaleDateString('en-US', options);
    const end = endDate.toLocaleDateString('en-US', { ...options, year: 'numeric' });
    return `${start} - ${end}`;
  };

  const getSlotColor = (slot: TimeSlot) => {
    if (slot.isBlocked) return '#E74C3C';
    if (slot.appointment) {
      switch (slot.appointment.status) {
        case 'confirmed': return COLORS.primary;
        case 'pending': return '#F39C12';
        case 'completed': return '#27AE60';
        case 'cancelled': return '#95A5A6';
        default: return COLORS.primary;
      }
    }
    return '#E8F4FD';
  };

  const getSlotTextColor = (slot: TimeSlot) => {
    if (slot.isBlocked || slot.appointment) return 'white';
    return COLORS.text;
  };

  // Load data on mount and week change
  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  // Render components
  const renderDayCard = (day: DaySchedule, index: number) => {
    const dayDate = new Date(day.date);
    const isToday = dayDate.toDateString() === new Date().toDateString();
    
    return (
      <TouchableOpacity 
        key={day.dayOfWeek}
        style={[styles.dayCard, isToday && styles.todayCard]}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={day.isWorkingDay ? [COLORS.primary, COLORS.primaryDark] : ['#BDC3C7', '#95A5A6']}
          style={styles.dayCardGradient}
        >
          <Text style={styles.dayName}>{day.dayOfWeek.substring(0, 3)}</Text>
          <Text style={styles.dayDate}>{dayDate.getDate()}</Text>
          
          {day.isWorkingDay ? (
            <View style={styles.dayStats}>
              <Text style={styles.dayStatsText}>{day.appointmentCount} apt</Text>
              <Text style={styles.dayStatsText}>${day.revenue}</Text>
            </View>
          ) : (
            <Text style={styles.dayOffText}>Off</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderTimeSlot = (slot: TimeSlot) => (
    <TouchableOpacity
      key={slot.id}
      style={[
        styles.timeSlot,
        { backgroundColor: getSlotColor(slot) }
      ]}
      onPress={() => handleSlotPress(slot)}
      activeOpacity={0.8}
    >
      <Text style={[styles.slotTime, { color: getSlotTextColor(slot) }]}>
        {slot.startTime}
      </Text>
      
      {slot.appointment && (
        <>
          <Text style={styles.slotClient} numberOfLines={1}>
            {slot.appointment.clientName.split(' ')[0]}
          </Text>
          <Text style={styles.slotService} numberOfLines={1}>
            {slot.appointment.serviceName}
          </Text>
        </>
      )}
      
      {slot.isBlocked && (
        <Text style={styles.slotBlocked}>BLOCKED</Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (!weekSchedule) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.errorContainer}>
          <Ionicons name="calendar-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.errorText}>No schedule data available</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadScheduleData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Schedule</Text>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => console.log('Settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Week Navigation */}
        <View style={styles.weekNavigation}>
          <TouchableOpacity 
            style={styles.weekNavButton}
            onPress={() => navigateWeek('prev')}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>
          
          <View style={styles.weekInfo}>
            <Text style={styles.weekRange}>
              {formatWeekRange(weekSchedule.weekStartDate, weekSchedule.weekEndDate)}
            </Text>
            <Text style={styles.weekStats}>
              {weekSchedule.totalAppointments} appointments • ${weekSchedule.totalRevenue}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.weekNavButton}
            onPress={() => navigateWeek('next')}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Week Overview */}
        <View style={styles.weekOverview}>
          <Text style={styles.sectionTitle}>Week Overview</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysScrollContainer}
          >
            {weekSchedule.days.map((day, index) => renderDayCard(day, index))}
          </ScrollView>
        </View>

        {/* Daily Schedules */}
        <View style={styles.dailySchedules}>
          <Text style={styles.sectionTitle}>Daily Schedules</Text>
          
          {weekSchedule.days.map((day, dayIndex) => (
            <View key={day.dayOfWeek} style={styles.dayScheduleCard}>
              <View style={styles.dayScheduleHeader}>
                <View style={styles.dayScheduleInfo}>
                  <Text style={styles.dayScheduleTitle}>{day.dayOfWeek}</Text>
                  <Text style={styles.dayScheduleSubtitle}>
                    {day.isWorkingDay ? `${day.startTime} - ${day.endTime}` : 'Day off'}
                  </Text>
                </View>
                
                <Switch
                  value={day.isWorkingDay}
                  onValueChange={() => toggleWorkingDay(dayIndex)}
                  trackColor={{ false: '#E0E0E0', true: COLORS.primary }}
                  thumbColor={day.isWorkingDay ? 'white' : '#f4f3f4'}
                />
              </View>
              
              {day.isWorkingDay && day.timeSlots.length > 0 && (
                <View style={styles.timeSlotsContainer}>
                  <View style={styles.timeSlotsGrid}>
                    {day.timeSlots.map(slot => renderTimeSlot(slot))}
                  </View>
                </View>
              )}
              
              {day.isWorkingDay && day.timeSlots.length === 0 && (
                <View style={styles.noSlotsContainer}>
                  <Text style={styles.noSlotsText}>No time slots configured</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
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
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekInfo: {
    alignItems: 'center',
    flex: 1,
  },
  weekRange: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  weekStats: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
  },
  weekOverview: {
    paddingVertical: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  daysScrollContainer: {
    paddingHorizontal: SPACING.lg,
  },
  dayCard: {
    width: 80,
    marginRight: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  todayCard: {
    transform: [{ scale: 1.05 }],
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  dayCardGradient: {
    padding: SPACING.md,
    alignItems: 'center',
    minHeight: 100,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  dayDate: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: SPACING.sm,
  },
  dayStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  dayStatsText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  dayOffText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  dailySchedules: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  dayScheduleCard: {
    backgroundColor: 'white',
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  dayScheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  dayScheduleInfo: {
    flex: 1,
  },
  dayScheduleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  dayScheduleSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  timeSlotsContainer: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  timeSlot: {
    width: (width - (SPACING.lg * 2) - (SPACING.sm * 2)) / 3,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    minHeight: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  slotTime: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  slotClient: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 1,
  },
  slotService: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  slotBlocked: {
    fontSize: 10,
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
  },
  noSlotsContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  noSlotsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});

export default EnhancedScheduleScreen;
