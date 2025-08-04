import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  RefreshControl,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import MapView, { Marker, Callout, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { ServiceProvider, Post, RootStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../../services/api';
import LocationService, { Coordinates } from '../../services/locationService';

type InstagramSearchScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface SocialPost extends Post {
  providerId?: string;
  provider?: ServiceProvider;
  imageUrls?: string[];
  caption?: string;
  tags?: string[];
  serviceCategories?: string[];
  location?: string;
}

interface EnhancedServiceProvider extends ServiceProvider {
  postsCount?: number;
  isFollowedByCurrentUser?: boolean;
  isBookmarkedByCurrentUser?: boolean;
  socialLinks?: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
  };
  distanceAway?: number;
  serviceType?: string;
  isAvailableToday?: boolean;
}

interface SearchFilters {
  category: string[];
  priceRange: { min: number; max: number };
  rating: number;
  location: string;
  verified: boolean;
  distance: number;
}

const COLORS = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  accent: '#FFD93D',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#262626',
  textSecondary: '#8E8E8E',
  border: '#EFEFEF',
  gradient1: '#667eea',
  gradient2: '#764ba2',
  instagram: '#E1306C',
  instagramBlue: '#4267B2',
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const InstagramSearchScreen: React.FC = () => {
  const [providers, setProviders] = useState<EnhancedServiceProvider[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<SocialPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState<'grid' | 'list' | 'posts' | 'map'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    category: [],
    priceRange: { min: 0, max: 1000 },
    rating: 0,
    location: '',
    verified: false,
    distance: 50,
  });
  const [followingUsers, setFollowingUsers] = useState<{ [key: string]: boolean }>({});
  const [bookmarkedProviders, setBookmarkedProviders] = useState<{ [key: string]: boolean }>({});
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<EnhancedServiceProvider | null>(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 37.7749, // Default to San Francisco
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  const navigation = useNavigation<InstagramSearchScreenNavigationProp>();
  const { user } = useAuth();

  const initializeLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        setUserLocation(location);
        setMapRegion(prev => ({
          ...prev,
          latitude: location.latitude,
          longitude: location.longitude,
        }));
      }
    } catch (error) {
      console.error('Error getting user location:', error);
    }
  };

  useEffect(() => {
    loadInitialData();
    initializeLocation();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const debounceTimeout = setTimeout(() => {
        searchProviders();
      }, 500);
      return () => clearTimeout(debounceTimeout);
    } else if (searchQuery.length === 0) {
      loadInitialData();
    }
  }, [searchQuery]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setApiConnected(null); // Reset connection status
      
      const [providersData, postsData] = await Promise.all([
        loadFeaturedProviders(),
        loadTrendingPosts(),
      ]);
      
      setProviders(providersData);
      setTrendingPosts(postsData);
      setApiConnected(true);
      
      if (providersData.length === 0) {
        Alert.alert(
          'No Providers Found',
          'Unable to load providers at the moment. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setApiConnected(false);
      Alert.alert(
        'Connection Error',
        'Unable to connect to the server. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: loadInitialData },
          { text: 'Cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadInitialData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadFeaturedProviders = async (): Promise<EnhancedServiceProvider[]> => {
    try {
      const response = await ApiService.getServiceProviders();
      
      if (response.data && Array.isArray(response.data)) {
        // Generate mock coordinates for providers
        const mockCoordinates = LocationService.generateMockCoordinates();
        
        return response.data.map((provider: any, index: number) => ({
          id: provider.id,
          userId: provider.id, // Using provider ID as userId for now
          businessName: provider.businessName,
          businessDescription: provider.businessDescription,
          profilePictureUrl: provider.profilePictureUrl || 'https://via.placeholder.com/120',
          averageRating: provider.averageRating || 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
          totalReviews: provider.totalReviews || Math.floor(Math.random() * 200) + 50, // Random reviews 50-250
          isVerified: provider.verified,
          followersCount: Math.floor(Math.random() * 15000) + 5000, // Random followers 5k-20k
          followingCount: Math.floor(Math.random() * 1000) + 200, // Random following 200-1200
          postsCount: Math.floor(Math.random() * 300) + 100, // Random posts 100-400
          isFollowedByCurrentUser: false,
          isBookmarkedByCurrentUser: false,
          specialties: provider.specialties || [],
          priceRange: provider.priceRange || '$$',
          yearsOfExperience: Math.floor(Math.random() * 10) + 3, // Random experience 3-13 years
          businessAddress: `${provider.businessName} Location`,
          // Add distance calculation (mock for now)
          distanceAway: Math.floor(Math.random() * 50) + 1, // Random distance 1-50 miles
          // Add service type
          serviceType: provider.specialties?.[0] || 'Beauty Services',
          // Add availability status
          isAvailableToday: Math.random() > 0.3, // 70% chance available
          // Add coordinates
          coordinates: mockCoordinates[index % mockCoordinates.length],
          socialLinks: {
            instagram: `@${provider.businessName.toLowerCase().replace(/\s+/g, '')}`,
          },
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error loading providers from API:', error);
      // Fallback to empty array if API fails
      return [];
    }
  };

  const loadTrendingPosts = async (): Promise<SocialPost[]> => {
    try {
      const response = await ApiService.getPosts(1, 10); // Get first 10 posts
      
      if (response.data && Array.isArray(response.data)) {
        // Also get providers to match posts with providers
        const providersData = await loadFeaturedProviders();
        
        return response.data.map((post: any, index: number) => {
          // Match post with a provider (for demonstration, use modulo)
          const provider = providersData[index % providersData.length];
          
          return {
            id: post.id,
            userId: post.userId,
            providerId: provider?.id || post.providerId,
            provider: provider,
            imageUrls: post.imageUrls || ['https://via.placeholder.com/400x400'],
            caption: post.content || post.caption || 'Check out this amazing transformation! ✨',
            tags: post.tags || ['beauty', 'transformation'],
            serviceCategories: post.serviceCategories || ['Beauty'],
            location: post.location || provider?.businessAddress || 'Location',
            likesCount: post.likesCount || Math.floor(Math.random() * 1000) + 100,
            commentsCount: post.commentsCount || Math.floor(Math.random() * 100) + 10,
            isLikedByCurrentUser: post.isLikedByCurrentUser || false,
            isBookmarkedByCurrentUser: post.isBookmarkedByCurrentUser || false,
            createdAt: post.createdAt || new Date().toISOString(),
          };
        });
      }
      
      return [];
    } catch (error) {
      console.error('Error loading posts from API:', error);
      // Return empty array if API fails
      return [];
    }
  };

  const searchProviders = async () => {
    try {
      // For now, we'll filter locally since we don't have a search endpoint
      // In the future, you can implement: const response = await ApiService.get(`/serviceprovider/search?q=${searchQuery}`);
      const allProviders = await loadFeaturedProviders();
      const filteredProviders = allProviders.filter(provider =>
        provider.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (provider.businessDescription && provider.businessDescription.toLowerCase().includes(searchQuery.toLowerCase())) ||
        provider.specialties?.some(specialty => 
          specialty.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setProviders(filteredProviders);
    } catch (error) {
      console.error('Error searching providers:', error);
    }
  };

  const handleFollowToggle = async (providerId: string) => {
    try {
      const isCurrentlyFollowing = followingUsers[providerId];
      
      // Optimistic update
      setFollowingUsers(prev => ({
        ...prev,
        [providerId]: !isCurrentlyFollowing
      }));

      setProviders(prev => prev.map(provider => 
        provider.id === providerId 
          ? {
              ...provider,
              isFollowedByCurrentUser: !isCurrentlyFollowing,
              followersCount: isCurrentlyFollowing 
                ? (provider.followersCount || 0) - 1 
                : (provider.followersCount || 0) + 1
            }
          : provider
      ));

      // API call
      if (isCurrentlyFollowing) {
        await ApiService.unfollowProvider(providerId);
      } else {
        await ApiService.followProvider(providerId);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      // Revert optimistic update
      setFollowingUsers(prev => ({
        ...prev,
        [providerId]: !prev[providerId]
      }));
    }
  };

  const handleBookmarkToggle = async (providerId: string) => {
    try {
      const isCurrentlyBookmarked = bookmarkedProviders[providerId];
      
      setBookmarkedProviders(prev => ({
        ...prev,
        [providerId]: !isCurrentlyBookmarked
      }));

      setProviders(prev => prev.map(provider => 
        provider.id === providerId 
          ? { ...provider, isBookmarkedByCurrentUser: !isCurrentlyBookmarked }
          : provider
      ));

      console.log(`${isCurrentlyBookmarked ? 'Removing bookmark' : 'Bookmarking'} provider:`, providerId);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const post = trendingPosts.find(p => p.id === postId);
      if (!post) return;

      const isCurrentlyLiked = post.isLikedByCurrentUser;
      
      // Optimistic update
      setTrendingPosts(prev => prev.map(p => 
        p.id === postId 
          ? {
              ...p,
              isLikedByCurrentUser: !isCurrentlyLiked,
              likesCount: isCurrentlyLiked ? p.likesCount - 1 : p.likesCount + 1
            }
          : p
      ));

      // API call
      if (isCurrentlyLiked) {
        await ApiService.unlikePost(postId);
      } else {
        await ApiService.likePost(postId);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update
      setTrendingPosts(prev => prev.map(p => 
        p.id === postId 
          ? {
              ...p,
              isLikedByCurrentUser: !p.isLikedByCurrentUser,
              likesCount: p.isLikedByCurrentUser ? p.likesCount + 1 : p.likesCount - 1
            }
          : p
      ));
    }
  };

  const handleCommentOnPost = (postId: string) => {
    navigation.navigate('PostComments', { postId });
  };

  const handleBookmarkPost = async (postId: string) => {
    try {
      const post = trendingPosts.find(p => p.id === postId);
      if (!post) return;

      const isCurrentlyBookmarked = post.isBookmarkedByCurrentUser;
      
      // Optimistic update
      setTrendingPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, isBookmarkedByCurrentUser: !isCurrentlyBookmarked }
          : p
      ));

      // API call
      if (isCurrentlyBookmarked) {
        await ApiService.unbookmarkPost(postId);
      } else {
        await ApiService.bookmarkPost(postId);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert optimistic update
      setTrendingPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, isBookmarkedByCurrentUser: !p.isBookmarkedByCurrentUser }
          : p
      ));
    }
  };

  const handleViewPostProviderProfile = (providerId: string) => {
    navigation.navigate('EnhancedProviderProfile', { providerId });
  };

  const handleMarkerPress = (provider: EnhancedServiceProvider) => {
    setSelectedProvider(provider);
    setShowProviderModal(true);
  };

  const handleGetDirections = async (provider: EnhancedServiceProvider) => {
    if (provider.coordinates) {
      try {
        await LocationService.openDirections(
          provider.coordinates.latitude,
          provider.coordinates.longitude
        );
      } catch (error) {
        console.error('Error opening directions:', error);
        Alert.alert('Error', 'Unable to open directions');
      }
    }
  };

  const handleCloseModal = () => {
    setShowProviderModal(false);
    setSelectedProvider(null);
  };

  const handleMessageProvider = (provider: EnhancedServiceProvider) => {
    navigation.navigate('Chat', {
      userId: provider.userId,
      userName: provider.businessName,
      userImage: provider.profilePictureUrl,
    });
  };

  const handleViewProfile = (provider: EnhancedServiceProvider) => {
    navigation.navigate('EnhancedProviderProfile', { providerId: provider.id });
  };

  const renderProviderGrid = ({ item }: { item: EnhancedServiceProvider }) => (
    <TouchableOpacity
      style={styles.gridProviderCard}
      onPress={() => handleViewProfile(item)}
    >
      <Image
        source={{ uri: item.profilePictureUrl || 'https://via.placeholder.com/150' }}
        style={styles.gridProviderImage}
      />
      
      {/* Overlay with quick actions */}
      <View style={styles.gridOverlay}>
        <View style={styles.gridActions}>
          <TouchableOpacity
            style={styles.gridActionButton}
            onPress={() => handleFollowToggle(item.id)}
          >
            <Ionicons
              name={(item.isFollowedByCurrentUser) ? "heart" : "heart-outline"}
              size={20}
              color={(item.isFollowedByCurrentUser) ? COLORS.instagram : COLORS.surface}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.gridActionButton}
            onPress={() => handleBookmarkToggle(item.id)}
          >
            <Ionicons
              name={(item.isBookmarkedByCurrentUser) ? "bookmark" : "bookmark-outline"}
              size={20}
              color={(item.isBookmarkedByCurrentUser) ? COLORS.accent : COLORS.surface}
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.gridProviderInfo}>
          <Text style={styles.gridProviderName} numberOfLines={1}>
            {item.businessName}
          </Text>
          <Text style={styles.gridServiceType} numberOfLines={1}>
            {item.serviceType}
          </Text>
          <View style={styles.gridStats}>
            <View style={styles.gridStat}>
              <Ionicons name="star" size={12} color={COLORS.accent} />
              <Text style={styles.gridStatText}>{item.averageRating?.toFixed(1)}</Text>
            </View>
            <View style={styles.gridStat}>
              <Text style={styles.gridStatText}>{item.priceRange}</Text>
            </View>
            <View style={styles.gridStat}>
              <Ionicons name="location" size={12} color={COLORS.surface} />
              <Text style={styles.gridStatText}>{item.distanceAway}mi</Text>
            </View>
          </View>
          {item.isAvailableToday && (
            <View style={styles.availabilityBadge}>
              <Text style={styles.availabilityText}>Available Today</Text>
            </View>
          )}
        </View>
      </View>
      
      {item.isVerified && (
        <View style={styles.gridVerifiedBadge}>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.instagram} />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderProviderList = ({ item }: { item: EnhancedServiceProvider }) => (
    <View style={styles.listProviderCard}>
      <TouchableOpacity
        style={styles.listProviderContent}
        onPress={() => handleViewProfile(item)}
      >
        <Image
          source={{ uri: item.profilePictureUrl || 'https://via.placeholder.com/80' }}
          style={styles.listProviderImage}
        />
        
        <View style={styles.listProviderInfo}>
          <View style={styles.listProviderHeader}>
            <Text style={styles.listProviderName}>
              {item.businessName}
            </Text>
            {item.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color={COLORS.instagram} />
            )}
            {item.isAvailableToday && (
              <View style={styles.listAvailabilityBadge}>
                <Text style={styles.listAvailabilityText}>Available</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.listServiceType}>{item.serviceType}</Text>
          <Text style={styles.listProviderDescription} numberOfLines={2}>
            {item.businessDescription}
          </Text>
          
          <View style={styles.listProviderStats}>
            <View style={styles.listStat}>
              <Ionicons name="star" size={14} color={COLORS.accent} />
              <Text style={styles.listStatText}>{item.averageRating?.toFixed(1)} ({item.totalReviews})</Text>
            </View>
            <View style={styles.listStat}>
              <Ionicons name="cash" size={14} color={COLORS.textSecondary} />
              <Text style={styles.listStatText}>{item.priceRange}</Text>
            </View>
            <View style={styles.listStat}>
              <Ionicons name="location" size={14} color={COLORS.textSecondary} />
              <Text style={styles.listStatText}>{item.distanceAway} miles away</Text>
            </View>
          </View>
          
          <View style={styles.listSpecialties}>
            {item.specialties?.slice(0, 3).map((specialty, index) => (
              <View key={index} style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
      
      <View style={styles.listProviderActions}>
        <TouchableOpacity
          style={[
            styles.listActionButton,
            (item.isFollowedByCurrentUser) ? styles.followingButton : styles.followButton
          ]}
          onPress={() => handleFollowToggle(item.id)}
        >
          <Text style={[
            styles.listActionText,
            (item.isFollowedByCurrentUser) ? styles.followingText : styles.followText
          ]}>
            {(item.isFollowedByCurrentUser) ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.listActionButton}
          onPress={() => handleMessageProvider(item)}
        >
          <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.listActionButton}
          onPress={() => handleBookmarkToggle(item.id)}
        >
          <Ionicons
            name={(item.isBookmarkedByCurrentUser) ? "bookmark" : "bookmark-outline"}
            size={18}
            color={(item.isBookmarkedByCurrentUser) ? COLORS.accent : COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTrendingPost = ({ item }: { item: SocialPost }) => (
    <View style={styles.trendingPost}>
      {/* Post Header with Provider Info */}
      <View style={styles.postHeader}>
        <TouchableOpacity 
          style={styles.postProviderInfo}
          onPress={() => item.provider && handleViewPostProviderProfile(item.provider.id)}
        >
          <Image
            source={{ uri: item.provider?.profilePictureUrl || 'https://via.placeholder.com/32' }}
            style={styles.postProviderAvatar}
          />
          <View style={styles.postProviderDetails}>
            <Text style={styles.postProviderName} numberOfLines={1}>
              {item.provider?.businessName || 'Unknown Provider'}
            </Text>
            <Text style={styles.postLocation} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.postMoreButton}
          onPress={() => handleBookmarkPost(item.id)}
        >
          <Ionicons
            name={item.isBookmarkedByCurrentUser ? "bookmark" : "bookmark-outline"}
            size={20}
            color={item.isBookmarkedByCurrentUser ? COLORS.accent : COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Post Image */}
      <TouchableOpacity style={styles.postImageContainer}>
        <Image
          source={{ uri: item.imageUrls?.[0] || 'https://via.placeholder.com/200x200' }}
          style={styles.trendingPostImage}
        />
        <View style={styles.trendingPostOverlay}>
          <View style={styles.trendingPostStats}>
            <TouchableOpacity 
              style={styles.trendingStat}
              onPress={() => handleLikePost(item.id)}
            >
              <Ionicons 
                name={item.isLikedByCurrentUser ? "heart" : "heart-outline"} 
                size={16} 
                color={item.isLikedByCurrentUser ? COLORS.instagram : COLORS.surface} 
              />
              <Text style={styles.trendingStatText}>{item.likesCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.trendingStat}
              onPress={() => handleCommentOnPost(item.id)}
            >
              <Ionicons name="chatbubble" size={16} color={COLORS.surface} />
              <Text style={styles.trendingStatText}>{item.commentsCount}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <View style={styles.postActionsLeft}>
          <TouchableOpacity 
            style={styles.postActionButton}
            onPress={() => handleLikePost(item.id)}
          >
            <Ionicons
              name={item.isLikedByCurrentUser ? "heart" : "heart-outline"}
              size={24}
              color={item.isLikedByCurrentUser ? COLORS.instagram : COLORS.text}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.postActionButton}
            onPress={() => handleCommentOnPost(item.id)}
          >
            <Ionicons name="chatbubble-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Caption */}
      {item.caption && (
        <View style={styles.postCaption}>
          <Text style={styles.postCaptionText} numberOfLines={2}>
            <Text style={styles.postProviderNameInCaption}>
              {item.provider?.businessName}
            </Text>
            {' '}
            {item.caption}
          </Text>
        </View>
      )}
    </View>
  );

  const renderContent = () => {
    if (selectedView === 'posts') {
      return (
        <FlatList
          data={trendingPosts}
          renderItem={renderTrendingPost}
          numColumns={1}
          contentContainerStyle={styles.postsContainer}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    if (selectedView === 'map') {
      return (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
            provider={PROVIDER_GOOGLE}
            showsUserLocation={true}
            showsMyLocationButton={true}
            mapType="standard"
          >
            {providers.map((provider) => {
              if (!provider.coordinates) return null;
              
              return (
                <Marker
                  key={provider.id}
                  coordinate={{
                    latitude: provider.coordinates.latitude,
                    longitude: provider.coordinates.longitude,
                  }}
                  onPress={() => handleMarkerPress(provider)}
                >
                  <View style={styles.markerContainer}>
                    <View style={[styles.marker, provider.isVerified && styles.verifiedMarker]}>
                      <Image
                        source={{ uri: provider.profilePictureUrl || 'https://via.placeholder.com/40' }}
                        style={styles.markerImage}
                      />
                      {provider.isVerified && (
                        <View style={styles.verifiedBadge}>
                          <Ionicons name="checkmark" size={8} color={COLORS.surface} />
                        </View>
                      )}
                    </View>
                    <View style={styles.markerTriangle} />
                  </View>
                  <Callout tooltip>
                    <View style={styles.calloutContainer}>
                      <Text style={styles.calloutTitle}>{provider.businessName}</Text>
                      <Text style={styles.calloutSubtitle}>{provider.serviceType}</Text>
                      <View style={styles.calloutRating}>
                        <Ionicons name="star" size={12} color={COLORS.accent} />
                        <Text style={styles.calloutRatingText}>{provider.averageRating?.toFixed(1)}</Text>
                        <Text style={styles.calloutPriceRange}>{provider.priceRange}</Text>
                      </View>
                    </View>
                  </Callout>
                </Marker>
              );
            })}
          </MapView>
        </View>
      );
    }

    const renderItem = selectedView === 'grid' ? renderProviderGrid : renderProviderList;
    const numColumns = selectedView === 'grid' ? 2 : 1;

    return (
      <FlatList
        data={providers}
        renderItem={renderItem}
        numColumns={numColumns}
        key={selectedView} // Force re-render when view changes
        contentContainerStyle={styles.providersContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>
          {apiConnected === null 
            ? 'Connecting to server...' 
            : apiConnected 
              ? 'Loading providers...' 
              : 'Connection failed. Retrying...'
          }
        </Text>
        {apiConnected === true && (
          <Text style={styles.connectionText}>✅ Connected to API</Text>
        )}
        {apiConnected === false && (
          <Text style={styles.errorText}>❌ Unable to connect to server</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Discover</Text>
          {apiConnected === true && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search providers, services, or styles..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <View style={styles.viewToggleButtons}>
            <TouchableOpacity
              style={[styles.viewButton, selectedView === 'grid' && styles.activeViewButton]}
              onPress={() => setSelectedView('grid')}
            >
              <Ionicons
                name="grid-outline"
                size={20}
                color={selectedView === 'grid' ? COLORS.primary : COLORS.textSecondary}
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.viewButton, selectedView === 'list' && styles.activeViewButton]}
              onPress={() => setSelectedView('list')}
            >
              <Ionicons
                name="list-outline"
                size={20}
                color={selectedView === 'list' ? COLORS.primary : COLORS.textSecondary}
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.viewButton, selectedView === 'posts' && styles.activeViewButton]}
              onPress={() => setSelectedView('posts')}
            >
              <Ionicons
                name="images-outline"
                size={20}
                color={selectedView === 'posts' ? COLORS.primary : COLORS.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewButton, selectedView === 'map' && styles.activeViewButton]}
              onPress={() => setSelectedView('map')}
            >
              <Ionicons
                name="map-outline"
                size={20}
                color={selectedView === 'map' ? COLORS.primary : COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.resultsCount}>
            {selectedView === 'posts' ? trendingPosts.length : providers.length} {selectedView === 'posts' ? 'trending posts' : selectedView === 'map' ? 'providers nearby' : 'providers'}
          </Text>
        </View>

        {/* Content */}
        {renderContent()}
      </ScrollView>

      {/* Provider Details Modal */}
      <Modal
        visible={showProviderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} style={styles.modalBlur}>
            <View style={styles.modalContent}>
              {selectedProvider && (
                <>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      onPress={handleCloseModal}
                    >
                      <Ionicons name="close" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalProviderInfo}>
                    <Image
                      source={{ uri: selectedProvider.profilePictureUrl || 'https://via.placeholder.com/80' }}
                      style={styles.modalProviderImage}
                    />
                    
                    <View style={styles.modalProviderDetails}>
                      <View style={styles.modalProviderHeader}>
                        <Text style={styles.modalProviderName}>
                          {selectedProvider.businessName}
                        </Text>
                        {selectedProvider.isVerified && (
                          <Ionicons name="checkmark-circle" size={20} color={COLORS.instagram} />
                        )}
                      </View>
                      
                      <Text style={styles.modalServiceType}>{selectedProvider.serviceType}</Text>
                      <Text style={styles.modalProviderDescription} numberOfLines={3}>
                        {selectedProvider.businessDescription}
                      </Text>
                      
                      <View style={styles.modalProviderStats}>
                        <View style={styles.modalStat}>
                          <Ionicons name="star" size={16} color={COLORS.accent} />
                          <Text style={styles.modalStatText}>
                            {selectedProvider.averageRating?.toFixed(1)} ({selectedProvider.totalReviews})
                          </Text>
                        </View>
                        <View style={styles.modalStat}>
                          <Ionicons name="cash" size={16} color={COLORS.textSecondary} />
                          <Text style={styles.modalStatText}>{selectedProvider.priceRange}</Text>
                        </View>
                        <View style={styles.modalStat}>
                          <Ionicons name="location" size={16} color={COLORS.textSecondary} />
                          <Text style={styles.modalStatText}>{selectedProvider.distanceAway} miles away</Text>
                        </View>
                      </View>

                      {selectedProvider.isAvailableToday && (
                        <View style={styles.modalAvailabilityBadge}>
                          <Text style={styles.modalAvailabilityText}>Available Today</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalActionButton}
                      onPress={() => handleGetDirections(selectedProvider)}
                    >
                      <Ionicons name="navigate" size={20} color={COLORS.surface} />
                      <Text style={styles.modalActionText}>Get Directions</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.modalActionButton, styles.modalSecondaryButton]}
                      onPress={() => {
                        handleCloseModal();
                        handleViewProfile(selectedProvider);
                      }}
                    >
                      <Ionicons name="person" size={20} color={COLORS.primary} />
                      <Text style={[styles.modalActionText, styles.modalSecondaryText]}>View Profile</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </BlurView>
        </View>
      </Modal>
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
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  connectionText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surface,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.surface,
    letterSpacing: 0.5,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  scrollContainer: {
    flex: 1,
  },
  
  // Search
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '400',
  },
  
  // View Toggle
  viewToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  viewToggleButtons: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 25,
    padding: 4,
  },
  viewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  activeViewButton: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  
  // Providers Container
  providersContainer: {
    padding: 16,
  },
  
  // Grid View
  gridProviderCard: {
    flex: 1,
    aspectRatio: 1,
    margin: 6,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gridProviderImage: {
    width: '100%',
    height: '100%',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
    padding: 12,
  },
  gridActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  gridActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridProviderInfo: {
    justifyContent: 'flex-end',
  },
  gridProviderName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.surface,
    marginBottom: 4,
  },
  gridServiceType: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.surface,
    opacity: 0.8,
    marginBottom: 4,
  },
  gridStats: {
    flexDirection: 'row',
    gap: 12,
  },
  gridStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridStatText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.surface,
  },
  gridVerifiedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 2,
  },
  availabilityBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.surface,
  },
  
  // List View
  listProviderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  listProviderContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  listProviderImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginRight: 16,
  },
  listProviderInfo: {
    flex: 1,
  },
  listProviderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  listProviderName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  listServiceType: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  listAvailabilityBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  listAvailabilityText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.surface,
  },
  listProviderDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  listProviderStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  listStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listStatText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  listSpecialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specialtyTag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  specialtyText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  listProviderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  listActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  followButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  followingButton: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
  },
  listActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  followText: {
    color: COLORS.surface,
  },
  followingText: {
    color: COLORS.textSecondary,
  },
  
  // Posts View
  postsContainer: {
    padding: 2,
  },
  trendingPost: {
    backgroundColor: COLORS.surface,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  postProviderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postProviderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  postProviderDetails: {
    flex: 1,
  },
  postProviderName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  postLocation: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  postMoreButton: {
    padding: 8,
  },
  postImageContainer: {
    position: 'relative',
  },
  trendingPostImage: {
    width: '100%',
    height: 200,
  },
  trendingPostOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    padding: 8,
  },
  trendingPostStats: {
    flexDirection: 'row',
    gap: 12,
  },
  trendingStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendingStatText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.surface,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  postActionsLeft: {
    flexDirection: 'row',
    gap: 16,
  },
  postActionButton: {
    padding: 4,
  },
  postCaption: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  postCaptionText: {
    fontSize: 14,
    lineHeight: 18,
    color: COLORS.text,
  },
  postProviderNameInCaption: {
    fontWeight: '600',
    color: COLORS.text,
  },

  // Map View Styles
  mapContainer: {
    height: 400,
    marginVertical: 16,
    borderRadius: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: COLORS.surface,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    position: 'relative',
  },
  verifiedMarker: {
    borderColor: COLORS.instagram,
  },
  markerImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.instagram,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  markerTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 8,
    borderRightWidth: 6,
    borderBottomWidth: 0,
    borderLeftWidth: 6,
    borderTopColor: COLORS.surface,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    marginTop: -1,
  },
  calloutContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  calloutSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  calloutRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  calloutRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  calloutPriceRange: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBlur: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: screenHeight * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalProviderInfo: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  modalProviderImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginRight: 16,
  },
  modalProviderDetails: {
    flex: 1,
  },
  modalProviderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  modalProviderName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalServiceType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 6,
  },
  modalProviderDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  modalProviderStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  modalStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalStatText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  modalAvailabilityBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  modalAvailabilityText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.surface,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  modalSecondaryButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  modalActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
  modalSecondaryText: {
    color: COLORS.primary,
  },
});

export default InstagramSearchScreen;
