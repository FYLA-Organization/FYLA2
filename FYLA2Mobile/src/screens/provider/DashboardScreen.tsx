import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayAppointments: 8,
    weeklyRevenue: 1250,
    monthlyRevenue: 4800,
    totalClients: 127,
    averageRating: 4.8,
    pendingAppointments: 3,
  });

  const quickActions = [
    { icon: 'calendar-outline', title: 'View Schedule', color: '#FF6B6B' },
    { icon: 'person-add-outline', title: 'Add Client', color: '#4ECDC4' },
    { icon: 'time-outline', title: 'Set Availability', color: '#45B7D1' },
    { icon: 'stats-chart-outline', title: 'View Analytics', color: '#96CEB4' },
  ];

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#FF6B6B', '#4ECDC4']}
        style={styles.header}
      >
        <Text style={styles.welcomeText}>Welcome back!</Text>
        <Text style={styles.nameText}>{user?.firstName}</Text>
        <Text style={styles.businessText}>Beauty Expert Dashboard</Text>
      </LinearGradient>

      {/* Today's Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color="#FF6B6B" />
            <Text style={styles.statNumber}>{stats.todayAppointments}</Text>
            <Text style={styles.statLabel}>Appointments</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#4ECDC4" />
            <Text style={styles.statNumber}>{stats.pendingAppointments}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      </View>

      {/* Revenue Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Revenue Overview</Text>
        <View style={styles.revenueContainer}>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueAmount}>${stats.weeklyRevenue}</Text>
            <Text style={styles.revenueLabel}>This Week</Text>
            <Text style={styles.revenueChange}>+12% from last week</Text>
          </View>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueAmount}>${stats.monthlyRevenue}</Text>
            <Text style={styles.revenueLabel}>This Month</Text>
            <Text style={styles.revenueChange}>+8% from last month</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { borderLeftColor: action.color }]}
            >
              <Ionicons name={action.icon as any} size={24} color={action.color} />
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Performance Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.performanceContainer}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceNumber}>{stats.totalClients}</Text>
            <Text style={styles.performanceLabel}>Total Clients</Text>
          </View>
          <View style={styles.performanceItem}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={styles.performanceNumber}>{stats.averageRating}</Text>
            </View>
            <Text style={styles.performanceLabel}>Average Rating</Text>
          </View>
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
  welcomeText: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
  },
  nameText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 5,
  },
  businessText: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 5,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  revenueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  revenueCard: {
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  revenueAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2ECC71',
  },
  revenueLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  revenueChange: {
    fontSize: 12,
    color: '#27AE60',
    marginTop: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  performanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  performanceLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default DashboardScreen;
