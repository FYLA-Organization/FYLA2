import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SocialPost } from '../../types';

const { width: screenWidth } = Dimensions.get('window');

interface PostCardProps {
  post: SocialPost;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (post: SocialPost) => void;
  onBookmark: (postId: string) => void;
  onProviderPress: (providerId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onProviderPress,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoadError, setImageLoadError] = useState(false);

  const handleImageError = () => {
    setImageLoadError(true);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  const renderImageCarousel = () => {
    if (!post.imageUrls || post.imageUrls.length === 0) {
      return (
        <View style={styles.noImagePlaceholder}>
          <Ionicons name="image-outline" size={40} color="#ccc" />
          <Text style={styles.noImageText}>No image available</Text>
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
            setCurrentImageIndex(newIndex);
          }}
        >
          {post.imageUrls.map((imageUrl, index) => (
            <View key={index} style={styles.imageWrapper}>
              {imageLoadError ? (
                <View style={styles.imageErrorContainer}>
                  <Ionicons name="image-outline" size={40} color="#ccc" />
                  <Text style={styles.imageErrorText}>Failed to load image</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.postImage}
                  resizeMode="cover"
                  onError={handleImageError}
                />
              )}
            </View>
          ))}
        </ScrollView>
        
        {/* Image indicators */}
        {post.imageUrls.length > 1 && (
          <View style={styles.imageIndicators}>
            {post.imageUrls.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.imageIndicator,
                  index === currentImageIndex && styles.activeImageIndicator,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderServiceTags = () => {
    if (!post.serviceCategories || post.serviceCategories.length === 0) return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.serviceTagsContainer}
        contentContainerStyle={styles.serviceTagsContent}
      >
        {post.serviceCategories.map((category, index) => (
          <View key={index} style={styles.serviceTag}>
            <Text style={styles.serviceTagText}>{category}</Text>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderHashtags = () => {
    if (!post.tags || post.tags.length === 0) return null;

    return (
      <View style={styles.hashtagsContainer}>
        {post.tags.map((tag, index) => (
          <Text key={index} style={styles.hashtag}>
            #{tag}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.providerInfo}
          onPress={() => {
            // Only navigate if the user is a service provider
            if (post.user?.isServiceProvider) {
              const providerId = post.userId || post.providerId;
              if (providerId) {
                onProviderPress(providerId);
              }
            } else {
              Alert.alert(
                'Profile Unavailable', 
                'This user is a client and does not have a business profile.',
                [{ text: 'OK' }]
              );
            }
          }}
        >
          <Image
            source={{
              uri: post.user?.profilePictureUrl || post.provider?.profilePictureUrl || 'https://via.placeholder.com/40x40?text=👤'
            }}
            style={styles.providerAvatar}
          />
          <View style={styles.providerDetails}>
            <Text style={styles.providerName}>
              {post.user ? `${post.user.firstName} ${post.user.lastName}` : 
               post.provider?.businessName || 'User'}
              {post.user?.isServiceProvider && (
                <Text style={styles.verifiedBadge}> ✓</Text>
              )}
            </Text>
            <View style={styles.locationTimeContainer}>
              {post.location && (
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={12} color="#666" />
                  <Text style={styles.locationText}>{post.location}</Text>
                </View>
              )}
              <Text style={styles.timeAgo}>{formatTimeAgo(post.createdAt)}</Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Image Carousel */}
      {renderImageCarousel()}

      {/* Service Tags */}
      {renderServiceTags()}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onLike(post.id)}
          >
            <Ionicons
              name={post.isLikedByCurrentUser ? "heart" : "heart-outline"}
              size={24}
              color={post.isLikedByCurrentUser ? "#FF6B6B" : "#333"}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onComment(post.id)}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onShare(post)}
          >
            <Ionicons name="paper-plane-outline" size={22} color="#333" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onBookmark(post.id)}
        >
          <Ionicons
            name={post.isBookmarkByCurrentUser ? "bookmark" : "bookmark-outline"}
            size={22}
            color={post.isBookmarkByCurrentUser ? "#FF6B6B" : "#333"}
          />
        </TouchableOpacity>
      </View>

      {/* Likes and Comments Count */}
      <View style={styles.engagementContainer}>
        {post.likesCount > 0 && (
          <Text style={styles.likesText}>
            {post.likesCount} {post.likesCount === 1 ? 'like' : 'likes'}
          </Text>
        )}
        
        {post.commentsCount > 0 && (
          <TouchableOpacity onPress={() => onComment(post.id)}>
            <Text style={styles.commentsText}>
              View all {post.commentsCount} comments
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Caption */}
      {post.caption && (
        <View style={styles.captionContainer}>
          <Text style={styles.captionText}>
            <Text style={styles.providerUsername}>
              {post.user ? `${post.user.firstName} ${post.user.lastName}` : 
               post.provider?.businessName || 'User'}
            </Text>
            {' '}{post.caption}
          </Text>
        </View>
      )}

      {/* Hashtags */}
      {renderHashtags()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  verifiedBadge: {
    color: '#3797F0',
    fontSize: 16,
    fontWeight: '600',
  },
  locationTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
  },
  moreButton: {
    padding: 8,
  },
  imageContainer: {
    position: 'relative',
  },
  imageWrapper: {
    width: screenWidth,
  },
  postImage: {
    width: screenWidth,
    height: screenWidth * 0.75,
    backgroundColor: '#f0f0f0',
  },
  noImagePlaceholder: {
    width: screenWidth,
    height: screenWidth * 0.4,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  imageErrorContainer: {
    width: screenWidth,
    height: screenWidth * 0.75,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageErrorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 15,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  imageIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeImageIndicator: {
    backgroundColor: 'white',
  },
  serviceTagsContainer: {
    marginTop: 10,
  },
  serviceTagsContent: {
    paddingHorizontal: 15,
    gap: 8,
  },
  serviceTag: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  serviceTagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 12,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    padding: 4,
  },
  engagementContainer: {
    paddingHorizontal: 15,
    paddingTop: 8,
    gap: 4,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commentsText: {
    fontSize: 14,
    color: '#666',
  },
  captionContainer: {
    paddingHorizontal: 15,
    paddingTop: 8,
  },
  captionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  providerUsername: {
    fontWeight: '600',
    color: '#333',
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 15,
    gap: 6,
  },
  hashtag: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '500',
  },
});

export default PostCard;
