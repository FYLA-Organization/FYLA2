import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SPACING, RADIUS } from '../../constants/colors';
import ApiService from '../../services/api';
import { RootStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

type PromotionsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface RouteParams {
  providerId: string;
  providerName: string;
  providerImage?: string;
}

interface Promotion {
  id: number;
  name: string;
  description: string;
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  startDate: string;
  endDate: string;
  maxUses: number;
  currentUses: number;
  minimumSpend: number;
  isActive: boolean;
  isPublic: boolean;
}

const ProviderPromotionsScreen: React.FC = () => {
  const navigation = useNavigation<PromotionsScreenNavigationProp>();
  const route = useRoute();
  const { providerId, providerName, providerImage } = route.params as RouteParams;
  const { user } = useAuth();
  
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loyaltyStatus, setLoyaltyStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [promotionsData, loyaltyData] = await Promise.all([
        ApiService.getPublicPromotions(providerId),
        user && !user.isServiceProvider 
          ? ApiService.getClientLoyaltyStatusWithProvider(providerId)
          : Promise.resolve(null)
      ]);
      
      setPromotions(promotionsData || []);
      setLoyaltyStatus(loyaltyData);
    } catch (error) {
      console.error('Error loading promotions:', error);
      Alert.alert('Error', 'Failed to load promotions data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCopyCode = (code: string) => {
    // In a real app, you'd copy to clipboard
    Alert.alert('Code Copied', `Promotion code "${code}" copied to clipboard!`);
  };

  const handleBookNow = (promotion: Promotion) => {
    // Navigate to booking with the promotion pre-applied
    Alert.alert(
      'Book with Promotion',
      `Ready to book with promotion code: ${promotion.code}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            // Navigate back to search and apply promotion
            navigation.goBack();
          }
        }
      ]
    );
  };

  const renderPromotionCard = (promotion: Promotion) => {
    const isExpired = new Date(promotion.endDate) < new Date();
    const daysLeft = Math.max(0, Math.ceil((new Date(promotion.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
    
    return (
      <View key={promotion.id} style={[styles.promotionCard, isExpired && styles.expiredCard]}>
        <View style={styles.promotionHeader}>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {promotion.discountType === 'percentage' 
                ? `${promotion.discountValue}% OFF` 
                : `$${promotion.discountValue} OFF`}
            </Text>
          </View>
          {isExpired ? (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredText}>EXPIRED</Text>
            </View>
          ) : (
            <View style={styles.activeBadge}>
              <Text style={styles.activeText}>ACTIVE</Text>
            </View>
          )}
        </View>

        <Text style={styles.promotionName}>{promotion.name}</Text>
        <Text style={styles.promotionDescription}>{promotion.description}</Text>

        <View style={styles.promotionDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="code-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>Code: {promotion.code}</Text>
            <TouchableOpacity 
              style={styles.copyButton}
              onPress={() => handleCopyCode(promotion.code)}
            >
              <Ionicons name="copy-outline" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {promotion.minimumSpend > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="card-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>Minimum spend: ${promotion.minimumSpend}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>
              Valid until: {new Date(promotion.endDate).toLocaleDateString()}
            </Text>
          </View>

          {!isExpired && daysLeft <= 7 && (
            <View style={styles.urgencyRow}>
              <Ionicons name="time-outline" size={16} color={COLORS.warning} />
              <Text style={styles.urgencyText}>
                {daysLeft === 0 ? 'Expires today!' : `${daysLeft} days left`}
              </Text>
            </View>
          )}

          <View style={styles.usageRow}>
            <Text style={styles.usageText}>
              {promotion.currentUses} / {promotion.maxUses} used
            </Text>
            <View style={styles.usageBar}>
              <View 
                style={[
                  styles.usageProgress, 
                  { width: `${(promotion.currentUses / promotion.maxUses) * 100}%` }
                ]} 
              />
            </View>
          </View>
        </View>

        {!isExpired && (
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => handleBookNow(promotion)}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.bookButtonGradient}
            >
              <Text style={styles.bookButtonText}>Book with this offer</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderLoyaltySection = () => {
    if (!loyaltyStatus) return null;

    return (
      <View style={styles.loyaltySection}>
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          style={styles.loyaltyCard}
        >
          <View style={styles.loyaltyHeader}>
            <Ionicons name="star" size={24} color={COLORS.surface} />
            <Text style={styles.loyaltyTitle}>Your Loyalty Status</Text>
          </View>
          
          <View style={styles.loyaltyStats}>
            <View style={styles.loyaltyStat}>
              <Text style={styles.loyaltyNumber}>{loyaltyStatus.pointsWithProvider}</Text>
              <Text style={styles.loyaltyLabel}>Points with {providerName}</Text>
            </View>
            <View style={styles.loyaltyStat}>
              <Text style={styles.loyaltyNumber}>{loyaltyStatus.totalPoints}</Text>
              <Text style={styles.loyaltyLabel}>Total Points</Text>
            </View>
            <View style={styles.loyaltyStat}>
              <Text style={styles.loyaltyNumber}>{loyaltyStatus.membershipTier}</Text>
              <Text style={styles.loyaltyLabel}>Tier</Text>
            </View>
          </View>

          {loyaltyStatus.pointsWithProvider >= 100 && (
            <View style={styles.redeemSection}>
              <Text style={styles.redeemText}>
                You can redeem your points for discounts!
              </Text>
              <TouchableOpacity style={styles.redeemButton}>
                <Text style={styles.redeemButtonText}>Redeem Points</Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading promotions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.surface} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            {providerImage && (
              <Image source={{ uri: providerImage }} style={styles.headerImage} />
            )}
            <View>
              <Text style={styles.headerTitle}>Promotions</Text>
              <Text style={styles.headerSubtitle}>{providerName}</Text>
            </View>
          </View>
          
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderLoyaltySection()}

        <View style={styles.promotionsSection}>
          <Text style={styles.sectionTitle}>Available Promotions</Text>
          
          {promotions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="pricetag-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyTitle}>No Promotions Available</Text>
              <Text style={styles.emptySubtitle}>
                Check back later for special offers from {providerName}
              </Text>
            </View>
          ) : (
            promotions.map(renderPromotionCard)
          )}
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
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  header: {
    paddingTop: 50,
    paddingBottom: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loyaltySection: {
    padding: SPACING.lg,
  },
  loyaltyCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  loyaltyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  loyaltyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  loyaltyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  loyaltyStat: {
    alignItems: 'center',
  },
  loyaltyNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  loyaltyLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  redeemSection: {
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  redeemText: {
    fontSize: 14,
    color: COLORS.surface,
    marginBottom: SPACING.sm,
  },
  redeemButton: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  redeemButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  promotionsSection: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  promotionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  expiredCard: {
    opacity: 0.6,
    backgroundColor: COLORS.borderLight,
  },
  promotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  discountBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  discountText: {
    color: COLORS.surface,
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeBadge: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  activeText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  expiredBadge: {
    backgroundColor: COLORS.textSecondary,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  expiredText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  promotionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  promotionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  promotionDetails: {
    marginBottom: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  copyButton: {
    padding: SPACING.xs,
  },
  urgencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.sm,
  },
  urgencyText: {
    fontSize: 14,
    color: COLORS.warning,
    fontWeight: '600',
  },
  usageRow: {
    marginTop: SPACING.sm,
  },
  usageText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  usageBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  usageProgress: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  bookButton: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  bookButtonGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  bookButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default ProviderPromotionsScreen;
