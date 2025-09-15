import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import featureGatingService, { UserSubscription } from '../../services/featureGatingService';
import { useNavigation } from '@react-navigation/native';

interface Props {
  showUpgradeButton?: boolean;
  compact?: boolean;
}

const SubscriptionStatusComponent: React.FC<Props> = ({ 
  showUpgradeButton = true, 
  compact = false 
}) => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      const sub = await featureGatingService.getSubscriptionInfo();
      setSubscription(sub);
    } catch (error) {
      console.error('Error loading subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePress = () => {
    navigation.navigate('SubscriptionPlans' as never);
  };

  const getTierInfo = () => {
    if (!subscription) return { name: 'Loading...', color: '#6B7280', icon: 'help-circle' };
    
    switch (subscription.tier) {
      case 0:
        return { name: 'Starter', color: '#6B7280', icon: 'leaf' };
      case 1:
        return { name: 'Professional', color: '#8B5CF6', icon: 'star' };
      case 2:
        return { name: 'Business', color: '#059669', icon: 'diamond' };
      default:
        return { name: 'Unknown', color: '#6B7280', icon: 'help-circle' };
    }
  };

  if (loading) {
    return null;
  }

  const tierInfo = getTierInfo();

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.compactBadge, { backgroundColor: tierInfo.color }]}>
          <Ionicons name={tierInfo.icon as any} size={12} color="white" />
          <Text style={styles.compactText}>{tierInfo.name}</Text>
        </View>
        {showUpgradeButton && subscription?.tier === 0 && (
          <TouchableOpacity onPress={handleUpgradePress} style={styles.compactUpgradeButton}>
            <Text style={styles.compactUpgradeText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={styles.planInfo}>
          <View style={[styles.planIcon, { backgroundColor: tierInfo.color }]}>
            <Ionicons name={tierInfo.icon as any} size={16} color="white" />
          </View>
          <View style={styles.planDetails}>
            <Text style={styles.planName}>{tierInfo.name} Plan</Text>
            <Text style={styles.planStatus}>
              {subscription?.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        
        {showUpgradeButton && subscription?.tier !== 2 && (
          <TouchableOpacity onPress={handleUpgradePress} style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>
              {subscription?.tier === 0 ? 'Upgrade' : 'Upgrade'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </TouchableOpacity>
        )}
      </View>
      
      {subscription?.tier === 0 && (
        <View style={styles.limitsContainer}>
          <Text style={styles.limitsTitle}>Current Limits:</Text>
          <Text style={styles.limitText}>
            • {subscription.limits.maxServices} services
          </Text>
          <Text style={styles.limitText}>
            • {subscription.limits.maxPhotosPerService} photos per service
          </Text>
          <Text style={styles.limitText}>
            • Basic features only
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  compactText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  compactUpgradeButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  compactUpgradeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  planIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  planDetails: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  planStatus: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  upgradeButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  limitsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  limitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  limitText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
});

export default SubscriptionStatusComponent;
