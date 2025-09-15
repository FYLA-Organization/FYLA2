import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
  StatusBar,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ServiceProvider, Service, RootStackParamList, Review } from '../../types';
import ApiService from '../../services/api';

const { width } = Dimensions.get('window');

type ProviderProfileScreenRouteProp = {
  key: string;
  name: 'ProviderProfile';
  params: { providerId: string };
};

type ProviderProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const COLORS = {
  primary: '#3797F0',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#262626',
  textSecondary: '#8E8E8E',
  button: '#3797F0',
  border: '#DBDBDB',
  borderLight: '#EFEFEF',
  heart: '#ED4956',
  success: '#00D563',
};

const ProviderProfileScreen: React.FC = () => {
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'posts' | 'services' | 'reviews'>('posts');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  
  const route = useRoute<ProviderProfileScreenRouteProp>();
  const navigation = useNavigation<ProviderProfileScreenNavigationProp>();
  const { providerId } = route.params;

  useEffect(() => {
    loadProviderData();
  }, [providerId]);

  const handleStartChat = () => {
    if (provider) {
      navigation.navigate('Chat', { 
        userId: provider.userId, 
        userName: `${provider.businessName}`,
        userImage: provider.profilePictureUrl
      });
    }
  };

  const loadProviderData = async () => {
    try {
      setIsLoading(true);
      
      // Load provider details, services, and reviews
      const [providerData, servicesData, reviewsData] = await Promise.all([
        ApiService.getServiceProvider(providerId),
        ApiService.getServicesByProvider(providerId), // Fixed: use correct method for provider-specific services
        ApiService.getReviews(providerId)
      ]);
      
      setProvider(providerData);
      setServices(servicesData);
      setReviews(reviewsData);

      // Load follow status
      try {
        const followStatus = await ApiService.getFollowStatus(providerId);
        setIsFollowing(followStatus.isFollowing);
        setFollowersCount(followStatus.followersCount);
      } catch (error) {
        console.error('Error loading follow status:', error);
        // Set default values from provider data if available
        setFollowersCount(providerData.followersCount || 0);
        setIsFollowing(providerData.isFollowing || false);
      }
    } catch (error) {
      console.error('Error loading provider data:', error);
      Alert.alert('Error', 'Failed to load provider information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!provider || isFollowLoading) return;

    try {
      setIsFollowLoading(true);
      
      let response;
      if (isFollowing) {
        response = await ApiService.unfollowProvider(providerId);
      } else {
        response = await ApiService.followProvider(providerId);
      }

      setIsFollowing(response.isFollowing);
      setFollowersCount(response.followersCount);
      
    } catch (error) {
      console.error('Error toggling follow status:', error);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleBookService = (service: Service) => {
    if (!provider) return;
    
    // Navigate to enhanced booking flow with service and provider details
    navigation.navigate('BookingFlow', {
      service: service,
      provider: provider
    });
  };

  const renderServiceCard = (service: Service) => (
    <View key={service.id} style={styles.enhancedServiceCard}>
      {service.imageUrl && (
        <Image source={{ uri: service.imageUrl }} style={styles.serviceImage} />
      )}
      <View style={styles.serviceInfo}>
        <View style={styles.serviceHeader}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.servicePrice}>${service.price}</Text>
          </View>
        </View>
        <Text style={styles.serviceDescription}>{service.description}</Text>
        <View style={styles.serviceDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.detailText}>{service.duration} min</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="pricetag-outline" size={16} color="#FFD700" />
            <Text style={styles.detailText}>{service.category}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => handleBookService(service)}
        >
          <Ionicons name="calendar-outline" size={16} color="#fff" />
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReviewCard = (review: Review) => (
    <View key={review.id} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: review.reviewer?.profilePictureUrl || 'https://via.placeholder.com/40' }}
          style={styles.reviewerImage}
        />
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>
            {review.reviewer?.firstName} {review.reviewer?.lastName}
          </Text>
          <View style={styles.reviewRatingContainer}>
            <View style={styles.reviewRating}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= review.rating ? "star" : "star-outline"}
                  size={16}
                  color="#FFD700"
                />
              ))}
            </View>
            <Text style={styles.reviewRatingText}>{review.rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.reviewDate}>
          {new Date(review.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      {review.comment && (
        <View style={styles.reviewCommentContainer}>
          <Text style={styles.reviewComment}>{review.comment}</Text>
        </View>
      )}
      
      {/* Show aggregated questionnaire insights to clients (but not detailed data) */}
      {review.questionnaire && (
        <View style={styles.publicInsights}>
          <View style={styles.insightRow}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.insightText}>
              Detailed service assessment completed
            </Text>
          </View>
          {review.questionnaire.wouldRecommend && (
            <View style={styles.insightRow}>
              <Ionicons name="thumbs-up" size={16} color="#4CAF50" />
              <Text style={styles.insightText}>
                Would recommend this service
              </Text>
            </View>
          )}
          {review.questionnaire.wouldUseAgain && (
            <View style={styles.insightRow}>
              <Ionicons name="repeat" size={16} color="#4CAF50" />
              <Text style={styles.insightText}>
                Would use this service again
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderGalleryImage = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      style={styles.galleryImageContainer}
      onPress={() => {
        setSelectedImageIndex(index);
        setShowImageModal(true);
      }}
    >
      <Image source={{ uri: item }} style={styles.galleryImage} />
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'posts':
        return renderPosts();
      case 'services':
        return (
          <View style={styles.tabContent}>
            {services.length > 0 ? (
              services.map(renderServiceCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No services available</Text>
              </View>
            )}
          </View>
        );
      case 'reviews':
        return (
          <View style={styles.tabContent}>
            {reviews.length > 0 ? (
              <View>
                {reviews.slice(0, 3).map(renderReviewCard)}
                <TouchableOpacity
                  style={styles.viewAllReviewsButton}
                  onPress={() => {
                    // TODO: Add navigation to ReviewsList when screen is added to navigation
                    console.log('Navigate to reviews list for provider:', providerId);
                    Alert.alert('Reviews', `Opening all reviews for ${provider?.businessName}`);
                  }}
                >
                  <Text style={styles.viewAllReviewsText}>
                    View All {reviews.length} Reviews
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No reviews yet</Text>
                <TouchableOpacity
                  style={styles.writeReviewButton}
                  onPress={() => {
                    // TODO: Add navigation to CreateReview when screen is added to navigation
                    console.log('Navigate to create review for provider:', providerId);
                    Alert.alert('Create Review', 'Opening review creation form');
                  }}
                >
                  <Text style={styles.writeReviewText}>Be the first to review</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      default:
        return renderPosts();
    }
  };

  if (isLoading) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3797F0" />
            <Text style={styles.loadingText}>Loading provider details...</Text>
          </View>
        </View>
      </>
    );
  }

  if (!provider) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#8E8E8E" />
            <Text style={styles.errorText}>Provider not found</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadProviderData}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  // Render Functions
  const renderPosts = () => {
    const mockPosts = Array.from({ length: 9 }).map((_, index) => ({
      id: `post-${index}`,
      imageUrl: `https://picsum.photos/400/400?random=${index}`,
      likesCount: Math.floor(Math.random() * 500) + 10,
      commentsCount: Math.floor(Math.random() * 50) + 1,
    }));

    return (
      <FlatList
        data={mockPosts}
        numColumns={3}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.postItem}
            onPress={() => {
              // TODO: Add navigation to PostDetail when screen is added to navigation
              console.log('Navigate to post detail:', item.id);
              Alert.alert('Post Detail', `Opening post ${item.id}`);
            }}
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.postImage}
            />
            <View style={styles.postOverlay}>
              <View style={styles.postStats}>
                <View style={styles.postStat}>
                  <Ionicons name="heart" size={16} color="white" />
                  <Text style={styles.postStatText}>{item.likesCount}</Text>
                </View>
                <View style={styles.postStat}>
                  <Ionicons name="chatbubble" size={16} color="white" />
                  <Text style={styles.postStatText}>{item.commentsCount}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.postsGrid}
      />
    );
  };

  const renderServices = () => (
    <View style={styles.servicesList}>
      {services.map((service) => (
        <View key={service.id} style={styles.serviceCard}>
          <View style={styles.serviceHeader}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.servicePrice}>${service.price}</Text>
          </View>
          <Text style={styles.serviceDescription}>{service.description}</Text>
          <View style={styles.serviceFooter}>
            <Text style={styles.serviceDuration}>{service.duration} min</Text>
            <TouchableOpacity 
              style={styles.bookServiceButton}
              onPress={() => handleBookService(service)}
            >
              <Text style={styles.bookServiceButtonText}>Book</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderReviews = () => (
    <View style={styles.reviewsList}>
      {reviews.map((review) => (
        <View key={review.id} style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Image
              source={{ uri: review.reviewer?.profilePictureUrl || 'https://via.placeholder.com/40' }}
              style={styles.reviewerImage}
            />
            <View style={styles.reviewerInfo}>
              <Text style={styles.reviewerName}>
                {review.reviewer?.firstName} {review.reviewer?.lastName}
              </Text>
              <Text style={styles.reviewDate}>
                {new Date(review.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.reviewRating}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < review.rating ? 'star' : 'star-outline'}
                  size={16}
                  color="#FFD700"
                />
              ))}
            </View>
          </View>
          <Text style={styles.reviewText}>{review.comment}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{provider.businessName}</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileTop}>
            <Image
              source={{
                uri: provider.profilePictureUrl || 'https://via.placeholder.com/90',
              }}
              style={styles.profileImage}
            />
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{services.length}</Text>
                <Text style={styles.statLabel}>Services</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{followersCount.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{provider.followingCount || 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>

          {/* Business Info */}
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{provider.businessName}</Text>
            <Text style={styles.businessDescription}>{provider.businessDescription}</Text>
            
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{provider.averageRating || 'New'} ({provider.totalReviews || 0} reviews)</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.bookButton]}
              onPress={() => {
                if (services.length > 0) {
                  navigation.navigate('BookingFlow', { 
                    service: services[0], 
                    provider: provider 
                  });
                }
              }}
            >
              <Text style={styles.bookButtonText}>Book Appointment</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                styles.followButton,
                isFollowing && styles.followingButton
              ]}
              onPress={handleFollow}
              disabled={isFollowLoading}
            >
              {isFollowLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[
                  styles.followButtonText,
                  isFollowing && styles.followingButtonText
                ]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.messageButton}
              onPress={() => navigation.navigate('Chat', { 
                userId: provider.userId, 
                userName: provider.businessName,
                userImage: provider.profilePictureUrl
              })}
            >
              <Ionicons name="chatbubble-outline" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'posts' && styles.activeTab]}
            onPress={() => setSelectedTab('posts')}
          >
            <Ionicons 
              name="grid-outline" 
              size={24} 
              color={selectedTab === 'posts' ? COLORS.text : COLORS.textSecondary} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'services' && styles.activeTab]}
            onPress={() => setSelectedTab('services')}
          >
            <Ionicons 
              name="pricetags-outline" 
              size={24} 
              color={selectedTab === 'services' ? COLORS.text : COLORS.textSecondary} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'reviews' && styles.activeTab]}
            onPress={() => setSelectedTab('reviews')}
          >
            <Ionicons 
              name="star-outline" 
              size={24} 
              color={selectedTab === 'reviews' ? COLORS.text : COLORS.textSecondary} 
            />
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {selectedTab === 'posts' && renderPosts()}
          {selectedTab === 'services' && renderServices()}
          {selectedTab === 'reviews' && renderReviews()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Base Layout
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Profile Section
  profileSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginRight: 20,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Business Info
  businessInfo: {
    marginBottom: 16,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  businessDescription: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  bookButton: {
    backgroundColor: COLORS.button,
  },
  bookButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  followButton: {
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  followingButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  followButtonText: {
    color: COLORS.background,
    fontWeight: '600',
    fontSize: 14,
  },
  followingButtonText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 14,
  },
  messageButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.text,
  },

  // Tab Content
  tabContent: {
    flex: 1,
    paddingTop: 16,
  },

  // Posts Grid
  postsGrid: {
    paddingHorizontal: 1,
  },
  postItem: {
    width: (width - 4) / 3,
    height: (width - 4) / 3,
    margin: 1,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Services List
  servicesList: {
    paddingHorizontal: 16,
  },
  serviceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.button,
  },
  serviceDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceDuration: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  serviceBookButton: {
    backgroundColor: COLORS.button,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  serviceBookText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },

  // Reviews List
  reviewsList: {
    paddingHorizontal: 16,
  },
  reviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },

  reviewDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  bookServiceButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  bookServiceButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },

  // Enhanced Service Styles
  enhancedServiceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  serviceImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },

  // Enhanced Review Styles
  reviewRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 4,
  },
  reviewCommentContainer: {
    marginTop: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },

  // Public Insights
  publicInsights: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: COLORS.text,
  },

  // Gallery
  galleryImageContainer: {
    margin: 1,
    flex: 1,
    aspectRatio: 1,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  galleryRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  // Empty States
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: COLORS.button,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },

  // Review Navigation Buttons
  viewAllReviewsButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  viewAllReviewsText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  writeReviewButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  writeReviewText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ProviderProfileScreen;
