import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
}

interface Schedule {
  day: string;
  date: string;
  isWorkingDay: boolean;
  timeSlots: TimeSlot[];
}

const ScheduleScreen = () => {
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const generateTimeSlots = (isWorkingDay: boolean): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    if (!isWorkingDay) return slots;

    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          id: `${hour}-${minute}`,
          time,
          isAvailable: Math.random() > 0.3, // Random availability for demo
        });
      }
    }
    return slots;
  };

  const [schedule, setSchedule] = useState<Schedule[]>([
    {
      day: 'Monday',
      date: '2025-07-21',
      isWorkingDay: true,
      timeSlots: generateTimeSlots(true),
    },
    {
      day: 'Tuesday',
      date: '2025-07-22',
      isWorkingDay: true,
      timeSlots: generateTimeSlots(true),
    },
    {
      day: 'Wednesday',
      date: '2025-07-23',
      isWorkingDay: true,
      timeSlots: generateTimeSlots(true),
    },
    {
      day: 'Thursday',
      date: '2025-07-24',
      isWorkingDay: true,
      timeSlots: generateTimeSlots(true),
    },
    {
      day: 'Friday',
      date: '2025-07-25',
      isWorkingDay: true,
      timeSlots: generateTimeSlots(true),
    },
    {
      day: 'Saturday',
      date: '2025-07-26',
      isWorkingDay: true,
      timeSlots: generateTimeSlots(true),
    },
    {
      day: 'Sunday',
      date: '2025-07-27',
      isWorkingDay: false,
      timeSlots: generateTimeSlots(false),
    },
  ]);

  const toggleWorkingDay = (dayIndex: number) => {
    setSchedule(prev => 
      prev.map((day, index) => 
        index === dayIndex 
          ? { 
              ...day, 
              isWorkingDay: !day.isWorkingDay,
              timeSlots: generateTimeSlots(!day.isWorkingDay)
            }
          : day
      )
    );
  };

  const toggleTimeSlot = (dayIndex: number, slotId: string) => {
    setSchedule(prev => 
      prev.map((day, index) => 
        index === dayIndex 
          ? {
              ...day,
              timeSlots: day.timeSlots.map(slot =>
                slot.id === slotId ? { ...slot, isAvailable: !slot.isAvailable } : slot
              )
            }
          : day
      )
    );
  };

  const renderDaySchedule = (day: Schedule, dayIndex: number) => (
    <View key={dayIndex} style={styles.dayCard}>
      <View style={styles.dayHeader}>
        <View>
          <Text style={styles.dayName}>{day.day}</Text>
          <Text style={styles.dayDate}>{day.date}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.workingToggle,
            { backgroundColor: day.isWorkingDay ? '#27AE60' : '#E74C3C' }
          ]}
          onPress={() => toggleWorkingDay(dayIndex)}
        >
          <Ionicons 
            name={day.isWorkingDay ? 'checkmark' : 'close'} 
            size={16} 
            color="white" 
          />
          <Text style={styles.workingToggleText}>
            {day.isWorkingDay ? 'Working' : 'Off'}
          </Text>
        </TouchableOpacity>
      </View>

      {day.isWorkingDay && (
        <View style={styles.timeSlotsContainer}>
          <View style={styles.timeSlotsGrid}>
            {day.timeSlots.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.timeSlot,
                  { backgroundColor: slot.isAvailable ? '#E8F5E8' : '#FFE8E8' }
                ]}
                onPress={() => toggleTimeSlot(dayIndex, slot.id)}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    { color: slot.isAvailable ? '#27AE60' : '#E74C3C' }
                  ]}
                >
                  {slot.time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Schedule Management</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.weekSelector}>
        <TouchableOpacity
          style={styles.weekButton}
          onPress={() => setSelectedWeek(selectedWeek - 1)}
        >
          <Ionicons name="chevron-back" size={20} color="#666" />
        </TouchableOpacity>
        <Text style={styles.weekText}>This Week</Text>
        <TouchableOpacity
          style={styles.weekButton}
          onPress={() => setSelectedWeek(selectedWeek + 1)}
        >
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scheduleContainer}>
        {schedule.map(renderDaySchedule)}
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#E8F5E8' }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FFE8E8' }]} />
          <Text style={styles.legendText}>Unavailable</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.bulkActionButton}>
          <Ionicons name="calendar-outline" size={20} color="white" />
          <Text style={styles.actionButtonText}>Block Time</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.bulkActionButton, { backgroundColor: '#27AE60' }]}>
          <Ionicons name="checkmark-circle-outline" size={20} color="white" />
          <Text style={styles.actionButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    padding: 8,
  },
  weekSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  weekButton: {
    padding: 8,
  },
  weekText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  scheduleContainer: {
    flex: 1,
    padding: 15,
  },
  dayCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dayDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  workingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  workingToggleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  timeSlotsContainer: {
    marginTop: 8,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    padding: 15,
    backgroundColor: 'white',
  },
  bulkActionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default ScheduleScreen;
