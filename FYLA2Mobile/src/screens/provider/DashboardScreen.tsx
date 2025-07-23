import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ProviderDashboard } from '../../types';

const DashboardScreen = () => {
  const [dashboardData, setDashboardData] = useState<ProviderDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await api.getProviderDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading && !dashboardData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="calendar-outline" size={24} color="#4ECDC4" />
            <Text style={styles.statNumber}>{dashboardData?.todayAppointments || 0}</Text>
            <Text style={styles.statLabel}>Today's Appointments</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color="#FF6B6B" />
            <Text style={styles.statNumber}>{dashboardData?.pendingAppointments || 0}</Text>
            <Text style={styles.statLabel}>Pending Requests</Text>
          </View>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="trending-up-outline" size={24} color="#45B7D1" />
            <Text style={styles.statNumber}>{formatCurrency(dashboardData?.weeklyRevenue || 0)}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={24} color="#96CEB4" />
            <Text style={styles.statNumber}>{formatCurrency(dashboardData?.monthlyRevenue || 0)}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>
      </View>

      {/* Additional Stats Row */}
      <View style={styles.additionalStats}>
        <View style={styles.additionalStatCard}>
          <Ionicons name="people-outline" size={20} color="#667eea" />
          <Text style={styles.additionalStatNumber}>{dashboardData?.totalClients || 0}</Text>
          <Text style={styles.additionalStatLabel}>Total Clients</Text>
        </View>
        <View style={styles.additionalStatCard}>
          <Ionicons name="star-outline" size={20} color="#FFD93D" />
          <Text style={styles.additionalStatNumber}>{dashboardData?.averageRating?.toFixed(1) || '0.0'}</Text>
          <Text style={styles.additionalStatLabel}>Rating</Text>
        </View>
      </View>

      {/* Next Appointment */}
      {dashboardData?.nextAppointment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Appointment</Text>
          <View style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
              <Text style={styles.appointmentClient}>
                {dashboardData.nextAppointment.clientName}
              </Text>
              <Text style={styles.appointmentPrice}>
                {formatCurrency(dashboardData.nextAppointment.totalAmount)}
              </Text>
            </View>
            <Text style={styles.appointmentService}>
              {dashboardData.nextAppointment.serviceName}
            </Text>
            <View style={styles.appointmentTime}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.appointmentTimeText}>
                {formatDate(dashboardData.nextAppointment.scheduledDate)} • {dashboardData.nextAppointment.duration} min
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Recent Bookings */}
      {dashboardData?.recentBookings && dashboardData.recentBookings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          {dashboardData.recentBookings.slice(0, 5).map((booking) => (
            <View key={booking.id} style={styles.appointmentItem}>
              <View style={styles.appointmentInfo}>
                <Text style={styles.appointmentItemClient}>{booking.clientName}</Text>
                <Text style={styles.appointmentItemService}>{booking.serviceName}</Text>
                <Text style={styles.appointmentItemTime}>
                  {formatDate(booking.scheduledDate)} • {booking.status}
                </Text>
              </View>
              <Text style={styles.appointmentItemPrice}>
                {formatCurrency(booking.totalAmount)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add-circle-outline" size={24} color="#4ECDC4" />
            <Text style={styles.actionButtonText}>Add Service</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="calendar-outline" size={24} color="#45B7D1" />
            <Text style={styles.actionButtonText}>View Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={24} color="#FF6B6B" />
            <Text style={styles.actionButtonText}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="stats-chart-outline" size={24} color="#96CEB4" />
            <Text style={styles.actionButtonText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
    marginTop: 5,
  },
  statsContainer: {
    marginTop: -20,
    paddingHorizontal: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  additionalStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  additionalStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  additionalStatNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  additionalStatLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  appointmentCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentClient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  appointmentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  appointmentService: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentTimeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  appointmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentItemClient: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  appointmentItemService: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  appointmentItemTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  appointmentItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: '#333',
  },
  activityDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '47%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    fontWeight: '500',
  },
});

export default DashboardScreen;
