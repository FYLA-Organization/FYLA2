import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList, ServiceProvider, Service, PortfolioItem } from '../../types';
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
  
  // Portfolio slideshow state
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [selectedPortfolioIndex, setSelectedPortfolioIndex] = useState(0);

  const providerId = (route.params as any)?.providerId || 'mock-provider-1';

  useEffect(() => {
    loadProviderProfile();
  }, [providerId]);

  const loadProviderProfile = async () => {
    try {
      setLoading(true);
      
      // Try to get real provider data from API
      console.log('🔄 Loading provider profile for ID:', providerId);
      
      try {
        const providerResponse = await ApiService.getServiceProvider(providerId);
        console.log('📡 Provider response:', providerResponse);
        
        if (providerResponse) {
          // Build the profile data from real API response
          const realData: ProviderProfileData = {
            provider: {
              ...providerResponse,
              businessName: providerResponse.businessName,
              businessDescription: providerResponse.businessDescription || 'Professional service provider',
              businessAddress: providerResponse.businessAddress || 'Service Location',
              averageRating: providerResponse.averageRating || 0,
              totalReviews: providerResponse.totalReviews || 0,
              isVerified: providerResponse.isVerified || false,
              profilePictureUrl: providerResponse.profilePictureUrl,
              specialties: providerResponse.specialties || [],
              priceRange: providerResponse.priceRange || 'Contact for pricing',
              services: providerResponse.services || []
            },
            socialStats: {
              postsCount: 0,
              followersCount: providerResponse.followersCount || 0,
              followingCount: providerResponse.followingCount || 0,
              totalLikes: 0,
              engagementRate: 0
            },
            services: providerResponse.services || [],
            averageRating: providerResponse.averageRating || 0,
            activePromos: [] // TODO: Implement promos endpoint
          };
          
          console.log('✅ Using real provider data:', realData);
          setProfileData(realData);
          setIsFollowing(providerResponse.isFollowedByCurrentUser || false);
          return;
        }
      } catch (apiError: any) {
        console.log('❌ API error loading provider profile:', apiError.response?.status, apiError.message);
      }
      
      // Fallback data when API is not available (should not be used in production)
      console.log('⚠️ Using fallback data for provider:', providerId);
      const fallbackData: ProviderProfileData = {
        provider: {
          id: providerId,
          userId: providerId,
          businessName: `Provider ${providerId.slice(-4)}`,
          businessDescription: 'Professional service provider. Please check back later for updated information.',
          businessAddress: 'Service Location',
          profilePictureUrl: undefined,
          priceRange: 'Contact for pricing',
          averageRating: 0,
          totalReviews: 0,
          isVerified: false,
          specialties: [],
          yearsOfExperience: 0,
          portfolioImages: [],
        },
        socialStats: {
          postsCount: 0,
          followersCount: 0,
          followingCount: 0,
          totalLikes: 0,
          engagementRate: 0,
        },
        services: [], // No fallback services
        averageRating: 0,
        activePromos: [] // No fallback promos
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
    if (!profileData?.provider) {
      Alert.alert('Error', 'Provider information not available');
      return;
    }

    console.log('Navigating to modern booking flow for service:', service.name);
    navigation.navigate('ModernBookingFlow', {
      service: service,
      provider: profileData.provider,
    });
  };

  const handlePortfolioItemPress = (item: PortfolioItem) => {
    if (profileData?.provider.portfolio) {
      const index = profileData.provider.portfolio.findIndex(p => p.id === item.id);
      setSelectedPortfolioIndex(index >= 0 ? index : 0);
      setShowPortfolioModal(true);
    }
  };

  const handlePreviousPortfolioItem = () => {
    if (profileData?.provider.portfolio) {
      setSelectedPortfolioIndex((prevIndex) => 
        prevIndex > 0 ? prevIndex - 1 : profileData.provider.portfolio!.length - 1
      );
    }
  };

  const handleNextPortfolioItem = () => {
    if (profileData?.provider.portfolio) {
      setSelectedPortfolioIndex((prevIndex) => 
        prevIndex < profileData.provider.portfolio!.length - 1 ? prevIndex + 1 : 0
      );
    }
  };

  const closePortfolioModal = () => {
    setShowPortfolioModal(false);
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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Image Header */}
          <View style={styles.heroContainer}>
            <ImageBackground
              source={{
                uri: profileData.provider.profilePictureUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=400&fit=crop'
              }}
              style={styles.heroBackground}
              imageStyle={styles.heroImage}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                style={styles.heroOverlay}
              >
                {/* Header Controls */}
                <View style={styles.headerControls}>
                  <TouchableOpacity 
                    style={styles.headerButton}
                    onPress={() => navigation.goBack()}
                  >
                    <Ionicons name="arrow-back" size={24} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.headerButton}>
                    <Ionicons name="share-outline" size={24} color="white" />
                  </TouchableOpacity>
                </View>

                {/* Provider Info Overlay */}
                <View style={styles.heroContent}>
                  <View style={styles.providerInfo}>
                    <View style={styles.profileImageContainer}>
                      <Image
                        source={{
                          uri: profileData.provider.profilePictureUrl || 'https://via.placeholder.com/80',
                        }}
                        style={styles.profileImage}
                      />
                      {profileData.provider.isVerified && (
                        <View style={styles.verifiedBadge}>
                          <Ionicons name="checkmark" size={12} color="white" />
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.providerDetails}>
                      <Text style={styles.businessName}>{profileData.provider.businessName}</Text>
                      <Text style={styles.businessDescriptionHero}>
                        {profileData.provider.businessDescription || 'Professional service provider'}
                      </Text>
                      
                      {/* Rating and Reviews */}
                      <View style={styles.ratingRow}>
                        <View style={styles.ratingContainer}>
                          <Ionicons name="star" size={16} color="#FFD700" />
                          <Text style={styles.rating}>
                            {profileData.averageRating > 0 ? profileData.averageRating.toFixed(1) : 'New'}
                          </Text>
                          <Text style={styles.reviewCount}>
                            ({profileData.provider.totalReviews || 0} reviews)
                          </Text>
                        </View>
                        <Text style={styles.separator}>•</Text>
                        <Text style={styles.priceRange}>{profileData.provider.priceRange}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>

          {/* Status Bar */}
          <View style={styles.statusBar}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.statusText}>Available for booking</Text>
            </View>
            <TouchableOpacity style={styles.scheduleButton}>
              <Ionicons name="calendar-outline" size={16} color="#5A4FCF" />
              <Text style={styles.scheduleButtonText}>View Schedule</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={handleFollow}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.messageButton}>
              <Ionicons name="chatbubble-outline" size={18} color="white" />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>

          {/* Specialties Badges */}
          {profileData.provider.specialties && profileData.provider.specialties.length > 0 && (
            <View style={styles.specialtiesContainer}>
              <Text style={styles.sectionTitle}>Specialties</Text>
              <View style={styles.badgesContainer}>
                {profileData.provider.specialties.map((specialty, index) => (
                  <View key={index} style={styles.specialtyBadge}>
                    <Text style={styles.specialtyBadgeText}>{specialty}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Services Section */}
          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>Services</Text>
            {profileData.services.length > 0 ? (
              profileData.services.map((service) => (
                <View key={service.id} style={styles.serviceCard}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceDescription}>{service.description}</Text>
                    <View style={styles.serviceDetails}>
                      <Text style={styles.servicePrice}>${service.price}</Text>
                      <Text style={styles.serviceDuration}>{service.duration}min</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.bookButton}
                    onPress={() => handleBookService(service)}
                  >
                    <Text style={styles.bookButtonText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.noServicesContainer}>
                <Ionicons name="list-outline" size={48} color="#E0E0E0" />
                <Text style={styles.noServicesText}>No services available</Text>
              </View>
            )}
          </View>

          {/* Portfolio Section */}
          <View style={styles.portfolioSection}>
            <Text style={styles.sectionTitle}>Portfolio</Text>
            {profileData.provider.portfolio && profileData.provider.portfolio.length > 0 ? (
              <View style={styles.portfolioGrid}>
                {profileData.provider.portfolio.map((item) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.portfolioItem}
                    onPress={() => handlePortfolioItemPress(item)}
                  >
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.portfolioImage}
                      resizeMode="cover"
                    />
                    {item.caption && (
                      <View style={styles.portfolioCaption}>
                        <Text style={styles.portfolioCaptionText} numberOfLines={2}>
                          {item.caption}
                        </Text>
                      </View>
                    )}
                    {item.category && (
                      <View style={styles.portfolioCategory}>
                        <Text style={styles.portfolioCategoryText}>{item.category}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noPortfolioContainer}>
                <Ionicons name="images-outline" size={48} color="#E0E0E0" />
                <Text style={styles.noPortfolioText}>No portfolio items yet</Text>
                <Text style={styles.noPortfolioSubtext}>
                  Check back later to see examples of their work
                </Text>
              </View>
            )}
          </View>

        </ScrollView>
      </View>

      {/* Portfolio Slideshow Modal */}
      <Modal
        visible={showPortfolioModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closePortfolioModal}
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" />
          
          {/* Close button */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={closePortfolioModal}
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>

          {/* Image counter */}
          {profileData?.provider.portfolio && profileData.provider.portfolio.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {selectedPortfolioIndex + 1} / {profileData.provider.portfolio.length}
              </Text>
            </View>
          )}

          {/* Main image */}
          {profileData?.provider.portfolio && profileData.provider.portfolio[selectedPortfolioIndex] && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: profileData.provider.portfolio[selectedPortfolioIndex].imageUrl }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
              
              {/* Image details */}
              <View style={styles.imageDetails}>
                {profileData.provider.portfolio[selectedPortfolioIndex].caption && (
                  <Text style={styles.imageCaption}>
                    {profileData.provider.portfolio[selectedPortfolioIndex].caption}
                  </Text>
                )}
                {profileData.provider.portfolio[selectedPortfolioIndex].category && (
                  <View style={styles.imageCategoryContainer}>
                    <Text style={styles.imageCategoryText}>
                      {profileData.provider.portfolio[selectedPortfolioIndex].category}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Navigation arrows */}
          {profileData?.provider.portfolio && profileData.provider.portfolio.length > 1 && (
            <>
              <TouchableOpacity 
                style={styles.leftArrow}
                onPress={handlePreviousPortfolioItem}
              >
                <Ionicons name="chevron-back" size={32} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.rightArrow}
                onPress={handleNextPortfolioItem}
              >
                <Ionicons name="chevron-forward" size={32} color="white" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
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

  // Modern Hero Design
  heroContainer: {
    height: 300,
    position: 'relative',
  },
  heroBackground: {
    flex: 1,
    height: '100%',
  },
  heroImage: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  providerDetails: {
    flex: 1,
  },
  businessDescriptionHero: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
    marginRight: 6,
  },
  reviewCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  separator: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginHorizontal: 8,
  },
  priceRange: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },

  // Status Bar
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(90, 79, 207, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scheduleButtonText: {
    fontSize: 12,
    color: '#5A4FCF',
    fontWeight: '600',
    marginLeft: 4,
  },

  // Specialties
  specialtiesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  specialtyBadge: {
    backgroundColor: 'rgba(90, 79, 207, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specialtyBadgeText: {
    fontSize: 12,
    color: '#5A4FCF',
    fontWeight: '500',
  },

  // Service card updates
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  serviceDuration: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  noServicesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noServicesText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  followButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: COLORS.primary,
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  followingButtonText: {
    color: 'white',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },

  // Profile Image
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'white',
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },

  // Services Section
  servicesSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },

  // Portfolio Section
  portfolioSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  portfolioItem: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  portfolioImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#F5F5F5',
  },
  portfolioCaption: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
  },
  portfolioCaptionText: {
    fontSize: 12,
    color: 'white',
    lineHeight: 16,
  },
  portfolioCategory: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  portfolioCategoryText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  noPortfolioContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noPortfolioText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  noPortfolioSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.7,
  },

  // Portfolio Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  imageCounter: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  imageCounterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  fullscreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.7,
    maxHeight: '70%',
  },
  imageDetails: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    padding: 16,
  },
  imageCaption: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  imageCategoryContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(90, 79, 207, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCategoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  leftArrow: {
    position: 'absolute',
    left: 20,
    top: '50%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 12,
    zIndex: 1000,
  },
  rightArrow: {
    position: 'absolute',
    right: 20,
    top: '50%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 12,
    zIndex: 1000,
  },
});

export default WorkingEnhancedProviderProfileScreen;
