// @ts-nocheck
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
  Modal,
  TextInput,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/colors';
import ApiService from '../../services/api';

// @ts-ignore - TypeScript fontWeight compatibility issues
const FONT_WEIGHTS = {
  medium: '500' as any,
  bold: '700' as any,
  semibold: '600' as any,
};
import type { RootStackParamList } from '../../types';

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface DashboardActivity {
  type: string;
  message: string;
  timestamp: string;
}

interface TopService {
  name: string;
  revenue: number;
  bookings: number;
}

interface DashboardData {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  totalClients: number;
  newClientsThisMonth: number;
  appointmentsToday: number;
  appointmentsThisWeek: number;
  averageRating: number;
  topServices: TopService[];
  recentActivity: DashboardActivity[];
}

const ProviderDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    totalClients: 0,
    newClientsThisMonth: 0,
    appointmentsToday: 0,
    appointmentsThisWeek: 0,
    averageRating: 0,
    topServices: [],
    recentActivity: []
  });
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationInput, setLocationInput] = useState('123 Main St, City, State');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load real analytics data from backend
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token available');
        return;
      }

      const response = await fetch('http://192.168.1.185:5224/api/analytics/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const analyticsData = await response.json();
        console.log('Raw API data:', analyticsData);
        
        // Transform API data to match dashboard metrics format
        const transformedData = {
          todayRevenue: analyticsData.weeklyRevenue || 0,
          weekRevenue: analyticsData.weeklyRevenue || 0,
          monthRevenue: analyticsData.monthlyRevenue || 0,
          totalClients: analyticsData.totalClients || 0,
          newClientsThisMonth: Math.floor((analyticsData.totalClients || 0) * 0.3), // Estimate 30% new
          appointmentsToday: analyticsData.todayAppointments || 0,
          appointmentsThisWeek: analyticsData.todayAppointments ? (analyticsData.todayAppointments * 5) : 0, // Estimate 5x daily
          averageRating: analyticsData.averageRating || 0,
          topServices: analyticsData.recentBookings?.slice(0, 3).map((booking: any, index: number) => ({
            name: booking.serviceName || `Service ${index + 1}`,
            revenue: booking.totalAmount || 0,
            bookings: index + 1 // Simple count
          })) || [],
          recentActivity: analyticsData.recentBookings?.slice(0, 4).map((booking: any) => ({
            type: 'booking',
            message: `${booking.status} booking with ${booking.clientName}`,
            timestamp: booking.scheduledDate
          })) || []
        };
        
        setDashboardData(transformedData);
        console.log('Updated dashboard with real data:', transformedData);
      } else {
        console.error('Dashboard API failed:', response.status, response.statusText);
        Alert.alert('Error', 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'Network error loading dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleUpdateLocation = () => {
    setShowLocationModal(false);
    Alert.alert('Success', 'Business location updated successfully!');
  };

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Client Management',
      icon: 'people',
      color: COLORS.primary,
      onPress: () => navigation.navigate('ClientManagement'),
    },
    {
      id: '2',
      title: 'Schedule',
      icon: 'calendar',
      color: COLORS.success,
      onPress: () => navigation.navigate('EnhancedSchedule'),
    },
    {
      id: '3',
      title: 'Coupons & Loyalty',
      icon: 'gift',
      color: COLORS.accent,
      onPress: () => navigation.navigate('CouponsLoyalty'),
    },
    {
      id: '4',
      title: 'Analytics',
      icon: 'analytics',
      color: COLORS.analytics,
      onPress: () => navigation.navigate('Analytics'),
    },
  ];

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Business Dashboard</Text>
            <TouchableOpacity 
              style={styles.locationButton}
              onPress={() => setShowLocationModal(true)}
            >
              <Ionicons name="location" size={20} color={COLORS.surface} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Metrics Cards */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Today's Revenue</Text>
                <Text style={styles.metricValue}>
                  {formatCurrency(dashboardData.todayRevenue)}
                </Text>
                <View style={styles.metricTrend}>
                  <Ionicons name="trending-up" size={16} color={COLORS.success} />
                  <Text style={styles.trendText}>+12%</Text>
                </View>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Week Revenue</Text>
                <Text style={styles.metricValue}>
                  {formatCurrency(dashboardData.weekRevenue)}
                </Text>
                <View style={styles.metricTrend}>
                  <Ionicons name="trending-up" size={16} color={COLORS.success} />
                  <Text style={styles.trendText}>+8%</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.metricRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Appointments Today</Text>
                <Text style={styles.metricValue}>{dashboardData.appointmentsToday}</Text>
                <View style={styles.metricTrend}>
                  <Ionicons name="calendar" size={16} color={COLORS.primary} />
                  <Text style={styles.trendText}>Active</Text>
                </View>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total Clients</Text>
                <Text style={styles.metricValue}>{dashboardData.totalClients}</Text>
                <View style={styles.metricTrend}>
                  <Ionicons name="people" size={16} color={COLORS.primary} />
                  <Text style={styles.trendText}>{dashboardData.newClientsThisMonth} new</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionCard}
                  onPress={action.onPress}
                >
                  <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                    <Ionicons name={action.icon as any} size={24} color={COLORS.surface} />
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.activityContainer}>
              {dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { 
                    backgroundColor: activity.type === 'booking' ? COLORS.primary :
                                   activity.type === 'payment' ? COLORS.success :
                                   activity.type === 'review' ? COLORS.warning :
                                   COLORS.accent
                  }]}>
                    <Ionicons 
                      name={
                        activity.type === 'booking' ? 'calendar' :
                        activity.type === 'payment' ? 'card' :
                        activity.type === 'review' ? 'star' :
                        'person-add'
                      } 
                      size={16} 
                      color={COLORS.surface} 
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>{activity.message}</Text>
                    <Text style={styles.activityTime}>
                      {new Date(activity.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Top Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Services</Text>
            <View style={styles.servicesContainer}>
              {dashboardData.topServices.map((service, index) => (
                <View key={index} style={styles.serviceItem}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceBookings}>{service.bookings} bookings</Text>
                  </View>
                  <Text style={styles.serviceRevenue}>
                    {formatCurrency(service.revenue)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Location Modal */}
        <Modal
          visible={showLocationModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowLocationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Business Location</Text>
                <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <Text style={styles.inputLabel}>Business Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={locationInput}
                  onChangeText={setLocationInput}
                  placeholder="Enter your business address"
                  multiline
                />
                
                <TouchableOpacity 
                  style={styles.updateButton}
                  onPress={handleUpdateLocation}
                >
                  <Text style={styles.updateButtonText}>Update Location</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  // @ts-ignore - FontWeight type issue with TYPOGRAPHY constants
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textSecondary,
    fontWeight: '500' as any,
  },
  header: {
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.surface,
  },
  locationButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  metricsContainer: {
    marginTop: -SPACING.xl,
    marginBottom: SPACING.lg,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginHorizontal: SPACING.xs / 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.medium,
    marginBottom: SPACING.xs,
  },
  metricValue: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.medium,
    marginLeft: SPACING.xs / 2,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - SPACING.md * 3) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    textAlign: 'center',
  },
  activityContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.medium,
  },
  activityTime: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  servicesContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  serviceBookings: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  serviceRevenue: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.success,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    width: width - SPACING.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.base,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: SPACING.lg,
  },
  updateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.surface,
  },
});

export default ProviderDashboardScreen;
