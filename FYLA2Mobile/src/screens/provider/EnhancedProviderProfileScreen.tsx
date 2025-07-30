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
import ApiService from '../../services/apiService';

const { width } = Dimensions.get('window');

type ProviderProfileScreenRouteProp = {
  key: string;
  name: 'EnhancedProviderProfile';
  params: { providerId: string };
};

type ProviderProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const COLORS = {
  primary: '#3797F0',
  secondary: '#4ECDC4',
  accent: '#FFD93D',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#262626',
  textSecondary: '#8E8E8E',
  border: '#EFEFEF',
  instagram: '#E1306C',
  heart: '#FF3040',
  star: '#FFD700',
};

interface Post {
  id: string;
  imageUrl: string;
  likesCount: number;
  commentsCount: number;
  caption: string;
}

const EnhancedProviderProfileScreen: React.FC = () => {
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'posts' | 'services' | 'reviews'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  
  const route = useRoute<ProviderProfileScreenRouteProp>();
  const navigation = useNavigation<ProviderProfileScreenNavigationProp>();
  const { providerId } = route.params;

  useEffect(() => {
    loadProviderData();
  }, [providerId]);

  const loadProviderData = async () => {
    try {
      setIsLoading(true);
      
      // Load provider details, services, and reviews from API
      const [providerData, servicesData, reviewsData, userPostsData] = await Promise.all([
        ApiService.getServiceProvider(providerId),
        ApiService.getServicesByProvider(providerId),
        ApiService.getReviews(providerId),
        ApiService.getUserPosts(providerId, 1, 12)
      ]);
      
      setProvider(providerData);
      setServices(servicesData);
      setReviews(reviewsData);

      // Transform API posts to the expected format
      const transformedPosts: Post[] = userPostsData.map((post: any, index: number) => ({
        id: post.id?.toString() || `post-${index}`,
        imageUrl: post.imageUrl || `https://picsum.photos/400/400?random=${index + 100}`,
        likesCount: post.likesCount || Math.floor(Math.random() * 1000) + 50,
        commentsCount: post.commentsCount || Math.floor(Math.random() * 100) + 5,
        caption: post.caption || post.content || `Beautiful work by ${providerData.businessName} #beauty #professional`,
      }));
      
      // Add some mock posts if no real posts exist
      if (transformedPosts.length === 0) {
        const mockPosts: Post[] = Array.from({ length: 9 }, (_, index) => ({
          id: `mock-post-${index}`,
          imageUrl: `https://picsum.photos/400/400?random=${index + 200}`,
          likesCount: Math.floor(Math.random() * 1000) + 50,
          commentsCount: Math.floor(Math.random() * 100) + 5,
          caption: `Beautiful work by ${providerData.businessName} #beauty #professional #${providerData.businessName.toLowerCase().replace(/\s+/g, '')}`,
        }));
        setPosts(mockPosts);
      } else {
        setPosts(transformedPosts);
      }

      // Load follow status from API
      try {
        const followStatus = await ApiService.getFollowStatus(providerId);
        setIsFollowing(followStatus.isFollowing);
        setFollowersCount(followStatus.followersCount);
      } catch (error) {
        console.error('Error loading follow status:', error);
        setFollowersCount(providerData.followersCount || 0);
        setIsFollowing(false);
      }
    } catch (error) {
      console.error('Error loading provider data:', error);
      Alert.alert('Error', 'Failed to load provider information. Please try again.');
      
      // Fallback to mock data if API fails
      setProvider({
        id: providerId,
        userId: 'mock-user',
        businessName: 'Provider Profile',
        businessDescription: 'Professional beauty services provider',
        profilePictureUrl: 'https://via.placeholder.com/100',
        averageRating: 4.5,
        totalReviews: 50,
        isVerified: false,
        followersCount: 100,
        followingCount: 50,
        specialties: ['Beauty', 'Makeup'],
        priceRange: '$$$',
        yearsOfExperience: 5,
        businessAddress: 'Professional Studio',
      } as ServiceProvider);
      
      const mockPosts: Post[] = Array.from({ length: 6 }, (_, index) => ({
        id: `fallback-post-${index}`,
        imageUrl: `https://picsum.photos/400/400?random=${index + 300}`,
        likesCount: Math.floor(Math.random() * 500) + 25,
        commentsCount: Math.floor(Math.random() * 50) + 2,
        caption: `Professional work showcase`,
      }));
      setPosts(mockPosts);
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
        response = await ApiService.unfollowUser(providerId);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        response = await ApiService.followUser(providerId);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
      
      // Update with actual response if available
      if (response?.isFollowing !== undefined) {
        setIsFollowing(response.isFollowing);
      }
      if (response?.followersCount !== undefined) {
        setFollowersCount(response.followersCount);
      }
      
    } catch (error) {
      console.error('Error toggling follow status:', error);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
      
      // Revert optimistic updates on error
      setIsFollowing(prev => !prev);
      setFollowersCount(prev => isFollowing ? prev + 1 : prev - 1);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleBookService = (service: Service) => {
    if (!provider) return;
    
    navigation.navigate('BookingFlow', {
      service: service,
      provider: provider
    });
  };

  const handlePostPress = (post: Post, index: number) => {
    // For now, show an alert - TODO: implement PostDetailScreen navigation
    Alert.alert(
      'Post Detail',
      `Post: ${post.caption}\nLikes: ${post.likesCount}\nComments: ${post.commentsCount}`,
      [
        { text: 'Close' },
        { text: 'Like', onPress: () => console.log('Liked post:', post.id) },
      ]
    );
  };

  const handleViewAllReviews = () => {
    // For now, show an alert - TODO: implement ReviewsListScreen navigation
    Alert.alert(
      'All Reviews',
      `View all ${reviews.length} reviews for ${provider?.businessName}`,
      [
        { text: 'Close' },
        { text: 'View', onPress: () => console.log('Navigate to reviews list') },
      ]
    );
  };

  const handleCreateReview = () => {
    // For now, show an alert - TODO: implement CreateReviewScreen navigation
    Alert.alert(
      'Write Review',
      `Write a review for ${provider?.businessName}`,
      [
        { text: 'Cancel' },
        { text: 'Write Review', onPress: () => console.log('Navigate to create review') },
      ]
    );
  };

  const renderStarRating = (rating: number, size: number = 16) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : star - 0.5 <= rating ? 'star-half' : 'star-outline'}
            size={size}
            color={COLORS.star}
          />
        ))}
      </View>
    );
  };

  const renderServiceCard = (service: Service) => (
    <View key={service.id} style={styles.serviceCard}>
      {service.imageUrl && (
        <Image source={{ uri: service.imageUrl }} style={styles.serviceImage} />
      )}
      <View style={styles.serviceInfo}>
        <View style={styles.serviceHeader}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.servicePrice}>${service.price}</Text>
        </View>
        <Text style={styles.serviceDescription}>{service.description}</Text>
        <View style={styles.serviceDetails}>
          <View style={styles.serviceDetailItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.serviceDetailText}>{service.duration} min</Text>
          </View>
          <View style={styles.serviceDetailItem}>
            <Ionicons name="pricetag-outline" size={16} color={COLORS.primary} />
            <Text style={styles.serviceDetailText}>{service.category}</Text>
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
          style={styles.reviewerAvatar}
        />
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>
            {review.reviewer?.firstName} {review.reviewer?.lastName}
          </Text>
          <View style={styles.reviewRatingContainer}>
            {renderStarRating(review.rating)}
            <Text style={styles.reviewRatingText}>{review.rating.toFixed(1)}</Text>
          </View>
          <Text style={styles.reviewDate}>
            {new Date(review.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      {review.comment && (
        <Text style={styles.reviewComment}>{review.comment}</Text>
      )}
    </View>
  );

  const renderPostsGrid = () => (
    <FlatList
      data={posts}
      numColumns={3}
      renderItem={({ item, index }) => (
        <TouchableOpacity
          style={styles.postItem}
          onPress={() => handlePostPress(item, index)}
          activeOpacity={0.8}
        >
          <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
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
      showsVerticalScrollIndicator={false}
    />
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'posts':
        return renderPostsGrid();
      case 'services':
        return (
          <View style={styles.tabContent}>
            {services.length > 0 ? (
              services.map(renderServiceCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={COLORS.textSecondary} />
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
                  style={styles.viewAllButton}
                  onPress={handleViewAllReviews}
                >
                  <Text style={styles.viewAllButtonText}>
                    View All {reviews.length} Reviews
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="star-outline" size={48} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>No reviews yet</Text>
                <TouchableOpacity
                  style={styles.createReviewButton}
                  onPress={handleCreateReview}
                >
                  <Text style={styles.createReviewButtonText}>Be the first to review</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      default:
        return renderPostsGrid();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading provider...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!provider) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.errorText}>Provider not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProviderData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{provider.businessName}</Text>
        <TouchableOpacity onPress={() => Share.share({ message: `Check out ${provider.businessName} on FYLA2!` })}>
          <Ionicons name="share-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <Image
              source={{
                uri: provider.profilePictureUrl || 'https://via.placeholder.com/100',
              }}
              style={styles.profileImage}
            />
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{posts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
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
            
            {provider.averageRating && (
              <View style={styles.ratingContainer}>
                {renderStarRating(provider.averageRating)}
                <Text style={styles.ratingText}>
                  {provider.averageRating.toFixed(1)} ({provider.totalReviews || 0} reviews)
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => {
                if (services.length > 0) {
                  handleBookService(services[0]);
                }
              }}
            >
              <Text style={styles.primaryButtonText}>Book Service</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                styles.secondaryButton,
                isFollowing && styles.followingButton
              ]}
              onPress={handleFollow}
              disabled={isFollowLoading}
            >
              {isFollowLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={[
                  styles.secondaryButtonText,
                  isFollowing && styles.followingButtonText
                ]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconButton}
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
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Profile Section
  profileSection: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 24,
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
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // Business Info
  businessInfo: {
    marginBottom: 20,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  businessDescription: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  followingButton: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  followingButtonText: {
    color: COLORS.text,
  },
  iconButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.text,
  },

  // Tab Content
  tabContent: {
    backgroundColor: COLORS.background,
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
    backgroundColor: 'rgba(0,0,0,0.4)',
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

  // Services
  serviceCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: 160,
  },
  serviceInfo: {
    padding: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  serviceDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  serviceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceDetailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  bookButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: 16,
  },

  // Reviews
  reviewCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  reviewRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  reviewRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  reviewComment: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },

  // Buttons
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  createReviewButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignSelf: 'center',
  },
  createReviewButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: 14,
  },

  // Empty States
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
  },
});

export default EnhancedProviderProfileScreen;
