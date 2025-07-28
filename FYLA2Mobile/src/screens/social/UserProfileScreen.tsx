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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService } from '../../services/api';
import { SocialPost, UserProfile } from '../../types';
import { RootStackParamList } from '../../types/navigation';

type UserProfileScreenRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;
type UserProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'UserProfile'>;

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 48) / 3; // 3 columns with 16px margins

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
      const [profileResponse, postsResponse, followResponse] = await Promise.all([
        apiService.getUserProfile(userId),
        apiService.getUserPosts(userId),
        apiService.checkFollowStatus(userId),
      ]);
      
      setProfile(profileResponse.data);
      setPosts(postsResponse.data);
      setIsFollowing(followResponse.data.isFollowing);
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
      if (isFollowing) {
        await apiService.unfollowUser(userId);
        setIsFollowing(false);
        if (profile) {
          setProfile({ ...profile, followersCount: profile.followersCount - 1 });
        }
      } else {
        await apiService.followUser(userId);
        setIsFollowing(true);
        if (profile) {
          setProfile({ ...profile, followersCount: profile.followersCount + 1 });
        }
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleMessage = () => {
    if (profile) {
      navigation.navigate('Chat', { 
        userId: profile.id, 
        user: { 
          id: profile.id, 
          name: profile.displayName,
          avatar: profile.profileImage 
        } 
      });
    }
  };

  const handleBooking = () => {
    if (profile?.isServiceProvider) {
      navigation.navigate('ProviderDetails', { providerId: userId });
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
      onPress={() => navigation.navigate('PostDetails', { postId: item.id })}
    >
      <Image source={{ uri: item.images[0] }} style={styles.gridImage} />
      {item.images.length > 1 && (
        <View style={styles.multiplePhotosIcon}>
          <Ionicons name="copy" size={16} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderListPost = ({ item }: { item: SocialPost }) => (
    <View style={styles.listPost}>
      <View style={styles.postHeader}>
        <Image source={{ uri: item.userAvatar }} style={styles.postUserAvatar} />
        <View style={styles.postUserInfo}>
          <Text style={styles.postUserName}>{item.userName}</Text>
          <Text style={styles.postDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
      <Text style={styles.postContent}>{item.content}</Text>
      {item.images.length > 0 && (
        <Image source={{ uri: item.images[0] }} style={styles.listPostImage} />
      )}
      <View style={styles.postStats}>
        <Text style={styles.statText}>{item.likesCount} likes</Text>
        <Text style={styles.statText}>{item.commentsCount} comments</Text>
      </View>
    </View>
  );

  if (loading || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile.displayName}</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Profile Info */}
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <Image source={{ uri: profile.profileImage }} style={styles.profileImage} />
          {profile.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
            </View>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.postsCount}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      </View>

      {/* Bio */}
      <View style={styles.bioSection}>
        <Text style={styles.displayName}>{profile.displayName}</Text>
        {profile.isServiceProvider && (
          <Text style={styles.businessCategory}>{profile.businessCategory}</Text>
        )}
        <Text style={styles.bio}>{profile.bio}</Text>
        {profile.location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.location}>{profile.location}</Text>
          </View>
        )}
        {profile.website && (
          <TouchableOpacity style={styles.websiteContainer}>
            <Ionicons name="link-outline" size={16} color="#007AFF" />
            <Text style={styles.website}>{profile.website}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {profile.isServiceProvider ? (
          <>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleBooking}
            >
              <Text style={styles.primaryButtonText}>Book Now</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, isFollowing ? styles.followingButton : styles.followButton]}
              onPress={handleFollow}
            >
              <Text style={isFollowing ? styles.followingButtonText : styles.followButtonText}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={[styles.actionButton, isFollowing ? styles.followingButton : styles.followButton]}
              onPress={handleFollow}
            >
              <Text style={isFollowing ? styles.followingButtonText : styles.followButtonText}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.messageButton]}
              onPress={handleMessage}
            >
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Posts Section */}
      <View style={styles.postsSection}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'grid' && styles.activeTab]}
            onPress={() => setActiveTab('grid')}
          >
            <Ionicons name="grid-outline" size={24} color={activeTab === 'grid' ? '#000' : '#666'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'list' && styles.activeTab]}
            onPress={() => setActiveTab('list')}
          >
            <Ionicons name="list-outline" size={24} color={activeTab === 'list' ? '#000' : '#666'} />
          </TouchableOpacity>
        </View>

        {activeTab === 'grid' ? (
          <FlatList
            data={posts}
            renderItem={renderGridPost}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.gridContainer}
          />
        ) : (
          <FlatList
            data={posts}
            renderItem={renderListPost}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  moreButton: {
    padding: 8,
  },
  profileSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  bioSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  displayName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  websiteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  website: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  followButton: {
    backgroundColor: '#007AFF',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  followingButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  followingButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  messageButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  messageButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  postsSection: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  gridContainer: {
    padding: 2,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    margin: 1,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  multiplePhotosIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  listContainer: {
    padding: 16,
  },
  listPost: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  postUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  postUserInfo: {
    flex: 1,
  },
  postUserName: {
    fontSize: 14,
    fontWeight: '600',
  },
  postDate: {
    fontSize: 12,
    color: '#666',
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  listPostImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
});

export default UserProfileScreen;
