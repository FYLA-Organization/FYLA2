import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  Switch,
  ActivityIndicator,
  StatusBar,
  FlatList,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/colors';
import { generateDemoWeekSchedule } from '../../data/providerDemoData';
import ApiService from '../../services/api';
import { RootStackParamList } from '../../types';

const { width } = Dimensions.get('window');

type ScheduleNavigationProp = StackNavigationProp<RootStackParamList>;

interface TimeSlot {
  hour: number;
  minute: number;
  available: boolean;
}

interface DaySchedule {
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  isWorkingDay: boolean;
  startTime: TimeSlot;
  endTime: TimeSlot;
  breakStart?: TimeSlot;
  breakEnd?: TimeSlot;
  timeSlots: ScheduleSlot[];
}

interface ScheduleSlot {
  id: string;
  startTime: TimeSlot;
  endTime: TimeSlot;
  isBooked: boolean;
  isBlocked: boolean;
  appointment?: {
    clientName: string;
    serviceName: string;
    duration: number;
    status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  };
}

interface WeeklySchedule {
  weekStartDate: Date;
  days: DaySchedule[];
}

const EnhancedScheduleScreen: React.FC = () => {
  const navigation = useNavigation<ScheduleNavigationProp>();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule | null>(null);
  const [selectedDay, setSelectedDay] = useState<DaySchedule | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<any>(null);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  useEffect(() => {
    loadWeeklySchedule();
  }, [currentWeekOffset]);

  const loadWeeklySchedule = async () => {
    try {
      setLoading(true);
      
      // Calculate week start date
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + (currentWeekOffset * 7));
      
      // Load mock data - in real app, this would be API call
      const mockSchedule: WeeklySchedule = {
        weekStartDate: weekStart,
        days: [
          {
            dayOfWeek: 'Monday',
            isWorkingDay: true,
            startTime: { hour: 9, minute: 0, available: true },
            endTime: { hour: 17, minute: 0, available: true },
            breakStart: { hour: 12, minute: 0, available: false },
            breakEnd: { hour: 13, minute: 0, available: false },
            timeSlots: generateDaySlots('Monday', weekStart),
          },
          {
            dayOfWeek: 'Tuesday',
            isWorkingDay: true,
            startTime: { hour: 9, minute: 0, available: true },
            endTime: { hour: 17, minute: 0, available: true },
            breakStart: { hour: 12, minute: 0, available: false },
            breakEnd: { hour: 13, minute: 0, available: false },
            timeSlots: generateDaySlots('Tuesday', weekStart),
          },
          {
            dayOfWeek: 'Wednesday',
            isWorkingDay: true,
            startTime: { hour: 9, minute: 0, available: true },
            endTime: { hour: 17, minute: 0, available: true },
            breakStart: { hour: 12, minute: 0, available: false },
            breakEnd: { hour: 13, minute: 0, available: false },
            timeSlots: generateDaySlots('Wednesday', weekStart),
          },
          {
            dayOfWeek: 'Thursday',
            isWorkingDay: true,
            startTime: { hour: 9, minute: 0, available: true },
            endTime: { hour: 17, minute: 0, available: true },
            breakStart: { hour: 12, minute: 0, available: false },
            breakEnd: { hour: 13, minute: 0, available: false },
            timeSlots: generateDaySlots('Thursday', weekStart),
          },
          {
            dayOfWeek: 'Friday',
            isWorkingDay: true,
            startTime: { hour: 9, minute: 0, available: true },
            endTime: { hour: 17, minute: 0, available: true },
            breakStart: { hour: 12, minute: 0, available: false },
            breakEnd: { hour: 13, minute: 0, available: false },
            timeSlots: generateDaySlots('Friday', weekStart),
          },
          {
            dayOfWeek: 'Saturday',
            isWorkingDay: true,
            startTime: { hour: 10, minute: 0, available: true },
            endTime: { hour: 16, minute: 0, available: true },
            timeSlots: generateDaySlots('Saturday', weekStart),
          },
          {
            dayOfWeek: 'Sunday',
            isWorkingDay: false,
            startTime: { hour: 0, minute: 0, available: false },
            endTime: { hour: 0, minute: 0, available: false },
            timeSlots: [],
          },
        ],
      };
      
      setWeeklySchedule(mockSchedule);
    } catch (error) {
      console.error('Error loading schedule:', error);
      Alert.alert('Error', 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const generateDaySlots = (dayName: string, weekStart: Date): ScheduleSlot[] => {
    const slots: ScheduleSlot[] = [];
    const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(dayName);
    
    // Generate 30-minute slots for the day
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 12 && minute < 60) continue; // Skip lunch break
        
        const slotId = `${dayName}-${hour}-${minute}`;
        const isBooked = Math.random() > 0.7; // 30% chance of being booked
        
        slots.push({
          id: slotId,
          startTime: { hour, minute, available: !isBooked },
          endTime: { hour: minute === 30 ? hour + 1 : hour, minute: minute === 30 ? 0 : 30, available: !isBooked },
          isBooked,
          isBlocked: false,
          appointment: isBooked ? {
            clientName: ['Sarah Johnson', 'Emma Wilson', 'Lisa Chen', 'Maria Garcia'][Math.floor(Math.random() * 4)],
            serviceName: ['Hair Cut', 'Facial', 'Manicure', 'Hair Color'][Math.floor(Math.random() * 4)],
            duration: [30, 60, 90][Math.floor(Math.random() * 3)],
            status: ['confirmed', 'pending'][Math.floor(Math.random() * 2)] as any,
          } : undefined,
        });
      }
    }
    
    return slots;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWeeklySchedule();
    setRefreshing(false);
  };

  const formatTime = (timeSlot: TimeSlot) => {
    const hour = timeSlot.hour;
    const minute = timeSlot.minute;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatWeekRange = (weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const handleDayPress = (day: DaySchedule) => {
    setSelectedDay(day);
    setShowDayModal(true);
  };

  const handleSlotPress = (slot: ScheduleSlot) => {
    if (slot.isBooked) {
      // Show appointment details
      Alert.alert(
        'Appointment Details',
        `Client: ${slot.appointment?.clientName}\nService: ${slot.appointment?.serviceName}\nTime: ${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}\nStatus: ${slot.appointment?.status}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Edit', onPress: () => console.log('Edit appointment') },
          { text: 'Complete', onPress: () => handleCompleteAppointment(slot) },
        ]
      );
    } else {
      // Block/unblock time slot
      Alert.alert(
        'Time Slot',
        'What would you like to do with this time slot?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: slot.isBlocked ? 'Unblock' : 'Block', onPress: () => handleToggleSlot(slot) },
          { text: 'Add Appointment', onPress: () => handleAddAppointment(slot) },
        ]
      );
    }
  };

  const handleCompleteAppointment = (slot: ScheduleSlot) => {
    // Mark appointment as completed
    console.log('Completing appointment:', slot.id);
  };

  const handleToggleSlot = (slot: ScheduleSlot) => {
    // Toggle slot blocked status
    console.log('Toggling slot:', slot.id);
  };

  const handleAddAppointment = (slot: ScheduleSlot) => {
    // Navigate to add appointment screen
    console.log('Adding appointment to slot:', slot.id);
  };

  const handleToggleWorkingDay = (dayName: string, isWorking: boolean) => {
    if (!weeklySchedule) return;
    
    setWeeklySchedule(prev => ({
      ...prev!,
      days: prev!.days.map(day => 
        day.dayOfWeek === dayName 
          ? { ...day, isWorkingDay: isWorking }
          : day
      ),
    }));
  };

  const getSlotColor = (slot: ScheduleSlot) => {
    if (slot.isBooked) {
      if (slot.appointment?.status === 'confirmed') return COLORS.success;
      if (slot.appointment?.status === 'pending') return COLORS.warning;
      if (slot.appointment?.status === 'completed') return COLORS.primary;
      return COLORS.textSecondary;
    }
    if (slot.isBlocked) return COLORS.error;
    return COLORS.borderLight;
  };

  const renderDayCard = (day: DaySchedule, index: number) => {
    const dayDate = new Date(weeklySchedule!.weekStartDate);
    dayDate.setDate(dayDate.getDate() + index);
    
    const bookedSlots = day.timeSlots.filter(slot => slot.isBooked).length;
    const totalSlots = day.timeSlots.length;
    
    return (
      <TouchableOpacity
        key={day.dayOfWeek}
        style={styles.dayCard}
        onPress={() => handleDayPress(day)}
      >
        <LinearGradient
          colors={day.isWorkingDay ? COLORS.gradientSuccess : ['#ccc', '#999'] as const}
          style={styles.dayGradient}
        >
          <Text style={styles.dayName}>{day.dayOfWeek}</Text>
          <Text style={styles.dayDate}>
            {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
          
          {day.isWorkingDay ? (
            <>
              <Text style={styles.dayHours}>
                {formatTime(day.startTime)} - {formatTime(day.endTime)}
              </Text>
              <View style={styles.dayStats}>
                <Text style={styles.dayStatsText}>
                  {bookedSlots}/{totalSlots} booked
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.dayOff}>Day Off</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderTimeSlot = (slot: ScheduleSlot) => (
    <TouchableOpacity
      key={slot.id}
      style={[styles.timeSlot, { backgroundColor: getSlotColor(slot) }]}
      onPress={() => handleSlotPress(slot)}
    >
      <Text style={[styles.slotTime, { color: slot.isBooked ? 'white' : COLORS.text }]}>
        {formatTime(slot.startTime)}
      </Text>
      {slot.isBooked && slot.appointment && (
        <>
          <Text style={styles.slotClient}>{slot.appointment.clientName}</Text>
          <Text style={styles.slotService}>{slot.appointment.serviceName}</Text>
        </>
      )}
      {slot.isBlocked && (
        <Text style={styles.slotBlocked}>Blocked</Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <LinearGradient colors={COLORS.gradient} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (!weeklySchedule) {
    return (
      <View style={styles.container}>
        <Text>No schedule data available</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.container}>
        <LinearGradient colors={COLORS.gradient} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Schedule Management</Text>
            <TouchableOpacity onPress={() => console.log('Settings')}>
              <Ionicons name="settings" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Week Navigation */}
          <View style={styles.weekNavigation}>
            <TouchableOpacity 
              style={styles.weekNavButton}
              onPress={() => setCurrentWeekOffset(currentWeekOffset - 1)}
            >
              <Ionicons name="chevron-back" size={20} color="white" />
            </TouchableOpacity>
            
            <Text style={styles.weekRange}>
              {formatWeekRange(weeklySchedule.weekStartDate)}
            </Text>
            
            <TouchableOpacity 
              style={styles.weekNavButton}
              onPress={() => setCurrentWeekOffset(currentWeekOffset + 1)}
            >
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Week Overview */}
          <View style={styles.weekOverview}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysContainer}
            >
              {weeklySchedule.days.map((day, index) => renderDayCard(day, index))}
            </ScrollView>
          </View>

          {/* Daily Schedules */}
          {weeklySchedule.days.filter(day => day.isWorkingDay).map((day) => (
            <View key={day.dayOfWeek} style={styles.daySection}>
              <View style={styles.daySectionHeader}>
                <Text style={styles.daySectionTitle}>{day.dayOfWeek}</Text>
                <Switch
                  value={day.isWorkingDay}
                  onValueChange={(value) => handleToggleWorkingDay(day.dayOfWeek, value)}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor="white"
                />
              </View>
              
              <View style={styles.timeSlotsGrid}>
                {day.timeSlots.map(renderTimeSlot)}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Day Details Modal */}
        <Modal
          visible={showDayModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDayModal(false)}
        >
          <BlurView intensity={80} style={styles.modalOverlay}>
            <View style={styles.dayModalContent}>
              {selectedDay && (
                <>
                  <View style={styles.dayModalHeader}>
                    <Text style={styles.dayModalTitle}>{selectedDay.dayOfWeek} Schedule</Text>
                    <TouchableOpacity onPress={() => setShowDayModal(false)}>
                      <Ionicons name="close" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>
                  
                  <ScrollView style={styles.dayModalBody}>
                    <View style={styles.daySettings}>
                      <View style={styles.daySettingItem}>
                        <Text style={styles.daySettingLabel}>Working Day</Text>
                        <Switch
                          value={selectedDay.isWorkingDay}
                          onValueChange={(value) => handleToggleWorkingDay(selectedDay.dayOfWeek, value)}
                          trackColor={{ false: COLORS.border, true: COLORS.primary }}
                          thumbColor="white"
                        />
                      </View>
                      
                      {selectedDay.isWorkingDay && (
                        <>
                          <View style={styles.daySettingItem}>
                            <Text style={styles.daySettingLabel}>Start Time</Text>
                            <TouchableOpacity style={styles.timeButton}>
                              <Text style={styles.timeButtonText}>
                                {formatTime(selectedDay.startTime)}
                              </Text>
                            </TouchableOpacity>
                          </View>
                          
                          <View style={styles.daySettingItem}>
                            <Text style={styles.daySettingLabel}>End Time</Text>
                            <TouchableOpacity style={styles.timeButton}>
                              <Text style={styles.timeButtonText}>
                                {formatTime(selectedDay.endTime)}
                              </Text>
                            </TouchableOpacity>
                          </View>
                          
                          {selectedDay.breakStart && selectedDay.breakEnd && (
                            <>
                              <View style={styles.daySettingItem}>
                                <Text style={styles.daySettingLabel}>Break Start</Text>
                                <TouchableOpacity style={styles.timeButton}>
                                  <Text style={styles.timeButtonText}>
                                    {formatTime(selectedDay.breakStart)}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                              
                              <View style={styles.daySettingItem}>
                                <Text style={styles.daySettingLabel}>Break End</Text>
                                <TouchableOpacity style={styles.timeButton}>
                                  <Text style={styles.timeButtonText}>
                                    {formatTime(selectedDay.breakEnd)}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </>
                          )}
                        </>
                      )}
                    </View>
                  </ScrollView>
                </>
              )}
            </View>
          </BlurView>
        </Modal>
      </View>
    </>
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
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekRange: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  weekOverview: {
    paddingVertical: 20,
  },
  daysContainer: {
    paddingHorizontal: 20,
  },
  dayCard: {
    width: (width - 60) / 4,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayGradient: {
    padding: 12,
    alignItems: 'center',
    minHeight: 100,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  dayDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  dayHours: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 8,
  },
  dayStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dayStatsText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  dayOff: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  daySection: {
    backgroundColor: COLORS.surface,
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  daySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  daySectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    width: (width - 76) / 3, // Account for margins and gaps
    borderRadius: 8,
    padding: 8,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotTime: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  slotClient: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  slotService: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  slotBlocked: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dayModalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  dayModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  dayModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  dayModalBody: {
    maxHeight: 400,
  },
  daySettings: {
    padding: 20,
  },
  daySettingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  daySettingLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  timeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EnhancedScheduleScreen;
