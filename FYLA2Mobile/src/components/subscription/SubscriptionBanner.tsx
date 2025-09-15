import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import FeatureGatingService from '../../services/featureGatingService';
import { MODERN_COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../constants/modernDesign';

interface SubscriptionBannerProps {
  feature?: string;
  style?: any;
}

const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ feature, style }) => {
  const navigation = useNavigation();
  const [tierName, setTierName] = useState('');
  const [upgradeMessage, setUpgradeMessage] = useState('');

  useEffect(() => {
    loadSubscriptionInfo();
  }, [feature]);

  const loadSubscriptionInfo = async () => {
    try {
      const tier = await FeatureGatingService.getTierName();
      setTierName(tier);
      
      if (feature) {
        const message = await FeatureGatingService.showUpgradePrompt(feature);
        setUpgradeMessage(message.message);
      }
    } catch (error) {
      console.error('Error loading subscription info:', error);
    }
  };

  const handleUpgrade = () => {
    navigation.navigate('SubscriptionPlans' as never);
  };

  if (tierName === 'Business') {
    return null; // Don't show banner for highest tier
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="diamond-outline" size={20} color={MODERN_COLORS.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {feature ? `Unlock ${feature}` : `${tierName} Plan`}
          </Text>
          <Text style={styles.description}>
            {upgradeMessage || 'Upgrade to access premium features'}
          </Text>
        </View>
        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
          <Text style={styles.upgradeButtonText}>Upgrade</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: MODERN_COLORS.primary + '15',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: MODERN_COLORS.primary + '30',
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MODERN_COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  textContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: '600',
    color: MODERN_COLORS.textPrimary,
    marginBottom: 2,
  },
  description: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.sm,
  },
  upgradeButton: {
    backgroundColor: MODERN_COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  upgradeButtonText: {
    color: MODERN_COLORS.white,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
  },
});

export default SubscriptionBanner;
