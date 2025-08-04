import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import ApiService from '../../services/apiService';
import { Post, User, RootStackParamList } from '../../types';

interface SocialPost extends Post {
  userAvatar?: string;
  userName?: string;
  images: string[];
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  isServiceProvider: boolean;
  createdAt: string;
  displayName: string;
  businessCategory?: string;
  bio?: string;
  website?: string;
  locationName?: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isVerified: boolean;
  profileImage: string;
}

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
  instagram: '#E1306C',
};

type UserProfileScreenRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;
type UserProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'UserProfile'>;

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 6) / 3; // 3 columns with 2px gaps

const UserProfileScreen: React.FC = () => {
  const route = useRoute<UserProfileScreenRouteProp>();
  const navigation = useNavigation<UserProfileScreenNavigationProp>();
  const { userId } = route.params;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Load user profile and posts from API
      const [userProfileData, userPostsData] = await Promise.all([
        ApiService.getUserProfile(userId),
        ApiService.getUserPosts(userId, 1, 20)
      ]);

      // Transform API data to expected format
      const transformedProfile: UserProfile = {
        id: userProfileData.id || userId,
        email: userProfileData.email || '',
        firstName: userProfileData.firstName || '',
        lastName: userProfileData.lastName || '',
        profilePictureUrl: userProfileData.profilePictureUrl,
        isServiceProvider: userProfileData.isServiceProvider || false,
        createdAt: userProfileData.createdAt || new Date().toISOString(),
        displayName: userProfileData.displayName || `${userProfileData.firstName} ${userProfileData.lastName}`.trim(),
        businessCategory: userProfileData.businessCategory || 'Beauty Enthusiast',
        bio: userProfileData.bio || 'Beauty lover | Always trying new looks ✨\nSelf-care advocate 💄',
        website: userProfileData.website,
        locationName: userProfileData.locationName || userProfileData.location,
        postsCount: userProfileData.postsCount || userPostsData.length,
        followersCount: userProfileData.followersCount || 0,
        followingCount: userProfileData.followingCount || 0,
        isVerified: userProfileData.isVerified || false,
        profileImage: userProfileData.profilePictureUrl || 'https://via.placeholder.com/150',
      };

      // Transform API posts to expected format
      const transformedPosts: SocialPost[] = userPostsData.map((post: any, index: number) => ({
        id: post.id?.toString() || `post-${index}`,
        userId: post.userId || userId,
        content: post.content || post.caption || '',
        imageUrl: post.imageUrl || `https://picsum.photos/300/300?random=${index + 400}`,
        images: post.images || [post.imageUrl || `https://picsum.photos/300/300?random=${index + 400}`],
        userAvatar: transformedProfile.profileImage,
        userName: transformedProfile.displayName,
        isBusinessPost: post.isBusinessPost || false,
        likesCount: post.likesCount || Math.floor(Math.random() * 100) + 10,
        commentsCount: post.commentsCount || Math.floor(Math.random() * 20) + 2,
        bookmarksCount: post.bookmarksCount || Math.floor(Math.random() * 30) + 1,
        isLikedByCurrentUser: post.isLikedByCurrentUser || false,
        isBookmarkedByCurrentUser: post.isBookmarkedByCurrentUser || false,
        createdAt: post.createdAt || new Date().toISOString(),
        comments: post.comments || []
      }));

      // If no posts from API, add some placeholder posts
      if (transformedPosts.length === 0) {
        const placeholderPosts: SocialPost[] = [
          {
            id: 'placeholder-1',
            userId: userId,
            content: 'Welcome to my profile! 💄✨',
            imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=300&fit=crop',
            images: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=300&fit=crop'],
            userAvatar: transformedProfile.profileImage,
            userName: transformedProfile.displayName,
            isBusinessPost: false,
            likesCount: 45,
            commentsCount: 12,
            bookmarksCount: 3,
            isLikedByCurrentUser: false,
            isBookmarkedByCurrentUser: false,
            createdAt: new Date().toISOString(),
            comments: []
          }
        ];
        setPosts(placeholderPosts);
      } else {
        setPosts(transformedPosts);
      }

      setProfile(transformedProfile);

      // Load follow status
      try {
        const followStatus = await ApiService.getFollowStatus(userId);
        setIsFollowing(followStatus.isFollowing);
      } catch (error) {
        console.error('Error loading follow status:', error);
        setIsFollowing(false);
      }

    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // Fallback to mock data if API fails
      const mockProfile: UserProfile = {
        id: userId,
        email: 'user@example.com',
        firstName: 'User',
        lastName: 'Profile',
        profilePictureUrl: 'https://via.placeholder.com/150',
        isServiceProvider: false,
        createdAt: new Date().toISOString(),
        displayName: 'User Profile',
        businessCategory: 'Beauty Enthusiast',
        bio: 'Beauty lover | Always trying new looks ✨\nSelf-care advocate 💄',
        website: undefined,
        locationName: 'Location Unknown',
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
        isVerified: false,
        profileImage: 'https://via.placeholder.com/150'
      };

      setProfile(mockProfile);
      setPosts([]);
      Alert.alert('Error', 'Failed to load user profile. Showing offline data.');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await ApiService.unfollowUser(userId);
        setIsFollowing(false);
        if (profile) {
          setProfile({ ...profile, followersCount: Math.max(0, profile.followersCount - 1) });
        }
      } else {
        await ApiService.followUser(userId);
        setIsFollowing(true);
        if (profile) {
          setProfile({ ...profile, followersCount: profile.followersCount + 1 });
        }
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      Alert.alert('Error', 'Failed to update follow status');
      // Revert optimistic update on error
      setIsFollowing(!isFollowing);
    }
  };

  const handleMessage = () => {
    navigation.navigate('Messages');
  };

  const handleBooking = () => {
    if (profile?.isServiceProvider) {
      navigation.navigate('EnhancedProviderProfile', { providerId: userId });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const renderGridPost = ({ item }: { item: SocialPost }) => (
    <TouchableOpacity 
      style={styles.gridItem}
      onPress={() => navigation.navigate('PostComments', { postId: item.id })}
    >
      <Image source={{ uri: item.images[0] }} style={styles.gridImage} />
      {item.images.length > 1 && (
        <View style={styles.multiplePhotosIcon}>
          <Ionicons name="copy" size={16} color="white" />
        </View>
      )}
      <View style={styles.postStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={12} color="white" />
          <Text style={styles.statText}>{item.likesCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble" size={12} color="white" />
          <Text style={styles.statText}>{item.commentsCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <View style={styles.container}>
        {/* Instagram-style Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{profile.displayName}</Text>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Instagram-style Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileHeader}>
              {/* Profile Image */}
              <View style={styles.profileImageContainer}>
                <LinearGradient
                  colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
                  style={styles.gradientBorder}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.profileImageInner}>
                    <Image source={{ uri: profile.profileImage }} style={styles.profileImage} />
                  </View>
                </LinearGradient>
                {profile.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.verified} />
                  </View>
                )}
              </View>

              {/* Stats */}
              <View style={styles.statsContainer}>
                <TouchableOpacity style={styles.statItem}>
                  <Text style={styles.statNumber}>{profile.postsCount}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statItem}>
                  <Text style={styles.statNumber}>{profile.followersCount.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statItem}>
                  <Text style={styles.statNumber}>{profile.followingCount.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Profile Info */}
            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>{profile.displayName}</Text>
              {profile.businessCategory && (
                <Text style={styles.businessCategory}>{profile.businessCategory}</Text>
              )}
              {profile.bio && (
                <Text style={styles.bio}>{profile.bio}</Text>
              )}
              {profile.website && (
                <TouchableOpacity>
                  <Text style={styles.website}>{profile.website}</Text>
                </TouchableOpacity>
              )}
              {profile.locationName && (
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.location}>{profile.locationName}</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.followButton, isFollowing && styles.followingButton]}
                onPress={handleFollow}
              >
                <Text style={[styles.actionButtonText, isFollowing && styles.followingButtonText]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.messageButton]}
                onPress={handleMessage}
              >
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>

              {profile.isServiceProvider && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.bookButton]}
                  onPress={handleBooking}
                >
                  <Text style={styles.actionButtonText}>Book</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Posts Grid */}
          <View style={styles.postsSection}>
            <FlatList
              data={posts}
              renderItem={renderGridPost}
              numColumns={3}
              scrollEnabled={false}
              contentContainerStyle={styles.postsGrid}
              ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
              columnWrapperStyle={styles.row}
            />
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
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  
  // Instagram-style Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 44,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  moreButton: {
    padding: 8,
  },
  
  scrollContainer: {
    flex: 1,
  },
  
  // Instagram-style Profile Section
  profileSection: {
    backgroundColor: COLORS.surface,
    paddingBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 16,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 20,
  },
  gradientBorder: {
    width: 94,
    height: 94,
    borderRadius: 47,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 1,
  },
  
  // Stats Section
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  
  // Profile Info
  profileInfo: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  businessCategory: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 18,
    marginBottom: 4,
  },
  website: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  location: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButton: {
    backgroundColor: COLORS.primary,
  },
  followingButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bookButton: {
    backgroundColor: COLORS.instagram,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
  },
  followingButtonText: {
    color: COLORS.text,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  
  // Posts Grid
  postsSection: {
    backgroundColor: COLORS.surface,
    marginTop: 8,
  },
  postsGrid: {
    paddingTop: 2,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.borderLight,
  },
  multiplePhotosIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    padding: 2,
  },
  postStats: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 12,
  },
  statText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
    marginLeft: 2,
  },
});

export default UserProfileScreen;
