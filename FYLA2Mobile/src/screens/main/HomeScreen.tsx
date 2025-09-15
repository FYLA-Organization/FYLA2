import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList } from '../../types';
import ApiService from '../../services/api';
import FirstTimeUserGuide, { useFirstTimeUserGuide } from '../../components/FirstTimeUserGuide';
import QuickStartGuide, { useQuickStartGuide } from '../../components/QuickStartGuide';
import SmartTooltip, { useSmartTooltips } from '../../components/SmartTooltip';
import { MODERN_COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../../constants/modernDesign';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface PostType {
  id: string;
  content: string;
  images?: string[];
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
    isVerified?: boolean;
    isServiceProvider?: boolean;
    businessName?: string;
    serviceCategory?: string;
  };
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLikedByCurrentUser: boolean;
  isBookmarkedByCurrentUser?: boolean;
  location?: string;
  tags?: string[];
}

const HomeScreen: React.FC = () => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [likedPosts, setLikedPosts] = useState<{ [key: string]: boolean }>({});
  const [bookmarkedPosts, setBookmarkedPosts] = useState<{ [key: string]: boolean }>({});
  const [postLikes, setPostLikes] = useState<{ [key: string]: number }>({});
  
  // First-time user experience
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  
  // Initialize first-time user experience
  const userType = user?.isServiceProvider ? 'provider' : 'client';
  const firstTimeGuide = useFirstTimeUserGuide(userType);
  const quickStartGuide = useQuickStartGuide(userType);
  const smartTooltips = useSmartTooltips('Home', userType);

  // Helper function for time formatting
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  useEffect(() => {
    loadSocialFeed(1, true);
    
    // Show first-time user experience if needed
    if (!firstTimeGuide.loading && firstTimeGuide.shouldShow) {
      setTimeout(() => setShowFirstTimeGuide(true), 2000);
    } else if (!quickStartGuide.loading && quickStartGuide.shouldShow) {
      setTimeout(() => setShowQuickStart(true), 2500);
    }
  }, [firstTimeGuide.loading, firstTimeGuide.shouldShow, quickStartGuide.loading, quickStartGuide.shouldShow]);

  const loadSocialFeed = async (pageNum: number = 1, isRefresh: boolean = false) => {
    if (loadingMore && !isRefresh) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum > 1) {
        setLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      // Mock data for demo with proper types
      const mockPosts: PostType[] = [
        {
          id: '1',
          content: 'Just finished an amazing balayage transformation! ✨ Loving how the blonde blends seamlessly with the natural brunette base. Book your appointment today!',
          images: ['https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500'],
          user: {
            id: '1',
            firstName: 'Sarah',
            lastName: 'Johnson',
            profilePictureUrl: 'https://images.unsplash.com/photo-1494790108755-2616b156d9b6?w=150',
            isVerified: true,
            isServiceProvider: true,
            businessName: 'Glamour Studio',
            serviceCategory: 'Hair Styling',
          },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          likesCount: 42,
          commentsCount: 8,
          isLikedByCurrentUser: false,
          isBookmarkedByCurrentUser: false,
          location: 'Beverly Hills, CA',
          tags: ['balayage', 'haircolor', 'transformation'],
        },
        {
          id: '2',
          content: 'Bridal makeup for today\'s gorgeous bride! 💄 Natural glam with a touch of sparkle ✨ Perfect for outdoor weddings!',
          images: ['https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=500'],
          user: {
            id: '2',
            firstName: 'Maria',
            lastName: 'Rodriguez',
            profilePictureUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
            isVerified: false,
            isServiceProvider: true,
            businessName: 'Beauty Bliss Makeup',
            serviceCategory: 'Makeup Artist',
          },
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          likesCount: 67,
          commentsCount: 12,
          isLikedByCurrentUser: true,
          isBookmarkedByCurrentUser: true,
          location: 'Santa Monica, CA',
          tags: ['bridal', 'makeup', 'wedding'],
        },
        {
          id: '3',
          content: 'Obsessed with my new gel nails! 💅 The marble effect is everything! Thank you Jessica for the amazing work!',
          images: ['https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500'],
          user: {
            id: '3',
            firstName: 'Emma',
            lastName: 'Davis',
            profilePictureUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
            isVerified: false,
            isServiceProvider: false,
          },
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          likesCount: 23,
          commentsCount: 5,
          isLikedByCurrentUser: false,
          isBookmarkedByCurrentUser: false,
          tags: ['nails', 'gelmanicure', 'marble'],
        },
        {
          id: '4',
          content: 'Fresh cut and style! ✂️ Love working with different textures and creating unique looks for each client.',
          images: ['https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=500'],
          user: {
            id: '4',
            firstName: 'Alex',
            lastName: 'Thompson',
            profilePictureUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
            isVerified: true,
            isServiceProvider: true,
            businessName: 'Modern Cuts Salon',
            serviceCategory: 'Hair Stylist',
          },
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          likesCount: 89,
          commentsCount: 15,
          isLikedByCurrentUser: false,
          isBookmarkedByCurrentUser: false,
          location: 'West Hollywood, CA',
          tags: ['haircut', 'styling', 'texture'],
        },
      ];

      if (isRefresh || pageNum === 1) {
        setPosts(mockPosts);
        setPage(2);
      } else {
        setPosts(prev => [...prev, ...mockPosts]);
        setPage(pageNum + 1);
      }

      setHasMore(mockPosts.length === 10);
    } catch (error) {
      console.error('Error loading social feed:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    loadSocialFeed(1, true);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      loadSocialFeed(page);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const isCurrentlyLiked = likedPosts[postId];
      
      // Optimistic update
      setLikedPosts(prev => ({ ...prev, [postId]: !isCurrentlyLiked }));
      setPostLikes(prev => ({ 
        ...prev, 
        [postId]: (prev[postId] || 0) + (isCurrentlyLiked ? -1 : 1) 
      }));

      // API call would go here
      // await ApiService.toggleLike(postId);
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update
      setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
      setPostLikes(prev => ({ 
        ...prev, 
        [postId]: (prev[postId] || 0) + (likedPosts[postId] ? 1 : -1) 
      }));
    }
  };

  const handleBookmark = async (postId: string) => {
    try {
      const isCurrentlyBookmarked = bookmarkedPosts[postId];
      
      // Optimistic update
      setBookmarkedPosts(prev => ({ ...prev, [postId]: !isCurrentlyBookmarked }));

      // API call would go here
      // await ApiService.toggleBookmark(postId);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert optimistic update
      setBookmarkedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
    }
  };

  const handleComment = (postId: string) => {
    navigation.navigate('PostComments', { postId });
  };

  const handleShare = async (post: PostType) => {
    try {
      // Share functionality would go here
      console.log('Sharing post:', post.id);
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleUserPress = (userId: string, isServiceProvider: boolean = false) => {
    if (isServiceProvider) {
      navigation.navigate('EnhancedProviderProfile', { providerId: userId });
    } else {
      navigation.navigate('UserProfile', { userId });
    }
  };

  const renderPost = ({ item: post }: { item: PostType }) => (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => handleUserPress(post.user?.id || '', post.user?.isServiceProvider)}
        >
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: post.user?.profilePictureUrl || 'https://via.placeholder.com/40' }}
              style={styles.userAvatar}
            />
            {post.user?.isServiceProvider && (
              <View style={styles.providerBadge}>
                <Ionicons name="briefcase" size={12} color={MODERN_COLORS.white} />
              </View>
            )}
          </View>
          <View style={styles.userDetails}>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>
                {post.user?.isServiceProvider 
                  ? post.user.businessName 
                  : post.user ? `${post.user.firstName} ${post.user.lastName}` : 'Unknown User'
                }
              </Text>
              {post.user?.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color={MODERN_COLORS.primary} />
              )}
            </View>
            <View style={styles.postMetadata}>
              <Text style={styles.timeAgo}>{formatTimeAgo(post.createdAt)}</Text>
              {post.user?.isServiceProvider && post.user.serviceCategory && (
                <>
                  <Text style={styles.metadataSeparator}>•</Text>
                  <Text style={styles.serviceCategory}>{post.user.serviceCategory}</Text>
                </>
              )}
              {post.location && (
                <>
                  <Text style={styles.metadataSeparator}>•</Text>
                  <Text style={styles.location}>{post.location}</Text>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={MODERN_COLORS.gray500} />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <View style={styles.postContentSection}>
        <Text style={styles.postText}>
          <Text style={styles.postUsername}>
            {post.user?.isServiceProvider 
              ? post.user.businessName 
              : post.user ? `${post.user.firstName} ${post.user.lastName}` : 'Unknown User'
            }
          </Text>
          {' '}{post.content}
        </Text>
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.map((tag, index) => (
              <TouchableOpacity key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Post Image */}
      {post.images && post.images.length > 0 && (
        <Image source={{ uri: post.images[0] }} style={styles.postImage} />
      )}

      {/* Post Actions */}
      <View style={styles.postActions}>
        <View style={styles.leftActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLike(post.id)}
          >
            <Ionicons 
              name={likedPosts[post.id] || post.isLikedByCurrentUser ? "heart" : "heart-outline"} 
              size={24} 
              color={likedPosts[post.id] || post.isLikedByCurrentUser ? MODERN_COLORS.error : MODERN_COLORS.gray700}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleComment(post.id)}
          >
            <Ionicons name="chatbubble-outline" size={24} color={MODERN_COLORS.gray700} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleShare(post)}
          >
            <Ionicons name="paper-plane-outline" size={24} color={MODERN_COLORS.gray700} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleBookmark(post.id)}
        >
          <Ionicons 
            name={bookmarkedPosts[post.id] || post.isBookmarkedByCurrentUser ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={bookmarkedPosts[post.id] || post.isBookmarkedByCurrentUser ? MODERN_COLORS.warning : MODERN_COLORS.gray700}
          />
        </TouchableOpacity>
      </View>

      {/* Post Stats */}
      <View style={styles.postStats}>
        <TouchableOpacity>
          <Text style={styles.likesCount}>
            {(post.likesCount + (postLikes[post.id] || 0)).toLocaleString()} likes
          </Text>
        </TouchableOpacity>
        {post.commentsCount > 0 && (
          <TouchableOpacity onPress={() => handleComment(post.id)}>
            <Text style={styles.viewComments}>
              View all {post.commentsCount} comments
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={MODERN_COLORS.background} />
      
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoContainer}>
          <LinearGradient
            colors={[MODERN_COLORS.primary, MODERN_COLORS.primaryLight]}
            style={styles.logoGradient}
          >
            <Text style={styles.logoText}>FYLA</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('Search')}
          >
            <Ionicons name="search-outline" size={24} color={MODERN_COLORS.gray700} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('Messages')}
          >
            <Ionicons name="chatbubble-outline" size={24} color={MODERN_COLORS.gray700} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Feed */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={MODERN_COLORS.primary}
            colors={[MODERN_COLORS.primary]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            {isLoading ? (
              <Text style={styles.loadingText}>Loading amazing content...</Text>
            ) : (
              <>
                <Ionicons name="images-outline" size={64} color={MODERN_COLORS.gray400} />
                <Text style={styles.emptyTitle}>No posts yet</Text>
                <Text style={styles.emptyText}>
                  Follow some providers or create your first post!
                </Text>
              </>
            )}
          </View>
        )}
      />

      {/* First-Time User Components */}
      <FirstTimeUserGuide
        visible={showFirstTimeGuide}
        onClose={() => {
          setShowFirstTimeGuide(false);
          firstTimeGuide.setShouldShow(false);
        }}
        userType={userType}
        navigation={navigation}
      />

      <QuickStartGuide
        visible={showQuickStart}
        onClose={() => {
          setShowQuickStart(false);
          quickStartGuide.setShouldShow(false);
        }}
        userType={userType}
        navigation={navigation}
      />

      {/* Smart Tooltips */}
      {smartTooltips.map((tooltip) => (
        <SmartTooltip
          key={tooltip.id}
          {...tooltip}
          onAction={() => {
            if (tooltip.actionText === 'Explore') {
              navigation.navigate('Search');
            }
          }}
        />
      ))}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  
  feedContent: {
    paddingBottom: SPACING.tabBarHeight + SPACING.md,
  },
  
  // Modern Header Design
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: MODERN_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
    ...SHADOWS.sm,
  },
  logoContainer: {
    flex: 1,
  },
  logoGradient: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    alignSelf: 'flex-start',
  },
  logoText: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.white,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  headerButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: MODERN_COLORS.gray50,
  },

  // Post Card Styles
  postCard: {
    backgroundColor: MODERN_COLORS.surface,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.sm,
    ...SHADOWS.sm,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  providerBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: MODERN_COLORS.primary,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: MODERN_COLORS.surface,
  },
  userDetails: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  username: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
  },
  postMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timeAgo: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
  },
  metadataSeparator: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textTertiary,
    marginHorizontal: SPACING.xs,
  },
  serviceCategory: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  location: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textTertiary,
  },
  moreButton: {
    padding: SPACING.xs,
  },
  postImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  
  // Post Content Section
  postContentSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  postUsername: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
  },
  postText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * TYPOGRAPHY.base,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  tag: {
    backgroundColor: MODERN_COLORS.primary + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.lg,
  },
  tagText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  leftActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    padding: SPACING.xs,
  },
  
  // Post Stats
  postStats: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  likesCount: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  viewComments: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default HomeScreen;
