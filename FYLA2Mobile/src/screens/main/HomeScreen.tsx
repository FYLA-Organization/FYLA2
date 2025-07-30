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
    loadSocialFeed();
  }, []);

  const loadSocialFeed = async () => {
    try {
      console.log('🔄 Loading social feed...');
      
      // Mock data until backend is working
      const mockPosts: Post[] = [
        {
          id: '1',
          content: 'Just finished an amazing hair transformation! 💇‍♀️✨ Book your appointment today!',
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
          createdAt: new Date().toISOString(),
          likesCount: 24,
          commentsCount: 8,
          bookmarksCount: 3,
          isLikedByCurrentUser: false,
          isBookmarkedByCurrentUser: false,
          comments: []
        },
        {
          id: '2',
          content: 'Beautiful nail art session completed! 💅 Perfect for any occasion.',
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
          createdAt: new Date().toISOString(),
          likesCount: 45,
          commentsCount: 12,
          bookmarksCount: 7,
          isLikedByCurrentUser: true,
          isBookmarkedByCurrentUser: false,
          comments: []
        },
        {
          id: '3',
          content: 'Relaxing massage therapy session. Your wellness is our priority! 🌿',
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
          createdAt: new Date().toISOString(),
          likesCount: 32,
          commentsCount: 5,
          bookmarksCount: 2,
          isLikedByCurrentUser: false,
          isBookmarkedByCurrentUser: true,
          comments: []
        }
      ];

      console.log('✅ Social feed loaded successfully with mock data');
      setPosts(mockPosts);
      
      // Initialize social interaction state
      const initialLikes: { [key: string]: number } = {};
      const initialLikedState: { [key: string]: boolean } = {};
      const initialBookmarkState: { [key: string]: boolean } = {};
      
      mockPosts.forEach((post: Post) => {
        initialLikes[post.id] = post.likesCount || 0;
        initialLikedState[post.id] = post.isLikedByCurrentUser || false;
        initialBookmarkState[post.id] = post.isBookmarkedByCurrentUser || false;
      });
      
      setPostLikes(initialLikes);
      setLikedPosts(initialLikedState);
      setBookmarkedPosts(initialBookmarkState);
    } catch (error: any) {
      console.error('❌ Error loading social feed:', error);
      
      // Fallback to empty array on error
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSocialFeed();
    setRefreshing(false);
  };

  const handlePostPress = (post: Post) => {
    // Navigate to post details or user profile
    console.log('Post pressed:', post.id);
  };

  const handleLikePress = (postId: string) => {
    const isCurrentlyLiked = likedPosts[postId];
    const currentLikes = postLikes[postId] || 0;
    
    // Update like state
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !isCurrentlyLiked
    }));
    
    // Update likes count
    setPostLikes(prev => ({
      ...prev,
      [postId]: isCurrentlyLiked ? currentLikes - 1 : currentLikes + 1
    }));
    
    // Add haptic feedback
    console.log(`${isCurrentlyLiked ? 'Unliked' : 'Liked'} post ${postId}`);
  };

  const handleBookmarkPress = (postId: string) => {
    const isCurrentlyBookmarked = bookmarkedPosts[postId];
    
    // Update bookmark state
    setBookmarkedPosts(prev => ({
      ...prev,
      [postId]: !isCurrentlyBookmarked
    }));
    
    console.log(`${isCurrentlyBookmarked ? 'Removed bookmark' : 'Bookmarked'} post ${postId}`);
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

  const handleCategoryPress = (category: { name: string; icon: string; color: string }) => {
    // For now, navigate to search - could be enhanced later to pass category filter
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

        {/* Feed Content */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          
          {/* Welcome Card */}
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>Hello, {user?.firstName}! 👋</Text>
            <Text style={styles.welcomeSubtitle}>Discover amazing beauty services near you</Text>
          </View>

          {/* Social Feed */}
          {isLoading ? (
            <View style={styles.loadingView}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            posts.map((post) => (
              <View key={post.id} style={styles.feedCard}>
                {/* Post Header */}
                <View style={styles.postHeader}>
                  <TouchableOpacity 
                    style={styles.userInfo}
                    onPress={() => handlePostPress(post)}
                  >
                    <Image
                      source={{ uri: post.user?.profilePictureUrl || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face' }}
                      style={styles.userAvatar}
                    />
                    <View style={styles.userDetails}>
                      <Text style={styles.username}>
                        {post.user ? `${post.user.firstName} ${post.user.lastName}` : 'Beauty Provider'}
                      </Text>
                      <Text style={styles.location}>Professional Service</Text>
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
                        color={likedPosts[post.id] ? COLORS.heart : COLORS.text} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="chatbubble-outline" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="paper-plane-outline" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity 
                    style={styles.bookmarkButton}
                    onPress={() => handleBookmarkPress(post.id)}
                  >
                    <Ionicons 
                      name={bookmarkedPosts[post.id] ? "bookmark" : "bookmark-outline"} 
                      size={24} 
                      color={COLORS.text} 
                    />
                  </TouchableOpacity>
                </View>

                {/* Post Info */}
                <View style={styles.postInfo}>
                  {/* Likes */}
                  <TouchableOpacity style={styles.likesContainer}>
                    <Text style={styles.likesText}>
                      {postLikes[post.id] || post.likesCount || 0} {((postLikes[post.id] || post.likesCount || 0) === 1) ? 'like' : 'likes'}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.description} numberOfLines={3}>
                    <Text style={styles.postUsername}>
                      {post.user ? `${post.user.firstName}${post.user.lastName}`.toLowerCase() : 'beautyProvider'}
                    </Text>
                    {' '}
                    {post.content || 'Check out our amazing beauty services! Book your appointment today for professional care. ✨ #beauty #professional #booktoday'}
                  </Text>
                  
                  {/* Comments */}
                  <TouchableOpacity>
                    <Text style={styles.viewComments}>
                      {post.commentsCount > 0 
                        ? `View all ${post.commentsCount} comments`
                        : 'Add a comment...'
                      }
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Timestamp */}
                  <Text style={styles.timestamp}>
                    {formatTimeAgo(post.createdAt)}
                  </Text>
                </View>
              </View>
            ))
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
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
  
  // Bottom Spacing
  bottomPadding: {
    height: 100,
  },
});

export default HomeScreen;
