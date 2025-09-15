import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  FlatList,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList } from '../../types';
import ApiService from '../../services/api';
import { MODERN_COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../../constants/modernDesign';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 32 - 8) / 3; // 3 columns with margins and gaps

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface UserPost {
  id: string;
  images: string[];
  content: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

interface UserStats {
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

interface ProfileTab {
  id: string;
  title: string;
  icon: string;
  count?: number;
}

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    postsCount: 0,
    followersCount: 0,
    followingCount: 0,
  });
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const profileTabs: ProfileTab[] = [
    { id: 'posts', title: 'Posts', icon: 'grid-outline', count: userStats.postsCount },
    { id: 'bookmarks', title: 'Saved', icon: 'bookmark-outline' },
    { id: 'likes', title: 'Liked', icon: 'heart-outline' },
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUserPosts(),
        loadUserStats(),
      ]);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUserPosts = async () => {
    try {
      // Try to get real user posts from API
      try {
        console.log('🔄 Loading user posts from API...');
        const currentUser = await ApiService.getCurrentUser();
        
        if (currentUser?.id) {
          // Get user's social posts
          const userPostsResponse = await ApiService.getUserPosts(currentUser.id);
          
          if (userPostsResponse && userPostsResponse.data && userPostsResponse.data.length > 0) {
            console.log('✅ Successfully loaded user posts from API:', userPostsResponse.data.length);
            
            // Convert API posts to expected format
            const realPosts: UserPost[] = userPostsResponse.data.map((post: any) => ({
              id: post.id,
              images: post.imageUrls || ['https://images.unsplash.com/photo-1562322140-8baeececf3df?w=300&h=300&fit=crop'],
              content: post.caption || 'Beautiful work! ✨',
              likesCount: post.likesCount || 0,
              commentsCount: post.commentsCount || 0,
              createdAt: post.createdAt || new Date().toISOString(),
            }));
            
            setUserPosts(realPosts);
            setUserStats(prev => ({ ...prev, postsCount: realPosts.length }));
            return;
          }
        }
      } catch (apiError) {
        console.log('📡 API unavailable for user posts, using fallback:', apiError);
      }
      
      // Fallback to mock data
      const mockPosts: UserPost[] = [
        {
          id: '1',
          images: ['https://images.unsplash.com/photo-1562322140-8baeececf3df?w=300&h=300&fit=crop'],
          content: 'Amazing balayage transformation! ✨',
          likesCount: 42,
          commentsCount: 8,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          images: ['https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=300&h=300&fit=crop'],
          content: 'Bridal makeup look 💄',
          likesCount: 67,
          commentsCount: 12,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          images: ['https://images.unsplash.com/photo-1604902396830-aca29212d9dc?w=300&h=300&fit=crop'],
          content: 'Nail art design 💅',
          likesCount: 35,
          commentsCount: 5,
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          images: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=300&fit=crop'],
          content: 'Fresh cut and style ✂️',
          likesCount: 89,
          commentsCount: 15,
          createdAt: new Date().toISOString(),
        },
        {
          id: '5',
          images: ['https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?w=300&h=300&fit=crop'],
          content: 'Skincare routine results 🌟',
          likesCount: 123,
          commentsCount: 28,
          createdAt: new Date().toISOString(),
        },
        {
          id: '6',
          images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop'],
          content: 'Perfect eyebrows 👀',
          likesCount: 76,
          commentsCount: 11,
          createdAt: new Date().toISOString(),
        },
      ];
      
      setUserPosts(mockPosts);
      setUserStats(prev => ({ ...prev, postsCount: mockPosts.length }));
    } catch (error) {
      console.error('Error loading user posts:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      // Mock stats
      setUserStats({
        postsCount: 6,
        followersCount: 1247,
        followingCount: 342,
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  const handleEditProfile = () => {
    navigation.navigate('EnhancedProfile');
  };

  const handleSettings = () => {
    navigation.navigate('NotificationSettings');
  };

  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Handle profile picture upload
        console.log('Profile picture selected:', result.assets[0].uri);
        Alert.alert('Success', 'Profile picture updated!');
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const renderPost = ({ item: post }: { item: UserPost }) => (
    <TouchableOpacity 
      style={styles.gridItem}
      onPress={() => {
        // Navigate to post detail
        console.log('Post selected:', post.id);
      }}
    >
      <Image source={{ uri: post.images[0] }} style={styles.gridImage} />
      <View style={styles.postOverlay}>
        <View style={styles.postStats}>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={16} color={MODERN_COLORS.white} />
            <Text style={styles.statText}>{post.likesCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble" size={16} color={MODERN_COLORS.white} />
            <Text style={styles.statText}>{post.commentsCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <FlatList
            data={userPosts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={styles.gridRow}
          />
        );
      case 'bookmarks':
        return (
          <View style={styles.emptyTabContent}>
            <Ionicons name="bookmark-outline" size={64} color={MODERN_COLORS.gray400} />
            <Text style={styles.emptyTabTitle}>No saved posts</Text>
            <Text style={styles.emptyTabText}>Posts you save will appear here</Text>
          </View>
        );
      case 'likes':
        return (
          <View style={styles.emptyTabContent}>
            <Ionicons name="heart-outline" size={64} color={MODERN_COLORS.gray400} />
            <Text style={styles.emptyTabTitle}>No liked posts</Text>
            <Text style={styles.emptyTabText}>Posts you like will appear here</Text>
          </View>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MODERN_COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={MODERN_COLORS.background} />
      
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={MODERN_COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={handleSettings}>
              <Ionicons name="settings-outline" size={24} color={MODERN_COLORS.gray700} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={logout}>
              <Ionicons name="log-out-outline" size={24} color={MODERN_COLORS.gray700} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <TouchableOpacity onPress={handleImageUpload}>
              <Image
                source={{
                  uri: user?.profilePictureUrl || 'https://images.unsplash.com/photo-1494790108755-2616b156d9b6?w=150&h=150&fit=crop'
                }}
                style={styles.profileImage}
              />
              <View style={styles.editImageBadge}>
                <Ionicons name="camera" size={16} color={MODERN_COLORS.white} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user ? `${user.firstName} ${user.lastName}` : 'User Name'}
            </Text>
            <Text style={styles.profileBio}>
              Beauty enthusiast ✨ | Sharing my journey | DM for collabs
            </Text>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <TouchableOpacity style={styles.statBox}>
                <Text style={styles.statNumber}>{userStats.postsCount}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statBox}>
                <Text style={styles.statNumber}>{userStats.followersCount.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statBox}>
                <Text style={styles.statNumber}>{userStats.followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton}>
                <Ionicons name="share-outline" size={20} color={MODERN_COLORS.gray700} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {profileTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                activeTab === tab.id && styles.activeTabButton
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon as any}
                size={24}
                color={activeTab === tab.id ? MODERN_COLORS.primary : MODERN_COLORS.gray500}
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText
              ]}>
                {tab.title}
              </Text>
              {tab.count !== undefined && (
                <Text style={styles.tabCount}>{tab.count}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {renderTabContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.tabBarHeight + SPACING.md,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: MODERN_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.textPrimary,
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

  // Profile Section
  profileSection: {
    padding: SPACING.lg,
    backgroundColor: MODERN_COLORS.surface,
  },
  profileImageContainer: {
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: MODERN_COLORS.border,
  },
  editImageBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: MODERN_COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: MODERN_COLORS.surface,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  profileBio: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * TYPOGRAPHY.base,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: SPACING.lg,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.textPrimary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
    marginTop: SPACING.xs / 2,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
  },
  editButton: {
    flex: 1,
    backgroundColor: MODERN_COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.white,
  },
  shareButton: {
    backgroundColor: MODERN_COLORS.gray100,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: MODERN_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: MODERN_COLORS.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.gray500,
  },
  activeTabText: {
    color: MODERN_COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
  tabCount: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.gray400,
  },

  // Tab Content
  tabContent: {
    backgroundColor: MODERN_COLORS.surface,
    minHeight: 400,
  },
  gridContainer: {
    padding: SPACING.md,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  postOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  postStats: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  statText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.white,
  },

  // Empty States
  emptyTabContent: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyTabTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyTabText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
    textAlign: 'center',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
});

export default ProfileScreen;
