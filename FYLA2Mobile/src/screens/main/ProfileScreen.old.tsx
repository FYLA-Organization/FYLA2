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
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList, Post } from '../../types';
import { COLORS } from '../../constants/colors';
import ApiService from '../../services/api';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface UserPost extends Post {
  images: string[];
  userAvatar?: string;
  userName?: string;
}

interface UserStats {
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 48) / 3; // 3 columns with 16px margin on each side + 8px gaps between items

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    postsCount: 0,
    followersCount: 0,
    followingCount: 0,
  });
  const [selectedView, setSelectedView] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

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
      if (user?.id) {
        // Try to get user's posts from API
        const response = await ApiService.getUserPosts(user.id, 1, 20);
        
        if (response.data && Array.isArray(response.data)) {
          const posts = response.data.map((post: any, index: number) => ({
            ...post,
            images: post.imageUrls || [post.imageUrl || `https://images.unsplash.com/photo-${1560066984138 + index}?w=300&h=300&fit=crop`],
            userAvatar: user?.profilePictureUrl,
            userName: `${user?.firstName} ${user?.lastName}`,
          }));
          setUserPosts(posts);
        } else {
          // Fallback to all posts if user posts endpoint doesn't exist
          const allPostsResponse = await ApiService.getPosts(1, 20);
          if (allPostsResponse.data && Array.isArray(allPostsResponse.data)) {
            const posts = allPostsResponse.data.slice(0, 12).map((post: any, index: number) => ({
              ...post,
              images: post.imageUrls || [post.imageUrl || `https://images.unsplash.com/photo-${1560066984138 + index}?w=300&h=300&fit=crop`],
              userAvatar: user?.profilePictureUrl,
              userName: `${user?.firstName} ${user?.lastName}`,
            }));
            setUserPosts(posts);
          } else {
            setUserPosts(generateMockPosts());
          }
        }
      } else {
        setUserPosts(generateMockPosts());
      }
    } catch (error) {
      console.error('Error loading user posts:', error);
      // Fallback to mock data
      setUserPosts(generateMockPosts());
    }
  };

  const loadUserStats = async () => {
    try {
      if (user?.id) {
        // Use the new real social stats API
        const socialStats = await ApiService.getUserSocialStats(user.id);
        setUserStats({
          postsCount: socialStats.postsCount,
          followersCount: socialStats.followersCount,
          followingCount: socialStats.followingCount,
        });
      } else {
        // Fallback to basic stats when API unavailable
        setUserStats({
          postsCount: 0,
          followersCount: 0,
          followingCount: 0,
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
      // Fallback to basic stats on error
      setUserStats({
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
      });
    }
  };

  const generateMockPosts = (): UserPost[] => {
    const mockImages = [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1612178537253-bccd437b730e?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=300&h=300&fit=crop',
      'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&h=300&fit=crop',
    ];

    // Return fewer, more realistic fallback posts when API is unavailable
    return Array.from({ length: 6 }, (_, index) => ({
      id: `fallback-${index + 1}`,
      userId: user?.id || '',
      content: `Post ${index + 1}`,
      imageUrl: mockImages[index % mockImages.length],
      images: [mockImages[index % mockImages.length]],
      userAvatar: user?.profilePictureUrl,
      userName: `${user?.firstName} ${user?.lastName}`,
      isBusinessPost: false,
      likesCount: 0,
      commentsCount: 0,
      bookmarksCount: 0,
      isLikedByCurrentUser: false,
      isBookmarkedByCurrentUser: false,
      createdAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
      comments: []
    }));
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUpdateProfilePicture = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need camera permissions to update your profile picture');
        return;
      }

      // Show options for camera or gallery
      Alert.alert(
        'Update Profile Picture',
        'Choose how you want to update your profile picture',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              const cameraResult = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!cameraResult.canceled && cameraResult.assets[0]) {
                await uploadProfilePicture(cameraResult.assets[0].uri);
              }
            }
          },
          {
            text: 'Choose from Gallery',
            onPress: async () => {
              const galleryResult = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!galleryResult.canceled && galleryResult.assets[0]) {
                await uploadProfilePicture(galleryResult.assets[0].uri);
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Error accessing camera/gallery:', error);
      Alert.alert('Error', 'Failed to access camera or gallery');
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    try {
      setLoading(true);
      console.log('📤 Uploading profile picture...');
      
      const updatedImageUrl = await ApiService.updateProfilePicture(imageUri);
      
      console.log('✅ Profile picture updated:', updatedImageUrl);
      Alert.alert('Success!', 'Your profile picture has been updated successfully!');
      
      // Refresh user data to show the new image
      await loadUserData();
    } catch (error) {
      console.error('❌ Error updating profile picture:', error);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderGridPost = ({ item }: { item: UserPost }) => (
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

  const renderListPost = ({ item }: { item: UserPost }) => (
    <TouchableOpacity 
      style={styles.listPostCard}
      onPress={() => navigation.navigate('PostComments', { postId: item.id })}
    >
      <Image source={{ uri: item.images[0] }} style={styles.listPostImage} />
      <View style={styles.listPostContent}>
        <Text style={styles.listPostText} numberOfLines={2}>
          {item.content}
        </Text>
        <View style={styles.listPostStats}>
          <View style={styles.listPostStat}>
            <Ionicons name="heart" size={16} color={COLORS.accent} />
            <Text style={styles.listPostStatText}>{item.likesCount}</Text>
          </View>
          <View style={styles.listPostStat}>
            <Ionicons name="chatbubble" size={16} color={COLORS.textSecondary} />
            <Text style={styles.listPostStatText}>{item.commentsCount}</Text>
          </View>
          <View style={styles.listPostStat}>
            <Ionicons name="bookmark" size={16} color={COLORS.textSecondary} />
            <Text style={styles.listPostStatText}>{item.bookmarksCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const menuItems = [
    { icon: 'person-outline', title: 'Enhanced Profile', subtitle: 'Complete profile with preferences', onPress: () => navigation.navigate('EnhancedProfile') },
    { icon: 'create-outline', title: 'Edit Basic Info', subtitle: 'Update your information', onPress: () => console.log('Edit Profile') },
    { icon: 'heart-outline', title: 'Following & Bookmarks', subtitle: 'Manage your connections', onPress: () => navigation.navigate('FollowingBookmarks') },
    { icon: 'card-outline', title: 'Payment Methods', subtitle: 'Manage your cards', onPress: () => console.log('Payment Methods') },
    { icon: 'notifications-outline', title: 'Notifications', subtitle: 'Customize alerts', onPress: () => navigation.navigate('NotificationSettings') },
    { icon: 'help-circle-outline', title: 'Help & Support', subtitle: 'Get assistance', onPress: () => console.log('Help & Support') },
    { icon: 'information-circle-outline', title: 'About', subtitle: 'App version & info', onPress: () => console.log('About') },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <View style={styles.container}>
        {/* Header with Options */}
        <View style={styles.topHeader}>
          <Text style={styles.screenTitle}>{user?.firstName}'s Profile</Text>
          <TouchableOpacity 
            style={styles.optionsButton}
            onPress={() => setShowOptionsModal(true)}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Instagram-style Header */}
          <View style={styles.header}>
            <View style={styles.profileSection}>
              <View style={styles.profileImageContainer}>
                <LinearGradient
                  colors={[COLORS.accent, COLORS.primary, COLORS.primaryDark]} // Updated with shared colors
                  style={styles.gradientBorder}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.profileImageInner}>
                    <Image
                      source={{
                        uri: user?.profilePictureUrl || 'https://via.placeholder.com/140',
                      }}
                      style={styles.profileImage}
                    />
                  </View>
                </LinearGradient>
                <TouchableOpacity 
                  style={styles.editImageButton}
                  onPress={handleUpdateProfilePicture}
                >
                  <Ionicons name="camera" size={16} color={COLORS.surface} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              
              {user?.isServiceProvider && (
                <View style={styles.providerBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.surface} />
                  <Text style={styles.providerText}>Service Provider</Text>
                </View>
              )}

              {/* Instagram-style stats */}
              <View style={styles.statsContainer}>
                <TouchableOpacity style={styles.statItem}>
                  <Text style={styles.statNumber}>{userStats.postsCount}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statItem}>
                  <Text style={styles.statNumber}>{userStats.followersCount.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statItem}>
                  <Text style={styles.statNumber}>{userStats.followingCount.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </TouchableOpacity>
              </View>

              {/* View Toggle */}
              <View style={styles.viewToggle}>
                <TouchableOpacity
                  style={[styles.viewButton, selectedView === 'grid' && styles.activeViewButton]}
                  onPress={() => setSelectedView('grid')}
                >
                  <Ionicons
                    name="grid-outline"
                    size={20}
                    color={selectedView === 'grid' ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text style={[styles.viewButtonText, selectedView === 'grid' && styles.activeViewButtonText]}>
                    Grid
                  </Text>
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
                  <Text style={[styles.viewButtonText, selectedView === 'list' && styles.activeViewButtonText]}>
                    List
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Posts Section */}
          <View style={styles.postsSection}>
            <Text style={styles.sectionTitle}>My Posts</Text>
            {userPosts.length > 0 ? (
              <FlatList
                data={userPosts}
                renderItem={selectedView === 'grid' ? renderGridPost : renderListPost}
                numColumns={selectedView === 'grid' ? 3 : 1}
                key={selectedView} // Force re-render when view changes
                scrollEnabled={false}
                contentContainerStyle={selectedView === 'grid' ? styles.postsGrid : styles.postsListContainer}
                ItemSeparatorComponent={() => <View style={{ height: selectedView === 'grid' ? 0 : 12 }} />}
                columnWrapperStyle={selectedView === 'grid' ? styles.row : undefined}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="images-outline" size={64} color={COLORS.textSecondary} />
                <Text style={styles.emptyStateText}>No posts yet</Text>
                <Text style={styles.emptyStateSubtext}>Share your first moment!</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Options Modal */}
        <Modal
          visible={showOptionsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowOptionsModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowOptionsModal(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Account Options</Text>
                <TouchableOpacity onPress={() => setShowOptionsModal(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.optionsContainer}>
                {menuItems.map((item, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.optionItem} 
                    onPress={() => {
                      setShowOptionsModal(false);
                      item.onPress();
                    }}
                  >
                    <View style={styles.optionIcon}>
                      <Ionicons name={item.icon as any} size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>{item.title}</Text>
                      <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                ))}
                
                {/* Logout in Modal */}
                <TouchableOpacity 
                  style={styles.logoutOption}
                  onPress={() => {
                    setShowOptionsModal(false);
                    handleLogout();
                  }}
                >
                  <View style={styles.logoutIconContainer}>
                    <Ionicons name="log-out-outline" size={20} color={COLORS.accent} />
                  </View>
                  <Text style={styles.logoutOptionText}>Sign Out</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  // Base Layout
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Top Header
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  optionsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Header Section
  header: {
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 24,
    backgroundColor: COLORS.surface,
  },
  profileSection: {
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  gradientBorder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageInner: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  editImageButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  userName: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.verified,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: COLORS.verified,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  providerText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  
  // Instagram-style Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
    marginTop: 20,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },

  // View Toggle
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 25,
    padding: 4,
    marginTop: 10,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 2,
    gap: 6,
  },
  activeViewButton: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeViewButtonText: {
    color: COLORS.primary,
  },

  // Posts Section
  postsSection: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    paddingTop: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    paddingHorizontal: 20,
    letterSpacing: -0.3,
  },

  // Grid View - Fixed layout
  postsGrid: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
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

  // List View
  postsListContainer: {
    paddingHorizontal: 16,
  },
  listPostCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  listPostImage: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.borderLight,
  },
  listPostContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  listPostText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 18,
    marginBottom: 8,
  },
  listPostStats: {
    flexDirection: 'row',
    gap: 16,
  },
  listPostStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listPostStatText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  optionsContainer: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  logoutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 10,
    backgroundColor: COLORS.background,
  },
  logoutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  logoutOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
  },
});

export default ProfileScreen;
