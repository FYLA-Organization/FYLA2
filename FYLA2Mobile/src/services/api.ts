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
  BookingCreationResponse,
  ClientLoyaltyStatus,
  Review,
  ReviewQuestionnaire,
  Post,
  Message,
  ChatRoom,
  ChatMessage,
  SendMessageRequest,
  ApiResponse,
  PaginatedResponse,
  SearchFilters,
  PaymentMethod,
  PaymentCalculation,
  PaymentTransaction,
  PaymentSettings,
  CreatePaymentIntentRequest,
  PaymentIntentResponse,
  RefundRequest,
  FileUploadResponse,
  ProviderDashboard,
  RevenueAnalytics,
  ClientAnalytics
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

  async getServiceProvider(id: string): Promise<ServiceProvider | null> {
    try {
      const response = await this.api.get(`/serviceprovider/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching service provider:', error);
      return null;
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

  async getProviderServices(providerId: string): Promise<Service[]> {
    try {
      const response = await this.api.get(`/services/provider/${providerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching provider services:', error);
      throw error;
    }
  }

  async createService(serviceData: any): Promise<Service> {
    try {
      const response = await this.api.post('/services', serviceData);
      return response.data;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  async updateService(id: number, serviceData: any): Promise<Service> {
    try {
      const response = await this.api.put(`/services/${id}`, serviceData);
      return response.data;
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  async deleteService(id: number): Promise<void> {
    try {
      await this.api.delete(`/services/${id}`);
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }

  // Review Methods
  async getReviews(providerId: string): Promise<Review[]> {
    try {
      const response = await this.api.get(`/serviceprovider/${providerId}/reviews`);
      return response.data.data; // The reviews endpoint returns { data: [...], pagination: {...}, summary: {...} }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  }

  async createReview(bookingId: string, rating: number, comment: string, questionnaire?: ReviewQuestionnaire): Promise<Review> {
    try {
      const response = await this.api.post('/review', {
        bookingId,
        rating,
        comment,
        questionnaire,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  async getBookingReview(bookingId: string): Promise<Review | null> {
    try {
      const response = await this.api.get(`/review/booking/${bookingId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No review exists for this booking
      }
      console.error('Error fetching booking review:', error);
      throw error;
    }
  }

  async getUserReviews(userId: string): Promise<Review[]> {
    try {
      const response = await this.api.get(`/reviews/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user reviews:', error);
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

  async createBooking(bookingData: CreateBookingRequest): Promise<BookingCreationResponse> {
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
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      // Return empty paginated response to prevent UI errors
      if (error?.response?.status === 404) {
        return {
          data: [],
          pageNumber: page,
          pageSize: pageSize,
          totalPages: 0,
          totalCount: 0
        };
      }
      throw error;
    }
  }

  async getUserPosts(userId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Post>> {
    try {
      const params = { page, pageSize };
      const response = await this.api.get(`/posts/user/${userId}`, { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user posts:', error);
      // Return empty paginated response to prevent UI errors
      if (error?.response?.status === 404) {
        return {
          data: [],
          pageNumber: page,
          pageSize: pageSize,
          totalPages: 0,
          totalCount: 0
        };
      }
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

  // Enhanced Social Media Methods
  async getSocialFeed(page: number = 1, pageSize: number = 20, filter: 'all' | 'following' | 'nearby' = 'all'): Promise<{ posts: any[], hasMore: boolean }> {
    try {
      const response = await this.api.get(`/Social/feed?page=${page}&pageSize=${pageSize}&filter=${filter}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching social feed:', error);
      // Return empty array structure to prevent .map errors
      return { posts: [], hasMore: false };
    }
  }

  async createSocialPost(postData: {
    content: string;
    images?: string[];
    location?: string;
    tags?: string[];
    isBusinessPost?: boolean;
    serviceCategory?: string;
    priceRange?: string;
    allowBooking?: boolean;
  }): Promise<any> {
    try {
      const response = await this.api.post('/Social/posts', postData);
      return response.data;
    } catch (error) {
      console.error('Error creating social post:', error);
      throw error;
    }
  }

  async sharePost(postId: string, content?: string): Promise<void> {
    try {
      await this.api.post(`/social/posts/${postId}/share`, { content });
    } catch (error) {
      console.error('Error sharing post:', error);
      throw error;
    }
  }

  async uploadMultipleImages(images: Array<{
    uri: string;
    name: string;
    type: string;
  }>): Promise<string[]> {
    try {
      const uploadPromises = images.map(async (image) => {
        const formData = new FormData();
        formData.append('file', {
          uri: image.uri,
          name: image.name,
          type: image.type,
        } as any);

        const response = await this.api.post('/fileupload/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data.url || response.data.fileName;
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw error;
    }
  }

  async updateProfilePicture(imageUri: string): Promise<string> {
    try {
      const fileName = `profile_${Date.now()}.jpg`;
      const uploadResult = await this.uploadImage(imageUri, fileName);
      
      // Update the user profile with new picture URL
      const currentUser = await this.getCurrentUser();
      if (currentUser) {
        await this.updateProfile({
          profilePictureUrl: uploadResult.url || uploadResult.fileName
        });
      }
      
      return uploadResult.url || uploadResult.fileName;
    } catch (error) {
      console.error('Error updating profile picture:', error);
      throw error;
    }
  }

  async likePost(postId: string): Promise<void> {
    try {
      await this.api.post(`/social/posts/${postId}/like`);
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  }

  async unlikePost(postId: string): Promise<void> {
    try {
      await this.api.delete(`/social/posts/${postId}/like`);
    } catch (error) {
      console.error('Error unliking post:', error);
      throw error;
    }
  }

  async addPostComment(postId: string, content: string): Promise<any> {
    try {
      const response = await this.api.post(`/social/posts/${postId}/comments`, {
        content
      });
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  async bookmarkPost(postId: string): Promise<void> {
    try {
      await this.api.post(`/social/posts/${postId}/bookmark`);
    } catch (error) {
      console.error('Error bookmarking post:', error);
      throw error;
    }
  }

  async unbookmarkPost(postId: string): Promise<void> {
    try {
      await this.api.delete(`/social/posts/${postId}/bookmark`);
    } catch (error) {
      console.error('Error unbookmarking post:', error);
      throw error;
    }
  }

  async followProvider(providerId: string): Promise<void> {
    try {
      await this.api.post(`/social/follow/${providerId}`);
    } catch (error) {
      console.error('Error following provider:', error);
      throw error;
    }
  }

  async unfollowProvider(providerId: string): Promise<void> {
    try {
      await this.api.delete(`/social/follow/${providerId}`);
    } catch (error) {
      console.error('Error unfollowing provider:', error);
      throw error;
    }
  }

  async getFollowStatus(providerId: string): Promise<{ isFollowing: boolean; followersCount: number }> {
    try {
      const response = await this.api.get(`/social/follow/status/${providerId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting follow status:', error);
      // Return default values if the follow functionality is not yet implemented
      return { isFollowing: false, followersCount: 0 };
    }
  }

  async getSavedPosts(page: number = 1): Promise<{ posts: any[]; hasMore: boolean }> {
    try {
      const response = await this.api.get('/social/bookmarks', {
        params: { page }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching saved posts:', error);
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

  // Enhanced Payment Methods
  async calculatePayment(serviceId: number, providerId: string): Promise<PaymentCalculation> {
    try {
      const response = await this.api.get(`/enhancedpayment/calculate/${serviceId}/${providerId}`);
      return response.data;
    } catch (error) {
      console.error('Error calculating payment:', error);
      throw error;
    }
  }

  async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentIntentResponse> {
    try {
      const response = await this.api.post('/enhancedpayment/intent', request);
      return response.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  async processPayment(paymentIntentId: string, paymentMethod: PaymentMethod): Promise<PaymentTransaction> {
    try {
      const response = await this.api.post('/enhancedpayment/process', {
        paymentIntentId,
        paymentMethod
      });
      return response.data;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  async getBookingTransactions(bookingId: number): Promise<PaymentTransaction[]> {
    try {
      const response = await this.api.get(`/enhancedpayment/booking/${bookingId}/transactions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking transactions:', error);
      throw error;
    }
  }

  async requestRefund(request: RefundRequest): Promise<PaymentTransaction> {
    try {
      const response = await this.api.post('/enhancedpayment/refund', request);
      return response.data;
    } catch (error) {
      console.error('Error requesting refund:', error);
      throw error;
    }
  }

  async getPaymentSettings(providerId: string): Promise<PaymentSettings> {
    try {
      const response = await this.api.get(`/enhancedpayment/settings/${providerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      throw error;
    }
  }

  async updatePaymentSettings(providerId: string, settings: Partial<PaymentSettings>): Promise<PaymentSettings> {
    try {
      const response = await this.api.put(`/enhancedpayment/settings/${providerId}`, settings);
      return response.data;
    } catch (error) {
      console.error('Error updating payment settings:', error);
      throw error;
    }
  }

  // ===== ENHANCED PROVIDER BUSINESS MANAGEMENT =====
  
  // Client Management
  async getProviderClients(page: number = 1, limit: number = 20): Promise<PaginatedResponse<any>> {
    try {
      const response = await this.api.get(`/serviceprovider/clients?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching provider clients:', error);
      throw error;
    }
  }

  async updateClientNotes(clientId: string, notes: string): Promise<void> {
    try {
      await this.api.put(`/serviceprovider/clients/${clientId}/notes`, { notes });
    } catch (error) {
      console.error('Error updating client notes:', error);
      throw error;
    }
  }

  async sendClientMessage(clientIds: string[], message: string): Promise<void> {
    try {
      await this.api.post('/serviceprovider/clients/message', {
        clientIds,
        message
      });
    } catch (error) {
      console.error('Error sending client message:', error);
      throw error;
    }
  }

  // Coupons Management
  async getCoupons(): Promise<any[]> {
    try {
      const response = await this.api.get('/serviceprovider/coupons');
      return response.data;
    } catch (error) {
      console.error('Error fetching coupons:', error);
      throw error;
    }
  }

  async createCoupon(couponData: any): Promise<any> {
    try {
      const response = await this.api.post('/serviceprovider/coupons', couponData);
      return response.data;
    } catch (error) {
      console.error('Error creating coupon:', error);
      throw error;
    }
  }

  async updateCoupon(couponId: string, couponData: any): Promise<any> {
    try {
      const response = await this.api.put(`/serviceprovider/coupons/${couponId}`, couponData);
      return response.data;
    } catch (error) {
      console.error('Error updating coupon:', error);
      throw error;
    }
  }

  async toggleCoupon(couponId: string, isActive: boolean): Promise<void> {
    try {
      await this.api.patch(`/serviceprovider/coupons/${couponId}/toggle`, { isActive });
    } catch (error) {
      console.error('Error toggling coupon:', error);
      throw error;
    }
  }

  async deleteCoupon(couponId: string): Promise<void> {
    try {
      await this.api.delete(`/serviceprovider/coupons/${couponId}`);
    } catch (error) {
      console.error('Error deleting coupon:', error);
      throw error;
    }
  }

  // Loyalty Programs
  async getLoyaltyPrograms(): Promise<any[]> {
    try {
      const response = await this.api.get('/serviceprovider/loyalty');
      return response.data;
    } catch (error) {
      console.error('Error fetching loyalty programs:', error);
      throw error;
    }
  }

  async createLoyaltyProgram(programData: any): Promise<any> {
    try {
      const response = await this.api.post('/serviceprovider/loyalty', programData);
      return response.data;
    } catch (error) {
      console.error('Error creating loyalty program:', error);
      throw error;
    }
  }

  async updateLoyaltyProgram(programId: string, programData: any): Promise<any> {
    try {
      const response = await this.api.put(`/serviceprovider/loyalty/${programId}`, programData);
      return response.data;
    } catch (error) {
      console.error('Error updating loyalty program:', error);
      throw error;
    }
  }

  async toggleLoyaltyProgram(programId: string, isActive: boolean): Promise<void> {
    try {
      await this.api.patch(`/serviceprovider/loyalty/${programId}/toggle`, { isActive });
    } catch (error) {
      console.error('Error toggling loyalty program:', error);
      throw error;
    }
  }

  // Auto Messages
  async getAutoMessages(): Promise<any[]> {
    try {
      const response = await this.api.get('/serviceprovider/auto-messages');
      return response.data;
    } catch (error) {
      console.error('Error fetching auto messages:', error);
      throw error;
    }
  }

  async createAutoMessage(messageData: any): Promise<any> {
    try {
      const response = await this.api.post('/serviceprovider/auto-messages', messageData);
      return response.data;
    } catch (error) {
      console.error('Error creating auto message:', error);
      throw error;
    }
  }

  async updateAutoMessage(messageId: string, messageData: any): Promise<any> {
    try {
      const response = await this.api.put(`/serviceprovider/auto-messages/${messageId}`, messageData);
      return response.data;
    } catch (error) {
      console.error('Error updating auto message:', error);
      throw error;
    }
  }

  async toggleAutoMessage(messageId: string, isActive: boolean): Promise<void> {
    try {
      await this.api.patch(`/serviceprovider/auto-messages/${messageId}/toggle`, { isActive });
    } catch (error) {
      console.error('Error toggling auto message:', error);
      throw error;
    }
  }

  // Schedule Management
  async getProviderSchedule(weekOffset: number = 0): Promise<any> {
    try {
      const response = await this.api.get(`/providerschedule/weekly?weekOffset=${weekOffset}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching provider schedule:', error);
      throw error;
    }
  }

  async updateDaySchedule(dayData: any): Promise<void> {
    try {
      await this.api.put('/providerschedule/day', dayData);
    } catch (error) {
      console.error('Error updating day schedule:', error);
      throw error;
    }
  }

  async checkScheduleConflicts(appointmentData: any): Promise<any> {
    try {
      const response = await this.api.post('/providerschedule/check-conflicts', appointmentData);
      return response.data;
    } catch (error) {
      console.error('Error checking schedule conflicts:', error);
      throw error;
    }
  }

  // Business Location
  async updateBusinessLocation(locationData: any): Promise<void> {
    try {
      await this.api.put('/serviceprovider/business-location', locationData);
    } catch (error) {
      console.error('Error updating business location:', error);
      throw error;
    }
  }

  async getBusinessLocation(): Promise<any> {
    try {
      const response = await this.api.get('/serviceprovider/business-location');
      return response.data;
    } catch (error) {
      console.error('Error fetching business location:', error);
      throw error;
    }
  }

  // Enhanced Analytics
  async getRevenueAnalytics(timeframe: 'week' | 'month' | 'quarter' | 'year'): Promise<RevenueAnalytics> {
    try {
      const response = await this.api.get(`/analytics/revenue?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      throw error;
    }
  }

  async getClientAnalytics(): Promise<ClientAnalytics> {
    try {
      const response = await this.api.get('/analytics/clients');
      return response.data;
    } catch (error) {
      console.error('Error fetching client analytics:', error);
      throw error;
    }
  }

  async getServicePerformance(): Promise<any[]> {
    try {
      const response = await this.api.get('/analytics/service-performance');
      return response.data;
    } catch (error) {
      console.error('Error fetching service performance:', error);
      throw error;
    }
  }

  async getBookingTrends(timeframe: string): Promise<any> {
    try {
      const response = await this.api.get(`/analytics/booking-trends?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking trends:', error);
      throw error;
    }
  }

  // Appointment Management (Enhanced)
  async acceptAppointment(appointmentId: string): Promise<void> {
    try {
      await this.api.patch(`/booking/${appointmentId}/accept`);
    } catch (error) {
      console.error('Error accepting appointment:', error);
      throw error;
    }
  }

  async declineAppointment(appointmentId: string, reason?: string): Promise<void> {
    try {
      await this.api.patch(`/booking/${appointmentId}/decline`, { reason });
    } catch (error) {
      console.error('Error declining appointment:', error);
      throw error;
    }
  }

  async completeAppointment(appointmentId: string): Promise<void> {
    try {
      await this.api.patch(`/booking/${appointmentId}/complete`);
    } catch (error) {
      console.error('Error completing appointment:', error);
      throw error;
    }
  }

  async rescheduleAppointment(appointmentId: string, newDateTime: string): Promise<void> {
    try {
      await this.api.patch(`/booking/${appointmentId}/reschedule`, { 
        newDateTime 
      });
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw error;
    }
  }

  // Client Communication
  async getClientHistory(clientId: string): Promise<any> {
    try {
      const response = await this.api.get(`/serviceprovider/clients/${clientId}/history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching client history:', error);
      throw error;
    }
  }

  async sendPromoMessage(clientIds: string[], promoData: any): Promise<void> {
    try {
      await this.api.post('/serviceprovider/send-promo', {
        clientIds,
        ...promoData
      });
    } catch (error) {
      console.error('Error sending promo message:', error);
      throw error;
    }
  }

  // Loyalty Points Management
  async awardLoyaltyPoints(clientId: string, points: number, reason: string): Promise<void> {
    try {
      await this.api.post(`/serviceprovider/loyalty/award`, {
        clientId,
        points,
        reason
      });
    } catch (error) {
      console.error('Error awarding loyalty points:', error);
      throw error;
    }
  }

  async redeemLoyaltyPoints(clientId: string, points: number): Promise<void> {
    try {
      await this.api.post(`/serviceprovider/loyalty/redeem`, {
        clientId,
        points
      });
    } catch (error) {
      console.error('Error redeeming loyalty points:', error);
      throw error;
    }
  }

  // ===== REAL DATA INTEGRATION METHODS =====

  // Provider Analytics with Real Data
  async getProviderAnalytics(providerId: string, period: 'week' | 'month' | 'year'): Promise<{
    revenue: RevenueAnalytics;
    clients: ClientAnalytics;
    socialMetrics: {
      totalPosts: number;
      totalLikes: number;
      totalComments: number;
      totalFollowers: number;
      engagementRate: number;
    };
  }> {
    try {
      const response = await this.api.get(`/analytics/provider/${providerId}`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching provider analytics:', error);
      throw error;
    }
  }

  // Client-Provider Interaction Methods
  async getProviderPromosForClient(providerId: string): Promise<{
    id: string;
    title: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minPurchase?: number;
    validFrom: string;
    validUntil: string;
    isActive: boolean;
    usageCount: number;
    maxUsage?: number;
  }[]> {
    try {
      const response = await this.api.get(`/providers/${providerId}/promos/active`);
      return response.data;
    } catch (error: any) {
      // Silently handle missing endpoint - return mock data for now
      if (error?.response?.status === 404) {
        return [
          {
            id: '1',
            title: 'New Client Special',
            description: 'Get 20% off your first appointment',
            discountType: 'percentage',
            discountValue: 20,
            minPurchase: 50,
            validFrom: '2025-08-01T00:00:00Z',
            validUntil: '2025-12-31T23:59:59Z',
            isActive: true,
            usageCount: 15,
            maxUsage: 100,
          },
          {
            id: '2',
            title: 'Summer Glow Package',
            description: '$30 off premium facial services',
            discountType: 'fixed',
            discountValue: 30,
            validFrom: '2025-08-01T00:00:00Z',
            validUntil: '2025-09-30T23:59:59Z',
            isActive: true,
            usageCount: 8,
            maxUsage: 50,
          },
        ];
      }
      console.error('Error fetching provider promos:', error);
      return [];
    }
  }

  async getClientLoyaltyStatus(providerId: string, clientId: string): Promise<{
    totalPoints: number;
    currentTierLevel: string;
    nextTierPoints: number;
    availableRewards: {
      id: string;
      title: string;
      description: string;
      pointsCost: number;
      type: 'discount' | 'service' | 'product';
      value: number;
    }[];
    recentTransactions: {
      id: string;
      type: 'earned' | 'redeemed';
      points: number;
      description: string;
      date: string;
    }[];
  }> {
    try {
      const response = await this.api.get(`/loyalty/${providerId}/client/${clientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching client loyalty status:', error);
      throw error;
    }
  }

  async getProviderScheduleForClient(providerId: string, date?: string): Promise<{
    availableSlots: {
      date: string;
      timeSlots: {
        time: string;
        available: boolean;
        serviceId?: string;
        duration: number;
      }[];
    }[];
    blockedDates: string[];
    specialHours: {
      date: string;
      openTime: string;
      closeTime: string;
      note?: string;
    }[];
  }> {
    try {
      const response = await this.api.get(`/providers/${providerId}/schedule`, {
        params: { date, forClient: true }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching provider schedule:', error);
      throw error;
    }
  }

  // Real Social Metrics
  async getPostMetrics(postId: string): Promise<{
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    bookmarksCount: number;
    viewsCount: number;
    isLikedByCurrentUser: boolean;
    isBookmarkedByCurrentUser: boolean;
  }> {
    try {
      const response = await this.api.get(`/social/posts/${postId}/metrics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching post metrics:', error);
      return {
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        bookmarksCount: 0,
        viewsCount: 0,
        isLikedByCurrentUser: false,
        isBookmarkedByCurrentUser: false,
      };
    }
  }

  async togglePostLike(postId: string): Promise<{ isLiked: boolean; newCount: number }> {
    try {
      const response = await this.api.post(`/social/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error toggling post like:', error);
      throw error;
    }
  }

  async togglePostBookmark(postId: string): Promise<{ isBookmarked: boolean; newCount: number }> {
    try {
      const response = await this.api.post(`/social/posts/${postId}/bookmark`);
      return response.data;
    } catch (error) {
      console.error('Error toggling post bookmark:', error);
      throw error;
    }
  }

  async getUserSocialStats(userId: string): Promise<{
    postsCount: number;
    followersCount: number;
    followingCount: number;
    totalLikes: number;
    totalComments: number;
    engagementRate: number;
  }> {
    try {
      const response = await this.api.get(`/social/users/${userId}/stats`);
      return response.data;
    } catch (error: any) {
      // Silently handle missing endpoint - return mock data for now
      if (error?.response?.status === 404) {
        return {
          postsCount: 12,
          followersCount: 245,
          followingCount: 189,
          totalLikes: 1248,
          totalComments: 324,
          engagementRate: 8.5,
        };
      }
      console.error('Error fetching user social stats:', error);
      return {
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
        totalLikes: 0,
        totalComments: 0,
        engagementRate: 0,
      };
    }
  }

  async followUser(userId: string): Promise<{ isFollowing: boolean; newFollowerCount: number }> {
    try {
      const response = await this.api.post(`/social/users/${userId}/follow`);
      return response.data;
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  async unfollowUser(userId: string): Promise<{ isFollowing: boolean; newFollowerCount: number }> {
    try {
      const response = await this.api.delete(`/social/users/${userId}/follow`);
      return response.data;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  // Real-time Comment System
  async getPostComments(postId: string, page: number = 1, limit: number = 20): Promise<{
    comments: {
      id: string;
      postId: string;
      userId: string;
      content: string;
      createdAt: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        profilePictureUrl?: string;
      };
      likesCount: number;
      isLikedByCurrentUser: boolean;
      replies?: any[];
    }[];
    hasMore: boolean;
    totalCount: number;
  }> {
    try {
      const response = await this.api.get(`/social/posts/${postId}/comments`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching post comments:', error);
      return { comments: [], hasMore: false, totalCount: 0 };
    }
  }

  async addComment(postId: string, content: string): Promise<any> {
    try {
      const response = await this.api.post(`/social/posts/${postId}/comments`, {
        content
      });
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  async likeComment(commentId: string): Promise<{ isLiked: boolean; newCount: number }> {
    try {
      const response = await this.api.post(`/social/comments/${commentId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error liking comment:', error);
      throw error;
    }
  }

  // Enhanced Client Profile Data
  async getClientProfileData(clientId: string): Promise<{
    user: User;
    socialStats: {
      postsCount: number;
      followersCount: number;
      followingCount: number;
    };
    loyaltyPrograms: {
      providerId: string;
      providerName: string;
      totalPoints: number;
      tierLevel: string;
      availableRewards: number;
    }[];
    availablePromos: {
      providerId: string;
      providerName: string;
      promos: {
        id: string;
        title: string;
        description: string;
        discountValue: number;
        validUntil: string;
      }[];
    }[];
    recentBookings: Booking[];
    favoriteProviders: ServiceProvider[];
  }> {
    try {
      const response = await this.api.get(`/clients/${clientId}/profile`);
      return response.data;
    } catch (error) {
      console.error('Error fetching client profile data:', error);
      throw error;
    }
  }

  // Provider Profile Enhancement
  async getProviderProfileData(providerId: string): Promise<{
    provider: ServiceProvider;
    socialStats: {
      postsCount: number;
      followersCount: number;
      followingCount: number;
      totalLikes: number;
      engagementRate: number;
    };
    services: Service[];
    recentPosts: Post[];
    reviews: Review[];
    averageRating: number;
    activePromos: {
      id: string;
      title: string;
      description: string;
      discountValue: number;
      validUntil: string;
    }[];
    schedule: {
      nextAvailableSlot: string;
      weeklyAvailability: {
        [key: string]: {
          openTime: string;
          closeTime: string;
          available: boolean;
        };
      };
    };
  }> {
    try {
      const response = await this.api.get(`/providers/${providerId}/profile`);
      return response.data;
    } catch (error) {
      console.error('Error fetching provider profile data:', error);
      throw error;
    }
  }

  // Real-time Notifications
  async getNotifications(page: number = 1): Promise<{
    notifications: {
      id: string;
      type: 'like' | 'comment' | 'follow' | 'booking' | 'promo' | 'loyalty';
      title: string;
      message: string;
      isRead: boolean;
      createdAt: string;
      actionUrl?: string;
      relatedUser?: {
        id: string;
        firstName: string;
        lastName: string;
        profilePictureUrl?: string;
      };
    }[];
    unreadCount: number;
    hasMore: boolean;
  }> {
    try {
      const response = await this.api.get('/notifications', {
        params: { page }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { notifications: [], unreadCount: 0, hasMore: false };
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await this.api.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    try {
      await this.api.patch('/notifications/read-all');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Database management
  async reseedDatabase(): Promise<any> {
    try {
      const response = await this.api.post('/database/reseed');
      return response.data;
    } catch (error) {
      console.error('Error reseeding database:', error);
      throw error;
    }
  }

  async getDatabaseStats(): Promise<any> {
    try {
      const response = await this.api.get('/database/stats');
      return response.data;
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  }

  // Enhanced Provider Appointments Management
  async getProviderAppointments(filters: any): Promise<any> {
    try {
      const queryString = new URLSearchParams(filters).toString();
      const response = await this.api.get(`/provider/appointments?${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Error getting provider appointments:', error);
      throw error;
    }
  }

  async updateAppointmentStatus(appointmentId: number, status: string, notes?: string, tipAmount?: number): Promise<any> {
    try {
      const response = await this.api.post(`/provider/appointments/${appointmentId}/update-status`, {
        status,
        notes,
        tipAmount
      });
      return response.data;
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  }

  async getProviderPaymentHistory(startDate?: string, endDate?: string, page = 1, pageSize = 50): Promise<any> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      const response = await this.api.get(`/provider/appointments/payment-history?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw error;
    }
  }

  async generateInvoice(bookingId: number): Promise<any> {
    try {
      const response = await this.api.post(`/provider/appointments/generate-invoice/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  }

  // Enhanced Schedule Management
  async getProviderWeekSchedule(weekStart: string): Promise<any> {
    try {
      const response = await this.api.get(`/provider/schedule-management/week?weekStart=${weekStart}`);
      return response.data;
    } catch (error) {
      console.error('Error getting week schedule:', error);
      throw error;
    }
  }

  async getProviderScheduleStats(startDate?: string, endDate?: string): Promise<any> {
    try {
      const params = new URLSearchParams({
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      const response = await this.api.get(`/provider/schedule-management/stats?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error getting schedule stats:', error);
      throw error;
    }
  }

  async blockTimeSlot(date: string, startTime: string, endTime: string, reason?: string): Promise<any> {
    try {
      const response = await this.api.post('/provider/schedule-management/block-time', {
        date,
        startTime,
        endTime,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error blocking time slot:', error);
      throw error;
    }
  }

  async unblockTimeSlot(bookingId: number): Promise<any> {
    try {
      const response = await this.api.delete(`/provider/schedule-management/unblock-time/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error('Error unblocking time slot:', error);
      throw error;
    }
  }

  async updateProviderAvailability(availabilityUpdate: any): Promise<any> {
    try {
      const response = await this.api.post('/provider/schedule-management/availability', availabilityUpdate);
      return response.data;
    } catch (error) {
      console.error('Error updating availability:', error);
      throw error;
    }
  }

  async updateBulkAvailability(bulkUpdate: any): Promise<any> {
    try {
      const response = await this.api.post('/provider/schedule-management/bulk-availability', bulkUpdate);
      return response.data;
    } catch (error) {
      console.error('Error updating bulk availability:', error);
      throw error;
    }
  }

  // Public schedule access for clients
  async getProviderPublicAvailability(providerId: string, date: string): Promise<any> {
    try {
      const response = await this.api.get(`/provider/schedule-management/availability/${providerId}?date=${date}`);
      return response.data;
    } catch (error) {
      console.error('Error getting provider availability:', error);
      throw error;
    }
  }
}

export default new ApiService();
