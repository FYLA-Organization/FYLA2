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
import { BlurView } from 'expo-blur';
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
      <LinearGradient colors={['#667eea', '#764ba2']} style={[styles.container, styles.centered]}>
        <BlurView intensity={20} style={styles.loadingCard}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </BlurView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="calendar-outline" size={28} color="#4ECDC4" />
              <Text style={[styles.statNumber, { color: '#4ECDC4' }]}>{dashboardData?.todayAppointments || 0}</Text>
              <Text style={styles.statLabel}>Today's Appointments</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={28} color="#FF6B6B" />
              <Text style={[styles.statNumber, { color: '#FF6B6B' }]}>{dashboardData?.pendingAppointments || 0}</Text>
              <Text style={styles.statLabel}>Pending Requests</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="trending-up-outline" size={28} color="#45B7D1" />
              <Text style={[styles.statNumber, { color: '#45B7D1' }]}>{formatCurrency(dashboardData?.weeklyRevenue || 0)}</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="cash-outline" size={28} color="#96CEB4" />
              <Text style={[styles.statNumber, { color: '#96CEB4' }]}>{formatCurrency(dashboardData?.monthlyRevenue || 0)}</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
          </View>
        </View>

        {/* Additional Stats Row */}
        <View style={styles.additionalStats}>
          <View style={styles.additionalStatCard}>
            <Ionicons name="people-outline" size={24} color="#667eea" />
            <Text style={[styles.additionalStatNumber, { color: '#667eea' }]}>{dashboardData?.totalClients || 0}</Text>
            <Text style={styles.additionalStatLabel}>Total Clients</Text>
          </View>
          <View style={styles.additionalStatCard}>
            <Ionicons name="star-outline" size={24} color="#FFD93D" />
            <Text style={[styles.additionalStatNumber, { color: '#FFD93D' }]}>{dashboardData?.averageRating?.toFixed(1) || '0.0'}</Text>
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
              <Ionicons name="calendar-outline" size={16} color="#4ECDC4" />
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
            <Ionicons name="chatbubble-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="stats-chart-outline" size={24} color="white" />
            <Text style={styles.actionButtonText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  // Base Layout
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingBottom: 100,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  
  // Header Section
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  headerTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
    letterSpacing: -0.2,
  },
  
  // Stats Section
  statsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginTop: 8,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  
  // Additional Stats
  additionalStats: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  additionalStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  additionalStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginTop: 6,
    letterSpacing: -0.2,
  },
  additionalStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 6,
    fontWeight: '500',
  },
  
  // Section Containers
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 24,
    marginVertical: 12,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  
  // Appointment Cards
  appointmentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentClient: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.2,
  },
  appointmentPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4ECDC4',
    letterSpacing: -0.2,
  },
  appointmentService: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    fontWeight: '500',
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentTimeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 6,
    fontWeight: '500',
  },
  
  // Appointment Items
  appointmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentItemClient: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.2,
  },
  appointmentItemService: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    fontWeight: '500',
  },
  appointmentItemTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    fontWeight: '500',
  },
  appointmentItemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4ECDC4',
    letterSpacing: -0.2,
  },
  
  // Activity Items
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  activityInfo: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 15,
    color: 'white',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  activityDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    fontWeight: '500',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#96CEB4',
    letterSpacing: -0.2,
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  actionButtonText: {
    fontSize: 13,
    color: 'white',
    marginTop: 12,
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
});

export default DashboardScreen;
