import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  FlatList,
  TextInput,
  Alert,
  Animated,
  PanGestureHandler,
  GestureHandlerRootView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
  primary: '#3797F0',
  secondary: '#4ECDC4',
  accent: '#FFD93D',
  background: '#000000',
  surface: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#8E8E8E',
  border: '#EFEFEF',
  instagram: '#E1306C',
  heart: '#FF3040',
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  comment: string;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  replies?: Comment[];
}

interface Post {
  id: string;
  userId: string;
  provider: {
    id: string;
    businessName: string;
    profilePictureUrl: string;
    isVerified: boolean;
  };
  imageUrls: string[];
  caption: string;
  location: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
}

interface RouteParams {
  postId: string;
  initialImageIndex?: number;
}

const PostDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { postId, initialImageIndex = 0 } = route.params as RouteParams;
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadPostDetail();
  }, [postId]);

  useEffect(() => {
    if (post) {
      setIsLiked(post.isLiked);
      setIsBookmarked(post.isBookmarked);
      setLikesCount(post.likesCount);
    }
  }, [post]);

  const loadPostDetail = async () => {
    try {
      setLoading(true);
      
      // Mock API calls - replace with actual API
      const [postData, commentsData] = await Promise.all([
        getMockPost(postId),
        getMockComments(postId),
      ]);

      setPost(postData);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Error', 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeToggle = async () => {
    try {
      // Optimistic update
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

      // Animate heart
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // API call would go here
      console.log('Toggle like for post:', postId);
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
    }
  };

  const handleBookmarkToggle = async () => {
    try {
      setIsBookmarked(!isBookmarked);
      // API call would go here
      console.log('Toggle bookmark for post:', postId);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      setIsBookmarked(!isBookmarked);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const comment: Comment = {
        id: Date.now().toString(),
        userId: user?.id || 'current-user',
        userName: user?.firstName + ' ' + user?.lastName || 'You',
        userAvatar: user?.profilePictureUrl || 'https://via.placeholder.com/40',
        comment: newComment.trim(),
        likesCount: 0,
        isLiked: false,
        createdAt: new Date().toISOString(),
      };

      setComments(prev => [comment, ...prev]);
      setNewComment('');
      
      // API call would go here
      console.log('Add comment:', comment);
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const handleShare = () => {
    // Implement share functionality
    Alert.alert('Share', 'Share functionality would be implemented here');
  };

  const handleClosePost = () => {
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
    });
  };

  const renderImageCarousel = () => {
    if (!post || !post.imageUrls.length) return null;

    return (
      <View style={styles.imageContainer}>
        <FlatList
          data={post.imageUrls}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
            setCurrentImageIndex(index);
          }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              activeOpacity={1}
              onPress={() => setShowComments(!showComments)}
            >
              <Image source={{ uri: item }} style={styles.postImage} />
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
        
        {post.imageUrls.length > 1 && (
          <View style={styles.imageIndicators}>
            {post.imageUrls.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentImageIndex && styles.activeIndicator
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <View style={styles.leftActions}>
        <TouchableOpacity onPress={handleLikeToggle} style={styles.actionButton}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={28}
              color={isLiked ? COLORS.heart : COLORS.text}
            />
          </Animated.View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => setShowComments(true)} 
          style={styles.actionButton}
        >
          <Ionicons name="chatbubble-outline" size={26} color={COLORS.text} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
          <Ionicons name="paper-plane-outline" size={26} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity onPress={handleBookmarkToggle} style={styles.actionButton}>
        <Ionicons
          name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
          size={26}
          color={isBookmarked ? COLORS.text : COLORS.text}
        />
      </TouchableOpacity>
    </View>
  );

  const renderPostInfo = () => {
    if (!post) return null;

    return (
      <View style={styles.postInfo}>
        <View style={styles.providerInfo}>
          <Image
            source={{ uri: post.provider.profilePictureUrl }}
            style={styles.providerAvatar}
          />
          <View style={styles.providerDetails}>
            <View style={styles.providerHeader}>
              <Text style={styles.providerName}>{post.provider.businessName}</Text>
              {post.provider.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
              )}
            </View>
            {post.location && (
              <Text style={styles.location}>{post.location}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.followButton}
            onPress={() => navigation.navigate('EnhancedProviderProfile', { providerId: post.provider.id })}
          >
            <Text style={styles.followButtonText}>View Profile</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.likesCount}>
          {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
        </Text>
        
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>
            <Text style={styles.captionUsername}>{post.provider.businessName} </Text>
            {post.caption}
          </Text>
        </View>
        
        {post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.map((tag, index) => (
              <Text key={index} style={styles.tag}>#{tag}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <Image source={{ uri: item.userAvatar }} style={styles.commentAvatar} />
      <View style={styles.commentContent}>
        <Text style={styles.commentText}>
          <Text style={styles.commentUsername}>{item.userName} </Text>
          {item.comment}
        </Text>
        <Text style={styles.commentTime}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity style={styles.commentLikeButton}>
        <Ionicons
          name={item.isLiked ? 'heart' : 'heart-outline'}
          size={16}
          color={item.isLiked ? COLORS.heart : COLORS.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );

  const renderCommentsSection = () => (
    <View style={[styles.commentsSection, { height: showComments ? '50%' : 0 }]}>
      <View style={styles.commentsHeader}>
        <Text style={styles.commentsTitle}>Comments</Text>
        <TouchableOpacity onPress={() => setShowComments(false)}>
          <Ionicons name="chevron-down" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        style={styles.commentsList}
        showsVerticalScrollIndicator={false}
      />
      
      <View style={styles.addCommentContainer}>
        <Image
          source={{ uri: user?.profilePictureUrl || 'https://via.placeholder.com/40' }}
          style={styles.userAvatar}
        />
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          placeholderTextColor={COLORS.textSecondary}
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity
          onPress={handleAddComment}
          disabled={!newComment.trim()}
          style={[styles.sendButton, { opacity: newComment.trim() ? 1 : 0.5 }]}
        >
          <Ionicons name="send" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading || !post) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading post...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <Animated.View 
          style={[
            styles.content,
            { transform: [{ translateY }] }
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClosePost} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Post</Text>
            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {renderImageCarousel()}
          {renderActionButtons()}
          {renderPostInfo()}
          {renderCommentsSection()}
        </Animated.View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

// Mock data functions
const getMockPost = async (postId: string): Promise<Post> => {
  return {
    id: postId,
    userId: 'provider1',
    provider: {
      id: 'provider1',
      businessName: 'Glamour Studio',
      profilePictureUrl: 'https://via.placeholder.com/40',
      isVerified: true,
    },
    imageUrls: [
      'https://via.placeholder.com/400x600',
      'https://via.placeholder.com/400x600/FF6B6B',
      'https://via.placeholder.com/400x600/4ECDC4',
    ],
    caption: 'Bridal transformation complete! ✨ Creating magic for our beautiful bride 💖 What an amazing day of beauty and love! #BridalMakeup #GlamourStudio #BeautyTransformation',
    location: 'Beverly Hills, CA',
    tags: ['bridal', 'makeup', 'transformation', 'beauty', 'wedding'],
    likesCount: 1247,
    commentsCount: 89,
    sharesCount: 23,
    isLiked: false,
    isBookmarked: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  };
};

const getMockComments = async (postId: string): Promise<Comment[]> => {
  return [
    {
      id: '1',
      userId: 'user1',
      userName: 'Sarah Johnson',
      userAvatar: 'https://via.placeholder.com/40',
      comment: 'Absolutely stunning work! The attention to detail is incredible 😍',
      likesCount: 12,
      isLiked: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Emma Davis',
      userAvatar: 'https://via.placeholder.com/40',
      comment: 'This is why I booked with you for my wedding next month! Can\'t wait! 💕',
      likesCount: 8,
      isLiked: true,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
  ];
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
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  postImage: {
    width: screenWidth,
    height: screenWidth,
    resizeMode: 'cover',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  activeIndicator: {
    backgroundColor: COLORS.text,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  leftActions: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    padding: 4,
  },
  postInfo: {
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  providerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  providerDetails: {
    flex: 1,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  location: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.text,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  likesCount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  captionContainer: {
    marginBottom: 8,
  },
  caption: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  captionUsername: {
    fontWeight: '700',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  commentsSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    gap: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentContent: {
    flex: 1,
  },
  commentText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 18,
  },
  commentUsername: {
    fontWeight: '700',
  },
  commentTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  commentLikeButton: {
    padding: 4,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    maxHeight: 80,
  },
  sendButton: {
    padding: 8,
  },
});

export default PostDetailScreen;
