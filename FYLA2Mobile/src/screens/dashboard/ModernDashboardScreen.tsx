import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { modernTheme } from '../../theme/modernTheme';
import { ModernCard } from '../../components/ui/ModernCard';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalBookings: number;
  completedBookings: number;
  revenue: number;
  rating: number;
  subscriptionTier: string;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
  onPress: () => void;
}

export const ModernDashboardScreen: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    completedBookings: 0,
    revenue: 0,
    rating: 0,
    subscriptionTier: 'Free',
  });
  const [refreshing, setRefreshing] = useState(false);

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'New Booking',
      subtitle: 'Schedule service',
      icon: 'add-circle-outline',
      gradient: modernTheme.colors.primary.gradient,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Navigate to booking screen
      },
    },
    {
      id: '2',
      title: 'Subscription',
      subtitle: 'Manage plan',
      icon: 'diamond-outline',
      gradient: modernTheme.colors.secondary.gradient,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Navigate to subscription screen
      },
    },
    {
      id: '3',
      title: 'Analytics',
      subtitle: 'View insights',
      icon: 'bar-chart-outline',
      gradient: modernTheme.colors.accent.gradient,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Navigate to analytics screen
      },
    },
    {
      id: '4',
      title: 'Payments',
      subtitle: 'Payment history',
      icon: 'card-outline',
      gradient: modernTheme.colors.success.gradient,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Navigate to payments screen
      },
    },
  ];

  const loadDashboardData = async () => {
    try {
      // Simulate loading dashboard data
      setStats({
        totalBookings: 24,
        completedBookings: 20,
        revenue: 1250.00,
        rating: 4.8,
        subscriptionTier: 'Premium',
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={modernTheme.colors.primary.gradient}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Good morning!</Text>
              <Text style={styles.userName}>John Doe</Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.profileGradient}
              >
                <Ionicons name="person-outline" size={24} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subscriptionBadge}>
            {stats.subscriptionTier} Member
          </Text>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );

  const renderStatsCard = () => (
    <ModernCard variant="glass" style={styles.statsCard}>
      <Text style={styles.statsTitle}>Your Performance</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalBookings}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.completedBookings}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${stats.revenue}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.rating}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>
    </ModernCard>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.quickActionItem}
            onPress={action.onPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={action.gradient}
              style={styles.quickActionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <BlurView intensity={20} style={styles.quickActionBlur}>
                <Ionicons name={action.icon} size={32} color="white" />
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              </BlurView>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRecentActivity = () => (
    <ModernCard variant="elevated" style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.activityList}>
        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="checkmark-circle" size={20} color={modernTheme.colors.success.main} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Service completed</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
            <Text style={styles.activityAmount}>+$125</Text>
          </View>
        ))}
      </View>
    </ModernCard>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderStatsCard()}
        {renderQuickActions()}
        {renderRecentActivity()}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: modernTheme.colors.background,
  },
  header: {
    height: 200,
  },
  headerGradient: {
    flex: 1,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: modernTheme.spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: modernTheme.spacing.md,
  },
  greeting: {
    fontFamily: modernTheme.typography.fontFamily.regular,
    fontSize: modernTheme.typography.fontSize.md,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontFamily: modernTheme.typography.fontFamily.bold,
    fontSize: modernTheme.typography.fontSize.xl,
    color: 'white',
    marginTop: modernTheme.spacing.xs,
  },
  profileButton: {
    borderRadius: modernTheme.borderRadius.full,
    overflow: 'hidden',
  },
  profileGradient: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionBadge: {
    fontFamily: modernTheme.typography.fontFamily.medium,
    fontSize: modernTheme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: modernTheme.spacing.md,
    paddingVertical: modernTheme.spacing.xs,
    borderRadius: modernTheme.borderRadius.full,
    alignSelf: 'flex-start',
    marginTop: modernTheme.spacing.lg,
  },
  content: {
    flex: 1,
    marginTop: -40,
  },
  statsCard: {
    margin: modernTheme.spacing.lg,
    padding: modernTheme.spacing.lg,
  },
  statsTitle: {
    fontFamily: modernTheme.typography.fontFamily.semibold,
    fontSize: modernTheme.typography.fontSize.lg,
    color: modernTheme.colors.text.primary,
    marginBottom: modernTheme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: modernTheme.spacing.md,
  },
  statValue: {
    fontFamily: modernTheme.typography.fontFamily.bold,
    fontSize: modernTheme.typography.fontSize.xl,
    color: modernTheme.colors.primary.main,
    marginBottom: modernTheme.spacing.xs,
  },
  statLabel: {
    fontFamily: modernTheme.typography.fontFamily.regular,
    fontSize: modernTheme.typography.fontSize.sm,
    color: modernTheme.colors.text.secondary,
    textAlign: 'center',
  },
  quickActionsContainer: {
    paddingHorizontal: modernTheme.spacing.lg,
    marginBottom: modernTheme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: modernTheme.typography.fontFamily.semibold,
    fontSize: modernTheme.typography.fontSize.lg,
    color: modernTheme.colors.text.primary,
    marginBottom: modernTheme.spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: (width - modernTheme.spacing.lg * 2 - modernTheme.spacing.md) / 2,
    marginBottom: modernTheme.spacing.md,
    borderRadius: modernTheme.borderRadius.lg,
    overflow: 'hidden',
    height: 120,
  },
  quickActionGradient: {
    flex: 1,
  },
  quickActionBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: modernTheme.spacing.md,
  },
  quickActionTitle: {
    fontFamily: modernTheme.typography.fontFamily.semibold,
    fontSize: modernTheme.typography.fontSize.md,
    color: 'white',
    marginTop: modernTheme.spacing.sm,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontFamily: modernTheme.typography.fontFamily.regular,
    fontSize: modernTheme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: modernTheme.spacing.xs,
    textAlign: 'center',
  },
  activityCard: {
    margin: modernTheme.spacing.lg,
    padding: modernTheme.spacing.lg,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: modernTheme.spacing.lg,
  },
  viewAllText: {
    fontFamily: modernTheme.typography.fontFamily.medium,
    fontSize: modernTheme.typography.fontSize.sm,
    color: modernTheme.colors.primary.main,
  },
  activityList: {
    gap: modernTheme.spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: modernTheme.spacing.sm,
  },
  activityIcon: {
    marginRight: modernTheme.spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontFamily: modernTheme.typography.fontFamily.medium,
    fontSize: modernTheme.typography.fontSize.md,
    color: modernTheme.colors.text.primary,
  },
  activityTime: {
    fontFamily: modernTheme.typography.fontFamily.regular,
    fontSize: modernTheme.typography.fontSize.sm,
    color: modernTheme.colors.text.secondary,
    marginTop: modernTheme.spacing.xs,
  },
  activityAmount: {
    fontFamily: modernTheme.typography.fontFamily.semibold,
    fontSize: modernTheme.typography.fontSize.md,
    color: modernTheme.colors.success.main,
  },
  bottomPadding: {
    height: modernTheme.spacing.xl,
  },
});
