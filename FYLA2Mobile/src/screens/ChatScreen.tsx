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
  ActionSheetIOS,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { ChatMessage, FileUploadResponse } from '../types';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import ApiService from '../services/api';

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
  const [uploading, setUploading] = useState(false);
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

  const requestImagePickerPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need camera roll permissions to share images.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestImagePickerPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await uploadAndSendImage(asset.uri, asset.fileName || 'image.jpg');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need camera permissions to take photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await uploadAndSendImage(asset.uri, `photo_${Date.now()}.jpg`);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadAndSendImage = async (imageUri: string, fileName: string) => {
    if (!currentUser) return;

    setUploading(true);
    try {
      // Upload image to server
      const uploadResponse: FileUploadResponse = await ApiService.uploadImage(imageUri, fileName);
      
      // Send message with attachment
      await sendMessage({
        receiverId: userId,
        content: 'Shared an image',
        messageType: 'image',
        attachmentUrl: uploadResponse.url,
        attachmentType: uploadResponse.type,
        attachmentSize: uploadResponse.size,
        attachmentName: uploadResponse.fileName,
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const showAttachmentOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhoto();
          } else if (buttonIndex === 2) {
            pickImage();
          }
        }
      );
    } else {
      Alert.alert(
        'Select Image',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: takePhoto },
          { text: 'Choose from Library', onPress: pickImage },
        ]
      );
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    // Just now (less than 1 minute)
    if (diffInMinutes < 1) {
      return 'now';
    }
    
    // Minutes ago (1-59 minutes)
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    }
    
    // Hours ago (1-23 hours)
    if (diffInHours < 24) {
      return `${diffInHours}h`;
    }
    
    // Yesterday
    if (diffInDays === 1) {
      return 'Yesterday';
    }
    
    // Days ago (2-6 days)
    if (diffInDays < 7) {
      return `${diffInDays}d`;
    }
    
    // Week or more - show actual date
    if (diffInDays < 365) {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    // Over a year - include year
    return messageDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.senderId === currentUser?.id;
    const hasAttachment = item.attachmentUrl && item.attachmentType;
    
    return (
      <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
        <View style={[styles.messageBubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}>
          {/* Image Attachment */}
          {hasAttachment && item.messageType === 'image' && (
            <TouchableOpacity 
              style={styles.imageContainer}
              onPress={() => {
                // TODO: Add full-screen image viewer
                Alert.alert('Image', 'Full-screen image viewer coming soon!');
              }}
            >
              <Image 
                source={{ uri: `http://10.0.12.121:5224${item.attachmentUrl}` }} 
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          
          {/* Document Attachment */}
          {hasAttachment && item.messageType === 'file' && (
            <TouchableOpacity style={styles.documentContainer}>
              <Icon name="document" size={24} color="#667eea" />
              <View style={styles.documentInfo}>
                <Text style={styles.documentName} numberOfLines={1}>
                  {item.attachmentName || 'Document'}
                </Text>
                <Text style={styles.documentSize}>
                  {item.attachmentSize ? `${(item.attachmentSize / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          
          {/* Text Content */}
          {item.content && item.content.trim() !== 'Shared an image' && (
            <Text style={[styles.messageText, isOwnMessage ? styles.ownMessageText : styles.otherMessageText]}>
              {item.content}
            </Text>
          )}
          
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
          <TouchableOpacity
            style={styles.attachmentButton}
            onPress={showAttachmentOptions}
            disabled={!isConnected}
          >
            <Icon 
              name="attach" 
              size={20} 
              color={isConnected ? '#667eea' : '#ccc'} 
            />
          </TouchableOpacity>
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
  attachmentButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
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
  // Image and attachment styles
  imageContainer: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  documentSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default ChatScreen;
