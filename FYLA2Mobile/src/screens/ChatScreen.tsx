import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ChatMessage } from '../types';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';

interface ChatScreenRouteParams {
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
}

const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, user } = route.params as ChatScreenRouteParams;
  const { user: currentUser } = useAuth();
  const { messages, sendMessage, loadMessages, markAsRead, isConnected } = useChat();
  
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter messages for this conversation
  const conversationMessages = messages.filter(
    msg => 
      (msg.senderId === currentUser?.id && msg.receiverId === userId) ||
      (msg.senderId === userId && msg.receiverId === currentUser?.id)
  );

  useEffect(() => {
    // Load messages for this conversation
    loadMessages(userId);

    // Mark messages as read
    const unreadMessages = conversationMessages.filter(
      msg => msg.receiverId === currentUser?.id && !msg.isRead
    );
    unreadMessages.forEach(msg => markAsRead(msg.id));

    // Set up typing indicators
    const unsubscribeTyping = chatService.onUserTyping((typingUserId: string) => {
      if (typingUserId === userId) {
        setOtherUserTyping(true);
      }
    });

    const unsubscribeStopTyping = chatService.onUserStoppedTyping((typingUserId: string) => {
      if (typingUserId === userId) {
        setOtherUserTyping(false);
      }
    });

    return () => {
      unsubscribeTyping();
      unsubscribeStopTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [userId, loadMessages, markAsRead, currentUser?.id]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (conversationMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversationMessages.length]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || sending || !currentUser) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      await sendMessage({
        receiverId: userId,
        content: messageText,
        messageType: 'text',
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setInputText(messageText); // Restore the message
    } finally {
      setSending(false);
    }
  };

  const handleTyping = async (text: string) => {
    setInputText(text);

    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      try {
        await chatService.sendTyping(userId);
      } catch (error) {
        console.error('Error sending typing indicator:', error);
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(async () => {
      if (isTyping) {
        setIsTyping(false);
        try {
          await chatService.stopTyping(userId);
        } catch (error) {
          console.error('Error stopping typing indicator:', error);
        }
      }
    }, 2000);

    // Stop typing immediately if text is empty
    if (text.length === 0 && isTyping) {
      setIsTyping(false);
      try {
        await chatService.stopTyping(userId);
      } catch (error) {
        console.error('Error stopping typing indicator:', error);
      }
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.senderId === currentUser?.id;
    
    return (
      <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
        <View style={[styles.messageBubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, isOwnMessage ? styles.ownMessageText : styles.otherMessageText]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime]}>
              {formatMessageTime(item.timestamp)}
            </Text>
            {isOwnMessage && (
              <View style={styles.messageStatus}>
                {item.status === 'Sent' && (
                  <Icon name="checkmark" size={14} color="#999" style={styles.readIcon} />
                )}
                {item.status === 'Delivered' && (
                  <Icon name="checkmark-done" size={14} color="#999" style={styles.readIcon} />
                )}
                {item.status === 'Read' && (
                  <Icon name="checkmark-done" size={14} color="#4CAF50" style={styles.readIcon} />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        Start your conversation with {user.firstName}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerUserInfo}>
          {user.profilePictureUrl ? (
            <Image source={{ uri: user.profilePictureUrl }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.defaultHeaderAvatar]}>
              <Text style={styles.headerAvatarText}>
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </Text>
            </View>
          )}
          <View style={styles.headerUserDetails}>
            <Text style={styles.headerUserName}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={styles.connectionStatus}>
              {isConnected ? 'Online' : 'Connecting...'}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {/* Add video call, phone call icons here if needed */}
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={conversationMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          ListEmptyComponent={renderEmptyState}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Typing Indicator */}
        {otherUserTyping && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>
              {user.firstName} is typing...
            </Text>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={handleTyping}
            placeholder="Type a message..."
            multiline
            maxLength={1000}
            editable={isConnected}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || sending || !isConnected) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending || !isConnected}
          >
            <Icon 
              name={sending ? 'hourglass' : 'send'} 
              size={20} 
              color={(!inputText.trim() || sending || !isConnected) ? '#ccc' : '#fff'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 12,
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  defaultHeaderAvatar: {
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerUserDetails: {
    flex: 1,
  },
  headerUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  connectionStatus: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  ownBubble: {
    backgroundColor: '#667eea',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#666',
  },
  readIcon: {
    marginLeft: 4,
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    fontSize: 16,
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default ChatScreen;
