import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { ChatMessage, ChatRoom, SendMessageRequest } from '../types';
import ApiService from './api';

class ChatService {
  private connection: HubConnection | null = null;
  private messageHandlers: ((message: ChatMessage) => void)[] = [];
  private typingHandlers: ((userId: string) => void)[] = [];
  private stopTypingHandlers: ((userId: string) => void)[] = [];

  async connect(token: string): Promise<void> {
    if (this.connection?.state === 'Connected') {
      return;
    }

    this.connection = new HubConnectionBuilder()
      .withUrl('http://192.168.1.185:5224/chathub', {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    // Set up event handlers
    this.connection.on('ReceiveMessage', (message: ChatMessage) => {
      console.log('Received message:', message);
      this.messageHandlers.forEach(handler => handler(message));
    });

    this.connection.on('UserTyping', (userId: string) => {
      console.log('User typing:', userId);
      this.typingHandlers.forEach(handler => handler(userId));
    });

    this.connection.on('UserStoppedTyping', (userId: string) => {
      console.log('User stopped typing:', userId);
      this.stopTypingHandlers.forEach(handler => handler(userId));
    });

    try {
      await this.connection.start();
      console.log('SignalR Connected');
    } catch (error) {
      console.error('SignalR Connection Error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  isConnected(): boolean {
    return this.connection?.state === 'Connected';
  }

  onMessage(handler: (message: ChatMessage) => void): () => void {
    this.messageHandlers.push(handler);
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  onUserTyping(handler: (userId: string) => void): () => void {
    this.typingHandlers.push(handler);
    return () => {
      const index = this.typingHandlers.indexOf(handler);
      if (index > -1) {
        this.typingHandlers.splice(index, 1);
      }
    };
  }

  onUserStoppedTyping(handler: (userId: string) => void): () => void {
    this.stopTypingHandlers.push(handler);
    return () => {
      const index = this.stopTypingHandlers.indexOf(handler);
      if (index > -1) {
        this.stopTypingHandlers.splice(index, 1);
      }
    };
  }

  async sendTyping(receiverId: string): Promise<void> {
    if (this.connection?.state === 'Connected') {
      try {
        await this.connection.invoke('SendTyping', receiverId);
      } catch (error) {
        console.error('Error sending typing indicator:', error);
      }
    }
  }

  async stopTyping(receiverId: string): Promise<void> {
    if (this.connection?.state === 'Connected') {
      try {
        await this.connection.invoke('StopTyping', receiverId);
      } catch (error) {
        console.error('Error stopping typing indicator:', error);
      }
    }
  }

  // API methods for chat functionality
  async getChatRooms(): Promise<ChatRoom[]> {
    try {
      const response = await ApiService.getChatRooms();
      return response;
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      throw error;
    }
  }

  async getChatMessages(userId: string): Promise<ChatMessage[]> {
    try {
      const response = await ApiService.getChatMessages(userId);
      return response;
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      throw error;
    }
  }

  async sendMessage(request: SendMessageRequest): Promise<ChatMessage> {
    try {
      const response = await ApiService.sendMessage(request);
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      await ApiService.markMessageAsRead(messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await ApiService.getUnreadCount();
      return response;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }
}

export const chatService = new ChatService();
