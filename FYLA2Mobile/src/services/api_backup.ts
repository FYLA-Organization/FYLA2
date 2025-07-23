import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  User,
  ServiceProvider,
  Service,
  Booking,
  CreateBookingRequest,
  Message,
  ChatRoom,
} from '../types';

  async sendMessage(receiverId: string, content: string): Promise<Message> {
    try {
      const response = await this.api.post('/chat/send', {
        receiverId,
        content,
        messageType: 'text',
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
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
  }teBookingRequest,
  Review,
  Post,
  Message,
  Conversation,
  ApiResponse,
  PaginatedResponse,
  SearchFilters
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL = 'http://192.168.1.185:5224/api'; // Updated to use new WiFi network IP

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          await this.refreshToken();
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<any> = await this.api.post('/auth/login', credentials);
    await this.saveTokens(response.data.token, ''); // No refresh token yet
    return {
      token: response.data.token,
      refreshToken: '', // Backend doesn't provide refresh token yet
      user: response.data.user
    };
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<any> = await this.api.post('/auth/register', userData);
    await this.saveTokens(response.data.token, ''); // No refresh token yet
    return {
      token: response.data.token,
      refreshToken: '', // Backend doesn't provide refresh token yet
      user: response.data.user
    };
  }

  // Dev login methods
  async devLoginClient(): Promise<AuthResponse> {
    const response: AxiosResponse<any> = await this.api.post('/auth/dev-login-client');
    await this.saveTokens(response.data.token, '');
    return {
      token: response.data.token,
      refreshToken: '',
      user: response.data.user
    };
  }

  async devLoginProvider(): Promise<AuthResponse> {
    const response: AxiosResponse<any> = await this.api.post('/auth/dev-login-provider');
    await this.saveTokens(response.data.token, '');
    return {
      token: response.data.token,
      refreshToken: '',
      user: response.data.user
    };
  }

  async refreshToken(): Promise<void> {
    try {
      // For now, just logout since we don't have refresh token implementation
      await this.logout();
    } catch (error) {
      await this.logout();
      throw error;
    }
  }

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove(['auth_token', 'refresh_token', 'user_data']);
  }

  private async saveTokens(token: string, refreshToken: string): Promise<void> {
    await AsyncStorage.multiSet([
      ['auth_token', token],
      ['refresh_token', refreshToken]
    ]);
  }

  // User Management
  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/auth/me');
    return response.data;
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response: AxiosResponse<User> = await this.api.put('/auth/profile', userData);
    return response.data;
  }

  // Service Providers
  async getServiceProviders(page = 1, pageSize = 10, filters?: SearchFilters, query?: string): Promise<PaginatedResponse<ServiceProvider>> {
    const params: any = { page, pageSize };
    
    // Add search query if provided
    if (query) {
      params.query = query;
    }
    
    // Add filters if provided
    if (filters) {
      if (filters.category) params.category = filters.category;
      if (filters.location) params.location = filters.location;
      if (filters.rating) params.minRating = filters.rating;
      if (filters.priceMin) params.priceMin = filters.priceMin;
      if (filters.priceMax) params.priceMax = filters.priceMax;
    }
    
    console.log('API call params:', params);
    
    const response: AxiosResponse<PaginatedResponse<ServiceProvider>> = await this.api.get('/serviceprovider/search', { params });
    return response.data;
  }

  async getServiceProvider(id: string): Promise<ServiceProvider> {
    const response: AxiosResponse<ServiceProvider> = await this.api.get(`/serviceprovider/${id}`);
    return response.data;
  }

  async getFeaturedProviders(count = 6): Promise<ServiceProvider[]> {
    const response: AxiosResponse<ServiceProvider[]> = await this.api.get(`/serviceprovider/featured?count=${count}`);
    return response.data;
  }

  async createServiceProvider(providerData: Partial<ServiceProvider>): Promise<ServiceProvider> {
    const response: AxiosResponse<ServiceProvider> = await this.api.post('/serviceprovider', providerData);
    return response.data;
  }

  async updateServiceProvider(providerData: Partial<ServiceProvider>): Promise<ServiceProvider> {
    const response: AxiosResponse<ServiceProvider> = await this.api.put('/serviceprovider', providerData);
    return response.data;
  }

  // Services
  async getServices(providerId?: string): Promise<Service[]> {
    if (providerId) {
      // Use specific provider services endpoint
      const response: AxiosResponse<Service[]> = await this.api.get(`/serviceprovider/${providerId}/services`);
      return response.data;
    } else {
      // Use general services endpoint
      const response: AxiosResponse<Service[]> = await this.api.get('/services');
      return response.data;
    }
  }

  async getService(id: string): Promise<Service> {
    const response: AxiosResponse<Service> = await this.api.get(`/services/${id}`);
    return response.data;
  }

  async searchServices(query: string, filters?: SearchFilters): Promise<PaginatedResponse<Service>> {
    const params = { query, ...filters };
    const response: AxiosResponse<PaginatedResponse<Service>> = await this.api.get('/services/search', { params });
    return response.data;
  }

  // Bookings
  async createBooking(bookingData: CreateBookingRequest): Promise<Booking> {
    const response: AxiosResponse<Booking> = await this.api.post('/bookings', bookingData);
    return response.data;
  }

  async getBookings(status?: string): Promise<Booking[]> {
    const params = status ? { status } : {};
    const response: AxiosResponse<Booking[]> = await this.api.get('/bookings/my-bookings', { params });
    return response.data;
  }

  async getBooking(id: string): Promise<Booking> {
    const response: AxiosResponse<Booking> = await this.api.get(`/bookings/${id}`);
    return response.data;
  }

  async getAvailability(providerId: string, date: string): Promise<string[]> {
    const response: AxiosResponse<string[]> = await this.api.get(`/bookings/availability/${providerId}?date=${date}`);
    return response.data;
  }

  async updateBookingStatus(id: string, status: string): Promise<void> {
    try {
      console.log('Updating booking status:', { id, status });
      await this.api.put(`/bookings/${id}/status`, { 
        status: status 
      });
    } catch (error) {
      console.error('Update booking status error:', error);
      throw error;
    }
  }

  async cancelBooking(id: string, reason: string): Promise<Booking> {
    const response: AxiosResponse<Booking> = await this.api.put(`/bookings/${id}/cancel`, { reason });
    return response.data;
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    try {
      const response = await this.api.get(`/bookings/my-bookings`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }
  }

  // Reviews
  async createReview(reviewData: { bookingId: string; rating: number; comment?: string }): Promise<Review> {
    const response: AxiosResponse<Review> = await this.api.post('/reviews', reviewData);
    return response.data;
  }

  async getReviews(providerId: string): Promise<Review[]> {
    const response: AxiosResponse<{ data: Review[] }> = await this.api.get(`/serviceprovider/${providerId}/reviews`);
    return response.data.data; // Backend returns { data: reviews[], pagination: {...} }
  }

  // Social Media
  async getPosts(page = 1, pageSize = 10): Promise<PaginatedResponse<Post>> {
    const params = { page, pageSize };
    const response: AxiosResponse<PaginatedResponse<Post>> = await this.api.get('/social/posts', { params });
    return response.data;
  }

  async createPost(postData: { content?: string; imageUrl?: string }): Promise<Post> {
    const response: AxiosResponse<Post> = await this.api.post('/social/posts', postData);
    return response.data;
  }

  async likePost(postId: string): Promise<void> {
    await this.api.post(`/social/posts/${postId}/like`);
  }

  async addComment(postId: string, content: string): Promise<void> {
    await this.api.post(`/social/posts/${postId}/comments`, { content });
  }

  async followUser(userId: string): Promise<void> {
    await this.api.post(`/social/follow/${userId}`);
  }

  // Messaging
  async getConversations(): Promise<Conversation[]> {
    const response: AxiosResponse<Conversation[]> = await this.api.get('/messaging/conversations');
    return response.data;
  }

  async getMessages(userId: string): Promise<Message[]> {
    const response: AxiosResponse<Message[]> = await this.api.get(`/messaging/conversation/${userId}`);
    return response.data;
  }

  async sendMessage(receiverId: string, content: string): Promise<Message> {
    const response: AxiosResponse<Message> = await this.api.post('/messaging/send', {
      receiverId,
      content
    });
    return response.data;
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await this.api.put(`/messaging/mark-read/${messageId}`);
  }

  // File Upload
  async uploadFile(file: any, type: 'image' | 'video' = 'image'): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response: AxiosResponse<{ url: string }> = await this.api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  }
}

export default new ApiService();
