import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, ChatRoom, SendMessageRequest, ChatContextType } from '../types';
import { chatService } from '../services/chatService';
import { useAuth } from '../context/AuthContext';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  // Connect to SignalR when user is authenticated
  useEffect(() => {
    if (user) {
      connectToChat();
    } else {
      disconnectFromChat();
    }

    return () => {
      disconnectFromChat();
    };
  }, [user]);

  const connectToChat = useCallback(async () => {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return;

    try {
      console.log('🔄 Attempting to connect to chat...');
      await chatService.connect(token);
      setIsConnected(true);
      console.log('✅ Chat connected successfully');

      // Set up message handler
      const unsubscribeMessage = chatService.onMessage((message: ChatMessage) => {
        setMessages(prev => {
          // Check if this message already exists (avoid duplicates from optimistic updates)
          const existingMessage = prev.find(msg => 
            msg.id === message.id || 
            (msg.senderId === message.senderId && 
             msg.receiverId === message.receiverId && 
             msg.content === message.content &&
             Math.abs(new Date(msg.timestamp).getTime() - new Date(message.timestamp).getTime()) < 5000) // Within 5 seconds
          );
          
          if (existingMessage) {
            // Replace optimistic message with real one
            return prev.map(msg => 
              msg.id === existingMessage.id ? message : msg
            );
          } else {
            // Add new message
            return [...prev, message];
          }
        });
        
        // Only update unread count if message is from someone else
        if (message.senderId !== user?.id) {
          // Update last message in rooms
          setRooms(prev => prev.map(room => 
            room.id === message.senderId 
              ? {
                  ...room,
                  lastMessage: {
                    id: message.id,
                    content: message.content,
                    timestamp: message.timestamp,
                    senderId: message.senderId
                  },
                  unreadCount: room.unreadCount + 1
                }
              : room
          ));
          // Update unread count
          setUnreadCount(prev => prev + 1);
        }
      });

      // Set up message status handlers
      const unsubscribeMessageDelivered = chatService.onMessageDelivered((messageId: string, userId: string) => {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'Delivered' as const, deliveredAt: new Date().toISOString() } : msg
        ));
      });

      const unsubscribeMessageRead = chatService.onMessageRead((messageId: string, userId: string) => {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'Read' as const, readAt: new Date().toISOString(), isRead: true } : msg
        ));
      });

      const unsubscribeMessagesRead = chatService.onMessagesRead((messageIds: string[], userId: string) => {
        setMessages(prev => prev.map(msg => 
          messageIds.includes(msg.id) ? { ...msg, status: 'Read' as const, readAt: new Date().toISOString(), isRead: true } : msg
        ));
      });

      // Load initial data
      await loadChatRooms();
      await loadUnreadCount();

      return () => {
        unsubscribeMessage();
        unsubscribeMessageDelivered();
        unsubscribeMessageRead();
        unsubscribeMessagesRead();
      };
    } catch (error) {
      console.error('❌ Failed to connect to chat:', error);
      setIsConnected(false);
      
      // Add retry logic for connection failures
      setTimeout(() => {
        console.log('🔄 Retrying chat connection in 5 seconds...');
        connectToChat();
      }, 5000);
    }
  }, []);

  const disconnectFromChat = useCallback(async () => {
    try {
      await chatService.disconnect();
      setIsConnected(false);
      setMessages([]);
      setRooms([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to disconnect from chat:', error);
    }
  }, []);

  const sendMessage = useCallback(async (request: SendMessageRequest) => {
    try {
      // Create optimistic message with temporary ID
      const tempId = `temp_${Date.now()}_${Math.random()}`;
      const optimisticMessage: ChatMessage = {
        id: tempId,
        senderId: user?.id || '',
        receiverId: request.receiverId,
        content: request.content,
        timestamp: new Date().toISOString(),
        isRead: false,
        messageType: request.messageType || 'text',
        status: 'Sent',
        attachmentUrl: request.attachmentUrl,
        attachmentType: request.attachmentType,
        attachmentSize: request.attachmentSize,
        attachmentName: request.attachmentName,
      };

      // Immediately add the message to local state for instant UI feedback
      setMessages(prev => [...prev, optimisticMessage]);

      try {
        // Send to server
        const serverMessage = await chatService.sendMessage(request);
        
        // Replace optimistic message with server response
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? { ...serverMessage, status: 'Delivered' } : msg
        ));
        
      } catch (serverError) {
        // Remove optimistic message on server error
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        throw serverError;
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [user?.id]);

  const loadChatRooms = useCallback(async () => {
    try {
      const chatRooms = await chatService.getChatRooms();
      setRooms(chatRooms);
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
    }
  }, []);

  const loadMessages = useCallback(async (userId: string) => {
    try {
      const chatMessages = await chatService.getChatMessages(userId);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, []);

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      await chatService.markMessageAsRead(messageId);
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      ));
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }, []);

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await chatService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  }, []);

  const value: ChatContextType = {
    messages,
    rooms,
    isConnected,
    sendMessage,
    loadChatRooms,
    loadMessages,
    markAsRead,
    unreadCount,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
