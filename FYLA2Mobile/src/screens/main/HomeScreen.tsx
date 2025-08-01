import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  StatusBar,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { Post, RootStackParamList } from '../../types';
import ApiService from '../../services/api';
import ShareModal from '../../components/ShareModal';

const { width } = Dimensions.get('window');

// Instagram-style Color Palette
const COLORS = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#262626',
  textSecondary: '#8E8E8E',
  border: '#DBDBDB',
  borderLight: '#EFEFEF',
  primary: '#3797F0',
  accent: '#FF3040',
  heart: '#FF3040',
  verified: '#3797F0',
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [lastTap, setLastTap] = useState<{ [key: string]: number }>({});
  const [likedPosts, setLikedPosts] = useState<{ [key: string]: boolean }>({});
  const [bookmarkedPosts, setBookmarkedPosts] = useState<{ [key: string]: boolean }>({});
  const [postLikes, setPostLikes] = useState<{ [key: string]: number }>({});
  const [showComments, setShowComments] = useState<string | null>(null);
  const [showShare, setShowShare] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: any[] }>({});
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  // Helper function for Instagram-like time formatting
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

      console.log('🔄 Loading social feed...', { page: pageNum, isRefresh });
      
      // Try to get real data from API
      try {
        const response = await ApiService.getSocialFeed(pageNum, 10, 'all');
        console.log('✅ Social feed API response:', response);
        
        if (response.posts && Array.isArray(response.posts)) {
          const newPosts = response.posts.map((post: any) => ({
            ...post,
            isLikedByCurrentUser: post.isLiked || false,
            isBookmarkedByCurrentUser: post.isBookmarked || false,
            user: post.provider || post.user || {
              id: post.userId,
              firstName: post.userName?.split(' ')[0] || 'Unknown',
              lastName: post.userName?.split(' ')[1] || 'User',
              profilePictureUrl: post.userAvatar,
              isServiceProvider: post.isBusinessPost || false,
            }
          }));

          if (isRefresh || pageNum === 1) {
            setPosts(newPosts);
            setPage(2);
          } else {
            setPosts(prev => [...prev, ...newPosts]);
            setPage(pageNum + 1);
          }
          
          setHasMore(response.hasMore);
          return;
        }
      } catch (apiError) {
        console.log('📡 API unavailable, falling back to mock data');
      }

      // Fallback to enhanced mock data
      const mockPosts: Post[] = [
        {
          id: `mock-${pageNum}-1`,
          content: 'Just finished an amazing hair transformation! 💇‍♀️✨ Book your appointment today! #hairgoals #transformation #beauty',
          imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop',
          isBusinessPost: true,
          userId: 'provider1',
          user: {
            id: 'provider1',
            firstName: 'Sarah',
            lastName: 'Johnson',
            email: 'sarah@salon.com',
            profilePictureUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
            isServiceProvider: true,
            createdAt: new Date().toISOString(),
          },
          createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          likesCount: Math.floor(Math.random() * 100) + 10,
          commentsCount: Math.floor(Math.random() * 20) + 3,
          bookmarksCount: Math.floor(Math.random() * 15) + 1,
          isLikedByCurrentUser: Math.random() > 0.5,
          isBookmarkedByCurrentUser: Math.random() > 0.7,
          comments: []
        },
        {
          id: `mock-${pageNum}-2`,
          content: 'Beautiful nail art session completed! 💅 Perfect for any occasion. DM for bookings! #nailart #beauty #nails',
          imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop',
          isBusinessPost: true,
          userId: 'provider2',
          user: {
            id: 'provider2',
            firstName: 'Maria',
            lastName: 'Rodriguez',
            email: 'maria@nails.com',
            profilePictureUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
            isServiceProvider: true,
            createdAt: new Date().toISOString(),
          },
          createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          likesCount: Math.floor(Math.random() * 100) + 20,
          commentsCount: Math.floor(Math.random() * 25) + 5,
          bookmarksCount: Math.floor(Math.random() * 20) + 2,
          isLikedByCurrentUser: Math.random() > 0.5,
          isBookmarkedByCurrentUser: Math.random() > 0.7,
          comments: []
        },
        {
          id: `mock-${pageNum}-3`,
          content: 'Relaxing massage therapy session. Your wellness is our priority! 🌿 Book now for ultimate relaxation. #massage #wellness #selfcare',
          imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop',
          isBusinessPost: true,
          userId: 'provider3',
          user: {
            id: 'provider3',
            firstName: 'Emma',
            lastName: 'Thompson',
            email: 'emma@spa.com',
            profilePictureUrl: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=40&h=40&fit=crop&crop=face',
            isServiceProvider: true,
            createdAt: new Date().toISOString(),
          },
          createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          likesCount: Math.floor(Math.random() * 80) + 15,
          commentsCount: Math.floor(Math.random() * 15) + 2,
          bookmarksCount: Math.floor(Math.random() * 10) + 1,
          isLikedByCurrentUser: Math.random() > 0.5,
          isBookmarkedByCurrentUser: Math.random() > 0.7,
          comments: []
        }
      ];

      if (isRefresh || pageNum === 1) {
        setPosts(mockPosts);
        setPage(2);
      } else {
        setPosts(prev => [...prev, ...mockPosts]);
        setPage(pageNum + 1);
      }
      
      // Simulate pagination
      setHasMore(pageNum < 5); // Allow 5 pages of mock data

      console.log('✅ Social feed loaded successfully');
      
      // Initialize social interaction state
      const allPosts = isRefresh || pageNum === 1 ? mockPosts : [...posts, ...mockPosts];
      const initialLikes: { [key: string]: number } = {};
      const initialLikedState: { [key: string]: boolean } = {};
      const initialBookmarkState: { [key: string]: boolean } = {};
      
      allPosts.forEach((post: Post) => {
        initialLikes[post.id] = post.likesCount || 0;
        initialLikedState[post.id] = post.isLikedByCurrentUser || false;
        initialBookmarkState[post.id] = post.isBookmarkedByCurrentUser || false;
      });
      
      setPostLikes(prev => ({ ...prev, ...initialLikes }));
      setLikedPosts(prev => ({ ...prev, ...initialLikedState }));
      setBookmarkedPosts(prev => ({ ...prev, ...initialBookmarkState }));
    } catch (error: any) {
      console.error('❌ Error loading social feed:', error);
      
      // Don't clear posts on error if we have existing ones
      if (pageNum === 1) {
        setPosts([]);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    loadSocialFeed(1, true);
  };

  const onEndReached = () => {
    if (hasMore && !loadingMore && !isLoading) {
      loadSocialFeed(page);
    }
  };

  // Enhanced interaction handlers with API calls
  const handleLikePress = async (postId: string) => {
    const isCurrentlyLiked = likedPosts[postId];
    const currentLikes = postLikes[postId] || 0;
    
    // Optimistic update
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !isCurrentlyLiked
    }));
    
    setPostLikes(prev => ({
      ...prev,
      [postId]: isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1
    }));

    // Try to call API
    try {
      if (isCurrentlyLiked) {
        await ApiService.unlikePost(postId);
      } else {
        await ApiService.likePost(postId);
      }
      console.log(`✅ ${isCurrentlyLiked ? 'Unliked' : 'Liked'} post ${postId}`);
    } catch (error) {
      // Revert optimistic update on error
      setLikedPosts(prev => ({
        ...prev,
        [postId]: isCurrentlyLiked
      }));
      
      setPostLikes(prev => ({
        ...prev,
        [postId]: currentLikes
      }));
      
      console.error('❌ Error toggling like:', error);
    }
  };

  const handleBookmarkPress = async (postId: string) => {
    const isCurrentlyBookmarked = bookmarkedPosts[postId];
    
    // Optimistic update
    setBookmarkedPosts(prev => ({
      ...prev,
      [postId]: !isCurrentlyBookmarked
    }));

    // Try to call API
    try {
      if (isCurrentlyBookmarked) {
        await ApiService.unbookmarkPost(postId);
      } else {
        await ApiService.bookmarkPost(postId);
      }
      console.log(`✅ ${isCurrentlyBookmarked ? 'Removed bookmark' : 'Bookmarked'} post ${postId}`);
    } catch (error) {
      // Revert optimistic update on error
      setBookmarkedPosts(prev => ({
        ...prev,
        [postId]: isCurrentlyBookmarked
      }));
      
      console.error('❌ Error toggling bookmark:', error);
    }
  };

  const handleSharePress = (postId: string) => {
    setShowShare(postId);
  };

  const handleCommentPress = (postId: string) => {
    navigation.navigate('PostComments', { postId });
  };

  const handleDoublePress = (postId: string) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    if (lastTap[postId] && now - lastTap[postId] < DOUBLE_PRESS_DELAY) {
      // Double tap to like
      if (!likedPosts[postId]) {
        handleLikePress(postId);
      }
    } else {
      setLastTap(prev => ({ ...prev, [postId]: now }));
    }
  };

  const categories = [
    { name: 'Hair', icon: 'cut-outline', color: '#FF6B6B' },
    { name: 'Nails', icon: 'hand-right-outline', color: '#4ECDC4' },
    { name: 'Makeup', icon: 'brush-outline', color: '#FFE66D' },
    { name: 'Massage', icon: 'body-outline', color: '#A8E6CF' },
    { name: 'Skin Care', icon: 'flower-outline', color: '#DDA0DD' },
    { name: 'Fitness', icon: 'barbell-outline', color: '#FFA07A' },
  ];

  const handleCategoryPress = (category: { name: string; icon: string; color?: string; gradient?: string[]; }) => {
    navigation.navigate('Search');
  };
  
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        
        {/* Instagram-style Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.logoContainer}>
              <Text style={styles.appName}>FYLA</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="heart-outline" size={24} color="#262626" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => navigation.navigate('Messages')}
              >
                <Ionicons name="chatbubble-outline" size={24} color="#262626" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Feed Content */}
        <FlatList
          style={styles.content}
          data={posts}
          renderItem={({ item: post }) => (
            <View style={styles.feedCard}>
              {/* Post Header */}
              <View style={styles.postHeader}>
                <TouchableOpacity 
                  style={styles.userInfo}
                  onPress={() => {
                    // Only navigate to provider profile if the user is a service provider
                    if (post.user?.isServiceProvider) {
                      navigation.navigate('ProviderProfile', { providerId: post.userId });
                    } else {
                      // For regular clients, show an alert or do nothing
                      Alert.alert(
                        'Profile Unavailable', 
                        'This user is a client and does not have a business profile.',
                        [{ text: 'OK' }]
                      );
                    }
                  }}
                >
                  <Image
                    source={{ uri: post.user?.profilePictureUrl || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face' }}
                    style={styles.userAvatar}
                  />
                  <View style={styles.userDetails}>
                    <Text style={styles.username}>
                      {post.user ? `${post.user.firstName} ${post.user.lastName}` : 'Beauty Provider'}
                      {post.user?.isServiceProvider && (
                        <Text style={styles.verifiedBadge}> ✓</Text>
                      )}
                    </Text>
                    <Text style={styles.location}>
                      {post.isBusinessPost ? 'Professional Service' : formatTimeAgo(post.createdAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.moreButton}>
                  <Ionicons name="ellipsis-horizontal" size={16} color="#262626" />
                </TouchableOpacity>
              </View>

              {/* Post Image */}
              <TouchableOpacity 
                onPress={() => handleDoublePress(post.id)}
                activeOpacity={1}
              >
                <Image
                  source={{ uri: post.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop' }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>

              {/* Post Actions */}
              <View style={styles.postActions}>
                <View style={styles.leftActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleLikePress(post.id)}
                  >
                    <Ionicons 
                      name={likedPosts[post.id] ? "heart" : "heart-outline"}
                      size={24} 
                      color={likedPosts[post.id] ? COLORS.heart : "#262626"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleCommentPress(post.id)}
                  >
                    <Ionicons name="chatbubble-outline" size={24} color="#262626" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleSharePress(post.id)}
                  >
                    <Ionicons name="paper-plane-outline" size={24} color="#262626" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity 
                  style={styles.bookmarkButton}
                  onPress={() => handleBookmarkPress(post.id)}
                >
                  <Ionicons 
                    name={bookmarkedPosts[post.id] ? "bookmark" : "bookmark-outline"}
                    size={24} 
                    color="#262626"
                  />
                </TouchableOpacity>
              </View>

              {/* Post Info */}
              <View style={styles.postInfo}>
                <TouchableOpacity style={styles.likesContainer}>
                  <Text style={styles.likesText}>
                    {postLikes[post.id] || 0} likes
                  </Text>
                </TouchableOpacity>
                
                <Text style={styles.postDescription}>
                  <Text style={styles.username}>
                    {post.user ? `${post.user.firstName} ${post.user.lastName}` : 'Beauty Provider'}
                    {post.user?.isServiceProvider && (
                      <Text style={styles.verifiedBadge}> ✓</Text>
                    )}
                  </Text>
                  {' '}{post.content}
                </Text>
                
                {post.commentsCount > 0 && (
                  <TouchableOpacity onPress={() => handleCommentPress(post.id)}>
                    <Text style={styles.viewComments}>
                      View all {post.commentsCount} comments
                    </Text>
                  </TouchableOpacity>
                )}
                
                <Text style={styles.postTime}>
                  {formatTimeAgo(post.createdAt)}
                </Text>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.1}
          ListFooterComponent={() => (
            loadingMore ? (
              <View style={styles.loadingMore}>
                <Text style={styles.loadingText}>Loading more posts...</Text>
              </View>
            ) : null
          )}
          ListHeaderComponent={() => (
            <>
              {/* Stories-style Categories */}
              <View style={styles.storiesSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesScroll}>
                  {categories.map((category, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.storyItem}
                      onPress={() => handleCategoryPress(category)}
                    >
                      <View style={[styles.storyCircle, { borderColor: category.color }]}>
                        <View style={[styles.storyIcon, { backgroundColor: category.color }]}>
                          <Ionicons name={category.icon as any} size={20} color="white" />
                        </View>
                      </View>
                      <Text style={styles.storyText}>{category.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Welcome Card */}
              <View style={styles.welcomeCard}>
                <Text style={styles.welcomeTitle}>Hello, {user?.firstName}! 👋</Text>
                <Text style={styles.welcomeSubtitle}>Discover amazing beauty services near you</Text>
              </View>
            </>
          )}
          ListEmptyComponent={() => (
            isLoading ? (
              <View style={styles.loadingView}>
                <Text style={styles.loadingText}>Loading amazing posts...</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="images-outline" size={64} color={COLORS.textSecondary} />
                <Text style={styles.emptyTitle}>No posts yet</Text>
                <Text style={styles.emptySubtitle}>Follow some providers to see their posts here!</Text>
              </View>
            )
          )}
        />

        {/* Share Modal */}
        <ShareModal
          visible={showShare !== null}
          onClose={() => setShowShare(null)}
          postId={showShare || ''}
          postContent={posts.find(p => p.id === showShare)?.content}
          userName={posts.find(p => p.id === showShare)?.user ? 
            `${posts.find(p => p.id === showShare)?.user?.firstName} ${posts.find(p => p.id === showShare)?.user?.lastName}` 
            : undefined}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  // Base Layout - Instagram Clean White
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Instagram-style Header
  header: {
    paddingTop: 44,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1,
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.8,
    fontFamily: 'System',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  
  // Stories-style Categories Section
  storiesSection: {
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  storiesScroll: {
    paddingHorizontal: 8,
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 75,
  },
  storyCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: COLORS.surface,
  },
  storyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyText: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Feed Content
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Welcome Card
  welcomeCard: {
    backgroundColor: COLORS.surface,
    margin: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '400',
    lineHeight: 20,
  },
  
  // Instagram-style Feed Cards
  feedCard: {
    backgroundColor: COLORS.surface,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // Post Header (like Instagram)
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.borderLight,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  verifiedBadge: {
    color: '#3797F0',
    fontSize: 14,
    fontWeight: '600',
  },
  location: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  moreButton: {
    padding: 8,
  },
  
  // Post Image
  postImage: {
    width: '100%',
    height: 400,
    backgroundColor: '#F7F7F7',
  },
  
  // Post Actions (like Instagram)
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
    padding: 8,
    marginRight: 12,
  },
  bookmarkButton: {
    padding: 8,
  },
  
  // Post Info
  postInfo: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  likesContainer: {
    marginBottom: 8,
  },
  likesText: {
    fontWeight: '600',
    color: COLORS.text,
    fontSize: 14,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 6,
  },
  postUsername: {
    fontWeight: '600',
    color: COLORS.text,
  },
  viewComments: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: '400',
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '400',
    textTransform: 'uppercase',
  },
  viewMore: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  
  // Loading State
  loadingView: {
    padding: 60,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '400',
  },
  loadingMore: {
    padding: 20,
    alignItems: 'center',
  },
  
  // Empty State
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Enhanced Post Styles
  postDescription: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 18,
    marginBottom: 8,
  },
  postTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  
  // Bottom Spacing
  bottomPadding: {
    height: 100,
  },
});

export default HomeScreen;
