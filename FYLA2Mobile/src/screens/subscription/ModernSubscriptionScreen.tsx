import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { modernTheme } from '../../theme/modernTheme';
import { ModernCard } from '../../components/ui/ModernCard';
import { ModernButton } from '../../components/ui/ModernButton';
import * as Haptics from 'expo-haptics';

interface SubscriptionTier {
  tier: string;
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
  isPopular?: boolean;
  badge?: string;
}

interface UserSubscription {
  tier: string;
  status: string;
  isActive: boolean;
  monthlyPrice: number;
  features: string[];
  limits: any;
}

export const ModernSubscriptionScreen: React.FC = () => {
  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Load subscription tiers and user's current subscription
      const [tiersResponse, userSubResponse] = await Promise.all([
        fetch('/api/payment/subscription-tiers'),
        fetch('/api/payment/subscription', {
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`,
          },
        }),
      ]);

      const tiers = await tiersResponse.json();
      const userSub = await userSubResponse.json();

      setSubscriptionTiers(tiers);
      setUserSubscription(userSub);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
      Alert.alert('Error', 'Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = async () => {
    // Implement your auth token retrieval logic
    return 'your-jwt-token';
  };

  const handleUpgrade = async (tier: SubscriptionTier) => {
    try {
      setUpgrading(tier.tier);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const response = await fetch('/api/payment/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({
          tier: tier.tier,
          billingInterval: billingInterval,
          successUrl: 'fyla://subscription/success',
          cancelUrl: 'fyla://subscription/cancel',
        }),
      });

      const data = await response.json();
      
      if (data.sessionUrl) {
        // Open Stripe checkout (you'll need to implement this based on your setup)
        // For React Native, you might use @stripe/stripe-react-native
        console.log('Redirect to:', data.sessionUrl);
      }
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
      Alert.alert('Error', 'Failed to start upgrade process');
    } finally {
      setUpgrading(null);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'free':
        return modernTheme.colors.subscription.free;
      case 'basic':
        return modernTheme.colors.subscription.basic;
      case 'premium':
        return modernTheme.colors.subscription.premium;
      case 'enterprise':
        return modernTheme.colors.subscription.enterprise;
      default:
        return modernTheme.colors.neutral;
    }
  };

  const formatPrice = (price: number, interval: 'month' | 'year') => {
    if (price === 0) return 'Free';
    return `$${price.toFixed(2)}/${interval === 'month' ? 'mo' : 'yr'}`;
  };

  const getDiscountPercentage = (monthly: number, annual?: number) => {
    if (!annual || monthly === 0) return null;
    const monthlyAnnual = monthly * 12;
    const discount = Math.round(((monthlyAnnual - annual) / monthlyAnnual) * 100);
    return discount > 0 ? discount : null;
  };

  const renderFeatureItem = (feature: string, included: boolean = true) => (
    <View key={feature} style={styles.featureItem}>
      <Ionicons
        name={included ? 'checkmark-circle' : 'close-circle'}
        size={20}
        color={included ? modernTheme.colors.success.main : modernTheme.colors.neutral[400]}
      />
      <Text
        style={[
          styles.featureText,
          !included && styles.featureTextDisabled,
        ]}
      >
        {feature}
      </Text>
    </View>
  );

  const renderSubscriptionCard = (tier: SubscriptionTier) => {
    const tierColors = getTierColor(tier.tier);
    const currentPrice = billingInterval === 'month' ? tier.monthlyPrice : tier.annualPrice || tier.monthlyPrice;
    const isCurrentTier = userSubscription?.tier === tier.tier;
    const discount = getDiscountPercentage(tier.monthlyPrice, tier.annualPrice);

    return (
      <ModernCard
        key={tier.tier}
        variant={tier.isPopular ? 'gradient' : 'elevated'}
        style={[
          styles.subscriptionCard,
          tier.isPopular && styles.popularCard,
        ]}
      >
        {tier.isPopular && (
          <View style={[styles.popularBadge, { backgroundColor: tierColors.color }]}>
            <Text style={styles.popularBadgeText}>Most Popular</Text>
          </View>
        )}

        <View style={styles.cardHeader}>
          <Text style={[styles.tierName, { color: tierColors.color }]}>
            {tier.name}
          </Text>
          <Text style={styles.tierDescription}>{tier.description}</Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            {formatPrice(currentPrice, billingInterval)}
          </Text>
          {billingInterval === 'year' && discount && (
            <View style={[styles.discountBadge, { backgroundColor: modernTheme.colors.success.main }]}>
              <Text style={styles.discountText}>Save {discount}%</Text>
            </View>
          )}
        </View>

        <View style={styles.featuresContainer}>
          {tier.features.map((feature) => renderFeatureItem(feature))}
        </View>

        <View style={styles.cardFooter}>
          {isCurrentTier ? (
            <ModernButton
              title="Current Plan"
              variant="outline"
              disabled
              onPress={() => {}}
              style={styles.actionButton}
            />
          ) : (
            <ModernButton
              title={tier.tier === 'Free' ? 'Downgrade' : 'Upgrade'}
              variant={tier.isPopular ? 'gradient' : 'primary'}
              onPress={() => handleUpgrade(tier)}
              loading={upgrading === tier.tier}
              style={styles.actionButton}
            />
          )}
        </View>
      </ModernCard>
    );
  };

  const renderBillingToggle = () => (
    <View style={styles.billingToggle}>
      <Text style={styles.billingLabel}>Billing Interval</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleOption,
            billingInterval === 'month' && styles.toggleOptionActive,
          ]}
          onPress={() => setBillingInterval('month')}
        >
          <Text
            style={[
              styles.toggleText,
              billingInterval === 'month' && styles.toggleTextActive,
            ]}
          >
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleOption,
            billingInterval === 'year' && styles.toggleOptionActive,
          ]}
          onPress={() => setBillingInterval('year')}
        >
          <Text
            style={[
              styles.toggleText,
              billingInterval === 'year' && styles.toggleTextActive,
            ]}
          >
            Annual
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={modernTheme.colors.primary.main} />
        <Text style={styles.loadingText}>Loading subscription plans...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#f8fafc', '#e2e8f0']}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Unlock powerful features to grow your business
          </Text>
        </View>

        {renderBillingToggle()}

        <View style={styles.cardsContainer}>
          {subscriptionTiers.map(renderSubscriptionCard)}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            All plans include a 14-day free trial. Cancel anytime.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: modernTheme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: modernTheme.colors.background.primary,
  },
  loadingText: {
    marginTop: modernTheme.spacing.md,
    fontSize: modernTheme.typography.fontSize.base,
    color: modernTheme.colors.text.secondary,
    fontFamily: modernTheme.typography.fontFamily.medium,
  },
  header: {
    alignItems: 'center',
    marginBottom: modernTheme.spacing['2xl'],
  },
  title: {
    fontSize: modernTheme.typography.fontSize['3xl'],
    fontFamily: modernTheme.typography.fontFamily.bold,
    color: modernTheme.colors.text.primary,
    marginBottom: modernTheme.spacing.sm,
  },
  subtitle: {
    fontSize: modernTheme.typography.fontSize.lg,
    fontFamily: modernTheme.typography.fontFamily.regular,
    color: modernTheme.colors.text.secondary,
    textAlign: 'center',
  },
  billingToggle: {
    alignItems: 'center',
    marginBottom: modernTheme.spacing.xl,
  },
  billingLabel: {
    fontSize: modernTheme.typography.fontSize.base,
    fontFamily: modernTheme.typography.fontFamily.medium,
    color: modernTheme.colors.text.primary,
    marginBottom: modernTheme.spacing.md,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: modernTheme.colors.surface.secondary,
    borderRadius: modernTheme.borderRadius.lg,
    padding: modernTheme.spacing.xs,
  },
  toggleOption: {
    paddingHorizontal: modernTheme.spacing.xl,
    paddingVertical: modernTheme.spacing.sm,
    borderRadius: modernTheme.borderRadius.md,
  },
  toggleOptionActive: {
    backgroundColor: modernTheme.colors.surface.primary,
    ...modernTheme.shadows.sm,
  },
  toggleText: {
    fontSize: modernTheme.typography.fontSize.base,
    fontFamily: modernTheme.typography.fontFamily.medium,
    color: modernTheme.colors.text.secondary,
  },
  toggleTextActive: {
    color: modernTheme.colors.primary.main,
  },
  cardsContainer: {
    gap: modernTheme.spacing.lg,
  },
  subscriptionCard: {
    position: 'relative',
  },
  popularCard: {
    borderWidth: 2,
    borderColor: modernTheme.colors.primary.main,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    paddingHorizontal: modernTheme.spacing.md,
    paddingVertical: modernTheme.spacing.xs,
    borderRadius: modernTheme.borderRadius.full,
    zIndex: 1,
  },
  popularBadgeText: {
    fontSize: modernTheme.typography.fontSize.sm,
    fontFamily: modernTheme.typography.fontFamily.semiBold,
    color: modernTheme.colors.text.inverse,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: modernTheme.spacing.lg,
  },
  tierName: {
    fontSize: modernTheme.typography.fontSize['2xl'],
    fontFamily: modernTheme.typography.fontFamily.bold,
    marginBottom: modernTheme.spacing.xs,
  },
  tierDescription: {
    fontSize: modernTheme.typography.fontSize.base,
    fontFamily: modernTheme.typography.fontFamily.regular,
    color: modernTheme.colors.text.secondary,
    textAlign: 'center',
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: modernTheme.spacing.xl,
  },
  price: {
    fontSize: modernTheme.typography.fontSize['4xl'],
    fontFamily: modernTheme.typography.fontFamily.bold,
    color: modernTheme.colors.text.primary,
  },
  discountBadge: {
    marginTop: modernTheme.spacing.xs,
    paddingHorizontal: modernTheme.spacing.sm,
    paddingVertical: modernTheme.spacing.xs,
    borderRadius: modernTheme.borderRadius.md,
  },
  discountText: {
    fontSize: modernTheme.typography.fontSize.sm,
    fontFamily: modernTheme.typography.fontFamily.semiBold,
    color: modernTheme.colors.text.inverse,
  },
  featuresContainer: {
    marginBottom: modernTheme.spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: modernTheme.spacing.sm,
  },
  featureText: {
    flex: 1,
    marginLeft: modernTheme.spacing.sm,
    fontSize: modernTheme.typography.fontSize.base,
    fontFamily: modernTheme.typography.fontFamily.regular,
    color: modernTheme.colors.text.primary,
  },
  featureTextDisabled: {
    color: modernTheme.colors.text.tertiary,
  },
  cardFooter: {
    marginTop: 'auto',
  },
  actionButton: {
    width: '100%',
  },
  footer: {
    alignItems: 'center',
    marginTop: modernTheme.spacing.xl,
    paddingTop: modernTheme.spacing.lg,
  },
  footerText: {
    fontSize: modernTheme.typography.fontSize.sm,
    fontFamily: modernTheme.typography.fontFamily.regular,
    color: modernTheme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default ModernSubscriptionScreen;
