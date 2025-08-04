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
import ApiService from '../../services/api';
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
      // Mock data for now since backend might not have these endpoints
      const mockProfile: UserProfile = {
        id: userId,
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe', 
        profilePictureUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        isServiceProvider: false,
        createdAt: new Date().toISOString(),
        displayName: 'John Doe',
        businessCategory: 'Beauty Enthusiast',
        bio: 'Beauty lover | Always trying new looks ✨\nSelf-care advocate 💄\nDM for collabs',
        website: 'johndoe.com',
        locationName: 'Los Angeles, CA',
        postsCount: 42,
        followersCount: 1250,
        followingCount: 890,
        isVerified: true,
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      };

      const mockPosts: SocialPost[] = [
        {
          id: '1',
          userId: userId,
          content: 'New hair color! What do you think? 💙',
          imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=300&fit=crop',
          images: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=300&fit=crop'],
          userAvatar: mockProfile.profileImage,
          userName: mockProfile.displayName,
          isBusinessPost: false,
          likesCount: 45,
          commentsCount: 12,
          bookmarksCount: 3,
          isLikedByCurrentUser: false,
          isBookmarkedByCurrentUser: false,
          createdAt: new Date().toISOString(),
          comments: []
        },
        {
          id: '2',
          userId: userId,
          content: 'Sunday self-care routine ✨',
          imageUrl: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=300&h=300&fit=crop',
          images: ['https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=300&h=300&fit=crop'],
          userAvatar: mockProfile.profileImage,
          userName: mockProfile.displayName,
          isBusinessPost: false,
          likesCount: 67,
          commentsCount: 8,
          bookmarksCount: 15,
          isLikedByCurrentUser: true,
          isBookmarkedByCurrentUser: false,
          createdAt: new Date().toISOString(),
          comments: []
        },
        {
          id: '3',
          userId: userId,
          content: 'Night out makeup look 💄',
          imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop',
          images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop'],
          userAvatar: mockProfile.profileImage,
          userName: mockProfile.displayName,
          isBusinessPost: false,
          likesCount: 89,
          commentsCount: 23,
          bookmarksCount: 7,
          isLikedByCurrentUser: false,
          isBookmarkedByCurrentUser: true,
          createdAt: new Date().toISOString(),
          comments: []
        },
        {
          id: '4',
          userId: userId,
          content: 'Skincare routine essentials',
          imageUrl: 'https://images.unsplash.com/photo-1612178537253-bccd437b730e?w=300&h=300&fit=crop',
          images: ['https://images.unsplash.com/photo-1612178537253-bccd437b730e?w=300&h=300&fit=crop'],
          userAvatar: mockProfile.profileImage,
          userName: mockProfile.displayName,
          isBusinessPost: false,
          likesCount: 34,
          commentsCount: 7,
          bookmarksCount: 12,
          isLikedByCurrentUser: false,
          isBookmarkedByCurrentUser: false,
          createdAt: new Date().toISOString(),
          comments: []
        },
        {
          id: '5',
          userId: userId,
          content: 'Beach waves tutorial',
          imageUrl: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=300&h=300&fit=crop',
          images: ['https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=300&h=300&fit=crop'],
          userAvatar: mockProfile.profileImage,
          userName: mockProfile.displayName,
          isBusinessPost: false,
          likesCount: 78,
          commentsCount: 15,
          bookmarksCount: 9,
          isLikedByCurrentUser: true,
          isBookmarkedByCurrentUser: false,
          createdAt: new Date().toISOString(),
          comments: []
        },
        {
          id: '6',
          userId: userId,
          content: 'Nail art inspiration',
          imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&h=300&fit=crop',
          images: ['https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&h=300&fit=crop'],
          userAvatar: mockProfile.profileImage,
          userName: mockProfile.displayName,
          isBusinessPost: false,
          likesCount: 56,
          commentsCount: 11,
          bookmarksCount: 18,
          isLikedByCurrentUser: false,
          isBookmarkedByCurrentUser: true,
          createdAt: new Date().toISOString(),
          comments: []
        }
      ];
      
      setProfile(mockProfile);
      setPosts(mockPosts);
      setIsFollowing(false); // Mock follow status
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleFollow = async () => {
    try {
      // Mock follow/unfollow functionality
      setIsFollowing(!isFollowing);
      if (profile) {
        const change = isFollowing ? -1 : 1;
        setProfile({ ...profile, followersCount: profile.followersCount + change });
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      Alert.alert('Error', 'Failed to update follow status');
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserProfile();
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
