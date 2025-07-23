import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const AnalyticsScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  
  const analyticsData = {
    week: {
      revenue: 1250,
      appointments: 18,
      newClients: 3,
      avgRating: 4.8,
      growth: '+12%',
    },
    month: {
      revenue: 4800,
      appointments: 72,
      newClients: 15,
      avgRating: 4.7,
      growth: '+8%',
    },
    year: {
      revenue: 52000,
      appointments: 856,
      newClients: 180,
      avgRating: 4.8,
      growth: '+25%',
    },
  };

  const popularServices = [
    { name: 'Hair Cut & Style', bookings: 28, revenue: 2240 },
    { name: 'Hair Color', bookings: 22, revenue: 3300 },
    { name: 'Deep Conditioning', bookings: 15, revenue: 900 },
    { name: 'Hair Extensions', bookings: 8, revenue: 1600 },
  ];

  const clientData = [
    { category: 'New Clients', count: 15, percentage: 25, color: '#FF6B6B' },
    { category: 'Returning Clients', count: 45, percentage: 75, color: '#4ECDC4' },
  ];

  const timeSlotData = [
    { time: '9-11 AM', bookings: 12, color: '#96CEB4' },
    { time: '11-1 PM', bookings: 18, color: '#FFEAA7' },
    { time: '1-3 PM', bookings: 15, color: '#DDA0DD' },
    { time: '3-5 PM', bookings: 22, color: '#98D8C8' },
    { time: '5-7 PM', bookings: 8, color: '#F7DC6F' },
  ];

  const currentData = analyticsData[selectedPeriod];

  const periods = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Business Analytics</Text>
        <Text style={styles.headerSubtitle}>Track your performance</Text>
      </LinearGradient>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.activePeriodButton,
            ]}
            onPress={() => setSelectedPeriod(period.key as any)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.activePeriodButtonText,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Ionicons name="cash-outline" size={24} color="#27AE60" />
            <Text style={styles.metricValue}>${currentData.revenue}</Text>
            <Text style={styles.metricLabel}>Revenue</Text>
            <Text style={styles.metricGrowth}>{currentData.growth}</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="calendar-outline" size={24} color="#3498DB" />
            <Text style={styles.metricValue}>{currentData.appointments}</Text>
            <Text style={styles.metricLabel}>Appointments</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="person-add-outline" size={24} color="#9B59B6" />
            <Text style={styles.metricValue}>{currentData.newClients}</Text>
            <Text style={styles.metricLabel}>New Clients</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="star-outline" size={24} color="#F39C12" />
            <Text style={styles.metricValue}>{currentData.avgRating}</Text>
            <Text style={styles.metricLabel}>Avg Rating</Text>
          </View>
        </View>
      </View>

      {/* Popular Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Services</Text>
        {popularServices.map((service, index) => (
          <View key={index} style={styles.serviceItem}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceStats}>
                {service.bookings} bookings • ${service.revenue}
              </Text>
            </View>
            <View style={styles.serviceBar}>
              <View
                style={[
                  styles.serviceBarFill,
                  { width: `${(service.bookings / 30) * 100}%` },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Client Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client Distribution</Text>
        <View style={styles.clientChart}>
          {clientData.map((item, index) => (
            <View key={index} style={styles.clientItem}>
              <View style={styles.clientInfo}>
                <View
                  style={[styles.clientColor, { backgroundColor: item.color }]}
                />
                <Text style={styles.clientCategory}>{item.category}</Text>
              </View>
              <View style={styles.clientStats}>
                <Text style={styles.clientCount}>{item.count}</Text>
                <Text style={styles.clientPercentage}>{item.percentage}%</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Peak Hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Peak Hours</Text>
        <View style={styles.timeChart}>
          {timeSlotData.map((slot, index) => (
            <View key={index} style={styles.timeSlot}>
              <Text style={styles.timeLabel}>{slot.time}</Text>
              <View style={styles.timeBarContainer}>
                <View
                  style={[
                    styles.timeBar,
                    {
                      height: `${(slot.bookings / 25) * 100}%`,
                      backgroundColor: slot.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.timeCount}>{slot.bookings}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Goals Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Goals</Text>
        <View style={styles.goalItem}>
          <Text style={styles.goalTitle}>Revenue Target</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '80%' }]} />
          </View>
          <Text style={styles.goalText}>$4,800 / $6,000 (80%)</Text>
        </View>
        <View style={styles.goalItem}>
          <Text style={styles.goalTitle}>Client Target</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '75%' }]} />
          </View>
          <Text style={styles.goalText}>60 / 80 clients (75%)</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 5,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activePeriodButton: {
    backgroundColor: '#667eea',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activePeriodButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  metricGrowth: {
    fontSize: 12,
    color: '#27AE60',
    marginTop: 2,
  },
  serviceItem: {
    marginBottom: 15,
  },
  serviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  serviceStats: {
    fontSize: 12,
    color: '#666',
  },
  serviceBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
  },
  serviceBarFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 3,
  },
  clientChart: {
    gap: 15,
  },
  clientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  clientCategory: {
    fontSize: 14,
    color: '#333',
  },
  clientStats: {
    alignItems: 'flex-end',
  },
  clientCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  clientPercentage: {
    fontSize: 12,
    color: '#666',
  },
  timeChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  timeSlot: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 8,
  },
  timeBarContainer: {
    height: 80,
    width: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    justifyContent: 'flex-end',
  },
  timeBar: {
    width: '100%',
    borderRadius: 10,
  },
  timeCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  goalItem: {
    marginBottom: 20,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#27AE60',
    borderRadius: 4,
  },
  goalText: {
    fontSize: 12,
    color: '#666',
  },
});

export default AnalyticsScreen;
