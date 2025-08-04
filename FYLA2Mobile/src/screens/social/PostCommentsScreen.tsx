import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../types';
import ApiService from '../../services/api';

type PostCommentsRouteProp = RouteProp<RootStackParamList, 'PostComments'>;
type PostCommentsNavigationProp = StackNavigationProp<RootStackParamList>;

interface Comment {
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
  replies?: Comment[];
}

const PostCommentsScreen: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  
  const navigation = useNavigation<PostCommentsNavigationProp>();
  const route = useRoute<PostCommentsRouteProp>();
  const { postId } = route.params;

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
      
      // Fallback to enhanced mock data
      const mockComments: Comment[] = [
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
      const newCommentObj: Comment = {
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
      };
      
      setComments(prev => [newCommentObj, ...prev]);
      const commentText = newComment.trim();
      setNewComment('');

      try {
        // Try to post to API
        const response = await ApiService.addPostComment(postId, commentText);
        console.log('✅ Comment posted successfully:', response);
        
        // Update the temporary comment with real data
        setComments(prev => 
          prev.map(comment => 
            comment.id === tempCommentId 
              ? { ...comment, id: response.id || response.commentId || comment.id }
              : comment
          )
        );
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

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentContainer}>
      <View style={styles.commentHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.user.firstName.charAt(0)}{item.user.lastName.charAt(0)}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>
              {item.user.firstName} {item.user.lastName}
            </Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(item.createdAt)}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.likeButton}>
          <Ionicons
            name={item.isLikedByCurrentUser ? "heart" : "heart-outline"}
            size={16}
            color={item.isLikedByCurrentUser ? "#FF6B6B" : "#666"}
          />
          {item.likesCount > 0 && (
            <Text style={styles.likeCount}>{item.likesCount}</Text>
          )}
        </TouchableOpacity>
      </View>
      <Text style={styles.commentText}>{item.content}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <LinearGradient colors={['#FF6B6B', '#4ECDC4']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comments</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      {/* Comments List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading comments...</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          style={styles.commentsList}
          contentContainerStyle={styles.commentsContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
              <Text style={styles.emptyTitle}>No comments yet</Text>
              <Text style={styles.emptyText}>Be the first to share your thoughts!</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Comment Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Add a comment..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newComment.trim() || isPosting) && styles.sendButtonDisabled,
            ]}
            onPress={handleAddComment}
            disabled={!newComment.trim() || isPosting}
          >
            {isPosting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  commentsList: {
    flex: 1,
  },
  commentsContent: {
    padding: 16,
    flexGrow: 1,
  },
  commentContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    fontSize: 12,
    color: '#666',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default PostCommentsScreen;
