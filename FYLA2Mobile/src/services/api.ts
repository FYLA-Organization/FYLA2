import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../config/environment';
import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  User,
  ServiceProvider,
  Service,
  Booking,
  CreateBookingRequest,
  Review,
  Post,
  Message,
  ChatRoom,
  ChatMessage,
  SendMessageRequest,
  ApiResponse,
  PaginatedResponse,
  SearchFilters
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private isInitialized: boolean = false;

  constructor() {
    // Initialize with a placeholder - will be updated after config initialization
    this.api = axios.create({
      baseURL: 'http://localhost:5224/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    this.initializeConfig();
  }

  private async initializeConfig() {
    try {
      await Config.initialize();
      
      console.log('🔄 Initializing API Service...');
      console.log('📱 Environment API URL:', process.env.EXPO_PUBLIC_API_URL);
      console.log('📱 Config base URL:', Config.baseURL);
      
      // Update the axios instance with the correct base URL
      this.api = axios.create({
        baseURL: Config.baseURL,
        timeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000'),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      this.setupInterceptors();
      this.isInitialized = true;
      console.log('✅ API Service initialized with URL:', Config.baseURL);
      console.log('✅ Using timeout:', parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000'));
    } catch (error) {
      console.error('❌ Failed to initialize API service:', error);
      this.setupInterceptors();
      this.isInitialized = true;
    }
  }

  private setupInterceptors() {

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          AsyncStorage.removeItem('authToken');
          AsyncStorage.removeItem('currentUser');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth Methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('🔄 Attempting login with URL:', Config.baseURL);
      console.log('🔄 Login credentials:', { email: credentials.email, password: '***' });
      console.log('🔄 API timeout setting:', this.api.defaults.timeout);
      
      const response = await this.api.post('/auth/login', credentials);
      
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('currentUser', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Request URL:', error.config?.url);
      console.error('❌ Base URL being used:', error.config?.baseURL);
      console.error('❌ Full error config:', error.config);
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await this.api.post('/auth/register', userData);
      
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('currentUser', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['authToken', 'currentUser']);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Development login helpers
  async devLoginClient(): Promise<AuthResponse> {
    return this.login({
      email: 'client1@fyla2.com',
      password: 'Password123!'
    });
  }

  async devLoginProvider(): Promise<AuthResponse> {
    return this.login({
      email: 'provider1@fyla2.com',
      password: 'Password123!'
    });
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userString = await AsyncStorage.getItem('currentUser');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      console.log('Updating profile:', userData);
      const response = await this.api.put('/auth/profile', userData);
      
      // Update local storage with new user data
      const updatedUser = response.data;
      await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Service Provider Methods
  async getServiceProviders(
    page: number = 1, 
    pageSize: number = 20, 
    filters: SearchFilters = {},
    query?: string
  ): Promise<PaginatedResponse<ServiceProvider>> {
    try {
      console.log('=== API SERVICE DEBUG ===');
      console.log('Making request to getServiceProviders');
      console.log('Page:', page, 'PageSize:', pageSize);
      console.log('Filters:', filters);
      console.log('Query:', query);
      
      const params: any = {
        page,
        pageSize,
      };
      
      if (query) {
        params.query = query;
      }
      
      if (filters.category && filters.category !== 'All') {
        params.category = filters.category;
      }
      
      if (filters.rating) {
        params.minRating = filters.rating;
      }
      
      if (filters.priceMin) {
        params.priceMin = filters.priceMin;
      }
      
      if (filters.distance) {
        params.distance = filters.distance;
      }
      
      console.log('Final request params:', params);
      
      const response = await this.api.get('/serviceprovider', { params });
      console.log('API Response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching service providers:', error);
      throw error;
    }
  }

  async getServiceProvider(id: string): Promise<ServiceProvider> {
    try {
      const response = await this.api.get(`/serviceprovider/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching service provider:', error);
      throw error;
    }
  }

  async getFeaturedProviders(): Promise<ServiceProvider[]> {
    try {
      const response = await this.api.get('/serviceprovider/featured');
      return response.data;
    } catch (error) {
      console.error('Error fetching featured providers:', error);
      throw error;
    }
  }

  // Service Methods
  async getServices(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Service>> {
    try {
      const params = { page, pageSize };
      const response = await this.api.get('/services', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  async getService(id: number): Promise<Service> {
    try {
      const response = await this.api.get(`/services/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching service:', error);
      throw error;
    }
  }

  async getServicesByProvider(providerId: string): Promise<Service[]> {
    try {
      const response = await this.api.get(`/serviceprovider/${providerId}/services`);
      return response.data;
    } catch (error) {
      console.error('Error fetching provider services:', error);
      throw error;
    }
  }

  // Review Methods
  async getReviews(providerId: string): Promise<Review[]> {
    try {
      const response = await this.api.get(`/serviceprovider/${providerId}/reviews`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  }

  async createReview(providerId: string, rating: number, comment: string): Promise<Review> {
    try {
      const response = await this.api.post('/reviews', {
        serviceProviderId: providerId,
        rating,
        comment,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  // Booking Methods
  async getBookings(): Promise<Booking[]> {
    try {
      const response = await this.api.get('/bookings/my-bookings');
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  }

  async createBooking(bookingData: CreateBookingRequest): Promise<Booking> {
    try {
      const response = await this.api.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  async getAvailability(providerId: string, date: string): Promise<string[]> {
    try {
      const response = await this.api.get(`/bookings/availability/${providerId}?date=${date}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching availability:', error);
      throw error;
    }
  }

  async getBooking(bookingId: string): Promise<Booking> {
    try {
      const response = await this.api.get(`/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  }

  async updateBookingStatus(bookingId: string, status: string): Promise<void> {
    try {
      await this.api.put(`/bookings/${bookingId}/status`, { status });
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    try {
      const response = await this.api.get(`/bookings/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }
  }

  // Chat & Messaging Methods
  async getChatMessages(userId: string): Promise<ChatMessage[]> {
    try {
      const response = await this.api.get(`/chat/${userId}/messages`);
      return response.data;
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      throw error;
    }
  }

  async sendMessage(request: SendMessageRequest): Promise<ChatMessage> {
    try {
      const response = await this.api.post('/chat/send', request);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      await this.api.put(`/chat/messages/${messageId}/read`);
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  async markMessageAsDelivered(messageId: string): Promise<void> {
    try {
      await this.api.put(`/chat/messages/${messageId}/delivered`);
    } catch (error) {
      console.error('Error marking message as delivered:', error);
      throw error;
    }
  }

  async markAllMessagesAsRead(userId: string): Promise<void> {
    try {
      await this.api.put(`/chat/conversations/${userId}/mark-all-read`);
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      throw error;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await this.api.get('/chat/unread-count');
      return response.data.unreadCount;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  async getUserProfile(userId: string): Promise<User> {
    try {
      const response = await this.api.get(`/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async getChatRooms(): Promise<ChatRoom[]> {
    try {
      const response = await this.api.get('/chat/rooms');
      return response.data;
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      throw error;
    }
  }

  // Posts Methods (for feed)
  async getPosts(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Post>> {
    try {
      const params = { page, pageSize };
      const response = await this.api.get('/posts', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  async createPost(content: string, imageUrl?: string): Promise<Post> {
    try {
      const response = await this.api.post('/posts', {
        content,
        imageUrl,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  async likePost(postId: string): Promise<void> {
    try {
      await this.api.post(`/posts/${postId}/like`);
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  }

  async unlikePost(postId: string): Promise<void> {
    try {
      await this.api.delete(`/posts/${postId}/like`);
    } catch (error) {
      console.error('Error unliking post:', error);
      throw error;
    }
  }

  // Push Notification Methods
  async registerPushToken(pushToken: string): Promise<void> {
    try {
      await this.api.post('/notifications/register-token', {
        pushToken,
        platform: 'expo',
      });
    } catch (error) {
      console.error('Error registering push token:', error);
      throw error;
    }
  }

  async unregisterPushToken(): Promise<void> {
    try {
      await this.api.delete('/notifications/unregister-token');
    } catch (error) {
      console.error('Error unregistering push token:', error);
      throw error;
    }
  }

  // File Upload Methods
  async uploadImage(imageUri: string, fileName: string): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        name: fileName,
        type: 'image/jpeg',
      } as any);

      const response = await this.api.post('/fileupload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async uploadDocument(fileUri: string, fileName: string, mimeType: string): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: mimeType,
      } as any);

      const response = await this.api.post('/fileupload/document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  // Analytics Methods
  async getProviderDashboard(): Promise<ProviderDashboard> {
    try {
      const response = await this.api.get('/analytics/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching provider dashboard:', error);
      throw error;
    }
  }

  async getRevenueAnalytics(period: 'week' | 'month' | 'year'): Promise<RevenueAnalytics> {
    try {
      const response = await this.api.get(`/analytics/revenue?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      throw error;
    }
  }

  async getClientAnalytics(period: 'week' | 'month' | 'year'): Promise<ClientAnalytics> {
    try {
      const response = await this.api.get(`/analytics/clients?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching client analytics:', error);
      throw error;
    }
  }
}

export default new ApiService();
