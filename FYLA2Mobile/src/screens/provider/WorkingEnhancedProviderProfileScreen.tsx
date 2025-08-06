import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList, ServiceProvider, Service } from '../../types';
import { COLORS, COMMON_STYLES } from '../../constants/colors';
import ApiService from '../../services/api';

type EnhancedProviderProfileNavigationProp = StackNavigationProp<RootStackParamList>;

interface ProviderProfileData {
  provider: ServiceProvider;
  socialStats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
    totalLikes: number;
    engagementRate: number;
  };
  services: Service[];
  averageRating: number;
  activePromos: {
    id: string;
    title: string;
    description: string;
    discountValue: number;
    validUntil: string;
  }[];
}

const WorkingEnhancedProviderProfileScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<EnhancedProviderProfileNavigationProp>();
  const route = useRoute();
  
  const [profileData, setProfileData] = useState<ProviderProfileData | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const providerId = (route.params as any)?.providerId || 'mock-provider-1';

  useEffect(() => {
    loadProviderProfile();
  }, [providerId]);

  const loadProviderProfile = async () => {
    try {
      setLoading(true);
      
      // Try to get real provider data from API
      try {
        const providerResponse = await ApiService.getServiceProvider(providerId);
        
        if (providerResponse) {
          // Get additional data (these have fallbacks if they fail)
          const socialStats = await ApiService.getUserSocialStats(providerId);
          const servicesResponse = await ApiService.getProviderServices(providerId);
          const promosResponse = await ApiService.getProviderPromosForClient(providerId);
          
          const realData: ProviderProfileData = {
            provider: providerResponse,
            socialStats: socialStats,
            services: servicesResponse || [],
            averageRating: providerResponse.averageRating || 0,
            activePromos: promosResponse || []
          };
          
          setProfileData(realData);
          setIsFollowing(providerResponse.isFollowedByCurrentUser || false);
          return;
        }
      } catch (apiError) {
        console.log('API error loading provider profile:', apiError);
      }
      
      // Fallback data when API is not available
      const fallbackData: ProviderProfileData = {
        provider: {
          id: providerId,
          userId: 'user-1',
          businessName: 'Elite Beauty Studio',
          businessDescription: 'Premium beauty services with over 10 years of experience. Specializing in hair styling, makeup, and skincare treatments.',
          businessAddress: 'Downtown Business District',
          profilePictureUrl: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=300&h=300&fit=crop',
          priceRange: '$50 - $200',
          averageRating: 4.8,
          totalReviews: 150,
          isVerified: true,
          specialties: ['Bridal Makeup', 'Color Correction', 'Anti-Aging Treatments'],
          yearsOfExperience: 12,
          portfolioImages: [],
        },
        socialStats: {
          postsCount: 45,
          followersCount: 1250,
          followingCount: 180,
          totalLikes: 3400,
          engagementRate: 0.085,
        },
        services: [
          {
            id: 'service-1',
            serviceProviderId: providerId,
            name: 'Hair Cut & Style',
            description: 'Professional haircut and styling service',
            price: 75,
            duration: 60,
            category: 'Hair',
            imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=300&fit=crop',
            isActive: true,
          },
          {
            id: 'service-2',
            serviceProviderId: providerId,
            name: 'Makeup Application',
            description: 'Professional makeup for special events',
            price: 120,
            duration: 90,
            category: 'Makeup',
            imageUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=300&h=300&fit=crop',
            isActive: true,
          },
        ],
        averageRating: 4.8,
        activePromos: [
          {
            id: 'promo-1',
            title: 'First Time Client Special',
            description: 'Get 20% off your first service',
            discountValue: 20,
            validUntil: '2025-08-31T23:59:59Z',
          },
          {
            id: 'promo-2',
            title: 'Weekend Special',
            description: 'Book weekend appointments and save',
            discountValue: 15,
            validUntil: '2025-08-15T23:59:59Z',
          },
        ],
      };
      
      setProfileData(fallbackData);
      setIsFollowing(false);
    } catch (error) {
      console.error('Error loading provider profile:', error);
      Alert.alert('Error', 'Failed to load provider profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        // Unfollow logic here
        const response = await ApiService.unfollowUser(providerId);
        setIsFollowing(response.isFollowing);
      } else {
        // Follow logic here  
        const response = await ApiService.followUser(providerId);
        setIsFollowing(response.isFollowing);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleBookService = (service: Service) => {
    navigation.navigate('BookingFlow', {
      service,
      provider: profileData!.provider
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProviderProfile();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading provider profile...</Text>
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.errorText}>Failed to load provider profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProviderProfile}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{profileData.provider.businessName}</Text>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <LinearGradient
              colors={COLORS.gradientPrimary}
              style={styles.profileGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.profileContent}>
                <Image
                  source={{
                    uri: profileData.provider.profilePictureUrl || 'https://via.placeholder.com/120',
                  }}
                  style={styles.profileImage}
                />
                <Text style={styles.businessName}>{profileData.provider.businessName}</Text>
                <Text style={styles.businessCategory}>{profileData.provider.priceRange}</Text>
                
                {/* Social Stats */}
                <View style={styles.socialStats}>
                  <View style={styles.socialStat}>
                    <Text style={styles.socialNumber}>{profileData.socialStats.postsCount}</Text>
                    <Text style={styles.socialLabel}>Posts</Text>
                  </View>
                  <View style={styles.socialStat}>
                    <Text style={styles.socialNumber}>{profileData.socialStats.followersCount}</Text>
                    <Text style={styles.socialLabel}>Followers</Text>
                  </View>
                  <View style={styles.socialStat}>
                    <Text style={styles.socialNumber}>{profileData.socialStats.totalLikes}</Text>
                    <Text style={styles.socialLabel}>Likes</Text>
                  </View>
                  <View style={styles.socialStat}>
                    <Text style={styles.socialNumber}>{(profileData.socialStats.engagementRate * 100).toFixed(1)}%</Text>
                    <Text style={styles.socialLabel}>Engagement</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  {user?.id === providerId ? (
                    // Provider's own profile - show management buttons
                    <>
                      <TouchableOpacity 
                        style={styles.manageServicesButton}
                        onPress={() => navigation.navigate('ServicesManagement')}
                      >
                        <Ionicons name="briefcase-outline" size={18} color={COLORS.surface} />
                        <Text style={styles.manageServicesButtonText}>Manage Services</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.editProfileButton}
                        onPress={() => {/* TODO: Add edit profile functionality */}}
                      >
                        <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
                        <Text style={styles.editProfileButtonText}>Edit Profile</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    // Viewing another provider's profile
                    <>
                      <TouchableOpacity 
                        style={[styles.followButton, isFollowing && styles.followingButton]}
                        onPress={handleFollow}
                      >
                        <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                          {isFollowing ? 'Following' : 'Follow'}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.messageButton}
                        onPress={() => navigation.navigate('Chat', { 
                          userId: profileData.provider.userId,
                          userName: profileData.provider.businessName
                        })}
                      >
                        <Ionicons name="chatbubble-outline" size={18} color={COLORS.surface} />
                        <Text style={styles.messageButtonText}>Message</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Business Info */}
          <View style={styles.businessInfo}>
            <Text style={styles.businessDescription}>
              {profileData.provider.businessDescription}
            </Text>
            
            {profileData.provider.specialties && (
              <View style={styles.specialties}>
                <Text style={styles.specialtiesTitle}>Specialties</Text>
                <View style={styles.specialtyTags}>
                  {profileData.provider.specialties.map((specialty, index) => (
                    <View key={index} style={styles.specialtyTag}>
                      <Text style={styles.specialtyText}>{specialty}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {profileData.provider.yearsOfExperience && (
              <View style={styles.experienceInfo}>
                <Ionicons name="star" size={20} color={COLORS.warning} />
                <Text style={styles.experienceText}>
                  {profileData.provider.yearsOfExperience} years of experience
                </Text>
              </View>
            )}
          </View>

          {/* Services Section */}
          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>Services</Text>
            {profileData.services.map((service) => (
              <TouchableOpacity 
                key={service.id}
                style={styles.serviceCard}
                onPress={() => handleBookService(service)}
              >
                <Image 
                  source={{ uri: service.imageUrl || 'https://via.placeholder.com/100' }}
                  style={styles.serviceImage}
                />
                <View style={styles.serviceContent}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceDescription} numberOfLines={2}>
                    {service.description}
                  </Text>
                  <View style={styles.serviceFooter}>
                    <View style={styles.servicePrice}>
                      <Text style={styles.priceText}>${service.price}</Text>
                      <Text style={styles.durationText}>{service.duration}min</Text>
                    </View>
                    <TouchableOpacity style={styles.bookButton}>
                      <Text style={styles.bookButtonText}>Book</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Active Promos Section */}
          <View style={styles.promosSection}>
            <Text style={styles.sectionTitle}>Active Promotions</Text>
            {profileData.activePromos.map((promo) => (
              <View key={promo.id} style={styles.promoCard}>
                <LinearGradient
                  colors={COLORS.gradientPrimary}
                  style={styles.promoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.promoContent}>
                    <View style={styles.promoLeft}>
                      <Text style={styles.promoTitle}>{promo.title}</Text>
                      <Text style={styles.promoDescription}>{promo.description}</Text>
                      <Text style={styles.promoExpiry}>
                        Valid until {new Date(promo.validUntil).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.promoRight}>
                      <Text style={styles.discountValue}>{promo.discountValue}%</Text>
                      <Text style={styles.discountLabel}>OFF</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </>
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
    backgroundColor: COLORS.surface,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Profile Header
  profileHeader: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileGradient: {
    padding: 24,
  },
  profileContent: {
    alignItems: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.surface,
    marginBottom: 16,
  },
  businessName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.surface,
    marginBottom: 4,
    textAlign: 'center',
  },
  businessCategory: {
    fontSize: 16,
    color: COLORS.surface,
    opacity: 0.9,
    marginBottom: 20,
  },
  socialStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  socialStat: {
    alignItems: 'center',
  },
  socialNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.surface,
  },
  socialLabel: {
    fontSize: 12,
    color: COLORS.surface,
    opacity: 0.8,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  followButton: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
  },
  followingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  followButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  followingButtonText: {
    color: COLORS.surface,
  },
  messageButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  manageServicesButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  manageServicesButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  editProfileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editProfileButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },

  // Business Info
  businessInfo: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    ...COMMON_STYLES.shadow,
  },
  businessDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
    marginBottom: 16,
  },
  specialties: {
    marginBottom: 16,
  },
  specialtiesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  specialtyTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyTag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specialtyText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  experienceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  experienceText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },

  // Services Section
  servicesSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  serviceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...COMMON_STYLES.shadow,
  },
  serviceImage: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.borderLight,
  },
  serviceContent: {
    padding: 16,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    flex: 1,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  durationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bookButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '600',
  },

  // Promos Section
  promosSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  promoCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  promoGradient: {
    padding: 20,
  },
  promoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoLeft: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.surface,
    marginBottom: 8,
  },
  promoDescription: {
    fontSize: 14,
    color: COLORS.surface,
    opacity: 0.9,
    marginBottom: 4,
  },
  promoExpiry: {
    fontSize: 12,
    color: COLORS.surface,
    opacity: 0.8,
  },
  promoRight: {
    alignItems: 'center',
    marginLeft: 16,
  },
  discountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.surface,
  },
  discountLabel: {
    fontSize: 12,
    color: COLORS.surface,
    fontWeight: '600',
  },
});

export default WorkingEnhancedProviderProfileScreen;
