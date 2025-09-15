import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../../services/apiService';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MODERN_COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../../constants/modernDesign';

type RootStackParamList = {
  SubscriptionPlans: undefined;
  ProviderDashboard: undefined;
};

type SubscriptionPlansNavigationProp = StackNavigationProp<RootStackParamList, 'SubscriptionPlans'>;
type SubscriptionPlansRouteProp = RouteProp<RootStackParamList, 'SubscriptionPlans'>;

interface Props {
  navigation: SubscriptionPlansNavigationProp;
  route: SubscriptionPlansRouteProp;
}

interface SubscriptionTier {
  tier: number;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice?: number;
  features: string[];
  limits: {
    maxServices: string;
    maxPhotosPerService: string;
    canUseAdvancedAnalytics: boolean;
    canUseCustomBranding: boolean;
    canUseAutomatedMarketing: boolean;
    canAcceptOnlinePayments: boolean;
    hasPrioritySupport: boolean;
  };
}

interface UserSubscription {
  tier: number;
  status: string;
  isActive: boolean;
  monthlyPrice: number;
}

const SubscriptionPlansScreen: React.FC<Props> = ({ navigation }) => {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<number | null>(null);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Load available subscription tiers
      const tiersResponse = await apiService.getSubscriptionTiers();
      setTiers(tiersResponse);

      // Load current user subscription
      try {
        const currentResponse = await apiService.getCurrentSubscription();
        setCurrentSubscription(currentResponse);
      } catch (error) {
        // User might not have a subscription yet
        console.log('No current subscription found');
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
      Alert.alert('Error', 'Failed to load subscription plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier.tier === 0) {
      // Free tier - no action needed
      return;
    }

    setSubscribing(tier.tier);
    
    try {
      const subscriptionData = {
        tier: tier.tier,
        billingInterval: billingInterval,
        successUrl: 'https://yourdomain.com/success', // Replace with your success URL
        cancelUrl: 'https://yourdomain.com/cancel' // Replace with your cancel URL
      };

      const response = await apiService.createSubscription(subscriptionData);
      
      if (response.sessionUrl) {
        // In a real app, you would open this URL in a browser or webview
        Alert.alert(
          'Subscription Setup',
          'Subscription checkout created successfully! In a production app, this would open Stripe Checkout.',
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('Stripe Session URL:', response.sessionUrl);
                // For demo purposes, simulate successful subscription
                simulateSuccessfulSubscription(tier);
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to create subscription. Please try again.'
      );
    } finally {
      setSubscribing(null);
    }
  };

  const simulateSuccessfulSubscription = (tier: SubscriptionTier) => {
    // This simulates what would happen after successful Stripe payment
    setCurrentSubscription({
      tier: tier.tier,
      status: 'active',
      isActive: true,
      monthlyPrice: tier.monthlyPrice
    });
    
    Alert.alert(
      'Success!',
      `You've successfully upgraded to ${tier.name}! All features are now available.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const getPriceText = (tier: SubscriptionTier) => {
    if (tier.monthlyPrice === 0) {
      return 'Free';
    }
    
    if (billingInterval === 'year' && tier.annualPrice) {
      const monthlySavings = tier.monthlyPrice * 12 - tier.annualPrice;
      return (
        <View>
          <Text style={styles.priceText}>${tier.annualPrice}/year</Text>
          <Text style={styles.savingsText}>Save ${monthlySavings.toFixed(0)}/year</Text>
        </View>
      );
    }
    
    return `$${tier.monthlyPrice}/month`;
  };

  const isCurrentTier = (tier: SubscriptionTier) => {
    return currentSubscription?.tier === tier.tier;
  };

  const getButtonText = (tier: SubscriptionTier) => {
    if (tier.tier === 0) {
      return isCurrentTier(tier) ? 'Current Plan' : 'Downgrade';
    }
    if (isCurrentTier(tier)) {
      return 'Current Plan';
    }
    if (currentSubscription && currentSubscription.tier > tier.tier) {
      return 'Downgrade';
    }
    return 'Upgrade';
  };

  const getButtonStyle = (tier: SubscriptionTier) => {
    if (isCurrentTier(tier)) {
      return [styles.subscribeButton, styles.currentButton];
    }
    if (tier.tier === 0) { // Starter plan
      return [styles.subscribeButton, styles.starterButton];
    }
    if (tier.tier === 1) { // Professional plan
      return [styles.subscribeButton, styles.professionalButton];
    }
    if (tier.tier === 2) { // Business plan
      return [styles.subscribeButton, styles.businessButton];
    }
    return styles.subscribeButton;
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier.tier) {
      case 0: return 'leaf-outline';
      case 1: return 'star-outline';
      case 2: return 'diamond-outline';
      default: return 'star-outline';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading subscription plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Plans</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Choose the plan that's right for your business</Text>
        
        {/* Billing Toggle */}
        <View style={styles.billingToggle}>
          <TouchableOpacity
            style={[styles.billingOption, billingInterval === 'month' && styles.billingOptionActive]}
            onPress={() => setBillingInterval('month')}
          >
            <Text style={[styles.billingText, billingInterval === 'month' && styles.billingTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.billingOption, billingInterval === 'year' && styles.billingOptionActive]}
            onPress={() => setBillingInterval('year')}
          >
            <Text style={[styles.billingText, billingInterval === 'year' && styles.billingTextActive]}>
              Annual
            </Text>
            <Text style={styles.saveBadge}>Save 17%</Text>
          </TouchableOpacity>
        </View>

        {/* Subscription Tiers */}
        <View style={styles.tiersContainer}>
          {tiers.map((tier) => (
            <View key={tier.tier} style={styles.tierCard}>
              <View style={styles.tierHeader}>
                <View style={styles.tierIconContainer}>
                  <Ionicons name={getTierIcon(tier)} size={24} color="#8B5CF6" />
                </View>
                <View style={styles.tierInfo}>
                  <Text style={styles.tierName}>{tier.name}</Text>
                  <Text style={styles.tierDescription}>{tier.description}</Text>
                </View>
                {tier.tier === 1 && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                )}
              </View>

              <View style={styles.priceContainer}>
                {typeof getPriceText(tier) === 'string' ? (
                  <Text style={styles.priceText}>{getPriceText(tier)}</Text>
                ) : (
                  getPriceText(tier)
                )}
              </View>

              <View style={styles.featuresContainer}>
                {tier.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={getButtonStyle(tier)}
                onPress={() => handleUpgrade(tier)}
                disabled={subscribing !== null || isCurrentTier(tier)}
              >
                {subscribing === tier.tier ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.subscribeButtonText}>{getButtonText(tier)}</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            All plans include secure payment processing and customer support.
          </Text>
          <Text style={styles.footerText}>
            You can cancel or change your plan at any time.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: MODERN_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '700',
    color: MODERN_COLORS.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
    textAlign: 'center',
    marginVertical: SPACING.lg,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * TYPOGRAPHY.base,
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: MODERN_COLORS.gray100,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    marginBottom: SPACING.xl,
  },
  billingOption: {
    flex: 1,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  billingOptionActive: {
    backgroundColor: MODERN_COLORS.white,
    ...SHADOWS.md,
  },
  billingText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: '600',
    color: MODERN_COLORS.textSecondary,
  },
  billingTextActive: {
    color: MODERN_COLORS.textPrimary,
  },
  saveBadge: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.success,
    fontWeight: '700',
    marginTop: 2,
  },
  tiersContainer: {
    gap: SPACING.lg,
  },
  tierCard: {
    backgroundColor: MODERN_COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 2,
    borderColor: MODERN_COLORS.border,
    ...SHADOWS.md,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  tierIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm + 4,
  },
  starterIcon: {
    backgroundColor: MODERN_COLORS.gray100,
  },
  professionalIcon: {
    backgroundColor: `${MODERN_COLORS.primary}15`,
  },
  businessIcon: {
    backgroundColor: `${MODERN_COLORS.success}15`,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '700',
    color: MODERN_COLORS.textPrimary,
    marginBottom: 4,
  },
  tierDescription: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.sm,
  },
  popularBadge: {
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
  },
  popularText: {
    color: MODERN_COLORS.white,
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
  },
  priceContainer: {
    marginBottom: SPACING.lg,
  },
  priceText: {
    fontSize: 32,
    fontWeight: '800',
    color: MODERN_COLORS.textPrimary,
  },
  savingsText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.success,
    fontWeight: '700',
    marginTop: 4,
  },
  featuresContainer: {
    marginBottom: SPACING.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm + 4,
  },
  featureText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
    marginLeft: SPACING.sm + 4,
    flex: 1,
  },
  subscribeButton: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  starterButton: {
    backgroundColor: MODERN_COLORS.gray500,
  },
  professionalButton: {
    backgroundColor: MODERN_COLORS.primary,
  },
  businessButton: {
    backgroundColor: MODERN_COLORS.success,
  },
  currentButton: {
    backgroundColor: MODERN_COLORS.gray500,
  },
  subscribeButtonText: {
    color: MODERN_COLORS.white,
    fontSize: TYPOGRAPHY.base,
    fontWeight: '700',
  },
  footer: {
    marginTop: SPACING.xxl,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
  },
});

export default SubscriptionPlansScreen;
