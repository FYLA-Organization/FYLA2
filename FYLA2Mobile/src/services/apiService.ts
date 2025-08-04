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
  SearchFilters,
  FileUploadResponse,
  ProviderDashboard,
  RevenueAnalytics,
  ClientAnalytics,
  ClientDashboard
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private isInitialized: boolean = false;

  constructor() {
    // Initialize with a placeholder - will be updated after config initialization
    this.api = axios.create({
      baseURL: 'http://localhost:5224/api',
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    this.initializeConfig();
  }

  private async initializeConfig() {
    try {
      await Config.initialize();
      
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
      console.log('API Service initialized with URL:', Config.baseURL);
    } catch (error) {
      console.error('Failed to initialize API service:', error);
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

  async getCurrentUser(): Promise<User | null> {
    try {
      const userString = await AsyncStorage.getItem('currentUser');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async getCurrentUserId(): Promise<string> {
    try {
      const user = await this.getCurrentUser();
      return user?.id || '';
    } catch (error) {
      console.error('Error getting current user ID:', error);
      throw error;
    }
  }

  // Services Methods
  async getServices(): Promise<Service[]> {
    try {
      const response = await this.api.get('/services');
      return response.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  async getServiceProviders(serviceId?: string): Promise<ServiceProvider[]> {
    try {
      const url = serviceId ? `/services/${serviceId}/providers` : '/providers';
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching service providers:', error);
      throw error;
    }
  }

  // Booking Methods - Phase 3 Enhanced
  async getAvailableSlots(providerId: string, serviceId: string, date: string): Promise<any> {
    try {
      const response = await this.api.get(`/booking/available-slots?providerId=${providerId}&serviceId=${serviceId}&date=${date}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching available slots:', error);
      throw error;
    }
  }

  async createBooking(bookingData: {
    serviceId: string;
    providerId: string;
    date: string;
    time: string;
    totalPrice: number;
    paymentMethod: string;
    notes?: string;
  }): Promise<any> {
    try {
      const response = await this.api.post('/booking/create', bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  async getBookingDetails(bookingId: string): Promise<any> {
    try {
      const response = await this.api.get(`/booking/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking details:', error);
      throw error;
    }
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<any> {
    try {
      const response = await this.api.post(`/booking/${bookingId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  async rescheduleBooking(bookingId: string, newDate: string, newTime: string): Promise<any> {
    try {
      const response = await this.api.post(`/booking/${bookingId}/reschedule`, {
        newDate,
        newTime,
      });
      return response.data;
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      throw error;
    }
  }

  async getProviderSchedule(providerId: string, date: string): Promise<any> {
    try {
      const response = await this.api.get(`/booking/provider/${providerId}/schedule?date=${date}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching provider schedule:', error);
      throw error;
    }
  }

  async blockTime(providerId: string, blockData: {
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
  }): Promise<any> {
    try {
      const response = await this.api.post(`/booking/provider/${providerId}/block-time`, blockData);
      return response.data;
    } catch (error) {
      console.error('Error blocking time:', error);
      throw error;
    }
  }

  // Analytics Methods - Phase 3 Enhanced
  async getProviderAnalytics(providerId: string, days: number = 30): Promise<any> {
    try {
      const response = await this.api.get(`/analytics/provider/${providerId}?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching provider analytics:', error);
      throw error;
    }
  }

  async getClientAnalytics(clientId: string, months: number = 6): Promise<any> {
    try {
      const response = await this.api.get(`/analytics/client/${clientId}?months=${months}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching client analytics:', error);
      throw error;
    }
  }

  async getDashboardData(): Promise<any> {
    try {
      const response = await this.api.get('/analytics/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  // File Upload Methods - Phase 3 Enhanced
  async uploadImageBase64(uploadData: {
    base64Data: string;
    fileName: string;
    contentType: string;
    category: string;
  }): Promise<any> {
    try {
      const response = await this.api.post('/fileupload/image', uploadData);
      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async bulkUploadImages(uploadData: {
    images: Array<{
      base64Data: string;
      fileName: string;
      contentType: string;
    }>;
    category: string;
  }): Promise<any> {
    try {
      const response = await this.api.post('/fileupload/images/bulk', uploadData);
      return response.data;
    } catch (error) {
      console.error('Error bulk uploading images:', error);
      throw error;
    }
  }

  async getUserFiles(userId: string, category?: string): Promise<any> {
    try {
      const params = category ? `?category=${category}` : '';
      const response = await this.api.get(`/fileupload/user/${userId}${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user files:', error);
      throw error;
    }
  }

  async deleteFile(fileId: string): Promise<any> {
    try {
      const response = await this.api.delete(`/fileupload/${fileId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async optimizeImage(fileId: string): Promise<any> {
    try {
      const response = await this.api.post(`/fileupload/optimize/${fileId}`);
      return response.data;
    } catch (error) {
      console.error('Error optimizing image:', error);
      throw error;
    }
  }

    // Test connectivity methods
  async testConnection(): Promise<any> {
    console.log('🔄 Testing basic API connectivity...');
    const response = await this.api.get('/Test');
    return response.data;
  }

  async testProviders(): Promise<any> {
    console.log('🔄 Testing providers endpoint...');
    const response = await this.api.get('/Test/providers');
    return response.data;
  }

  async testSocialFeed(): Promise<any> {
    console.log('🔄 Testing social feed endpoint...');
    const response = await this.api.get('/Test/social-feed');
    return response.data;
  }

  // Social Media Methods
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
    imageUrls?: string[];
    serviceId?: string;
    isBusinessPost?: boolean;
    location?: string;
  }): Promise<any> {
    try {
      const response = await this.api.post('/Social/posts', postData);
      return response.data;
    } catch (error) {
      console.error('Error creating social post:', error);
      throw error;
    }
  }

  async likePost(postId: string): Promise<void> {
    try {
      await this.api.post(`/Social/posts/${postId}/like`);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  }

  async unlikePost(postId: string): Promise<void> {
    try {
      await this.api.delete(`/Social/posts/${postId}/like`);
    } catch (error) {
      console.error('Error unliking post:', error);
    }
  }

  async getFollowStatus(userId: string): Promise<{ isFollowing: boolean; followersCount: number }> {
    try {
      const response = await this.api.get(`/Social/users/${userId}/follow-status`);
      return response.data;
    } catch (error) {
      console.error('Error getting follow status:', error);
      // Return fallback data on error
      return { isFollowing: false, followersCount: 0 };
    }
  }

  async unfollowUser(userId: string): Promise<{ isFollowing: boolean; followersCount: number }> {
    try {
      const response = await this.api.delete(`/Social/users/${userId}/follow`);
      return response.data;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  async followUser(userId: string): Promise<{ isFollowing: boolean; followersCount: number }> {
    try {
      const response = await this.api.post(`/Social/users/${userId}/follow`);
      return response.data;
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<any> {
    try {
      const response = await this.api.get(`/Social/users/${userId}/profile`);
      return response.data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async getMyProfile(): Promise<any> {
    try {
      const response = await this.api.get('/Social/users/me/profile');
      return response.data;
    } catch (error) {
      console.error('Error getting my profile:', error);
      throw error;
    }
  }

  async getUserPosts(userId: string, page: number = 1, pageSize: number = 20): Promise<any[]> {
    try {
      const response = await this.api.get(`/Social/users/${userId}/posts?page=${page}&pageSize=${pageSize}`);
      return response.data;
    } catch (error) {
      console.error('Error getting user posts:', error);
      return [];
    }
  }

  async getServiceProvider(providerId: string): Promise<any> {
    try {
      const response = await this.api.get(`/ServiceProvider/${providerId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting service provider:', error);
      throw error;
    }
  }

  async getServicesByProvider(providerId: string): Promise<any[]> {
    try {
      const response = await this.api.get(`/ServiceProvider/${providerId}/services`);
      return response.data;
    } catch (error) {
      console.error('Error getting services by provider:', error);
      return [];
    }
  }

  async getReviews(providerId: string): Promise<any[]> {
    try {
      const response = await this.api.get(`/ServiceProvider/${providerId}/reviews`);
      return response.data;
    } catch (error) {
      console.error('Error getting reviews:', error);
      return [];
    }
  }

  // Search Methods
  async advancedSearch(searchParams: {
    query?: string;
    category?: string;
    priceRange?: { min: number; max: number };
    rating?: number;
    distance?: number;
    availability?: string;
    sortBy?: string;
    features?: string[];
    location?: string;
    openNow?: boolean;
  }) {
    try {
      // Use ServiceProvider endpoint for search
      const params = new URLSearchParams();
      if (searchParams.query) params.append('query', searchParams.query);
      if (searchParams.category) params.append('category', searchParams.category);
      if (searchParams.location) params.append('location', searchParams.location);
      if (searchParams.rating) params.append('minRating', searchParams.rating.toString());
      if (searchParams.priceRange) {
        params.append('priceMin', searchParams.priceRange.min.toString());
        params.append('priceMax', searchParams.priceRange.max.toString());
      }
      params.append('page', '1');
      params.append('pageSize', '20');

      const response = await this.api.get(`/ServiceProvider?${params.toString()}`);
      return { data: response.data };
    } catch (error) {
      console.error('Error performing advanced search:', error);
      return { data: [] };
    }
  }

  // Enhanced Provider Appointment Management
  async getProviderAppointments(filters?: {
    page?: number;
    pageSize?: number;
    status?: string;
    paymentStatus?: string;
    membershipTier?: string;
    minAmount?: number;
    maxAmount?: number;
    searchTerm?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
      if (filters?.membershipTier) params.append('membershipTier', filters.membershipTier);
      if (filters?.minAmount) params.append('minAmount', filters.minAmount.toString());
      if (filters?.maxAmount) params.append('maxAmount', filters.maxAmount.toString());
      if (filters?.searchTerm) params.append('searchTerm', filters.searchTerm);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await this.api.get(`/provider/appointments?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting provider appointments:', error);
      return { success: false, message: 'Failed to get appointments' };
    }
  }

  async updateAppointmentStatus(appointmentId: number, status: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.put(`/provider/appointments/${appointmentId}/status`, { status });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating appointment status:', error);
      return { success: false, message: 'Failed to update appointment status' };
    }
  }

  async generateInvoice(appointmentId: number): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post(`/provider/appointments/${appointmentId}/invoice`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error generating invoice:', error);
      return { success: false, message: 'Failed to generate invoice' };
    }
  }

  async getPaymentHistory(filters?: {
    page?: number;
    pageSize?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await this.api.get(`/provider/appointments/payment-history?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting payment history:', error);
      return { success: false, message: 'Failed to get payment history' };
    }
  }

  // Enhanced Schedule Management
  async getWeekSchedule(weekStart: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(`/ProviderScheduleManagement/week?weekStart=${weekStart}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting week schedule:', error);
      return { success: false, message: 'Failed to get week schedule' };
    }
  }

  async blockTimeSlot(date: string, startTime: string, endTime: string, reason?: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post('/ProviderScheduleManagement/block', {
        date,
        startTime,
        endTime,
        reason
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error blocking time slot:', error);
      return { success: false, message: 'Failed to block time slot' };
    }
  }

  async unblockTimeSlot(blockId: number): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.delete(`/ProviderScheduleManagement/block/${blockId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error unblocking time slot:', error);
      return { success: false, message: 'Failed to unblock time slot' };
    }
  }

  async getProviderAvailability(providerId: string, date: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(`/ProviderScheduleManagement/availability/${providerId}?date=${date}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting provider availability:', error);
      return { success: false, message: 'Failed to get provider availability' };
    }
  }

  async getScheduleStats(): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get('/ProviderScheduleManagement/stats');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting schedule stats:', error);
      return { success: false, message: 'Failed to get schedule statistics' };
    }
  }
}

export default new ApiService();
