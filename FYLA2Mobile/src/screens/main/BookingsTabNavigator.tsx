import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScheduleTabContent from './ScheduleTabContent';
import AppointmentRequestsScreen from './AppointmentRequestsScreen';

const COLORS = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray800: '#1F2937',
  background: '#FAFAFA',
};

const BookingsTabNavigator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'requests'>('schedule');

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'schedule' && styles.activeTab]}
        onPress={() => setActiveTab('schedule')}
      >
        <Ionicons 
          name={activeTab === 'schedule' ? "calendar" : "calendar-outline"} 
          size={18} 
          color={activeTab === 'schedule' ? COLORS.primary : COLORS.gray500} 
        />
        <Text style={[
          styles.tabText, 
          { color: activeTab === 'schedule' ? COLORS.primary : COLORS.gray500 }
        ]}>
          Schedule
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
        onPress={() => setActiveTab('requests')}
      >
        <Ionicons 
          name={activeTab === 'requests' ? "notifications" : "notifications-outline"} 
          size={18} 
          color={activeTab === 'requests' ? COLORS.primary : COLORS.gray500} 
        />
        <Text style={[
          styles.tabText, 
          { color: activeTab === 'requests' ? COLORS.primary : COLORS.gray500 }
        ]}>
          Requests
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.content}>
        {activeTab === 'schedule' ? (
          <View style={styles.tabContent}>
            <ScheduleTabContent tabBar={renderTabBar()} />
          </View>
        ) : (
          <View style={styles.tabContent}>
            <AppointmentRequestsScreen tabBar={renderTabBar()} />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
});

export default BookingsTabNavigator;
