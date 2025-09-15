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
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, COMMON_STYLES } from '../../constants/colors';
import ApiService from '../../services/api';
import FeatureGatingService from '../../services/featureGatingService';
import FeatureOnboardingTour, { useFeatureOnboarding } from '../../components/FeatureOnboardingTour';
import { LineChart, BarChart } from 'react-native-chart-kit';

// @ts-ignore - TypeScript fontWeight compatibility issues
const FONT_WEIGHTS = {
  medium: '500' as any,
  bold: '700' as any,
  semibold: '600' as any,
};
import type { RootStackParamList } from '../../types';

const screenDimensions = Dimensions.get('window');
const { width = 375, height = 667 } = screenDimensions || {};

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

// Enhanced Subscription Tier Indicator Component
const SubscriptionTierIndicator = () => {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const sub = await FeatureGatingService.getSubscriptionInfo();
      setSubscription(sub);
    } catch (error) {
      console.error('Error loading subscription:', error);
      // Fallback to starter subscription if API call fails
      setSubscription({
        tier: 0,
        limits: {
          maxServices: 3,
          maxPhotosPerService: 5
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !subscription) return null;

  const tierInfo = {
    0: { 
      name: 'Free Plan',
      description: 'Basic features to get started',
      colors: ['#fbbf24', '#f59e0b'],
      textColor: '#92400e',
      bgColor: 'rgba(251, 191, 36, 0.1)',
      icon: 'star-outline',
      badge: 'FREE'
    },
    1: { 
      name: 'Pro Plan',
      description: 'Enhanced features for growing businesses',
      colors: ['#8b5cf6', '#7c3aed'],
      textColor: '#6b46c1',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      icon: 'rocket-outline',
      badge: 'PRO'
    },
    2: { 
      name: 'Business Plan',
      description: 'Complete solution for enterprises',
      colors: ['#10b981', '#059669'],
      textColor: '#047857',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      icon: 'diamond-outline',
      badge: 'BUSINESS'
    },
  };

  const currentTier = tierInfo[subscription?.tier as keyof typeof tierInfo] || tierInfo[0];
  const servicesUsed = 0; // TODO: Get actual count
  const maxServices = subscription?.limits?.maxServices || 0;
  const maxPhotos = subscription?.limits?.maxPhotosPerService || 0;

  return (
    <View style={subscriptionIndicatorStyles.container}>
      <LinearGradient
        colors={currentTier.colors}
        style={subscriptionIndicatorStyles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <BlurView intensity={30} style={subscriptionIndicatorStyles.blurContainer}>
          <View style={subscriptionIndicatorStyles.content}>
            <View style={subscriptionIndicatorStyles.leftContent}>
              <View style={subscriptionIndicatorStyles.iconSection}>
                <View style={subscriptionIndicatorStyles.iconContainer}>
                  <Ionicons name={currentTier.icon as any} size={24} color="white" />
                </View>
                <View style={subscriptionIndicatorStyles.badge}>
                  <Text style={subscriptionIndicatorStyles.badgeText}>{currentTier.badge}</Text>
                </View>
              </View>
              
              <View style={subscriptionIndicatorStyles.infoSection}>
                <Text style={subscriptionIndicatorStyles.planName}>{currentTier.name}</Text>
                <Text style={subscriptionIndicatorStyles.planDescription}>{currentTier.description}</Text>
                
                <View style={subscriptionIndicatorStyles.limitsContainer}>
                  <View style={subscriptionIndicatorStyles.limitItem}>
                    <Ionicons name="briefcase-outline" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={subscriptionIndicatorStyles.limitText}>
                      {servicesUsed}/{maxServices === 2147483647 ? '∞' : maxServices} services
                    </Text>
                  </View>
                  <View style={subscriptionIndicatorStyles.limitItem}>
                    <Ionicons name="image-outline" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={subscriptionIndicatorStyles.limitText}>
                      {maxPhotos === 2147483647 ? '∞' : maxPhotos} photos each
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            
            <View style={subscriptionIndicatorStyles.rightContent}>
              {subscription?.tier < 2 && (
                <TouchableOpacity 
                  style={subscriptionIndicatorStyles.upgradeButton}
                  onPress={() => navigation.navigate('SubscriptionPlans')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']}
                    style={subscriptionIndicatorStyles.upgradeGradient}
                  >
                    <Text style={subscriptionIndicatorStyles.upgradeText}>
                      {subscription?.tier === 0 ? 'Upgrade' : 'Go Business'}
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={subscriptionIndicatorStyles.featuresButton}
                onPress={() => navigation.navigate('SubscriptionPlans')}
                activeOpacity={0.7}
              >
                <Ionicons name="list-outline" size={18} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </LinearGradient>
    </View>
  );
};

// Subscription Status Banner Component
const SubscriptionStatusBanner = ({ onClose }: { onClose: () => void }) => {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const sub = await FeatureGatingService.getSubscriptionInfo();
      setSubscription(sub);
    } catch (error) {
      console.error('Error loading subscription:', error);
      // Fallback to starter subscription if API call fails
      setSubscription({
        tier: 0,
        limits: {
          maxServices: 3,
          maxPhotosPerService: 5
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !subscription) return null;

  const tierColors = {
    0: { 
      bg: '#FEF3C7', 
      text: '#92400E', 
      accent: '#F59E0B',
      gradient: ['#FEF3C7', '#FDE68A'],
      iconBg: 'rgba(245, 158, 11, 0.15)'
    }, // Starter - Yellow
    1: { 
      bg: '#EEF2FF', 
      text: '#4338CA', 
      accent: '#6366F1',
      gradient: ['#EEF2FF', '#E0E7FF'],
      iconBg: 'rgba(99, 102, 241, 0.15)'
    }, // Professional - Indigo
    2: { 
      bg: '#ECFDF5', 
      text: '#047857', 
      accent: '#10B981',
      gradient: ['#ECFDF5', '#D1FAE5'],
      iconBg: 'rgba(16, 185, 129, 0.15)'
    }, // Business - Green
  };

  const colors = tierColors[subscription?.tier as keyof typeof tierColors] || tierColors[0];
  const tierName = subscription?.tier === 0 ? 'Starter' : subscription?.tier === 1 ? 'Professional' : 'Business';
  const servicesUsed = 0; // TODO: Get actual count
  const maxServices = subscription?.limits?.maxServices || 0;
  const maxPhotos = subscription?.limits?.maxPhotosPerService || 0;

  return (
    <LinearGradient
      colors={colors.gradient}
      style={dashboardSubscriptionStyles.banner}
    >
      <BlurView intensity={20} style={dashboardSubscriptionStyles.blurContainer}>
        <View style={dashboardSubscriptionStyles.content}>
          <View style={dashboardSubscriptionStyles.leftSection}>
            <View style={[dashboardSubscriptionStyles.iconContainer, { backgroundColor: colors.iconBg }]}>
              <Ionicons name="diamond" size={20} color={colors.accent} />
            </View>
            <View style={dashboardSubscriptionStyles.textContainer}>
              <Text style={[dashboardSubscriptionStyles.tierText, { color: colors.text }]}>
                {tierName} Plan
              </Text>
              <Text style={[dashboardSubscriptionStyles.limitsText, { color: colors.text }]}>
                {servicesUsed}/{maxServices === -1 ? '∞' : maxServices} services • {maxPhotos === -1 ? '∞' : maxPhotos} photos
              </Text>
            </View>
          </View>
          
          <View style={dashboardSubscriptionStyles.rightSection}>
            {(subscription?.tier || 0) < 2 && (
              <TouchableOpacity 
                style={[dashboardSubscriptionStyles.upgradeButton, { backgroundColor: colors.accent }]}
                onPress={() => navigation.navigate('SubscriptionPlans')}
                activeOpacity={0.8}
              >
                <Text style={dashboardSubscriptionStyles.upgradeButtonText}>
                  {(subscription?.tier || 0) === 0 ? 'Upgrade' : 'Business'}
                </Text>
                <Ionicons name="arrow-forward" size={12} color={COLORS.surface} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={dashboardSubscriptionStyles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </LinearGradient>
  );
};

// Advanced Features Section Component
const AdvancedFeaturesSection = ({ navigation }: { navigation: any }) => {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const sub = await FeatureGatingService.getSubscriptionInfo();
      setSubscription(sub);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !subscription) return null;

  const advancedFeatures = [
    {
      id: 'marketingTools',
      title: 'Marketing Tools',
      icon: 'megaphone',
      color: '#F59E0B',
      requiredTier: 2,
      screen: 'MarketingTools',
      description: 'Automate your marketing campaigns'
    },
    {
      id: 'prioritySupport',
      title: 'Priority Support',
      icon: 'headset',
      color: '#10B981',
      requiredTier: 1,
      screen: 'PrioritySupport',
      description: '24-hour response time'
    },
    {
      id: 'multiLocation',
      title: 'Multi-Location',
      icon: 'business',
      color: '#3B82F6',
      requiredTier: 2,
      screen: 'MultiLocation',
      description: 'Manage multiple locations'
    },
    {
      id: 'chairRental',
      title: 'Chair Rental',
      icon: 'cube',
      color: '#EC4899',
      requiredTier: 2,
      screen: 'ChairRental',
      description: 'Rent out chairs to other providers'
    },
    {
      id: 'advancedAnalytics',
      title: 'Advanced Analytics',
      icon: 'trending-up',
      color: '#6366F1',
      requiredTier: 1,
      screen: 'Analytics',
      description: 'Detailed business insights'
    },
  ];

  const availableFeatures = advancedFeatures.filter(feature => subscription.tier >= feature.requiredTier);
  const lockedFeatures = advancedFeatures.filter(feature => subscription.tier < feature.requiredTier);

  const handleFeaturePress = (feature: any) => {
    if (subscription.tier >= feature.requiredTier) {
      navigation.navigate(feature.screen);
    } else {
      navigation.navigate('SubscriptionPlans');
    }
  };

  if (availableFeatures.length === 0 && lockedFeatures.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Advanced Features</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SubscriptionPlans')}>
          <Text style={styles.seeAllText}>Upgrade</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.featuresGrid}>
        {/* Available Features */}
        {availableFeatures.slice(0, 4).map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={styles.modernFeatureCard}
            onPress={() => handleFeaturePress(feature)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[feature.color + '20', feature.color + '10']}
              style={styles.modernFeatureGradient}
            >
              <View style={[styles.modernFeatureIcon, { backgroundColor: feature.color }]}>
                <Ionicons name={feature.icon as any} size={20} color="white" />
              </View>
              <Text style={styles.modernFeatureTitle} numberOfLines={1} ellipsizeMode="tail">
                {feature.title}
              </Text>
              <Text style={styles.modernFeatureDescription} numberOfLines={2} ellipsizeMode="tail">
                {feature.description}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
        
        {/* Locked Features */}
        {lockedFeatures.slice(0, Math.max(0, 4 - availableFeatures.length)).map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={styles.modernFeatureCard}
            onPress={() => handleFeaturePress(feature)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(156, 163, 175, 0.15)', 'rgba(156, 163, 175, 0.05)']}
              style={styles.modernFeatureGradient}
            >
              <View style={[styles.modernFeatureIcon, { backgroundColor: '#9CA3AF' }]}>
                <Ionicons name="lock-closed" size={20} color="white" />
              </View>
              <Text style={[styles.modernFeatureTitle, { color: '#9CA3AF' }]} numberOfLines={1} ellipsizeMode="tail">
                {feature.title}
              </Text>
              <Text style={[styles.modernFeatureDescription, { color: '#9CA3AF' }]} numberOfLines={2} ellipsizeMode="tail">
                {feature.requiredTier === 1 ? 'Professional' : 'Business'} plan
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const ProviderDashboardScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSubscriptionBanner, setShowSubscriptionBanner] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const { shouldShow, setShouldShow, loading: onboardingLoading } = useFeatureOnboarding();
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
      
      // Use the proper API service instead of hardcoded URL
      const response = await ApiService.get('/analytics/dashboard');
      
      if (response.data) {
        const apiData = response.data;
        console.log('Raw API data:', apiData);
        
        // Transform API data to match dashboard metrics format
        const transformedData = {
          todayRevenue: Number(apiData.weeklyRevenue) || 0,  // Use weekly as today estimate
          weekRevenue: Number(apiData.weeklyRevenue) || 0,
          monthRevenue: Number(apiData.monthlyRevenue) || 0,
          totalClients: apiData.totalClients || 0,
          newClientsThisMonth: Math.floor((apiData.totalClients || 0) * 0.2), // Estimate 20% new this month
          appointmentsToday: apiData.todayAppointments || 0,
          appointmentsThisWeek: (apiData.todayAppointments || 0) * 5, // Estimate 5x daily for week
          averageRating: apiData.averageRating || 0,
          topServices: apiData.recentBookings?.slice(0, 3).map((booking: any, index: number) => ({
            name: booking.serviceName || `Service ${index + 1}`,
            revenue: Number(booking.totalAmount) || 0,
            bookings: index + 1 // Simple count
          })) || [
            { name: 'Hair Cut & Style', revenue: 0, bookings: 0 },
            { name: 'Color Treatment', revenue: 0, bookings: 0 },
            { name: 'Facial', revenue: 0, bookings: 0 }
          ],
          recentActivity: apiData.recentBookings?.slice(0, 5).map((booking: any) => ({
            type: 'booking',
            message: `${booking.status} booking with ${booking.clientName} for ${booking.serviceName}`,
            timestamp: booking.scheduledDate
          })) || []
        };
        
        setDashboardData(transformedData);
        console.log('Updated dashboard with real data:', transformedData);
      } else {
        console.error('Dashboard API returned no data');
        // Set empty/zero data instead of demo data to show real state
        setDashboardData({
          todayRevenue: 0,
          weekRevenue: 0,
          monthRevenue: 0,
          totalClients: 0,
          newClientsThisMonth: 0,
          appointmentsToday: 0,
          appointmentsThisWeek: 0,
          averageRating: 0,
          topServices: [
            { name: 'No services yet', revenue: 0, bookings: 0 },
            { name: 'Create your first service', revenue: 0, bookings: 0 },
            { name: 'Start getting bookings', revenue: 0, bookings: 0 }
          ],
          recentActivity: [
            { type: 'welcome', message: 'Welcome to your dashboard!', timestamp: new Date().toISOString() },
            { type: 'setup', message: 'Add your first service to get started', timestamp: new Date().toISOString() }
          ]
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Show actual empty state instead of demo data
      setDashboardData({
        todayRevenue: 0,
        weekRevenue: 0,
        monthRevenue: 0,
        totalClients: 0,
        newClientsThisMonth: 0,
        appointmentsToday: 0,
        appointmentsThisWeek: 0,
        averageRating: 0,
        topServices: [
          { name: 'Unable to load services', revenue: 0, bookings: 0 },
          { name: 'Please try again', revenue: 0, bookings: 0 },
          { name: 'Check your connection', revenue: 0, bookings: 0 }
        ],
        recentActivity: [
          { type: 'error', message: 'Unable to load recent activity', timestamp: new Date().toISOString() },
          { type: 'info', message: 'Pull down to refresh', timestamp: new Date().toISOString() }
        ]
      });
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
      id: '2',
      title: 'Services',
      icon: 'briefcase',
      color: COLORS.success,
      onPress: () => navigation.navigate('EnhancedServiceManagement'),
    },
    {
      id: '3',
      title: 'Subscription',
      icon: 'diamond',
      color: '#8B5CF6',
      onPress: () => navigation.navigate('SubscriptionPlans'),
    },
    {
      id: '4',
      title: 'Promotions',
      icon: 'pricetag',
      color: COLORS.warning,
      onPress: () => navigation.navigate('EnhancedCouponsLoyalty'),
    },
    {
      id: '5',
      title: 'Availability',
      icon: 'time',
      color: COLORS.accent,
      onPress: () => navigation.navigate('ProviderAvailability'),
    },
    {
      id: '6',
      title: 'Analytics',
      icon: 'analytics',
      color: COLORS.analytics,
      onPress: () => navigation.navigate('Analytics'),
    },
  ];

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '$0.00';
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
        <LinearGradient
          colors={COLORS.gradientPrimary}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContent}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={COLORS.gradientSecondary}
              style={styles.loadingLogo}
            >
              <Ionicons name="diamond" size={32} color={COLORS.surface} />
            </LinearGradient>
          </View>
          <Text style={styles.loadingTitle}>FYLA</Text>
          <Text style={styles.loadingSubtitle}>Loading your business insights...</Text>
          <View style={styles.loadingIndicatorContainer}>
            <ActivityIndicator size="large" color={COLORS.surface} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Modern Floating Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#ff6b9d']}
        style={styles.modernHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <BlurView intensity={25} style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.greetingSection}>
                <Text style={styles.modernGreeting}>
                  {new Date().getHours() < 12 ? 'Good morning' : 
                   new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}
                </Text>
                <Text style={styles.modernTitle}>Dashboard</Text>
              </View>
              <View style={styles.modernDateContainer}>
                <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.modernDate}>
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.modernActionButton}>
                <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modernActionButton}
                onPress={() => setShowNotifications(!showNotifications)}
              >
                <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.9)" />
                <View style={styles.modernNotificationDot} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modernProfileButton}
                onPress={() => navigation.navigate('Analytics' as any)}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                  style={styles.profileGradient}
                >
                  <Ionicons name="analytics-outline" size={18} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </LinearGradient>

      {/* Notification Dropdown */}
      {showNotifications && (
        <View style={styles.notificationDropdown}>
          <BlurView intensity={95} style={styles.notificationBlur}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
              {dashboardData.recentActivity.map((activity, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.notificationItem} 
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowNotifications(false);
                    // Navigate based on activity type
                    if (activity.type === 'booking') {
                      navigation.navigate('Bookings');
                    } else if (activity.type === 'review') {
                      navigation.navigate('Reviews');
                    } else if (activity.type === 'payment') {
                      setSwipeableRevenueCard(true);
                    }
                  }}
                >
                  <View style={[styles.notificationIcon, { 
                    backgroundColor: activity.type === 'booking' ? '#667eea' :
                                   activity.type === 'payment' ? '#4ecdc4' :
                                   activity.type === 'review' ? '#f093fb' :
                                   '#ff6b9d'
                  }]}>
                    <Ionicons 
                      name={
                        activity.type === 'booking' ? 'calendar' :
                        activity.type === 'payment' ? 'card' :
                        activity.type === 'review' ? 'star' :
                        'refresh'
                      } 
                      size={14} 
                      color="white" 
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationMessage}>{activity.message}</Text>
                    <Text style={styles.notificationTime}>
                      {new Date(activity.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ))}
              
              {dashboardData.recentActivity.length === 0 && (
                <View style={styles.emptyNotifications}>
                  <Ionicons name="notifications-off" size={32} color={COLORS.textSecondary} />
                  <Text style={styles.emptyNotificationsText}>No recent activity</Text>
                </View>
              )}
            </ScrollView>
          </BlurView>
        </View>
      )}

      {/* Enhanced Subscription Tier Indicator */}
      <SubscriptionTierIndicator />

      {/* Subscription Status Banner */}
      {showSubscriptionBanner && (
        <SubscriptionStatusBanner onClose={() => setShowSubscriptionBanner(false)} />
      )}

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary, COLORS.secondary]}
            progressBackgroundColor="white"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Subscription Tier Indicator */}
        <SubscriptionTierIndicator />

        {/* Modern Stats Cards */}
        <View style={styles.modernStatsSection}>
          {/* Enhanced Revenue Analytics Card */}
          <View style={styles.modernStatCard}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.modernStatGradient}
            >
              <View style={styles.modernStatContent}>
                {/* Header Section */}
                <View style={styles.modernStatHeader}>
                  <View style={styles.modernStatIcon}>
                    <Ionicons name="trending-up" size={20} color="white" />
                  </View>
                  <Text style={styles.modernStatLabel}>Revenue Analytics</Text>
                </View>

                {/* Main Revenue Value */}
                <Text style={styles.modernStatValue}>
                  {formatCurrency(dashboardData.todayRevenue)}
                </Text>
                
                {/* Enhanced revenue details */}
                <View style={styles.revenueDetails}>
                  <View style={styles.revenueRow}>
                    <Text style={styles.revenueDetailLabel}>Today</Text>
                    <Text style={styles.revenueDetailValue}>{formatCurrency(dashboardData.todayRevenue)}</Text>
                  </View>
                  <View style={styles.revenueRow}>
                    <Text style={styles.revenueDetailLabel}>This Week</Text>
                    <Text style={styles.revenueDetailValue}>{formatCurrency(dashboardData.weekRevenue || 8500)}</Text>
                  </View>
                  <View style={styles.revenueRow}>
                    <Text style={styles.revenueDetailLabel}>Monthly Goal</Text>
                    <Text style={styles.revenueDetailValue}>{formatCurrency(32000)}</Text>
                  </View>
                </View>

                {/* Enhanced Chart Section */}
                <View style={styles.aestheticChartSection}>
                  {dashboardData && width > 0 && height > 0 && (
                    <View>
                      <LineChart
                        data={{
                          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                          datasets: [
                            {
                              data: [120, 180, 150, 200, 170, 90, Number(dashboardData.todayRevenue) || 160],
                              strokeWidth: 3,
                              color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                            },
                          ],
                        }}
                        width={Math.max(width - 112, 250)}
                        height={100}
                        chartConfig={{
                          backgroundColor: 'white',
                          backgroundGradientFrom: 'white',
                          backgroundGradientTo: 'white',
                          decimalPlaces: 0,
                          color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.8})`,
                          style: {
                            borderRadius: 16,
                          },
                          propsForDots: {
                            r: '4',
                            strokeWidth: '2',
                            stroke: '#22c55e',
                            fill: '#ffffff',
                          },
                          propsForLabels: {
                            fontSize: 12,
                            fontWeight: '700',
                            fill: 'rgba(0, 0, 0, 0.8)',
                          },
                          formatYLabel: (value) => `$${Number(value).toFixed(0)}`,
                          formatXLabel: (value) => value.toString().substring(0, 3),
                        }}
                        style={{
                          marginVertical: 8,
                          borderRadius: 16,
                        }}
                        withDots={true}
                        withShadow={false}
                        withScrollableDot={false}
                        withHorizontalLabels={true}
                        withVerticalLabels={true}
                        withInnerLines={false}
                        withOuterLines={false}
                        bezier
                      />
                    </View>
                  )}
                  
                  {/* Chart title moved below the graph */}
                  <Text style={[styles.chartTitle, { color: 'white' }]}>7-Day Revenue Trend</Text>
                </View>

                {/* Growth indicator */}
                <View style={styles.growthIndicator}>
                  <Text style={styles.growthLabel}>Growth: +12.5%</Text>
                  <Text style={styles.growthPeriod}>vs last week</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Gap between revenue and other cards */}
          <View style={{ height: 12 }} />

          <View style={styles.modernStatsGrid}>
            {/* Enhanced Appointments Card */}
            <View style={styles.modernStatCard}>
              <LinearGradient
                colors={['#ff6b9d', '#c44569']}
                style={styles.modernStatGradient}
              >
                <View style={styles.modernStatContent}>
                  <View style={styles.modernStatHeader}>
                    <View style={styles.modernStatIcon}>
                      <Ionicons name="calendar" size={20} color="white" />
                    </View>
                    <Text style={styles.modernStatLabel}>Appointments</Text>
                  </View>
                  
                  {/* Main appointment count */}
                  <Text style={styles.modernStatValue}>{dashboardData.appointmentsToday || 0}</Text>
                  
                  {/* Enhanced appointment details */}
                  <View style={styles.appointmentDetails}>
                    <View style={styles.appointmentRow}>
                      <Text style={styles.appointmentDetailLabel}>Today</Text>
                      <Text style={styles.appointmentDetailValue}>{dashboardData.appointmentsToday || 0}</Text>
                    </View>
                    <View style={styles.appointmentRow}>
                      <Text style={styles.appointmentDetailLabel}>This Week</Text>
                      <Text style={styles.appointmentDetailValue}>{dashboardData.appointmentsThisWeek || 0}</Text>
                    </View>
                    <View style={styles.appointmentRow}>
                      <Text style={styles.appointmentDetailLabel}>Completion Rate</Text>
                      <Text style={styles.appointmentDetailValue}>94%</Text>
                    </View>
                  </View>
                  
                  {/* Next appointment preview */}
                  <View style={styles.nextAppointment}>
                    <Text style={styles.nextAppointmentLabel}>Next: Sarah M.</Text>
                    <Text style={styles.nextAppointmentTime}>2:30 PM</Text>
                  </View>
                  
                  {/* View Calendar Button */}
                  <TouchableOpacity 
                    style={styles.viewCalendarButton}
                    onPress={() => navigation.navigate('Appointments')}
                  >
                    <Ionicons name="calendar-outline" size={16} color="white" />
                    <Text style={styles.viewCalendarText}>View Calendar</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.modernStatsGrid}>
            {/* Clients Card */}
            <TouchableOpacity 
              style={styles.modernStatCard}
              onPress={() => navigation.navigate('Clients')}
            >
              <LinearGradient
                colors={['#4ecdc4', '#44a08d']}
                style={styles.modernStatGradient}
              >
                <View style={styles.modernStatContent}>
                  <View style={styles.modernStatHeader}>
                    <View style={styles.modernStatIcon}>
                      <Ionicons name="people" size={20} color="white" />
                    </View>
                    <Text style={styles.modernStatLabel}>Total Clients</Text>
                  </View>
                  <Text style={styles.modernStatValue}>{dashboardData.totalClients || 0}</Text>
                  <Text style={styles.modernStatSubtext}>Active</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Rating Card */}
            <TouchableOpacity 
              style={styles.modernStatCard}
              onPress={() => navigation.navigate('Reviews')}
            >
              <LinearGradient
                colors={['#f093fb', '#f5576c']}
                style={styles.modernStatGradient}
              >
                <View style={styles.modernStatContent}>
                  <View style={styles.modernStatHeader}>
                    <View style={styles.modernStatIcon}>
                      <Ionicons name="star" size={20} color="white" />
                    </View>
                    <Text style={styles.modernStatLabel}>Rating</Text>
                  </View>
                  <Text style={styles.modernStatValue}>
                    {(dashboardData.averageRating && dashboardData.averageRating > 0) ? dashboardData.averageRating.toFixed(1) : '4.8'}
                  </Text>
                  <Text style={styles.modernStatSubtext}>Average</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekly Overview Card */}
        <View style={styles.modernOverviewCard}>
          <LinearGradient
            colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.05)']}
            style={styles.overviewCardGradient}
          >
            <BlurView intensity={20} style={styles.overviewBlur}>
              <View style={styles.overviewContent}>
                <View style={styles.overviewHeader}>
                  <Text style={styles.overviewTitle}>Weekly Performance</Text>
                  <TouchableOpacity style={styles.overviewAction}>
                    <Text style={styles.overviewActionText}>View Details</Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.overviewStats}>
                  <View style={styles.overviewStat}>
                    <Text 
                      style={styles.overviewStatValue}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.6}
                      allowFontScaling={false}
                      ellipsizeMode="clip"
                    >
                      {formatCurrency(dashboardData.weekRevenue)}
                    </Text>
                    <Text 
                      style={styles.overviewStatLabel}
                      numberOfLines={1}
                    >
                      Revenue
                    </Text>
                  </View>
                  <View style={styles.overviewDivider} />
                  <View style={styles.overviewStat}>
                    <Text 
                      style={styles.overviewStatValue}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.6}
                      allowFontScaling={false}
                      ellipsizeMode="clip"
                    >
                      {dashboardData.appointmentsThisWeek || 0}
                    </Text>
                    <Text 
                      style={styles.overviewStatLabel}
                      numberOfLines={1}
                    >
                      Bookings
                    </Text>
                  </View>
                  <View style={styles.overviewDivider} />
                  <View style={styles.overviewStat}>
                    <Text 
                      style={styles.overviewStatValue}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.6}
                      allowFontScaling={false}
                      ellipsizeMode="clip"
                    >
                      {dashboardData.newClientsThisMonth || 0}
                    </Text>
                    <Text 
                      style={styles.overviewStatLabel}
                      numberOfLines={1}
                    >
                      New Clients
                    </Text>
                  </View>
                </View>
              </View>
            </BlurView>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.modernActionsSection}>
          <Text style={styles.modernSectionTitle}>Quick Actions</Text>
          <View style={styles.modernActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.modernActionCard}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[action.color + '20', action.color + '10']}
                  style={styles.modernActionGradient}
                >
                  <View style={[styles.modernActionIcon, { backgroundColor: action.color }]}>
                    <Ionicons name={action.icon as any} size={18} color="white" />
                  </View>
                  <Text style={styles.modernActionTitle}>{action.title}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Advanced Features */}
        <AdvancedFeaturesSection navigation={navigation} />

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Feature Onboarding Tour */}
      {shouldShow && !onboardingLoading && (
        <FeatureOnboardingTour onComplete={() => setShouldShow(false)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Modern Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 24,
  },
  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.surface,
    marginBottom: 8,
    letterSpacing: 2,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: COLORS.surface,
    opacity: 0.8,
    marginBottom: 32,
    textAlign: 'center',
  },
  loadingIndicatorContainer: {
    marginTop: 16,
  },

  // Modern Header Styles
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerBlur: {
    borderRadius: 0,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  header: {
    // Removed padding since it's now in headerGradient
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  notificationCount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },

  // Content Styles
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Premium Overview Card
  premiumOverviewCard: {
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
    ...COMMON_STYLES.shadow,
  },
  overviewCardContent: {
    padding: 24,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  overviewTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.surface,
    marginBottom: 4,
  },
  overviewSubtitle: {
    fontSize: 14,
    color: COLORS.surface,
    opacity: 0.8,
    fontWeight: '500',
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectedPeriod: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.surface,
    marginRight: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF88',
  },

  // Revenue Display
  mainRevenue: {
    alignItems: 'center',
    marginBottom: 32,
  },
  revenueLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    fontWeight: '600',
  },
  revenueValue: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -1,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 14,
    color: '#00FF88',
    marginLeft: 6,
    fontWeight: '700',
  },

  // Luxury Stats
  luxuryStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  luxuryStat: {
    alignItems: 'center',
    flex: 1,
  },
  luxuryStatIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  luxuryStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.surface,
    marginBottom: 4,
  },
  luxuryStatLabel: {
    fontSize: 12,
    color: COLORS.surface,
    opacity: 0.8,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Section Styles
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
    marginRight: 4,
  },

  // Modern Quick Actions
  modernActionsGrid: {
    gap: 12,
  },
  modernActionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...COMMON_STYLES.shadow,
  },
  modernActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.surface,
  },
  modernActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modernActionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Analytics Preview Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  analyticsPreview: {
    marginBottom: 8,
  },
  analyticsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  analyticsBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 20,
  },
  analyticsContent: {
    gap: 20,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  analyticsItem: {
    flex: 1,
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Modern Metrics Styles
  modernMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  modernMetric: {
    flex: 1,
    alignItems: 'center',
  },
  metricGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Performance Metrics
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    ...COMMON_STYLES.shadow,
  },
  metricGradient: {
    padding: 20,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.surface,
    marginTop: 12,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.surface,
    opacity: 0.9,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Modern Activity List
  modernActivityList: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    ...COMMON_STYLES.shadow,
  },
  modernActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modernActivityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modernActivityContent: {
    flex: 1,
  },
  modernActivityText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  modernActivityTime: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Legacy styles for compatibility
  overviewCard: {
    backgroundColor: COLORS.surface,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    ...COMMON_STYLES.shadow,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: Math.max((width - 52) / 2, 150),
    ...COMMON_STYLES.shadow,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  overviewStat: {
    alignItems: 'center',
  },
  overviewStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  overviewStatContent: {},
  overviewStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  activityList: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
    ...COMMON_STYLES.shadow,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  // Feature Grid Styles
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 64) / 2,
    ...COMMON_STYLES.shadow,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  modernFeatureCard: {
    width: (width - 64) / 2,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modernFeatureGradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    height: 140,
    justifyContent: 'space-between',
  },
  modernFeatureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modernFeatureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  modernFeatureDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  lockedFeatureCard: {
    opacity: 0.6,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  featureDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  
  // Modern Header Styles
  modernHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  greetingSection: {
    marginBottom: 8,
  },
  modernGreeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  modernTitle: {
    fontSize: 32,
    color: 'white',
    fontWeight: '800',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  modernDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  modernDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modernActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modernNotificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6b9d',
    position: 'absolute',
    top: 8,
    right: 8,
  },
  modernProfileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Modern Stats Section
  modernStatsSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modernStatsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  modernStatCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modernStatGradient: {
    flex: 1,
    padding: 20,
  },
  modernStatContent: {
    flex: 1,
  },
  modernStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  modernStatLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  modernStatValue: {
    fontSize: 28,
    color: 'white',
    fontWeight: '800',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  modernStatTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modernStatTrendText: {
    fontSize: 13,
    color: '#00ff88',
    fontWeight: '700',
    marginLeft: 4,
    textShadowColor: 'rgba(0,255,136,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modernStatSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  
  // Enhanced Appointment Card Styles
  appointmentDetails: {
    marginTop: 8,
    marginBottom: 8,
  },
  appointmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  appointmentDetailLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  appointmentDetailValue: {
    fontSize: 12,
    color: 'white',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  nextAppointment: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  nextAppointmentLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  nextAppointmentTime: {
    fontSize: 11,
    color: 'white',
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  viewCalendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  viewCalendarText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  
  // Enhanced Revenue Card Styles
  revenueDetails: {
    marginTop: 8,
    marginBottom: 8,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  revenueDetailLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  revenueDetailValue: {
    fontSize: 12,
    color: 'white',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  growthIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,136,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  growthLabel: {
    fontSize: 11,
    color: '#00ff88',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  growthPeriod: {
    fontSize: 10,
    color: 'rgba(0,255,136,0.8)',
    fontWeight: '600',
  },
  
  // Modern Overview Card
  modernOverviewCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 140, // Ensure minimum height for content
  },
  overviewCardGradient: {
    flex: 1,
  },
  overviewBlur: {
    flex: 1,
  },
  overviewContent: {
    padding: 20,
    paddingVertical: 18, // Slightly reduce vertical padding
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18, // Increase spacing
    flexWrap: 'wrap', // Allow wrapping on smaller screens
    minHeight: 24, // Ensure consistent height
  },
  overviewTitle: {
    fontSize: Math.min(18, width * 0.045), // Responsive title size
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  overviewAction: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0, // Prevent shrinking
  },
  overviewActionText: {
    fontSize: Math.min(14, width * 0.035), // Responsive action text
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: 4,
  },
  overviewStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overviewStat: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2, // Reduce padding for more text space
    minWidth: 0, // Allows text to shrink if needed
    maxWidth: (width - 80) / 3, // Ensure consistent width distribution
  },
  overviewStatValue: {
    fontSize: Math.min(18, width * 0.042), // Slightly smaller responsive font
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
    width: '100%', // Use full available width
    paddingHorizontal: 1, // Minimal padding
  },
  overviewStatLabel: {
    fontSize: Math.min(12, width * 0.028), // Responsive font size
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  overviewDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: Math.max(8, width * 0.02), // Responsive margin
  },
  
  // Modern Actions Section
  modernActionsSection: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  modernSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  modernActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  modernActionCard: {
    width: (width - 48) / 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modernActionGradient: {
    padding: 12,
    alignItems: 'center',
    minHeight: 70,
    justifyContent: 'center',
  },
  modernActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  modernActionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 14,
  },
  
  // Modern Activity Section
  modernActivitySection: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  modernSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modernViewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernViewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: 4,
  },
  modernActivityList: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modernActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modernActivityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modernActivityContent: {
    flex: 1,
  },
  modernActivityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  modernActivityTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  
  // Subscription Tier Indicator Styles
  subscriptionTierCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tierCardGradient: {
    flex: 1,
  },
  tierCardContent: {
    padding: 20,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tierIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  tierStatus: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 4,
  },
  tierFeatures: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
    fontWeight: '500',
  },
  upgradePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 16,
  },
  upgradePromptText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginRight: 6,
  },
});

// Enhanced Subscription Tier Indicator Styles
const subscriptionIndicatorStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 20,
    overflow: 'hidden',
    ...COMMON_STYLES.shadow,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  gradient: {
    flex: 1,
  },
  blurContainer: {
    flex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconSection: {
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 0.5,
  },
  infoSection: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  planDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 16,
  },
  limitsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  limitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  limitText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  rightContent: {
    alignItems: 'center',
    gap: 8,
  },
  upgradeButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  upgradeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.3,
  },
  featuresButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Swipeable Revenue Card Styles
  swipeHint: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  cashoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 8,
  },
  cashoutButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Aesthetic Chart Section
  aestheticChartSection: {
    marginTop: 12,
    marginBottom: 8,
    overflow: 'hidden',
    borderRadius: 20,
    shadowColor: 'rgba(34, 197, 94, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
  },
  aestheticChart: {
    borderRadius: 20,
    marginHorizontal: -12,
  },
  chartTitle: {
    fontSize: 16,
    color: 'white',
    fontWeight: '800',
    marginBottom: 14,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    textTransform: 'uppercase',
  },
  
  // Chart Insights
  chartInsights: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  insightColumn: {
    flex: 1,
    alignItems: 'center',
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightKeyLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  insightKeyValue: {
    fontSize: 15,
    color: 'white',
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
  },
  insightItem: {
    alignItems: 'center',
    flex: 1,
  },
  insightLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    textAlign: 'center',
  },
  insightValue: {
    fontSize: 18,
    color: 'white',
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  insightDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
  },

  // Notification Dropdown Styles
  notificationDropdown: {
    position: 'absolute',
    top: 90,
    right: 16,
    left: 16,
    zIndex: 1000,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  notificationBlur: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.05)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  notificationsList: {
    maxHeight: 320,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.2,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  emptyNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    margin: 12,
  },
  emptyNotificationsText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 12,
    letterSpacing: 0.1,
  },
});

// Dashboard subscription styles object
const dashboardSubscriptionStyles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    ...COMMON_STYLES.shadow,
  },
  blurContainer: {
    flex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  textContainer: {
    flex: 1,
  },
  tierText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  limitsText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.85,
    lineHeight: 16,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  upgradeButtonText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default ProviderDashboardScreen;
