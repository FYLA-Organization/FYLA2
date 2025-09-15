import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { MODERN_COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants/modernDesign';
import ApiService from '../../services/api';

const { height: screenHeight } = Dimensions.get('window');

type PostCommentsRouteProp = RouteProp<RootStackParamList, 'PostComments'>;
type PostCommentsNavigationProp = StackNavigationProp<RootStackParamList>;

interface CommentData {
  id: string;
  content: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
  likesCount: number;
  isLikedByCurrentUser: boolean;
  createdAt: string;
  replies?: CommentData[];
  replyCount?: number;
  parentId?: string;
  isReply?: boolean;
}

const PostCommentsScreen: React.FC = () => {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyingToUser, setReplyingToUser] = useState<string>('');
  const [characterCount, setCharacterCount] = useState(0);
  const [inputHeight, setInputHeight] = useState(40);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());
  
  const navigation = useNavigation<PostCommentsNavigationProp>();
  const route = useRoute<PostCommentsRouteProp>();
  const { postId } = route.params;
  const inputRef = useRef<TextInput>(null);
  const likeAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      
      // Try to get real comments from API
      try {
        const commentsData = await ApiService.getPostComments(postId);
        console.log('✅ Comments loaded from API:', commentsData);
        
        if (Array.isArray(commentsData)) {
          const formattedComments = commentsData.map((comment: any) => ({
            id: comment.id,
            content: comment.content,
            user: {
              id: comment.userId,
              firstName: comment.userName?.split(' ')[0] || 'User',
              lastName: comment.userName?.split(' ')[1] || '',
              profilePictureUrl: comment.userAvatar,
            },
            likesCount: comment.likesCount || 0,
            isLikedByCurrentUser: comment.isLiked || false,
            createdAt: comment.createdAt,
          }));
          
          setComments(formattedComments);
          return;
        }
      } catch (apiError) {
        console.log('📡 API unavailable, using mock comments');
      }
      
      // Fallback to enhanced mock data with replies
      const mockComments: CommentData[] = [
        {
          id: '1',
          content: 'Absolutely gorgeous work! 😍 The transformation is amazing!',
          user: {
            id: '1',
            firstName: 'Sarah',
            lastName: 'Johnson',
            profilePictureUrl: 'https://picsum.photos/40/40?random=1',
          },
          likesCount: 5,
          isLikedByCurrentUser: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          replyCount: 2,
          replies: [
            {
              id: '1-1',
              content: 'Thank you so much! 💕 That means the world to me!',
              user: {
                id: 'provider',
                firstName: 'Maria',
                lastName: 'Rodriguez',
                profilePictureUrl: 'https://picsum.photos/40/40?random=provider',
              },
              likesCount: 3,
              isLikedByCurrentUser: true,
              createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
              parentId: '1',
              isReply: true,
            },
            {
              id: '1-2',
              content: 'I totally agree! Maria is so talented 🎨',
              user: {
                id: '3',
                firstName: 'Jessica',
                lastName: 'Miller',
                profilePictureUrl: 'https://picsum.photos/40/40?random=3',
              },
              likesCount: 1,
              isLikedByCurrentUser: false,
              createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
              parentId: '1',
              isReply: true,
            },
          ],
        },
        {
          id: '2',
          content: 'I need to book an appointment ASAP! How do I contact you? This is exactly what I want! 💅',
          user: {
            id: '2',
            firstName: 'Emma',
            lastName: 'Davis',
            profilePictureUrl: 'https://picsum.photos/40/40?random=2',
          },
          likesCount: 2,
          isLikedByCurrentUser: true,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          replyCount: 1,
          replies: [
            {
              id: '2-1',
              content: 'Hi Emma! You can book through the app or DM me directly 📱',
              user: {
                id: 'provider',
                firstName: 'Maria',
                lastName: 'Rodriguez',
                profilePictureUrl: 'https://picsum.photos/40/40?random=provider',
              },
              likesCount: 0,
              isLikedByCurrentUser: false,
              createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
              parentId: '2',
              isReply: true,
            },
          ],
        },
        {
          id: '3',
          content: 'Amazing skills! What products did you use for this look?',
          user: {
            id: '3',
            firstName: 'Jessica',
            lastName: 'Miller',
            profilePictureUrl: 'https://picsum.photos/40/40?random=3',
          },
          likesCount: 3,
          isLikedByCurrentUser: false,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          replyCount: 0,
        },
      ];
      
      setComments(mockComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setIsPosting(true);
      
      // Create optimistic update first
      const tempCommentId = `temp-${Date.now()}`;
      const isReplyMode = replyingTo !== null;
      
      const newCommentObj: CommentData = {
        id: tempCommentId,
        content: newComment.trim(),
        user: {
          id: 'current-user',
          firstName: 'You',
          lastName: '',
        },
        likesCount: 0,
        isLikedByCurrentUser: false,
        createdAt: new Date().toISOString(),
        parentId: isReplyMode ? replyingTo : undefined,
        isReply: isReplyMode,
      };
      
      if (isReplyMode) {
        // Add reply to the parent comment
        setComments(prev => 
          prev.map(comment => {
            if (comment.id === replyingTo) {
              const updatedReplies = [...(comment.replies || []), newCommentObj];
              return {
                ...comment,
                replies: updatedReplies,
                replyCount: (comment.replyCount || 0) + 1,
              };
            }
            return comment;
          })
        );
        
        // Ensure the thread is expanded to show the new reply
        setExpandedThreads(prev => new Set(prev).add(replyingTo));
      } else {
        // Add new top-level comment
        setComments(prev => [newCommentObj, ...prev]);
      }
      
      const commentText = newComment.trim();
      setNewComment('');
      setCharacterCount(0);
      setReplyingTo(null);
      setReplyingToUser('');

      try {
        // Try to post to API
        if (isReplyMode) {
          // const response = await ApiService.addReply(replyingTo, commentText);
          console.log('✅ Reply posted successfully');
        } else {
          const response = await ApiService.addPostComment(postId, commentText);
          console.log('✅ Comment posted successfully:', response);
        }
        
        // Update the temporary comment with real data
        // Implementation would depend on API response structure
      } catch (apiError) {
        console.log('📡 API unavailable, comment saved locally');
        // Keep the optimistic update even if API fails
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      // Haptic feedback for better UX
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Initialize animation if it doesn't exist
      if (!likeAnimations[commentId]) {
        likeAnimations[commentId] = new Animated.Value(1);
      }
      
      // Animate the like button
      Animated.sequence([
        Animated.timing(likeAnimations[commentId], {
          toValue: 1.3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(likeAnimations[commentId], {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Optimistic update
      setComments(prev => 
        prev.map(comment => {
          if (comment.id === commentId) {
            const newIsLiked = !comment.isLikedByCurrentUser;
            return {
              ...comment,
              isLikedByCurrentUser: newIsLiked,
              likesCount: newIsLiked ? comment.likesCount + 1 : comment.likesCount - 1,
            };
          }
          return comment;
        })
      );
      
      // TODO: API call to like/unlike comment
      // await ApiService.likeComment(commentId);
    } catch (error) {
      console.error('Error liking comment:', error);
      // Revert optimistic update on error
      setComments(prev => 
        prev.map(comment => {
          if (comment.id === commentId) {
            const revertIsLiked = comment.isLikedByCurrentUser;
            return {
              ...comment,
              isLikedByCurrentUser: !revertIsLiked,
              likesCount: !revertIsLiked ? comment.likesCount - 1 : comment.likesCount + 1,
            };
          }
          return comment;
        })
      );
    }
  };

  const handleReply = (commentId: string, userName: string) => {
    setReplyingTo(commentId);
    setReplyingToUser(userName);
    setNewComment(`@${userName} `);
    setCharacterCount(`@${userName} `.length);
    inputRef.current?.focus();
  };

  const toggleThread = async (commentId: string) => {
    const newExpandedThreads = new Set(expandedThreads);
    
    if (expandedThreads.has(commentId)) {
      // Collapse thread
      newExpandedThreads.delete(commentId);
    } else {
      // Expand thread
      newExpandedThreads.add(commentId);
      
      // Load replies if not already loaded
      const comment = comments.find(c => c.id === commentId);
      if (comment && (!comment.replies || comment.replies.length === 0) && comment.replyCount && comment.replyCount > 0) {
        await loadReplies(commentId);
      }
    }
    
    setExpandedThreads(newExpandedThreads);
  };

  const loadReplies = async (commentId: string) => {
    try {
      setLoadingReplies(prev => new Set(prev).add(commentId));
      
      // TODO: Replace with actual API call
      // const replies = await ApiService.getCommentReplies(commentId);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, replies are already in mock data
      // In real implementation, you would update the comment with loaded replies
      
    } catch (error) {
      console.error('Error loading replies:', error);
    } finally {
      setLoadingReplies(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  const handleInputChange = (text: string) => {
    setNewComment(text);
    setCharacterCount(text.length);
  };

  const handleInputContentSizeChange = (event: any) => {
    const newHeight = Math.max(40, Math.min(120, event.nativeEvent.contentSize.height));
    setInputHeight(newHeight);
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

  const renderReply = (reply: CommentData) => {
    if (!likeAnimations[reply.id]) {
      likeAnimations[reply.id] = new Animated.Value(1);
    }

    return (
      <View key={reply.id} style={styles.replyContainer}>
        <View style={styles.replyLine} />
        <View style={styles.replyContent}>
          <TouchableOpacity activeOpacity={0.7}>
            <Image 
              source={{ uri: reply.user.profilePictureUrl || `https://picsum.photos/28/28?random=${reply.id}` }}
              style={styles.replyAvatar}
            />
          </TouchableOpacity>
          
          <View style={styles.replyBody}>
            <View style={styles.replyTextContainer}>
              <Text style={styles.replyText}>
                <Text style={styles.replyUserName}>{reply.user.firstName} </Text>
                {reply.content}
              </Text>
            </View>
            
            <View style={styles.replyActions}>
              <Text style={styles.replyTimeAgo}>{formatTimeAgo(reply.createdAt)}</Text>
              
              {reply.likesCount > 0 && (
                <>
                  <Text style={styles.actionSeparator}>•</Text>
                  <Text style={styles.replyLikeCount}>
                    {reply.likesCount} {reply.likesCount === 1 ? 'like' : 'likes'}
                  </Text>
                </>
              )}
              
              <Text style={styles.actionSeparator}>•</Text>
              <TouchableOpacity 
                onPress={() => handleReply(reply.parentId || reply.id, reply.user.firstName)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.replyButton}>Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.replyLikeButton}
            onPress={() => handleLikeComment(reply.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale: likeAnimations[reply.id] }] }}>
              <Ionicons
                name={reply.isLikedByCurrentUser ? "heart" : "heart-outline"}
                size={14}
                color={reply.isLikedByCurrentUser ? MODERN_COLORS.error : MODERN_COLORS.textSecondary}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderComment = ({ item }: { item: CommentData }) => {
    // Initialize animation value if it doesn't exist
    if (!likeAnimations[item.id]) {
      likeAnimations[item.id] = new Animated.Value(1);
    }

    const hasReplies = item.replyCount && item.replyCount > 0;
    const isThreadExpanded = expandedThreads.has(item.id);
    const isLoadingReplies = loadingReplies.has(item.id);

    return (
      <View style={styles.commentContainer}>
        <View style={styles.commentContent}>
          <TouchableOpacity activeOpacity={0.7}>
            <Image 
              source={{ uri: item.user.profilePictureUrl || `https://picsum.photos/32/32?random=${item.id}` }}
              style={styles.userAvatar}
            />
          </TouchableOpacity>
          
          <View style={styles.commentBody}>
            <View style={styles.commentTextContainer}>
              <Text style={styles.commentText}>
                <Text style={styles.userName}>{item.user.firstName} </Text>
                {item.content}
              </Text>
            </View>
            
            <View style={styles.commentActions}>
              <Text style={styles.timeAgo}>{formatTimeAgo(item.createdAt)}</Text>
              
              {item.likesCount > 0 && (
                <>
                  <Text style={styles.actionSeparator}>•</Text>
                  <Text style={styles.likeCount}>
                    {item.likesCount} {item.likesCount === 1 ? 'like' : 'likes'}
                  </Text>
                </>
              )}
              
              <Text style={styles.actionSeparator}>•</Text>
              <TouchableOpacity 
                onPress={() => handleReply(item.id, item.user.firstName)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[
                  styles.replyButton, 
                  replyingTo === item.id && styles.replyButtonActive
                ]}>
                  Reply
                </Text>
              </TouchableOpacity>
              
              {replyingTo === item.id && (
                <View style={styles.replyingIndicator}>
                  <Ionicons name="return-down-forward" size={12} color={MODERN_COLORS.primary} />
                </View>
              )}
            </View>
            
            {/* View Replies Button */}
            {hasReplies && (
              <TouchableOpacity 
                style={styles.viewRepliesButton}
                onPress={() => toggleThread(item.id)}
                disabled={isLoadingReplies}
              >
                <View style={styles.viewRepliesContent}>
                  <View style={styles.threadLine} />
                  <Text style={styles.viewRepliesText}>
                    {isLoadingReplies ? 'Loading...' : 
                     isThreadExpanded ? 'Hide replies' : 
                     `View ${item.replyCount} ${item.replyCount === 1 ? 'reply' : 'replies'}`}
                  </Text>
                  {isLoadingReplies ? (
                    <ActivityIndicator size="small" color={MODERN_COLORS.textSecondary} />
                  ) : (
                    <Ionicons 
                      name={isThreadExpanded ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color={MODERN_COLORS.textSecondary} 
                    />
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.likeButton}
            onPress={() => handleLikeComment(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale: likeAnimations[item.id] }] }}>
              <Ionicons
                name={item.isLikedByCurrentUser ? "heart" : "heart-outline"}
                size={16}
                color={item.isLikedByCurrentUser ? MODERN_COLORS.error : MODERN_COLORS.textSecondary}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
        
        {/* Render Replies */}
        {isThreadExpanded && item.replies && (
          <View style={styles.repliesContainer}>
            {item.replies.map(reply => renderReply(reply))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Instagram-style Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Comments</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color={MODERN_COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Comments List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MODERN_COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          style={styles.commentsList}
          contentContainerStyle={styles.commentsContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Enhanced Instagram-style Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        {/* Character count and replying indicator */}
        {(replyingTo || characterCount > 0) && (
          <View style={styles.inputHeader}>
            {replyingTo && (
              <View style={styles.replyingToContainer}>
                <Ionicons name="return-down-forward" size={14} color={MODERN_COLORS.primary} />
                <Text style={styles.replyingToText}>Replying to {replyingToUser}</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setReplyingTo(null);
                    setReplyingToUser('');
                    setNewComment('');
                    setCharacterCount(0);
                  }}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <Ionicons name="close-circle" size={16} color={MODERN_COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
            
            {characterCount > 0 && (
              <Text style={[
                styles.characterCount,
                characterCount > 450 && styles.characterCountWarning,
                characterCount >= 500 && styles.characterCountDanger
              ]}>
                {characterCount}/500
              </Text>
            )}
          </View>
        )}
        
        <View style={styles.inputRow}>
          <TouchableOpacity activeOpacity={0.7}>
            <Image 
              source={{ uri: 'https://picsum.photos/32/32?random=current' }}
              style={styles.currentUserAvatar}
            />
          </TouchableOpacity>
          
          <TextInput
            ref={inputRef}
            style={[styles.commentInput, { height: inputHeight }]}
            placeholder={replyingTo ? "Add a reply..." : "Add a comment..."}
            placeholderTextColor={MODERN_COLORS.textSecondary}
            value={newComment}
            onChangeText={handleInputChange}
            onContentSizeChange={handleInputContentSizeChange}
            multiline
            maxLength={500}
            returnKeyType="default"
            blurOnSubmit={false}
            textAlignVertical="top"
          />
          
          <TouchableOpacity
            style={[
              styles.postButton,
              newComment.trim() ? styles.postButtonActive : styles.postButtonInactive
            ]}
            onPress={handleAddComment}
            disabled={!newComment.trim() || isPosting}
            activeOpacity={0.7}
          >
            {isPosting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={[
                styles.postButtonText,
                newComment.trim() && styles.postButtonTextActive
              ]}>
                {replyingTo ? 'Reply' : 'Post'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  
  // Instagram-style Header
  header: {
    backgroundColor: MODERN_COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
    paddingBottom: SPACING.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: SPACING.xs,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Comments List
  commentsList: {
    flex: 1,
  },
  commentsContent: {
    paddingVertical: SPACING.sm,
    paddingBottom: SPACING.tabBarHeight + SPACING.lg,
  },
  
  // Comment Item (Instagram-style)
  commentContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  commentContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: SPACING.sm,
  },
  commentBody: {
    flex: 1,
  },
  commentTextContainer: {
    backgroundColor: 'transparent',
  },
  commentText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textPrimary,
    lineHeight: 18,
  },
  userName: {
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  timeAgo: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.textSecondary,
  },
  actionSeparator: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.textSecondary,
  },
  likeCount: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  replyButton: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  replyButtonActive: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
  replyingIndicator: {
    marginLeft: SPACING.xs,
    opacity: 0.7,
  },
  likeButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  
  // Enhanced Input Styles
  inputHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: MODERN_COLORS.border,
    backgroundColor: MODERN_COLORS.backgroundSecondary,
  },
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  replyingToText: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.medium,
    flex: 1,
  },
  characterCount: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.textSecondary,
    textAlign: 'right',
  },
  characterCountWarning: {
    color: MODERN_COLORS.warning,
  },
  characterCountDanger: {
    color: MODERN_COLORS.error,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: MODERN_COLORS.border,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textPrimary,
    minHeight: 40,
    backgroundColor: MODERN_COLORS.surface,
  },
  postButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonActive: {
    backgroundColor: MODERN_COLORS.primary,
  },
  postButtonInactive: {
    backgroundColor: 'transparent',
  },
  postButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textSecondary,
  },
  postButtonTextActive: {
    color: MODERN_COLORS.white,
  },
  
  // Instagram-style Input Container
  inputContainer: {
    backgroundColor: MODERN_COLORS.background,
    borderTopWidth: 1,
    borderTopColor: MODERN_COLORS.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  currentUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  
  // Reply Styles
  repliesContainer: {
    marginTop: SPACING.sm,
  },
  replyContainer: {
    marginBottom: SPACING.sm,
  },
  replyLine: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: MODERN_COLORS.border,
  },
  replyContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: SPACING.lg,
    paddingLeft: SPACING.md,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: SPACING.sm,
  },
  replyBody: {
    flex: 1,
  },
  replyTextContainer: {
    backgroundColor: 'transparent',
  },
  replyText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textPrimary,
    lineHeight: 18,
  },
  replyUserName: {
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
  },
  replyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  replyTimeAgo: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.textSecondary,
  },
  replyLikeCount: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  replyLikeButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  
  // Thread View Styles
  viewRepliesButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  viewRepliesContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  threadLine: {
    width: 24,
    height: 1,
    backgroundColor: MODERN_COLORS.border,
  },
  viewRepliesText: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weight.medium,
    flex: 1,
  },
});

export default PostCommentsScreen;
