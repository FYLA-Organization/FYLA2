import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { SocialPost, SocialFeed } from '../../types';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
  primary: '#5A4FCF',      // Royal Indigo
  accent: '#F5C451',        // Soft Gold
  background: '#FAFAFA',    // Light Background
  surface: '#FFFFFF',       // Card Backgrounds
  textPrimary: '#1A1A1A',   // Dark Text
  textSecondary: '#6B6B6B', // Secondary Text
  lavenderMist: '#AFAAFF',  // Lavender Mist
  success: '#4CAF50',       // Success color
  warning: '#FF9800',       // Warning color
  error: '#F44336',         // Error color
  border: '#E8E8E8',        // Subtle borders
  shadow: '#000000',        // Shadow color
  heart: '#FF3040',         // Heart red
  bookmark: '#8B5CF6',      // Bookmark purple
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SocialFeedScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [feed, setFeed] = useState<SocialFeed>({ posts: [], hasMore: true, nextPage: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Mock API call - replace with actual API
      const mockFeed = await getMockSocialFeed(refresh ? 1 : feed.nextPage);
      
      if (refresh) {
        setFeed(mockFeed);
      } else {
        setFeed(prev => ({
          ...mockFeed,
          posts: [...prev.posts, ...mockFeed.posts],
        }));
      }
    } catch (error) {
      console.error('Error loading feed:', error);
      Alert.alert('Error', 'Failed to load social feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const loadMorePosts = () => {
    if (!loadingMore && feed.hasMore) {
      setLoadingMore(true);
      loadFeed(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      // Optimistic update
      setFeed(prev => ({
        ...prev,
        posts: prev.posts.map(post => 
          post.id === postId
            ? {
                ...post,
                isLikedByCurrentUser: !post.isLikedByCurrentUser,
                likesCount: post.isLikedByCurrentUser 
                  ? post.likesCount - 1 
                  : post.likesCount + 1
              }
            : post
        )
      }));

      // API call would go here
      console.log('Toggle like for post:', postId);
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      setFeed(prev => ({
        ...prev,
        posts: prev.posts.map(post => 
          post.id === postId
            ? {
                ...post,
                isLikedByCurrentUser: !post.isLikedByCurrentUser,
                likesCount: post.isLikedByCurrentUser 
                  ? post.likesCount + 1 
                  : post.likesCount - 1
              }
            : post
        )
      }));
    }
  };

  const handleBookmarkPost = async (postId: string) => {
    try {
      // Optimistic update
      setFeed(prev => ({
        ...prev,
        posts: prev.posts.map(post => 
          post.id === postId
            ? { ...post, isBookmarkByCurrentUser: !post.isBookmarkByCurrentUser }
            : post
        )
      }));

      // API call would go here
      console.log('Toggle bookmark for post:', postId);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const renderPostHeader = (post: SocialPost) => (
    <View style={styles.postHeader}>
      <TouchableOpacity
        style={styles.providerInfo}
        onPress={() => navigation.navigate('ProviderProfile', { providerId: post.providerId })}
      >
        <Image
          source={{ uri: post.provider.profilePictureUrl || 'https://via.placeholder.com/40' }}
          style={styles.providerAvatar}
        />
        <View style={styles.providerDetails}>
          <Text style={styles.providerName}>{post.provider.businessName}</Text>
          <Text style={styles.postLocation}>{post.location || 'Location'}</Text>
        </View>
      </TouchableOpacity>
      
      {post.provider.isVerified && (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
        </View>
      )}
    </View>
  );

  const renderPostImages = (post: SocialPost) => (
    <View style={styles.imagesContainer}>
      {post.imageUrls.length === 1 ? (
        <TouchableOpacity
          onPress={() => {
            setSelectedImage(post.imageUrls[0]);
            setShowImageModal(true);
          }}
        >
          <Image source={{ uri: post.imageUrls[0] }} style={styles.singleImage} />
        </TouchableOpacity>
      ) : (
        <FlatList
          data={post.imageUrls}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setSelectedImage(item);
                setShowImageModal(true);
              }}
            >
              <Image source={{ uri: item }} style={styles.carouselImage} />
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
      )}
    </View>
  );

  const renderPostActions = (post: SocialPost) => (
    <View style={styles.postActions}>
      <View style={styles.leftActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLikePost(post.id)}
        >
          <Ionicons
            name={post.isLikedByCurrentUser ? "heart" : "heart-outline"}
            size={24}
            color={post.isLikedByCurrentUser ? COLORS.heart : COLORS.textSecondary}
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('PostComments', { postId: post.id })}
        >
          <Ionicons name="chatbubble-outline" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('BookingFlow', { 
            providerId: post.providerId,
            serviceCategory: post.serviceCategories[0] 
          })}
        >
          <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => handleBookmarkPost(post.id)}
      >
        <Ionicons
          name={post.isBookmarkByCurrentUser ? "bookmark" : "bookmark-outline"}
          size={22}
          color={post.isBookmarkByCurrentUser ? COLORS.bookmark : COLORS.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );

  const renderPostContent = (post: SocialPost) => (
    <View style={styles.postContent}>
      {post.likesCount > 0 && (
        <TouchableOpacity style={styles.likesInfo}>
          <Text style={styles.likesText}>{post.likesCount} likes</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.captionContainer}>
        <Text style={styles.caption}>
          <Text style={styles.providerUsername}>{post.provider.businessName} </Text>
          {post.caption}
        </Text>
      </View>
      
      {post.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {post.tags.map((tag, index) => (
            <Text key={index} style={styles.tag}>#{tag}</Text>
          ))}
        </View>
      )}
      
      {post.commentsCount > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('PostComments', { postId: post.id })}
        >
          <Text style={styles.viewComments}>
            View all {post.commentsCount} comments
          </Text>
        </TouchableOpacity>
      )}
      
      <Text style={styles.postTime}>{getTimeAgo(post.createdAt)}</Text>
    </View>
  );

  const renderPost = ({ item }: { item: SocialPost }) => (
    <View style={styles.postCard}>
      {renderPostHeader(item)}
      {renderPostImages(item)}
      {renderPostActions(item)}
      {renderPostContent(item)}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient colors={[COLORS.primary, COLORS.lavenderMist]} style={styles.headerGradient}>
        <SafeAreaView>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Discover</Text>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('SocialSearch')}
            >
              <Ionicons name="search-outline" size={24} color={COLORS.surface} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );

  if (loading && feed.posts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <FlatList
        data={feed.posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadFeed(true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContainer}
      />

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity
            style={styles.imageModalBackdrop}
            onPress={() => setShowImageModal(false)}
          >
            <Image
              source={{ uri: selectedImage || '' }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowImageModal(false)}
            >
              <Ionicons name="close" size={30} color={COLORS.surface} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePost' as never)}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.accent]}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

// Mock data function - replace with actual API
const getMockSocialFeed = async (page: number): Promise<SocialFeed> => {
  const mockPosts: SocialPost[] = [
    {
      id: '1',
      providerId: 'provider1',
      provider: {
        id: 'provider1',
        userId: 'user1',
        businessName: 'Glamour Studio',
        profilePictureUrl: 'https://via.placeholder.com/40',
        isVerified: true,
        averageRating: 4.8,
        totalReviews: 127,
        followersCount: 1520,
        followingCount: 89,
        postsCount: 156,
        isFollowedByCurrentUser: false,
        isBookmarkedByCurrentUser: false,
      } as any,
      imageUrls: [
        'https://via.placeholder.com/400x400',
        'https://via.placeholder.com/400x500',
      ],
      caption: 'Fresh highlights and blowout for my beautiful client! 💁‍♀️✨ Book your transformation today!',
      tags: ['highlights', 'blowout', 'transformation', 'hair'],
      serviceCategories: ['Hair'],
      location: 'Downtown Beauty District',
      likesCount: 89,
      commentsCount: 12,
      isLikedByCurrentUser: false,
      isBookmarkByCurrentUser: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      updatedAt: new Date().toISOString(),
    },
    // Add more mock posts...
  ];

  return {
    posts: mockPosts,
    hasMore: page < 3,
    nextPage: page + 1,
  };
};

const getTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerGradient: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface + '20',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  feedContainer: {
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: COLORS.surface,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  providerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  postLocation: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  verifiedBadge: {
    marginLeft: 8,
  },
  imagesContainer: {
    width: screenWidth,
    height: screenWidth,
  },
  singleImage: {
    width: screenWidth,
    height: screenWidth,
  },
  carouselImage: {
    width: screenWidth,
    height: screenWidth,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 16,
    padding: 4,
  },
  postContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  likesInfo: {
    marginBottom: 8,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  captionContainer: {
    marginBottom: 8,
  },
  caption: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  providerUsername: {
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    fontSize: 14,
    color: COLORS.primary,
    marginRight: 8,
    marginBottom: 4,
  },
  viewComments: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  postTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  imageModalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenHeight * 0.8,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
  },
  fab: {
    position: 'absolute',
    bottom: 110,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SocialFeedScreen;
