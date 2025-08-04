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
          contentContainerStyle={styles.scrollContent}
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
            
            {/* Main Revenue Display */}
            <View style={styles.mainRevenue}>
              <Text style={styles.revenueLabel}>Total Revenue</Text>
              <Text style={styles.revenueValue}>
                {formatCurrency(dashboardData.todayRevenue)}
              </Text>
              <View style={styles.trendRow}>
                <Ionicons name="trending-up" size={16} color={COLORS.success} />
                <Text style={styles.trendText}>+12% from yesterday</Text>
              </View>
            </View>
            
            {/* Quick Stats Row */}
            <View style={styles.overviewStats}>
              <View style={styles.overviewStat}>
                <View style={styles.overviewStatIcon}>
                  <Ionicons name="calendar" size={18} color={COLORS.primary} />
                </View>
                <View style={styles.overviewStatContent}>
                  <Text style={styles.overviewStatValue}>{dashboardData.appointmentsToday}</Text>
                </View>
              </View>
              
              <View style={styles.overviewStat}>
                <View style={styles.overviewStatIcon}>
                  <Ionicons name="people" size={18} color={COLORS.success} />
                </View>
                <View style={styles.overviewStatContent}>
                  <Text style={styles.overviewStatValue}>{dashboardData.totalClients}</Text>
                </View>
              </View>
              
              <View style={styles.overviewStat}>
                <View style={styles.overviewStatIcon}>
                  <Ionicons name="star" size={18} color={COLORS.warning} />
                </View>
                <View style={styles.overviewStatContent}>
                  <Text style={styles.overviewStatValue}>{dashboardData.averageRating.toFixed(1)}</Text>
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
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100, // Extra padding for tab navigation
  },
  // Overview Card
  overviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
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
  revenueLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  revenueValue: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: SPACING.md,
  },
  revenueMain: {
    flex: 1,
    marginRight: SPACING.lg,
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
    marginBottom: 12,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendText: {
    fontSize: 14,
    color: COLORS.success,
    marginLeft: 4,
    fontWeight: '500',
  },
  // New Overview Card Layout
  mainRevenue: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  overviewStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  overviewStatContent: {
    flex: 1,
    alignItems: 'center',
  },
  overviewStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  appointmentsWidget: {
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: RADIUS.lg,
    minWidth: 100,
  },
  appointmentsCount: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  appointmentsLabel: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    marginBottom: SPACING.xl,
    gap: 16,
    marginTop: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    minHeight: 100,
    ...COMMON_STYLES.shadow,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
    marginBottom: SPACING.xl * 1.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
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
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: SPACING.sm,
  },
  actionButton: {
    width: (width - (SPACING.lg * 2) - 12) / 2, // 2 columns with gap
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    minHeight: 90,
    ...COMMON_STYLES.shadow,
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 16,
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
