import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import ApiService from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

interface WorkingHours {
  startTime: Date;
  endTime: Date;
  breakStart?: Date;
  breakEnd?: Date;
}

interface DaySchedule {
  dayOfWeek: string;
  isAvailable: boolean;
  workingHours?: WorkingHours;
}

interface TimePickerState {
  visible: boolean;
  type: 'start' | 'end' | 'breakStart' | 'breakEnd';
  dayIndex: number;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday', 
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const ModernProviderScheduleScreen: React.FC = () => {
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timePickerState, setTimePickerState] = useState<TimePickerState>({
    visible: false,
    type: 'start',
    dayIndex: 0
  });

  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    loadCurrentSchedule();
  }, []);

  const loadCurrentSchedule = async () => {
    try {
      setLoading(true);
      // Initialize with default schedule if none exists
      const defaultSchedule: DaySchedule[] = DAYS_OF_WEEK.map(day => ({
        dayOfWeek: day,
        isAvailable: day !== 'Sunday', // Default: closed on Sundays
        workingHours: day !== 'Sunday' ? {
          startTime: createTimeFromHours(day === 'Saturday' ? 10 : 9), // Saturday: 10 AM, Others: 9 AM
          endTime: createTimeFromHours(day === 'Saturday' ? 16 : 18),   // Saturday: 4 PM, Others: 6 PM
          breakStart: createTimeFromHours(12), // 12 PM
          breakEnd: createTimeFromHours(13),   // 1 PM
        } : undefined
      }));

      setSchedule(defaultSchedule);
    } catch (error) {
      console.error('Error loading schedule:', error);
      Alert.alert('Error', 'Failed to load your current schedule.');
    } finally {
      setLoading(false);
    }
  };

  const createTimeFromHours = (hour: number, minute: number = 0): Date => {
    const time = new Date();
    time.setHours(hour, minute, 0, 0);
    return time;
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const toggleDayAvailability = (dayIndex: number) => {
    setSchedule(prev => prev.map((day, index) => {
      if (index === dayIndex) {
        const isBecomingAvailable = !day.isAvailable;
        return {
          ...day,
          isAvailable: isBecomingAvailable,
          workingHours: isBecomingAvailable && !day.workingHours ? {
            startTime: createTimeFromHours(9),
            endTime: createTimeFromHours(18),
            breakStart: createTimeFromHours(12),
            breakEnd: createTimeFromHours(13),
          } : day.workingHours
        };
      }
      return day;
    }));
  };

  const showTimePicker = (dayIndex: number, type: 'start' | 'end' | 'breakStart' | 'breakEnd') => {
    setTimePickerState({
      visible: true,
      type,
      dayIndex
    });
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setTimePickerState(prev => ({ ...prev, visible: false }));
    }

    if (selectedTime) {
      const { dayIndex, type } = timePickerState;
      setSchedule(prev => prev.map((day, index) => {
        if (index === dayIndex && day.workingHours) {
          return {
            ...day,
            workingHours: {
              ...day.workingHours,
              [type === 'start' ? 'startTime' : 
               type === 'end' ? 'endTime' :
               type === 'breakStart' ? 'breakStart' :
               'breakEnd']: selectedTime
            }
          };
        }
        return day;
      }));
    }

    if (Platform.OS === 'ios') {
      setTimePickerState(prev => ({ ...prev, visible: false }));
    }
  };

  const validateSchedule = (): boolean => {
    for (const day of schedule) {
      if (day.isAvailable && day.workingHours) {
        const { startTime, endTime, breakStart, breakEnd } = day.workingHours;
        
        // Check if start time is before end time
        if (startTime >= endTime) {
          Alert.alert('Invalid Schedule', `${day.dayOfWeek}: Start time must be before end time.`);
          return false;
        }

        // Check break times if provided
        if (breakStart && breakEnd) {
          if (breakStart >= breakEnd) {
            Alert.alert('Invalid Schedule', `${day.dayOfWeek}: Break start time must be before break end time.`);
            return false;
          }

          if (breakStart <= startTime || breakEnd >= endTime) {
            Alert.alert('Invalid Schedule', `${day.dayOfWeek}: Break times must be within working hours.`);
            return false;
          }
        }
      }
    }
    return true;
  };

  const saveSchedule = async () => {
    if (!validateSchedule()) return;

    try {
      setSaving(true);
      
      // Transform schedule to API format
      const scheduleRequests = schedule.map(day => ({
        dayOfWeek: day.dayOfWeek,
        isAvailable: day.isAvailable,
        startTime: day.workingHours ? formatTimeForAPI(day.workingHours.startTime) : null,
        endTime: day.workingHours ? formatTimeForAPI(day.workingHours.endTime) : null,
        breakStartTime: day.workingHours?.breakStart ? formatTimeForAPI(day.workingHours.breakStart) : null,
        breakEndTime: day.workingHours?.breakEnd ? formatTimeForAPI(day.workingHours.breakEnd) : null,
      }));

      // Call API to save schedule
      await ApiService.setProviderSchedule(scheduleRequests);
      
      Alert.alert(
        'Schedule Saved!',
        'Your working hours have been updated successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', 'Failed to save your schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatTimeForAPI = (date: Date): string => {
    return date.toTimeString().slice(0, 5); // Returns "HH:mm" format
  };

  const copyToPreviousDay = (dayIndex: number) => {
    if (dayIndex === 0) return; // Can't copy to previous day for Monday

    const currentDay = schedule[dayIndex];
    const previousDayIndex = dayIndex - 1;

    setSchedule(prev => prev.map((day, index) => {
      if (index === previousDayIndex) {
        return {
          ...day,
          isAvailable: currentDay.isAvailable,
          workingHours: currentDay.workingHours ? {
            startTime: new Date(currentDay.workingHours.startTime),
            endTime: new Date(currentDay.workingHours.endTime),
            breakStart: currentDay.workingHours.breakStart ? new Date(currentDay.workingHours.breakStart) : undefined,
            breakEnd: currentDay.workingHours.breakEnd ? new Date(currentDay.workingHours.breakEnd) : undefined,
          } : undefined
        };
      }
      return day;
    }));
  };

  const applyToAllDays = (dayIndex: number) => {
    const sourceDay = schedule[dayIndex];
    
    Alert.alert(
      'Apply to All Days',
      'Apply these hours to all working days?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: () => {
            setSchedule(prev => prev.map(day => ({
              ...day,
              isAvailable: sourceDay.isAvailable,
              workingHours: sourceDay.workingHours ? {
                startTime: new Date(sourceDay.workingHours.startTime),
                endTime: new Date(sourceDay.workingHours.endTime),
                breakStart: sourceDay.workingHours.breakStart ? new Date(sourceDay.workingHours.breakStart) : undefined,
                breakEnd: sourceDay.workingHours.breakEnd ? new Date(sourceDay.workingHours.breakEnd) : undefined,
              } : undefined
            })));
          }
        }
      ]
    );
  };

  const renderDaySchedule = (day: DaySchedule, index: number) => (
    <View key={day.dayOfWeek} style={styles.dayContainer}>
      <View style={styles.dayHeader}>
        <View style={styles.dayInfo}>
          <Text style={styles.dayName}>{day.dayOfWeek}</Text>
          <Text style={styles.dayStatus}>
            {day.isAvailable ? 'Available' : 'Closed'}
          </Text>
        </View>
        
        <View style={styles.dayActions}>
          {index > 0 && day.isAvailable && (
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => copyToPreviousDay(index)}
            >
              <Ionicons name="copy-outline" size={16} color="#5A4FCF" />
            </TouchableOpacity>
          )}
          
          {day.isAvailable && (
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => applyToAllDays(index)}
            >
              <Ionicons name="duplicate-outline" size={16} color="#5A4FCF" />
            </TouchableOpacity>
          )}
          
          <Switch
            value={day.isAvailable}
            onValueChange={() => toggleDayAvailability(index)}
            trackColor={{ false: '#E5E7EB', true: '#A78BFA' }}
            thumbColor={day.isAvailable ? '#5A4FCF' : '#9CA3AF'}
          />
        </View>
      </View>

      {day.isAvailable && day.workingHours && (
        <View style={styles.hoursContainer}>
          <View style={styles.timeSection}>
            <Text style={styles.timeSectionTitle}>Working Hours</Text>
            <View style={styles.timeRow}>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => showTimePicker(index, 'start')}
              >
                <Text style={styles.timeButtonText}>
                  {formatTime(day.workingHours.startTime)}
                </Text>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
              </TouchableOpacity>
              
              <Text style={styles.timeSeparator}>to</Text>
              
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => showTimePicker(index, 'end')}
              >
                <Text style={styles.timeButtonText}>
                  {formatTime(day.workingHours.endTime)}
                </Text>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.timeSection}>
            <Text style={styles.timeSectionTitle}>Break Time (Optional)</Text>
            <View style={styles.timeRow}>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => showTimePicker(index, 'breakStart')}
              >
                <Text style={styles.timeButtonText}>
                  {day.workingHours.breakStart ? formatTime(day.workingHours.breakStart) : 'Start'}
                </Text>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
              </TouchableOpacity>
              
              <Text style={styles.timeSeparator}>to</Text>
              
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => showTimePicker(index, 'breakEnd')}
              >
                <Text style={styles.timeButtonText}>
                  {day.workingHours.breakEnd ? formatTime(day.workingHours.breakEnd) : 'End'}
                </Text>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5A4FCF" />
        <Text style={styles.loadingText}>Loading your schedule...</Text>
      </View>
    );
  }

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
            <Text style={styles.headerTitle}>Working Hours</Text>
            <Text style={styles.headerSubtitle}>Set your availability</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#5A4FCF" />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Manage Your Availability</Text>
            <Text style={styles.infoDescription}>
              Set your working hours to help clients book appointments when you're available.
              You can set different hours for each day of the week.
            </Text>
          </View>
        </View>

        {schedule.map(renderDaySchedule)}

        <View style={styles.saveContainer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={saveSchedule}
            disabled={saving}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={saving ? ['#9CA3AF', '#9CA3AF'] : ['#5A4FCF', '#7B6CE8']}
              style={styles.saveButtonGradient}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Schedule</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Time Picker */}
      {timePickerState.visible && (
        <DateTimePicker
          value={(() => {
            const day = schedule[timePickerState.dayIndex];
            if (!day.workingHours) return new Date();
            
            switch (timePickerState.type) {
              case 'start': return day.workingHours.startTime;
              case 'end': return day.workingHours.endTime;
              case 'breakStart': return day.workingHours.breakStart || createTimeFromHours(12);
              case 'breakEnd': return day.workingHours.breakEnd || createTimeFromHours(13);
              default: return new Date();
            }
          })()}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </View>
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
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  dayContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 2,
  },
  dayStatus: {
    fontSize: 14,
    color: '#6B7280',
  },
  dayActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyButton: {
    padding: 8,
    marginRight: 8,
  },
  hoursContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  timeSection: {
    marginBottom: 16,
  },
  timeSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  timeSeparator: {
    fontSize: 14,
    color: '#6B7280',
    marginHorizontal: 12,
  },
  saveContainer: {
    padding: 16,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default ModernProviderScheduleScreen;
