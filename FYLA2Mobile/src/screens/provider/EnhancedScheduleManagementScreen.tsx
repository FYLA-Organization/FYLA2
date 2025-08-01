import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/colors';
import { RootStackParamList } from '../../types';
import ApiService from '../../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface AppointmentTimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  bookingId?: string;
  clientName?: string;
  serviceName?: string;
  status?: 'Pending' | 'Confirmed' | 'InProgress' | 'Completed' | 'Cancelled' | 'Blocked';
}

interface DaySchedule {
  date: string;
  isWorkingDay: boolean;
  startTime?: string;
  endTime?: string;
  breakStart?: string;
  breakEnd?: string;
  timeSlots: AppointmentTimeSlot[];
  totalAppointments: number;
  dayRevenue: number;
  hasAvailableSlots: boolean;
}

interface WeekSchedule {
  weekStartDate: string;
  weekEndDate: string;
  days: DaySchedule[];
  totalWeekAppointments: number;
  weekRevenue: number;
  availableSlots: number;
}

interface ScheduleStats {
  totalBookedHours: number;
  totalAvailableHours: number;
  utilizationRate: number;
  peakDays: string[];
  peakHours: number[];
  averageBookingsPerDay: number;
  totalBlockedSlots: number;
  upcomingAppointments: number;
  revenueProjection: number;
}

const EnhancedScheduleManagementScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  
  // State Management
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule | null>(null);
  const [scheduleStats, setScheduleStats] = useState<ScheduleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DaySchedule | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showBlockTimeModal, setShowBlockTimeModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<AppointmentTimeSlot | null>(null);

  // Availability settings
  const [workingDays, setWorkingDays] = useState({
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: true,
    Sunday: false,
  });
  const [workingHours, setWorkingHours] = useState({
    start: '09:00',
    end: '18:00',
    breakStart: '12:00',
    breakEnd: '13:00',
  });

  const statusColors = {
    'Pending': '#F5C451',
    'Confirmed': '#5A4FCF',
    'InProgress': '#AFAAFF',
    'Completed': '#6B6B6B',
    'Cancelled': '#E74C3C',
    'Blocked': '#95A5A6'
  };

  const getAuthToken = async (): Promise<string> => {
    // Implementation depends on your auth system
    return 'your-auth-token';
  };

  // Get Monday of the current week
  const getMondayOfWeek = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const loadWeekSchedule = useCallback(async (weekStart: Date) => {
    try {
      const monday = getMondayOfWeek(new Date(weekStart));
      const response = await fetch(`/api/provider/schedule-management/week?weekStart=${monday.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const schedule: WeekSchedule = await response.json();
        setWeekSchedule(schedule);
        setCurrentWeekStart(monday);
      }
    } catch (error) {
      console.error('Error loading week schedule:', error);
      Alert.alert('Error', 'Failed to load schedule');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadScheduleStats = useCallback(async () => {
    try {
      const response = await fetch('/api/provider/schedule-management/stats', {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const stats: ScheduleStats = await response.json();
        setScheduleStats(stats);
      }
    } catch (error) {
      console.error('Error loading schedule stats:', error);
    }
  }, []);

  const blockTimeSlot = async (date: Date, startTime: Date, endTime: Date, reason?: string) => {
    try {
      const response = await fetch('/api/provider/schedule-management/block-time', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: date.toISOString(),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          reason
        })
      });

      if (response.ok) {
        loadWeekSchedule(currentWeekStart);
        Alert.alert('Success', 'Time slot blocked successfully');
      } else {
        const error = await response.text();
        Alert.alert('Error', error || 'Failed to block time slot');
      }
    } catch (error) {
      console.error('Error blocking time slot:', error);
      Alert.alert('Error', 'Failed to block time slot');
    }
  };

  const unblockTimeSlot = async (bookingId: number) => {
    try {
      const response = await fetch(`/api/provider/schedule-management/unblock-time/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        loadWeekSchedule(currentWeekStart);
        Alert.alert('Success', 'Time slot unblocked successfully');
      } else {
        Alert.alert('Error', 'Failed to unblock time slot');
      }
    } catch (error) {
      console.error('Error unblocking time slot:', error);
      Alert.alert('Error', 'Failed to unblock time slot');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadWeekSchedule(currentWeekStart);
      loadScheduleStats();
    }, [loadWeekSchedule, loadScheduleStats, currentWeekStart])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadWeekSchedule(currentWeekStart);
    loadScheduleStats();
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    loadWeekSchedule(newWeekStart);
  };

  const renderTimeSlot = (slot: AppointmentTimeSlot, dayDate: string) => {
    const startTime = new Date(slot.startTime);
    const isBlocked = slot.status === 'Blocked';
    const hasBooking = !slot.isAvailable && !isBlocked;

    return (
      <TouchableOpacity
        key={slot.startTime}
        style={[
          styles.timeSlot,
          slot.isAvailable && styles.availableSlot,
          isBlocked && styles.blockedSlot,
          hasBooking && styles.bookedSlot
        ]}
        onPress={() => {
          if (isBlocked) {
            Alert.alert(
              'Blocked Time',
              'Do you want to unblock this time slot?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Unblock', 
                  onPress: () => {
                    if (slot.bookingId) {
                      unblockTimeSlot(parseInt(slot.bookingId));
                    }
                  }
                }
              ]
            );
          } else if (slot.isAvailable) {
            setSelectedTimeSlot(slot);
            setShowBlockTimeModal(true);
          } else {
            // Show appointment details
            Alert.alert(
              'Appointment Details',
              `Client: ${slot.clientName}\nService: ${slot.serviceName}\nStatus: ${slot.status}`,
              [{ text: 'OK' }]
            );
          }
        }}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.timeSlotText,
          slot.isAvailable && styles.availableSlotText,
          isBlocked && styles.blockedSlotText,
          hasBooking && styles.bookedSlotText
        ]}>
          {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
        </Text>
        {hasBooking && (
          <Text style={styles.clientText} numberOfLines={1}>
            {slot.clientName}
          </Text>
        )}
        {isBlocked && (
          <Text style={styles.blockedText}>BLOCKED</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderDayColumn = (day: DaySchedule) => {
    const dayDate = new Date(day.date);
    const isToday = dayDate.toDateString() === new Date().toDateString();
    const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNumber = dayDate.getDate();

    return (
      <View key={day.date} style={styles.dayColumn}>
        {/* Day Header */}
        <TouchableOpacity
          style={[styles.dayHeader, isToday && styles.todayHeader]}
          onPress={() => {
            setSelectedDay(day);
            setShowDayModal(true);
          }}
        >
          <Text style={[styles.dayName, isToday && styles.todayText]}>{dayName}</Text>
          <Text style={[styles.dayNumber, isToday && styles.todayText]}>{dayNumber}</Text>
          <View style={styles.dayStats}>
            <Text style={[styles.dayStatsText, isToday && styles.todayText]}>
              {day.totalAppointments} apt
            </Text>
            <Text style={[styles.dayStatsText, isToday && styles.todayText]}>
              ${day.dayRevenue.toFixed(0)}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Time Slots */}
        <ScrollView 
          style={styles.timeSlotsContainer}
          showsVerticalScrollIndicator={false}
        >
          {day.isWorkingDay ? (
            day.timeSlots.map(slot => renderTimeSlot(slot, day.date))
          ) : (
            <View style={styles.nonWorkingDay}>
              <Text style={styles.nonWorkingDayText}>Closed</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderStatsPanel = () => {
    if (!scheduleStats) return null;

    return (
      <View style={styles.statsPanel}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.statsPanelGradient}
        >
          <Text style={styles.statsPanelTitle}>Schedule Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{scheduleStats.utilizationRate.toFixed(1)}%</Text>
              <Text style={styles.statLabel}>Utilization</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{scheduleStats.upcomingAppointments}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${scheduleStats.revenueProjection.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Projected</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{scheduleStats.totalBlockedSlots}</Text>
              <Text style={styles.statLabel}>Blocked</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderBlockTimeModal = () => (
    <Modal
      visible={showBlockTimeModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowBlockTimeModal(false)}
    >
      <BlurView intensity={100} style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Block Time Slot</Text>
            <TouchableOpacity onPress={() => setShowBlockTimeModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.modalText}>
              Block this time slot from being booked?
            </Text>
            {selectedTimeSlot && (
              <Text style={styles.selectedTimeText}>
                {new Date(selectedTimeSlot.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })} - {new Date(selectedTimeSlot.endTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowBlockTimeModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.blockButton}
                onPress={() => {
                  if (selectedTimeSlot) {
                    const slotDate = new Date(selectedTimeSlot.startTime);
                    const startTime = new Date(selectedTimeSlot.startTime);
                    const endTime = new Date(selectedTimeSlot.endTime);
                    blockTimeSlot(slotDate, startTime, endTime, 'Blocked by provider');
                  }
                  setShowBlockTimeModal(false);
                }}
              >
                <LinearGradient
                  colors={['#E74C3C', '#C0392B']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.blockButtonText}>Block Time</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </BlurView>
    </Modal>
  );

  const renderDayModal = () => (
    <Modal
      visible={showDayModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowDayModal(false)}
    >
      <BlurView intensity={100} style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedDay && new Date(selectedDay.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <TouchableOpacity onPress={() => setShowDayModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {selectedDay && (
            <ScrollView style={styles.dayModalContent}>
              {/* Day Stats */}
              <View style={styles.dayModalStats}>
                <View style={styles.dayModalStatItem}>
                  <Text style={styles.dayModalStatValue}>{selectedDay.totalAppointments}</Text>
                  <Text style={styles.dayModalStatLabel}>Appointments</Text>
                </View>
                <View style={styles.dayModalStatItem}>
                  <Text style={styles.dayModalStatValue}>${selectedDay.dayRevenue.toFixed(2)}</Text>
                  <Text style={styles.dayModalStatLabel}>Revenue</Text>
                </View>
                <View style={styles.dayModalStatItem}>
                  <Text style={styles.dayModalStatValue}>
                    {selectedDay.timeSlots.filter(s => s.isAvailable).length}
                  </Text>
                  <Text style={styles.dayModalStatLabel}>Available</Text>
                </View>
              </View>

              {/* Working Hours */}
              <View style={styles.workingHoursSection}>
                <Text style={styles.sectionTitle}>Working Hours</Text>
                <View style={styles.workingHoursInfo}>
                  <Text style={styles.workingHoursText}>
                    {selectedDay.isWorkingDay 
                      ? `${selectedDay.startTime} - ${selectedDay.endTime}`
                      : 'Closed'
                    }
                  </Text>
                  {selectedDay.breakStart && selectedDay.breakEnd && (
                    <Text style={styles.breakText}>
                      Break: {selectedDay.breakStart} - {selectedDay.breakEnd}
                    </Text>
                  )}
                </View>
              </View>

              {/* Appointments List */}
              <View style={styles.appointmentsSection}>
                <Text style={styles.sectionTitle}>Appointments</Text>
                {selectedDay.timeSlots
                  .filter(slot => !slot.isAvailable)
                  .map((slot, index) => (
                    <View key={index} style={styles.appointmentItem}>
                      <View style={styles.appointmentTime}>
                        <Text style={styles.appointmentTimeText}>
                          {new Date(slot.startTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </View>
                      <View style={styles.appointmentDetails}>
                        <Text style={styles.appointmentClient}>
                          {slot.status === 'Blocked' ? 'BLOCKED TIME' : slot.clientName}
                        </Text>
                        {slot.serviceName && (
                          <Text style={styles.appointmentService}>{slot.serviceName}</Text>
                        )}
                      </View>
                      <View style={[
                        styles.appointmentStatus,
                        { backgroundColor: statusColors[slot.status || 'Pending'] }
                      ]}>
                        <Text style={styles.appointmentStatusText}>{slot.status}</Text>
                      </View>
                    </View>
                  ))
                }
                {selectedDay.timeSlots.filter(slot => !slot.isAvailable).length === 0 && (
                  <Text style={styles.noAppointmentsText}>No appointments scheduled</Text>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </BlurView>
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule Management</Text>
          <TouchableOpacity onPress={() => setShowAvailabilityModal(true)}>
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Week Navigation */}
        <View style={styles.weekNavigation}>
          <TouchableOpacity onPress={() => navigateWeek('prev')}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.weekText}>
            {weekSchedule && new Date(weekSchedule.weekStartDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })} - {weekSchedule && new Date(weekSchedule.weekEndDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          </Text>
          <TouchableOpacity onPress={() => navigateWeek('next')}>
            <Ionicons name="chevron-forward" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats Panel */}
      {renderStatsPanel()}

      {/* Schedule Grid */}
      <ScrollView
        style={styles.scheduleContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {weekSchedule && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.weekGrid}
          >
            <View style={styles.weekRow}>
              {weekSchedule.days.map(day => renderDayColumn(day))}
            </View>
          </ScrollView>
        )}
      </ScrollView>

      {/* Modals */}
      {renderBlockTimeModal()}
      {renderDayModal()}
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
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  header: {
    paddingTop: 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: 'white',
    fontWeight: 'bold',
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  weekText: {
    ...TYPOGRAPHY.body,
    color: 'white',
    fontWeight: '600',
  },
  statsPanel: {
    margin: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsPanelGradient: {
    padding: SPACING.md,
  },
  statsPanelTitle: {
    ...TYPOGRAPHY.h3,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.h3,
    color: 'white',
    fontWeight: 'bold',
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  scheduleContainer: {
    flex: 1,
  },
  weekGrid: {
    paddingHorizontal: SPACING.md,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayColumn: {
    width: (width - SPACING.md * 3) / 7,
    marginRight: SPACING.xs,
    backgroundColor: 'white',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dayHeader: {
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  todayHeader: {
    backgroundColor: COLORS.primary,
  },
  dayName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '600',
  },
  dayNumber: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: 'bold',
    marginTop: 2,
  },
  todayText: {
    color: 'white',
  },
  dayStats: {
    marginTop: 4,
    alignItems: 'center',
  },
  dayStatsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  timeSlotsContainer: {
    maxHeight: height * 0.4,
  },
  timeSlot: {
    padding: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    minHeight: 40,
    justifyContent: 'center',
  },
  availableSlot: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  bookedSlot: {
    backgroundColor: 'rgba(90, 79, 207, 0.1)',
  },
  blockedSlot: {
    backgroundColor: 'rgba(149, 165, 166, 0.2)',
  },
  timeSlotText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 10,
  },
  availableSlotText: {
    color: '#4CAF50',
  },
  bookedSlotText: {
    color: COLORS.primary,
  },
  blockedSlotText: {
    color: '#95A5A6',
  },
  clientText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 9,
    marginTop: 2,
  },
  blockedText: {
    ...TYPOGRAPHY.caption,
    color: '#95A5A6',
    fontSize: 9,
    marginTop: 2,
    fontWeight: 'bold',
  },
  nonWorkingDay: {
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  nonWorkingDayText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: SPACING.md,
  },
  modalText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  selectedTimeText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    marginRight: SPACING.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  blockButton: {
    flex: 1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginLeft: SPACING.sm,
  },
  buttonGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  blockButtonText: {
    ...TYPOGRAPHY.body,
    color: 'white',
    fontWeight: 'bold',
  },
  dayModalContent: {
    padding: SPACING.md,
  },
  dayModalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  dayModalStatItem: {
    alignItems: 'center',
  },
  dayModalStatValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  dayModalStatLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  workingHoursSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  workingHoursInfo: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  workingHoursText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  breakText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  appointmentsSection: {
    marginBottom: SPACING.lg,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  appointmentTime: {
    marginRight: SPACING.md,
  },
  appointmentTimeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  appointmentDetails: {
    flex: 1,
  },
  appointmentClient: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  appointmentService: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  appointmentStatus: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  appointmentStatusText: {
    ...TYPOGRAPHY.caption,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
  noAppointmentsText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: SPACING.lg,
  },
});

export default EnhancedScheduleManagementScreen;
