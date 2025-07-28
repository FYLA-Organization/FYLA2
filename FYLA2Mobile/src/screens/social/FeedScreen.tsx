import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { SocialPost, RootStackParamList } from '../../types';
import ApiService from '../../services/api';
import PostCard from '../../components/feed/PostCard';
import StorySection from '../../components/feed/StorySection';
import CreatePostFloatingButton from '../../components/feed/CreatePostFloatingButton';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type FeedScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const FeedScreen: React.FC = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'following' | 'nearby'>('all');
  
  const { user } = useAuth();
  const navigation = useNavigation<FeedScreenNavigationProp>();
  const flatListRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => {
      loadInitialPosts();
    }, [activeFilter])
  );

  const loadInitialPosts = async () => {
    try {
      setIsLoading(true);
      setCurrentPage(1);
      const response = await ApiService.getSocialFeed(1, 20, activeFilter);
      setPosts(response.posts);
      setHasMorePosts(response.hasMore);
    } catch (error) {
      console.error('Error loading initial posts:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (isLoadingMore || !hasMorePosts) return;

    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      const response = await ApiService.getSocialFeed(nextPage, 20, activeFilter);
      
      setPosts(prevPosts => [...prevPosts, ...response.posts]);
      setCurrentPage(nextPage);
      setHasMorePosts(response.hasMore);
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInitialPosts();
    setIsRefreshing(false);
  };

  const handleLikePost = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const isCurrentlyLiked = post.isLikedByCurrentUser;
      
      // Optimistic update
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? {
                ...p,
                isLikedByCurrentUser: !isCurrentlyLiked,
                likesCount: isCurrentlyLiked ? p.likesCount - 1 : p.likesCount + 1
              }
            : p
        )
      );

      if (isCurrentlyLiked) {
        await ApiService.unlikePost(postId);
      } else {
        await ApiService.likePost(postId);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? {
                ...p,
                isLikedByCurrentUser: !p.isLikedByCurrentUser,
                likesCount: p.isLikedByCurrentUser ? p.likesCount - 1 : p.likesCount + 1
              }
            : p
        )
      );
    }
  };

  const handleBookmarkPost = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const isCurrentlyBookmarked = post.isBookmarkByCurrentUser;
      
      // Optimistic update
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { ...p, isBookmarkByCurrentUser: !isCurrentlyBookmarked }
            : p
        )
      );

      if (isCurrentlyBookmarked) {
        await ApiService.unbookmarkPost(postId);
      } else {
        await ApiService.bookmarkPost(postId);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert optimistic update on error
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { ...p, isBookmarkByCurrentUser: !p.isBookmarkByCurrentUser }
            : p
        )
      );
    }
  };

  const handleCommentPress = (postId: string) => {
    navigation.navigate('PostComments', { postId });
  };

  const handleSharePress = (post: SocialPost) => {
    // Implement share functionality
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  const handleProviderPress = (providerId: string) => {
    navigation.navigate('ProviderProfile', { providerId });
  };

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterTab, activeFilter === 'all' && styles.activeFilterTab]}
        onPress={() => setActiveFilter('all')}
      >
        <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>
          Discover
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterTab, activeFilter === 'following' && styles.activeFilterTab]}
        onPress={() => setActiveFilter('following')}
      >
        <Text style={[styles.filterText, activeFilter === 'following' && styles.activeFilterText]}>
          Following
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.filterTab, activeFilter === 'nearby' && styles.activeFilterTab]}
        onPress={() => setActiveFilter('nearby')}
      >
        <Text style={[styles.filterText, activeFilter === 'nearby' && styles.activeFilterText]}>
          Nearby
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPost = ({ item }: { item: SocialPost }) => (
    <PostCard
      post={item}
      onLike={handleLikePost}
      onComment={handleCommentPress}
      onShare={handleSharePress}
      onBookmark={handleBookmarkPost}
      onProviderPress={handleProviderPress}
    />
  );

  const renderHeader = () => (
    <View>
      <StorySection />
      {renderFilterTabs()}
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#FF6B6B" />
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="images-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No posts yet</Text>
      <Text style={styles.emptyText}>
        {activeFilter === 'following' 
          ? 'Follow some providers to see their posts here'
          : 'Be the first to share your beautiful work!'
        }
      </Text>
      {user?.isServiceProvider && (
        <TouchableOpacity 
          style={styles.createPostButton}
          onPress={() => navigation.navigate('CreatePost')}
        >
          <Text style={styles.createPostButtonText}>Create Your First Post</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading amazing content...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#FF6B6B', '#4ECDC4']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>FYLA</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.navigate('Search')}
            >
              <Ionicons name="search-outline" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.navigate('Messages')}
            >
              <Ionicons name="chatbubble-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Feed */}
      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#FF6B6B']}
            tintColor="#FF6B6B"
          />
        }
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={posts.length === 0 ? styles.emptyContentContainer : undefined}
      />

      {/* Create Post Floating Button */}
      {user?.isServiceProvider && (
        <CreatePostFloatingButton 
          onPress={() => navigation.navigate('CreatePost')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 15,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 4,
  },
  activeFilterTab: {
    backgroundColor: '#FF6B6B',
  },
  filterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyContentContainer: {
    flexGrow: 1,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  createPostButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  createPostButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FeedScreen;
