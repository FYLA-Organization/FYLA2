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
      await chatService.connect(token);
      setIsConnected(true);

      // Set up message handler
      const unsubscribeMessage = chatService.onMessage((message: ChatMessage) => {
        setMessages(prev => [...prev, message]);
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
      });

      // Load initial data
      await loadChatRooms();
      await loadUnreadCount();

      return unsubscribeMessage;
    } catch (error) {
      console.error('Failed to connect to chat:', error);
      setIsConnected(false);
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
      const message = await chatService.sendMessage(request);
      // Message will be added via SignalR callback for real-time update
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, []);

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
