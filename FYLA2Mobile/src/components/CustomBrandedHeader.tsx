import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/apiService';

const { width } = Dimensions.get('window');

interface BrandProfile {
  id: number;
  serviceProviderId: string;
  businessName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  tagline?: string;
  description?: string;
  socialMediaLinks: {
    website?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
}

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

interface CustomBrandedHeaderProps {
  serviceProviderId: string;
  defaultName: string;
  defaultImage?: string;
  onPromotionPress?: (promotion: Promotion) => void;
}

const CustomBrandedHeader: React.FC<CustomBrandedHeaderProps> = ({
  serviceProviderId,
  defaultName,
  defaultImage,
  onPromotionPress,
}) => {
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBrandingData();
  }, [serviceProviderId]);

  const loadBrandingData = async () => {
    try {
      const [brandData, promotionsData] = await Promise.all([
        getBrandProfile(serviceProviderId),
        getPublicPromotions(serviceProviderId),
      ]);

      setBrandProfile(brandData);
      setPromotions(promotionsData);
    } catch (error) {
      console.log('No custom branding found, using defaults');
    } finally {
      setLoading(false);
    }
  };

  const getBrandProfile = async (providerId: string) => {
    try {
      // This would call a public endpoint to get brand profile
      const response = await apiService.getPublicBrandProfile(providerId);
      return response;
    } catch (error) {
      return null;
    }
  };

  const getPublicPromotions = async (providerId: string) => {
    try {
      const response = await apiService.getPublicPromotions(providerId);
      return response || [];
    } catch (error) {
      return [];
    }
  };

  const handleSocialPress = (url: string) => {
    if (url) {
      // Open social media link
      Alert.alert('Opening Link', `Would you like to visit ${url}?`);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#4CAF50', '#45a049']}
          style={styles.defaultHeader}
        >
          <Text style={styles.loadingText}>Loading...</Text>
        </LinearGradient>
      </View>
    );
  }

  // Use custom branding if available, otherwise use defaults
  const colors: [string, string] = brandProfile
    ? [brandProfile.primaryColor, brandProfile.secondaryColor] as [string, string]
    : ['#4CAF50', '#45a049'];

  const businessName = brandProfile?.businessName || defaultName;
  const logoUrl = brandProfile?.logoUrl || defaultImage;

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors} style={styles.brandedHeader}>
        {/* Logo and Business Name */}
        <View style={styles.brandContainer}>
          {logoUrl && (
            <Image source={{ uri: logoUrl }} style={styles.logo} />
          )}
          <View style={styles.businessInfo}>
            <Text style={[styles.businessName, { fontFamily: brandProfile?.fontFamily || 'System' }]}>
              {businessName}
            </Text>
            {brandProfile?.tagline && (
              <Text style={styles.tagline}>{brandProfile.tagline}</Text>
            )}
          </View>
        </View>

        {/* Social Media Links */}
        {brandProfile?.socialMediaLinks && (
          <View style={styles.socialContainer}>
            {brandProfile.socialMediaLinks.website && (
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: brandProfile.accentColor }]}
                onPress={() => handleSocialPress(brandProfile.socialMediaLinks.website!)}
              >
                <Ionicons name="globe-outline" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
            {brandProfile.socialMediaLinks.instagram && (
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: brandProfile.accentColor }]}
                onPress={() => handleSocialPress(brandProfile.socialMediaLinks.instagram!)}
              >
                <Ionicons name="logo-instagram" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
            {brandProfile.socialMediaLinks.facebook && (
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: brandProfile.accentColor }]}
                onPress={() => handleSocialPress(brandProfile.socialMediaLinks.facebook!)}
              >
                <Ionicons name="logo-facebook" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Description */}
        {brandProfile?.description && (
          <Text style={styles.description}>{brandProfile.description}</Text>
        )}
      </LinearGradient>

      {/* Active Promotions */}
      {promotions.length > 0 && (
        <View style={styles.promotionsContainer}>
          <Text style={styles.promotionsTitle}>🎉 Special Offers</Text>
          {promotions.slice(0, 2).map((promotion) => (
            <TouchableOpacity
              key={promotion.id}
              style={[
                styles.promotionCard,
                { borderLeftColor: brandProfile?.accentColor || '#4CAF50' }
              ]}
              onPress={() => onPromotionPress?.(promotion)}
            >
              <View style={styles.promotionHeader}>
                <Text style={styles.promotionTitle}>{promotion.title}</Text>
                <View style={[
                  styles.promotionBadge,
                  { backgroundColor: brandProfile?.accentColor || '#4CAF50' }
                ]}>
                  <Text style={styles.promotionValue}>
                    {promotion.type === 'percentage' ? `${promotion.value}% OFF` : `$${promotion.value} OFF`}
                  </Text>
                </View>
              </View>
              <Text style={styles.promotionDescription}>{promotion.description}</Text>
              {promotion.promoCode && (
                <Text style={styles.promoCode}>Code: {promotion.promoCode}</Text>
              )}
              <Text style={styles.promotionExpiry}>
                Expires: {new Date(promotion.endDate).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  defaultHeader: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandedHeader: {
    minHeight: 220,
    padding: 20,
    paddingTop: 50,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 18,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
    backgroundColor: '#FFF',
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: '#E8F5E8',
    fontStyle: 'italic',
  },
  socialContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  description: {
    fontSize: 16,
    color: '#E8F5E8',
    lineHeight: 22,
  },
  promotionsContainer: {
    padding: 15,
    backgroundColor: '#f8f9fa',
  },
  promotionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  promotionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  promotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  promotionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  promotionBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  promotionValue: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  promotionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  promoCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  promotionExpiry: {
    fontSize: 12,
    color: '#999',
  },
});

export default CustomBrandedHeader;
