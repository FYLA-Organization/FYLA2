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
import { Post, RootStackParamList } from '../../types';
import ApiService from '../../services/api';
import { MODERN_COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../../constants/modernDesign';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [likedPosts, setLikedPosts] = useState<{ [key: string]: boolean }>({});
  const [postLikes, setPostLikes] = useState<{ [key: string]: number }>({});
  
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();

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
  }, []);

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

      // Mock data for demo
      const mockPosts: Post[] = [
        {
          id: '1',
          content: 'Just finished an amazing balayage transformation! ✨ Loving how the blonde blends seamlessly with the natural brunette base.',
          images: ['https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500'],
          user: {
            id: '1',
            firstName: 'Sarah',
            lastName: 'Johnson',
            profilePictureUrl: 'https://images.unsplash.com/photo-1494790108755-2616b156d9b6?w=150',
            isVerified: true,
          },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          likesCount: 42,
          commentsCount: 8,
          isLikedByCurrentUser: false,
        },
        {
          id: '2',
          content: 'Bridal makeup for today\'s gorgeous bride! 💄 Natural glam with a touch of sparkle ✨',
          images: ['https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=500'],
          user: {
            id: '2',
            firstName: 'Maria',
            lastName: 'Rodriguez',
            profilePictureUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
            isVerified: false,
          },
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          likesCount: 67,
          commentsCount: 12,
          isLikedByCurrentUser: true,
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

  const renderPost = ({ item: post }: { item: Post }) => (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Image 
            source={{ uri: post.user?.profilePictureUrl || 'https://via.placeholder.com/40' }}
            style={styles.userAvatar}
          />
          <View style={styles.userDetails}>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>
                {post.user ? `${post.user.firstName} ${post.user.lastName}` : 'Unknown User'}
              </Text>
              {post.user?.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color={MODERN_COLORS.primary} />
              )}
            </View>
            <Text style={styles.timeAgo}>{formatTimeAgo(post.createdAt)}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={MODERN_COLORS.gray500} />
        </TouchableOpacity>
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
              name={likedPosts[post.id] ? "heart" : "heart-outline"} 
              size={24} 
              color={likedPosts[post.id] ? MODERN_COLORS.error : MODERN_COLORS.gray700}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={24} color={MODERN_COLORS.gray700} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={24} color={MODERN_COLORS.gray700} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="bookmark-outline" size={24} color={MODERN_COLORS.gray700} />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <View style={styles.postContent}>
        <Text style={styles.likesCount}>
          {(post.likesCount + (postLikes[post.id] || 0)).toLocaleString()} likes
        </Text>
        <Text style={styles.postText}>
          <Text style={styles.username}>
            {post.user ? `${post.user.firstName} ${post.user.lastName}` : 'Unknown User'}
          </Text>
          {' '}{post.content}
        </Text>
        {post.commentsCount > 0 && (
          <TouchableOpacity>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
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
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.sm,
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
  timeAgo: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
    marginTop: 2,
  },
  moreButton: {
    padding: SPACING.xs,
  },
  postImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
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
  postContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  likesCount: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  postText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * TYPOGRAPHY.base,
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
