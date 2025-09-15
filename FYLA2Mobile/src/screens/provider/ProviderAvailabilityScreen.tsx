import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

import { MODERN_COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants/modernDesign';
import ApiService from '../../services/apiService';

const { width } = Dimensions.get('window');
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface BreakTime {
  id: string;
  startTime: Date;
  endTime: Date;
  title: string;
  type: 'lunch' | 'personal' | 'meeting' | 'other';
  color: string;
}

interface DayAvailability {
  isOpen: boolean;
  openTime: Date;
  closeTime: Date;
  breaks: BreakTime[];
}

interface WeeklySchedule {
  [key: string]: DayAvailability;
}

interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  isBooked: boolean;
  bookingId?: string;
}

const BREAK_TYPES = {
  lunch: { color: '#FF6B35', label: 'Lunch', icon: 'restaurant' },
  personal: { color: '#4ECDC4', label: 'Personal', icon: 'person' },
  meeting: { color: '#45B7D1', label: 'Meeting', icon: 'people' },
  other: { color: '#96CEB4', label: 'Other', icon: 'time' }
};

const ProviderAvailabilityScreen: React.FC = () => {
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState<'open' | 'close' | 'breakStart' | 'breakEnd'>('open');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [advancedMode, setAdvancedMode] = useState(false);
  const [breakModalVisible, setBreakModalVisible] = useState(false);
  const [editingBreak, setEditingBreak] = useState<{ day: string; breakId?: string } | null>(null);
  const [newBreakTitle, setNewBreakTitle] = useState('');
  const [newBreakType, setNewBreakType] = useState<keyof typeof BREAK_TYPES>('lunch');
  const [visualMode, setVisualMode] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      
      try {
        // Load real availability data with breaks
        const result = await ApiService.getProviderAvailabilitySchedule();
        
        if (result.success && result.data) {
          // Transform API data to component format
          const transformedSchedule: WeeklySchedule = {};
          
          // Initialize all days
          DAYS.forEach((day, index) => {
            transformedSchedule[day] = {
              isOpen: false,
              openTime: new Date(2023, 0, 1, 9, 0),
              closeTime: new Date(2023, 0, 1, 17, 0),
              breaks: []
            };
          });
          
          // Apply API data
          result.data.forEach((schedule: any) => {
            const dayName = DAYS[schedule.dayOfWeek];
            if (dayName) {
              transformedSchedule[dayName] = {
                isOpen: schedule.isAvailable,
                openTime: schedule.startTime ? 
                  new Date(2023, 0, 1, ...schedule.startTime.split(':').map(Number)) : 
                  new Date(2023, 0, 1, 9, 0),
                closeTime: schedule.endTime ? 
                  new Date(2023, 0, 1, ...schedule.endTime.split(':').map(Number)) : 
                  new Date(2023, 0, 1, 17, 0),
                breaks: schedule.breaks.map((breakData: any) => ({
                  id: breakData.id.toString(),
                  startTime: new Date(2023, 0, 1, ...breakData.startTime.split(':').map(Number)),
                  endTime: new Date(2023, 0, 1, ...breakData.endTime.split(':').map(Number)),
                  title: breakData.title,
                  type: breakData.type.toLowerCase(),
                  color: breakData.color
                }))
              };
            }
          });
          
          setWeeklySchedule(transformedSchedule);
        } else {
          // Fall back to default schedule
          setWeeklySchedule(getDefaultSchedule());
        }
      } catch (apiError) {
        console.log('Enhanced availability API not available, using default schedule');
        setWeeklySchedule(getDefaultSchedule());
      }
    } catch (error) {
      console.error('Error loading availability:', error);
      Alert.alert('Error', 'Failed to load availability settings');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSchedule = (): WeeklySchedule => {
    const schedule: WeeklySchedule = {};
    DAYS.forEach(day => {
      const isWeekend = ['Saturday', 'Sunday'].includes(day);
      schedule[day] = {
        isOpen: !isWeekend,
        openTime: new Date(2023, 0, 1, 9, 0), // 9:00 AM
        closeTime: new Date(2023, 0, 1, 17, 0), // 5:00 PM
        breaks: isWeekend ? [] : [
          {
            id: `lunch-${day}`,
            startTime: new Date(2023, 0, 1, 12, 0), // 12:00 PM
            endTime: new Date(2023, 0, 1, 13, 0), // 1:00 PM
            title: 'Lunch Break',
            type: 'lunch',
            color: BREAK_TYPES.lunch.color
          }
        ]
      };
    });
    return schedule;
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);
      
      // Convert schedule to API format
      const scheduleData = Object.entries(weeklySchedule).map(([day, availability]) => ({
        dayOfWeek: DAYS.indexOf(day),
        isAvailable: availability.isOpen,
        startTime: availability.isOpen ? availability.openTime.toTimeString().slice(0, 5) : null,
        endTime: availability.isOpen ? availability.closeTime.toTimeString().slice(0, 5) : null,
        breaks: availability.breaks.map(breakTime => ({
          startTime: breakTime.startTime.toTimeString().slice(0, 5),
          endTime: breakTime.endTime.toTimeString().slice(0, 5),
          title: breakTime.title,
          type: breakTime.type.charAt(0).toUpperCase() + breakTime.type.slice(1), // Capitalize first letter
          color: breakTime.color
        }))
      }));

      const result = await ApiService.updateProviderAvailabilitySchedule(scheduleData);
      
      if (result.success) {
        Alert.alert('Success', 'Availability schedule updated successfully!');
      } else {
        throw new Error(result.message || 'Failed to save schedule');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', 'Failed to save schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleDayAvailability = (day: string) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isOpen: !prev[day].isOpen
      }
    }));
  };

  const updateDayTime = (day: string, timeType: 'open' | 'close', time: Date) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [timeType === 'open' ? 'openTime' : 'closeTime']: time
      }
    }));
  };

  const updateBreakTime = (day: string, breakId: string, timeType: 'start' | 'end', time: Date) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        breaks: prev[day].breaks.map(breakItem => 
          breakItem.id === breakId 
            ? { ...breakItem, [timeType === 'start' ? 'startTime' : 'endTime']: time }
            : breakItem
        )
      }
    }));
  };

  const openTimePicker = (day: string, mode: 'open' | 'close' | 'breakStart' | 'breakEnd', breakId?: string) => {
    setSelectedDay(day);
    setTimePickerMode(mode);
    
    let initialTime = new Date();
    if (mode === 'open') {
      initialTime = weeklySchedule[day]?.openTime || new Date();
    } else if (mode === 'close') {
      initialTime = weeklySchedule[day]?.closeTime || new Date();
    } else if (mode === 'breakStart' && breakId) {
      const breakItem = weeklySchedule[day]?.breaks.find(b => b.id === breakId);
      initialTime = breakItem?.startTime || new Date();
    } else if (mode === 'breakEnd' && breakId) {
      const breakItem = weeklySchedule[day]?.breaks.find(b => b.id === breakId);
      initialTime = breakItem?.endTime || new Date();
    }
    
    setSelectedDate(initialTime);
    setEditingBreak(breakId ? { day, breakId } : null);
    setTimePickerVisible(true);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setTimePickerVisible(false);
    if (selectedTime && selectedDay) {
      if (timePickerMode === 'open' || timePickerMode === 'close') {
        updateDayTime(selectedDay, timePickerMode, selectedTime);
      } else if ((timePickerMode === 'breakStart' || timePickerMode === 'breakEnd') && editingBreak?.breakId) {
        updateBreakTime(selectedDay, editingBreak.breakId, timePickerMode === 'breakStart' ? 'start' : 'end', selectedTime);
      }
    }
    setEditingBreak(null);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const addBreak = (day: string) => {
    const newBreak: BreakTime = {
      id: `break-${day}-${Date.now()}`,
      startTime: new Date(2023, 0, 1, 12, 0),
      endTime: new Date(2023, 0, 1, 13, 0),
      title: newBreakTitle || 'Break',
      type: newBreakType,
      color: BREAK_TYPES[newBreakType].color
    };

    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        breaks: [...prev[day].breaks, newBreak]
      }
    }));
    
    setNewBreakTitle('');
    setBreakModalVisible(false);
  };

  const removeBreak = (day: string, breakId: string) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        breaks: prev[day].breaks.filter(breakItem => breakItem.id !== breakId)
      }
    }));
  };

  const openBreakModal = (day: string) => {
    setSelectedDay(day);
    setNewBreakTitle('');
    setNewBreakType('lunch');
    setBreakModalVisible(true);
  };

  const renderDayTimeline = (daySchedule: DayAvailability) => {
    const openHour = daySchedule.openTime.getHours();
    const closeHour = daySchedule.closeTime.getHours();
    const totalHours = closeHour - openHour;
    
    return (
      <View style={styles.timeline}>
        <View style={styles.timelineTrack}>
          {/* Available time track */}
          <View style={[styles.timelineSegment, styles.availableSegment]} />
          
          {/* Break segments */}
          {daySchedule.breaks.map((breakTime) => {
            const breakStart = breakTime.startTime.getHours() + (breakTime.startTime.getMinutes() / 60);
            const breakEnd = breakTime.endTime.getHours() + (breakTime.endTime.getMinutes() / 60);
            const leftPosition = ((breakStart - openHour) / totalHours) * 100;
            const width = ((breakEnd - breakStart) / totalHours) * 100;
            
            return (
              <View
                key={breakTime.id}
                style={[
                  styles.timelineBreak,
                  {
                    left: `${leftPosition}%`,
                    width: `${width}%`,
                    backgroundColor: breakTime.color,
                  }
                ]}
              />
            );
          })}
        </View>
        
        <View style={styles.timelineLabels}>
          <Text style={styles.timelineLabel}>{formatTime(daySchedule.openTime)}</Text>
          <Text style={styles.timelineLabel}>{formatTime(daySchedule.closeTime)}</Text>
        </View>
      </View>
    );
  };

  const copySchedule = (fromDay: string, toDay: string) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [toDay]: { ...prev[fromDay] }
    }));
  };

  const renderDaySchedule = (day: string) => {
    const daySchedule = weeklySchedule[day];
    if (!daySchedule) return null;

    return (
      <View key={day} style={styles.dayContainer}>
        <View style={styles.dayHeader}>
          <View style={styles.dayInfo}>
            <Text style={styles.dayName}>{day}</Text>
            {daySchedule.isOpen && (
              <Text style={styles.dayHours}>
                {formatTime(daySchedule.openTime)} - {formatTime(daySchedule.closeTime)}
              </Text>
            )}
            {daySchedule.isOpen && daySchedule.breaks.length > 0 && (
              <Text style={styles.breakCount}>
                {daySchedule.breaks.length} break{daySchedule.breaks.length > 1 ? 's' : ''}
              </Text>
            )}
          </View>
          
          <Switch
            value={daySchedule.isOpen}
            onValueChange={() => toggleDayAvailability(day)}
            trackColor={{ false: MODERN_COLORS.gray300, true: MODERN_COLORS.primary }}
          />
        </View>

        {daySchedule.isOpen && (
          <View style={styles.dayDetails}>
            <View style={styles.timeControls}>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => openTimePicker(day, 'open')}
              >
                <Text style={styles.timeButtonLabel}>Open</Text>
                <Text style={styles.timeButtonTime}>{formatTime(daySchedule.openTime)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => openTimePicker(day, 'close')}
              >
                <Text style={styles.timeButtonLabel}>Close</Text>
                <Text style={styles.timeButtonTime}>{formatTime(daySchedule.closeTime)}</Text>
              </TouchableOpacity>
            </View>

            {/* Enhanced Breaks Section */}
            <View style={styles.breaksContainer}>
              <View style={styles.breaksHeader}>
                <Text style={styles.breaksTitle}>Breaks & Time Off</Text>
                <TouchableOpacity
                  style={styles.addBreakButton}
                  onPress={() => openBreakModal(day)}
                >
                  <Ionicons name="add-circle" size={18} color={MODERN_COLORS.primary} />
                  <Text style={styles.addBreakText}>Add Break</Text>
                </TouchableOpacity>
              </View>

              {daySchedule.breaks.length === 0 && (
                <View style={styles.noBreaksContainer}>
                  <Ionicons name="time-outline" size={24} color={MODERN_COLORS.gray400} />
                  <Text style={styles.noBreaksText}>No breaks scheduled</Text>
                  <Text style={styles.noBreaksSubtext}>Add breaks to help manage your day</Text>
                </View>
              )}

              {daySchedule.breaks.map((breakTime) => (
                <View key={breakTime.id} style={[styles.breakItem, { borderLeftColor: breakTime.color }]}>
                  <View style={styles.breakInfo}>
                    <View style={styles.breakHeader}>
                      <View style={[styles.breakTypeIcon, { backgroundColor: breakTime.color }]}>
                        <Ionicons 
                          name={BREAK_TYPES[breakTime.type].icon as any} 
                          size={12} 
                          color={MODERN_COLORS.white} 
                        />
                      </View>
                      <Text style={styles.breakTitle}>{breakTime.title}</Text>
                      <Text style={styles.breakType}>{BREAK_TYPES[breakTime.type].label}</Text>
                    </View>
                    <View style={styles.breakTimeRow}>
                      <TouchableOpacity 
                        style={styles.breakTimeButton}
                        onPress={() => openTimePicker(day, 'breakStart', breakTime.id)}
                      >
                        <Text style={styles.breakTimeText}>{formatTime(breakTime.startTime)}</Text>
                      </TouchableOpacity>
                      <Text style={styles.breakTimeSeparator}>—</Text>
                      <TouchableOpacity 
                        style={styles.breakTimeButton}
                        onPress={() => openTimePicker(day, 'breakEnd', breakTime.id)}
                      >
                        <Text style={styles.breakTimeText}>{formatTime(breakTime.endTime)}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteBreakButton}
                    onPress={() => removeBreak(day, breakTime.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color={MODERN_COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Visual Timeline (when advanced mode is on) */}
            {advancedMode && (
              <View style={styles.timelineContainer}>
                <Text style={styles.timelineTitle}>Daily Timeline</Text>
                {renderDayTimeline(daySchedule)}
              </View>
            )}

            {advancedMode && (
              <View style={styles.copySchedule}>
                <Text style={styles.copyLabel}>Copy to:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.copyButtons}>
                    {DAYS.filter(d => d !== day).map(otherDay => (
                      <TouchableOpacity
                        key={otherDay}
                        style={styles.copyButton}
                        onPress={() => copySchedule(day, otherDay)}
                      >
                        <Text style={styles.copyButtonText}>{otherDay.slice(0, 3)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={MODERN_COLORS.primary} />
        <Text style={styles.loadingText}>Loading availability...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={MODERN_COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Availability</Text>
          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => setAdvancedMode(!advancedMode)}
          >
            <Ionicons 
              name={advancedMode ? "settings" : "settings-outline"} 
              size={24} 
              color={MODERN_COLORS.primary} 
            />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => {
              // Set all days to standard business hours
              const standardSchedule = getDefaultSchedule();
              setWeeklySchedule(standardSchedule);
            }}
          >
            <Ionicons name="business-outline" size={20} color={MODERN_COLORS.primary} />
            <Text style={styles.quickActionText}>Business Hours</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => {
              // Set all days to open
              const allOpenSchedule = { ...weeklySchedule };
              DAYS.forEach(day => {
                allOpenSchedule[day] = { ...allOpenSchedule[day], isOpen: true };
              });
              setWeeklySchedule(allOpenSchedule);
            }}
          >
            <Ionicons name="time-outline" size={20} color={MODERN_COLORS.success} />
            <Text style={styles.quickActionText}>Always Open</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => {
              // Set weekends only
              const weekendSchedule = { ...weeklySchedule };
              DAYS.forEach(day => {
                weekendSchedule[day] = { 
                  ...weekendSchedule[day], 
                  isOpen: ['Saturday', 'Sunday'].includes(day) 
                };
              });
              setWeeklySchedule(weekendSchedule);
            }}
          >
            <Ionicons name="cafe-outline" size={20} color={MODERN_COLORS.warning} />
            <Text style={styles.quickActionText}>Weekends</Text>
          </TouchableOpacity>
        </View>

        {/* Schedule List */}
        <ScrollView 
          style={styles.scheduleContainer}
          contentContainerStyle={{ paddingBottom: SPACING.tabBarHeight + SPACING.xl }}
          showsVerticalScrollIndicator={false}
        >
          {DAYS.map(renderDaySchedule)}
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveSchedule}
            disabled={saving}
          >
            <LinearGradient
              colors={saving ? [MODERN_COLORS.gray300, MODERN_COLORS.gray300] : [MODERN_COLORS.primary, MODERN_COLORS.primaryLight]}
              style={styles.saveButtonGradient}
            >
              {saving ? (
                <ActivityIndicator color={MODERN_COLORS.white} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color={MODERN_COLORS.white} />
                  <Text style={styles.saveButtonText}>Save Schedule</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Time Picker Modal */}
        {timePickerVisible && (
          <Modal transparent animationType="slide">
            <View style={styles.timePickerModal}>
              <View style={styles.timePickerContainer}>
                <DateTimePicker
                  value={selectedDate}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                />
              </View>
            </View>
          </Modal>
        )}

        {/* Break Modal */}
        {breakModalVisible && (
          <Modal transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.breakModal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add New Break</Text>
                  <TouchableOpacity onPress={() => setBreakModalVisible(false)}>
                    <Ionicons name="close" size={24} color={MODERN_COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Break Title</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g., Lunch Break"
                      value={newBreakTitle}
                      onChangeText={setNewBreakTitle}
                      maxLength={50}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Break Type</Text>
                    <View style={styles.breakTypeSelector}>
                      {Object.entries(BREAK_TYPES).map(([key, type]) => (
                        <TouchableOpacity
                          key={key}
                          style={[
                            styles.breakTypeOption,
                            { backgroundColor: type.color + '20' },
                            newBreakType === key && { backgroundColor: type.color, borderColor: type.color }
                          ]}
                          onPress={() => setNewBreakType(key as keyof typeof BREAK_TYPES)}
                        >
                          <Ionicons 
                            name={type.icon as any} 
                            size={16} 
                            color={newBreakType === key ? MODERN_COLORS.white : type.color} 
                          />
                          <Text style={[
                            styles.breakTypeLabel,
                            { color: newBreakType === key ? MODERN_COLORS.white : type.color }
                          ]}>
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setBreakModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalAddButton, !newBreakTitle && styles.modalAddButtonDisabled]}
                    onPress={() => selectedDay && addBreak(selectedDay)}
                    disabled={!newBreakTitle}
                  >
                    <Text style={styles.modalAddText}>Add Break</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: MODERN_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.textPrimary,
  },
  advancedToggle: {
    padding: SPACING.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MODERN_COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    backgroundColor: MODERN_COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
    ...SHADOWS.sm,
  },
  quickActionText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.textPrimary,
  },
  scheduleContainer: {
    flex: 1,
    padding: SPACING.lg,
  },
  dayContainer: {
    backgroundColor: MODERN_COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  dayHours: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
  },
  dayDetails: {
    marginTop: SPACING.lg,
  },
  timeControls: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  timeButton: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: MODERN_COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  timeButtonLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  timeButtonTime: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.primary,
  },
  breaksContainer: {
    marginTop: SPACING.lg,
  },
  breaksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  breaksTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
  },
  addBreakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  addBreakText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  breakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: MODERN_COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: MODERN_COLORS.primary,
    ...SHADOWS.sm,
  },
  breakText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
  },
  copySchedule: {
    marginTop: SPACING.lg,
  },
  copyLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  copyButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  copyButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: MODERN_COLORS.primaryLight + '20',
    borderRadius: BORDER_RADIUS.sm,
  },
  copyButtonText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: MODERN_COLORS.white,
    borderTopWidth: 1,
    borderTopColor: MODERN_COLORS.border,
  },
  saveButton: {
    borderRadius: BORDER_RADIUS.lg,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.white,
  },
  timePickerModal: {
    flex: 1,
    backgroundColor: MODERN_COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerContainer: {
    backgroundColor: MODERN_COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  },

  // Enhanced Break Styles
  breakCount: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.medium,
    marginTop: 2,
  },
  noBreaksContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  noBreaksText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weight.medium,
    marginTop: SPACING.sm,
  },
  noBreaksSubtext: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray400,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  breakInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  breakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  breakTypeIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  breakTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
    flex: 1,
  },
  breakType: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breakTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakTimeButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: MODERN_COLORS.gray50,
    borderRadius: BORDER_RADIUS.sm,
  },
  breakTimeText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  breakTimeSeparator: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
    marginHorizontal: SPACING.sm,
  },
  deleteBreakButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: MODERN_COLORS.error + '10',
  },

  // Timeline Styles
  timelineContainer: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: MODERN_COLORS.border,
  },
  timelineTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  timeline: {
    height: 40,
  },
  timelineTrack: {
    height: 8,
    backgroundColor: MODERN_COLORS.gray200,
    borderRadius: 4,
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  timelineSegment: {
    position: 'absolute',
    height: '100%',
    borderRadius: 4,
  },
  availableSegment: {
    width: '100%',
    backgroundColor: MODERN_COLORS.success + '40',
  },
  timelineBreak: {
    position: 'absolute',
    height: '100%',
    borderRadius: 4,
    opacity: 0.8,
  },
  timelineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.textSecondary,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: MODERN_COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  breakModal: {
    backgroundColor: MODERN_COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.textPrimary,
  },
  modalContent: {
    padding: SPACING.lg,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: MODERN_COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textPrimary,
    backgroundColor: MODERN_COLORS.white,
  },
  breakTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  breakTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: SPACING.xs,
  },
  breakTypeLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: MODERN_COLORS.border,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: MODERN_COLORS.gray100,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textSecondary,
  },
  modalAddButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: MODERN_COLORS.primary,
    alignItems: 'center',
  },
  modalAddButtonDisabled: {
    backgroundColor: MODERN_COLORS.gray300,
  },
  modalAddText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.white,
  },
});

export default ProviderAvailabilityScreen;
