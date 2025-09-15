import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Clipboard,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../services/apiService';

const { width } = Dimensions.get('window');

interface Promotion {
  id: number;
  title: string;
  description: string;
  type: string;
  value: number;
  promoCode?: string;
  endDate: string;
  minimumSpend: number;
}

interface PromotionDisplayProps {
  serviceProviderId: string;
  onPromotionSelect?: (promotion: Promotion) => void;
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const PromotionDisplay: React.FC<PromotionDisplayProps> = ({
  serviceProviderId,
  onPromotionSelect,
  brandColors,
}) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPromo, setExpandedPromo] = useState<number | null>(null);

  const defaultColors = {
    primary: '#4CAF50',
    secondary: '#45a049',
    accent: '#FF5722',
  };

  const colors = brandColors || defaultColors;

  useEffect(() => {
    loadPromotions();
  }, [serviceProviderId]);

  const loadPromotions = async () => {
    try {
      const response = await apiService.getPublicPromotions(serviceProviderId);
      setPromotions(response || []);
    } catch (error) {
      console.error('Error loading promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyPromoCode = async (code: string) => {
    try {
      await Clipboard.setString(code);
      Alert.alert('Copied!', `Promo code "${code}" copied to clipboard`);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy promo code');
    }
  };

  const formatDiscountValue = (promotion: Promotion) => {
    switch (promotion.type) {
      case 'percentage':
        return `${promotion.value}% OFF`;
      case 'fixed_amount':
        return `$${promotion.value} OFF`;
      case 'buy_one_get_one':
        return 'BUY 1 GET 1';
      case 'bundle':
        return 'BUNDLE DEAL';
      default:
        return `${promotion.value}% OFF`;
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handlePromotionPress = (promotion: Promotion) => {
    setExpandedPromo(expandedPromo === promotion.id ? null : promotion.id);
    onPromotionSelect?.(promotion);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading promotions...</Text>
      </View>
    );
  }

  if (promotions.length === 0) {
    return null; // No promotions available
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="pricetag" size={20} color={colors.accent} />
        <Text style={styles.headerTitle}>Special Offers</Text>
        <Text style={styles.headerSubtitle}>Limited time deals just for you!</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promotionsScroll}>
        {promotions.map((promotion) => {
          const daysRemaining = getDaysRemaining(promotion.endDate);
          const isExpanded = expandedPromo === promotion.id;
          
          return (
            <TouchableOpacity
              key={promotion.id}
              style={[
                styles.promotionCard,
                { borderColor: colors.accent },
                isExpanded && styles.expandedCard
              ]}
              onPress={() => handlePromotionPress(promotion)}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.cardGradient}
              >
                {/* Discount Badge */}
                <View style={[styles.discountBadge, { backgroundColor: colors.accent }]}>
                  <Text style={styles.discountText}>
                    {formatDiscountValue(promotion)}
                  </Text>
                </View>

                {/* Promotion Title */}
                <Text style={styles.promotionTitle} numberOfLines={isExpanded ? 0 : 2}>
                  {promotion.title}
                </Text>

                {/* Promotion Description */}
                <Text style={styles.promotionDescription} numberOfLines={isExpanded ? 0 : 3}>
                  {promotion.description}
                </Text>

                {/* Promo Code */}
                {promotion.promoCode && (
                  <TouchableOpacity
                    style={styles.promoCodeContainer}
                    onPress={() => copyPromoCode(promotion.promoCode!)}
                  >
                    <Text style={styles.promoCodeLabel}>Promo Code</Text>
                    <View style={styles.promoCodeBox}>
                      <Text style={styles.promoCodeText}>{promotion.promoCode}</Text>
                      <Ionicons name="copy-outline" size={16} color={colors.accent} />
                    </View>
                  </TouchableOpacity>
                )}

                {/* Minimum Spend */}
                {promotion.minimumSpend > 0 && (
                  <Text style={styles.minimumSpend}>
                    Minimum spend: ${promotion.minimumSpend.toFixed(2)}
                  </Text>
                )}

                {/* Expiry Info */}
                <View style={styles.expiryContainer}>
                  <Ionicons name="time-outline" size={14} color="#E8F5E8" />
                  <Text style={styles.expiryText}>
                    {daysRemaining > 0 
                      ? `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left` 
                      : 'Expires today!'}
                  </Text>
                </View>

                {/* Expanded Details */}
                {isExpanded && (
                  <View style={styles.expandedDetails}>
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Offer Type:</Text>
                      <Text style={styles.detailsValue}>
                        {promotion.type.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Valid Until:</Text>
                      <Text style={styles.detailsValue}>
                        {new Date(promotion.endDate).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.usePromotionButton}
                      onPress={() => onPromotionSelect?.(promotion)}
                    >
                      <Text style={styles.usePromotionText}>Use This Offer</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Expand/Collapse Indicator */}
                <View style={styles.expandIndicator}>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#E8F5E8" 
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  promotionsScroll: {
    paddingLeft: 20,
  },
  promotionCard: {
    width: width * 0.8,
    marginRight: 15,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  expandedCard: {
    width: width * 0.9,
  },
  cardGradient: {
    padding: 20,
    minHeight: 200,
  },
  discountBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  discountText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
    marginRight: 80, // Account for discount badge
  },
  promotionDescription: {
    fontSize: 14,
    color: '#E8F5E8',
    lineHeight: 20,
    marginBottom: 15,
  },
  promoCodeContainer: {
    marginBottom: 15,
  },
  promoCodeLabel: {
    fontSize: 12,
    color: '#E8F5E8',
    marginBottom: 5,
  },
  promoCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
  },
  promoCodeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    letterSpacing: 1,
  },
  minimumSpend: {
    fontSize: 12,
    color: '#E8F5E8',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  expiryText: {
    fontSize: 12,
    color: '#E8F5E8',
    marginLeft: 5,
  },
  expandedDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 15,
    marginTop: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailsLabel: {
    fontSize: 12,
    color: '#E8F5E8',
  },
  detailsValue: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: 'bold',
  },
  usePromotionButton: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  usePromotionText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: 10,
  },
});

export default PromotionDisplay;
