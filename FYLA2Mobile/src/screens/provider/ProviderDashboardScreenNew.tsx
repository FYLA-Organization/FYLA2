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
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, COMMON_STYLES } from '../../constants/colors';
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

      const response = await fetch('http://192.168.1.201:5224/api/analytics/dashboard', {
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

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Schedule',
      icon: 'calendar',
      color: COLORS.primary,
      onPress: () => navigation.navigate('Schedule'),
    },
    {
      id: '2',
      title: 'Services',
      icon: 'list',
      color: COLORS.secondary,
      onPress: () => navigation.navigate('ServiceManagement'),
    },
    {
      id: '3',
      title: 'Clients',
      icon: 'people',
      color: COLORS.success,
      onPress: () => navigation.navigate('Clients'),
    },
    {
      id: '4',
      title: 'Analytics',
      icon: 'analytics',
      color: COLORS.warning,
      onPress: () => navigation.navigate('Analytics'),
    },
  ];

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.headerTitle}>Business Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Revenue Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewTitle}>Today's Overview</Text>
            <View style={styles.periodSelector}>
              <Text style={styles.selectedPeriod}>Today</Text>
            </View>
          </View>
          
          <View style={styles.revenueRow}>
            <View style={styles.revenueMain}>
              <Text style={styles.revenueLabel}>Revenue</Text>
              <Text style={styles.revenueValue}>
                {formatCurrency(dashboardData.todayRevenue)}
              </Text>
              <View style={styles.trendRow}>
                <Ionicons name="trending-up" size={16} color={COLORS.success} />
                <Text style={styles.trendText}>+12% from yesterday</Text>
              </View>
            </View>
            
            <View style={styles.appointmentsWidget}>
              <Text style={styles.appointmentsCount}>{dashboardData.appointmentsToday}</Text>
              <Text style={styles.appointmentsLabel}>Appointments</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{dashboardData.appointmentsThisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="people-outline" size={20} color={COLORS.success} />
            </View>
            <Text style={styles.statValue}>{dashboardData.totalClients}</Text>
            <Text style={styles.statLabel}>Total Clients</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="star-outline" size={20} color={COLORS.warning} />
            </View>
            <Text style={styles.statValue}>{dashboardData.averageRating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionButton}
                onPress={action.onPress}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: action.color + '15' }]}>
                  <Ionicons name={action.icon as any} size={22} color={action.color} />
                </View>
                <Text style={styles.actionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.activityList}>
            {dashboardData.recentActivity.slice(0, 4).map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={[styles.activityDot, { 
                  backgroundColor: activity.type === 'booking' ? COLORS.primary :
                                 activity.type === 'payment' ? COLORS.success :
                                 COLORS.warning
                }]} />
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
      </ScrollView>
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
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  // Modern Header Styles
  header: {
    backgroundColor: COLORS.background,
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  // Content Styles
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  // Overview Card
  overviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...COMMON_STYLES.shadow,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  periodSelector: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  selectedPeriod: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueMain: {
    flex: 1,
  },
  revenueLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 14,
    color: COLORS.success,
    marginLeft: 4,
    fontWeight: '500',
  },
  appointmentsWidget: {
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
  },
  appointmentsCount: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  appointmentsLabel: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    ...COMMON_STYLES.shadow,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  // Section Styles
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  // Quick Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    ...COMMON_STYLES.shadow,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'center',
  },
  // Activity List
  activityList: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...COMMON_STYLES.shadow,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export default ProviderDashboardScreen;
