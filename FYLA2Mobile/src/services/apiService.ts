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
      
      // Create a new axios instance with the correct configuration
      const newAxiosInstance = axios.create({
        baseURL: Config.baseURL,
        timeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // Ensure the request is sent as JSON
        transformRequest: [function (data) {
          return JSON.stringify(data);
        }],
      });
      
      // Set up interceptors on the new instance
      this.setupInterceptorsForInstance(newAxiosInstance);
      
      // Replace the old instance
      this.api = newAxiosInstance;
      this.isInitialized = true;
      console.log('✅ API Service initialized with URL:', Config.baseURL);
      console.log('✅ Using timeout:', parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000'));
    } catch (error) {
      console.error('Failed to initialize API service:', error);
      // Fallback: set up interceptors on the existing instance
      this.setupInterceptorsForInstance(this.api);
      this.isInitialized = true;
    }
  }

  private setupInterceptors() {
    this.setupInterceptorsForInstance(this.api);
  }

  private setupInterceptorsForInstance(axiosInstance: any) {
    // Clear any existing interceptors
    axiosInstance.interceptors.request.clear();
    axiosInstance.interceptors.response.clear();
    
    // Add request interceptor to include auth token
    axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        // Ensure content type is set
        if (!config.headers['Content-Type']) {
          config.headers['Content-Type'] = 'application/json';
        }
        console.log('📤 Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          headers: config.headers,
          data: config.data
        });
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    axiosInstance.interceptors.response.use(
      (response) => {
        console.log('📥 Response:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });
        return response;
      },
      (error) => {
        // Handle availability endpoint 404 gracefully (not a critical error)
        if (error.config?.url?.includes('/ProviderScheduleManagement/availability/') && error.response?.status === 404) {
          console.log('ℹ️ Provider availability endpoint not implemented yet (404) - this is expected');
          return Promise.reject(error);
        }
        
        console.error('❌ Response interceptor error:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            method: error.config?.method,
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            headers: error.config?.headers
          }
        });
        
        if (error.response?.status === 401) {
          // Handle unauthorized access
          AsyncStorage.removeItem('authToken');
          AsyncStorage.removeItem('currentUser');
        }
        return Promise.reject(error);
      }
    );
  }

  private async waitForInitialization(): Promise<void> {
    while (!this.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
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

  async getAvailableDays(providerId: string, serviceId: string, startDate: string, daysCount: number = 14): Promise<any> {
    try {
      const response = await this.api.get(`/booking/available-days?providerId=${providerId}&serviceId=${serviceId}&startDate=${startDate}&daysCount=${daysCount}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching available days:', error);
      throw error;
    }
  }

  async createBooking(bookingData: CreateBookingRequest): Promise<any> {
    try {
      // Wait for initialization
      await this.waitForInitialization();
      
      console.log('=== BOOKING REQUEST ===');
      console.log('Base URL:', this.api.defaults.baseURL);
      console.log('Booking data:', JSON.stringify(bookingData, null, 2));
      
      const token = await AsyncStorage.getItem('authToken');
      console.log('Auth token exists:', !!token);
      
      // Test connectivity first
      console.log('Testing connectivity to server...');
      try {
        const testResponse = await this.api.get('/serviceproviders?page=1&pageSize=1');
        console.log('✅ Server connectivity test passed');
      } catch (testError: any) {
        console.log('❌ Server connectivity test failed:', testError.message);
      }
      
      const response = await this.api.post('/bookings', bookingData);
      console.log('=== BOOKING SUCCESS ===');
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      return response.data;
    } catch (error: any) {
      console.log('=== BOOKING ERROR ===');
      console.log('Error message:', error.message);
      console.log('Error status:', error.response?.status);
      console.log('Error data:', error.response?.data);
      console.log('Request method:', error.config?.method);
      console.log('Request URL:', error.config?.baseURL + error.config?.url);
      
      // If we get a 405 error, try direct fetch as fallback and for verification
      if (error.response?.status === 405) {
        console.log('🔄 Got 405 error, attempting direct fetch verification...');
        
        try {
          const token = await AsyncStorage.getItem('authToken');
          const baseUrl = this.api.defaults.baseURL || 'http://192.168.1.171:5224/api';
          
          console.log('=== DIRECT FETCH TEST ===');
          console.log('URL:', `${baseUrl}/bookings`);
          console.log('Token:', token ? token.substring(0, 50) + '...' : 'None');
          console.log('Body:', JSON.stringify(bookingData));
          
          const directResponse = await fetch(`${baseUrl}/bookings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(bookingData),
          });
          
          console.log('=== FETCH RESPONSE ===');
          console.log('Status:', directResponse.status);
          console.log('Status Text:', directResponse.statusText);
          console.log('Headers:', directResponse.headers);
          
          if (directResponse.ok) {
            const responseData = await directResponse.json();
            console.log('✅ Direct fetch success! Booking created:', responseData);
            
            // Return success data in the expected format
            return {
              success: true,
              booking: responseData, // The API returns the booking directly
              message: 'Booking created successfully!',
              isDirectFetch: true
            };
          } else {
            console.log('❌ Direct fetch also failed with status:', directResponse.status);
            const errorText = await directResponse.text();
            console.log('Direct fetch error response:', errorText);
          }
        } catch (fetchError) {
          console.log('Direct fetch failed:', fetchError);
        }
        
        // Even if direct fetch fails, the booking might have been created
        console.log('The booking may have been created on the server despite the error');
        
        // Return a special error type for 405 that indicates potential success
        const enhancedError = new Error('Network response issue - booking may have been created');
        (enhancedError as any).isPotentialSuccess = true;
        (enhancedError as any).originalError = error;
        throw enhancedError;
      }
      
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

  async getMyBookings(status?: string): Promise<any[]> {
    try {
      await this.waitForInitialization();
      const params = status ? `?status=${status}` : '';
      const response = await this.api.get(`/bookings/my-bookings${params}`);
      console.log('📅 My bookings loaded:', response.data?.length || 0, 'bookings');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching my bookings:', error);
      throw error;
    }
  }

  // Booking Actions - Cancel, Reschedule, Policies
  async getCancellationInfo(bookingId: string): Promise<any> {
    try {
      await this.waitForInitialization();
      const response = await this.api.get(`/booking/${bookingId}/cancellation-info`);
      console.log('📄 Cancellation info loaded for booking:', bookingId);
      return response.data;
    } catch (error) {
      console.error('Error getting cancellation info:', error);
      throw error;
    }
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<any> {
    try {
      await this.waitForInitialization();
      const response = await this.api.post(`/booking/${bookingId}/cancel`, { reason: reason || '' });
      console.log('🚫 Booking cancelled:', bookingId);
      return response.data;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  async rescheduleBooking(bookingId: string, newDate: string, newTime: string, reason?: string): Promise<any> {
    try {
      await this.waitForInitialization();
      const response = await this.api.post(`/booking/${bookingId}/reschedule`, {
        newDate,
        newTime,
        reason: reason || ''
      });
      console.log('🔄 Booking reschedule requested:', bookingId);
      return response.data;
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      throw error;
    }
  }

  async updateBookingStatus(bookingId: string, status: string): Promise<any> {
    try {
      await this.waitForInitialization();
      const response = await this.api.put(`/bookings/${bookingId}/status`, { status });
      console.log('📝 Booking status updated:', bookingId, 'to', status);
      return response.data;
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }

  async getProviderCancellationPolicy(providerId: string): Promise<any> {
    try {
      await this.waitForInitialization();
      const response = await this.api.get(`/booking/policy/${providerId}`);
      console.log('📋 Provider policy loaded:', providerId);
      return response.data;
    } catch (error) {
      console.error('Error getting provider policy:', error);
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
      return { success: false, message: 'Failed to get appointments', data: null };
    }
  }

  // Helper function to convert status string to enum value
  private getStatusEnumValue(status: string): number {
    const statusMap: { [key: string]: number } = {
      'pending': 0,
      'confirmed': 1,
      'inprogress': 2,
      'completed': 3,
      'cancelled': 4,
      'blocked': 5
    };
    return statusMap[status.toLowerCase()] ?? 0;
  }

  async updateAppointmentStatus(appointmentId: number, status: string): Promise<ApiResponse<any>> {
    try {
      const statusEnum = this.getStatusEnumValue(status);
      const response = await this.api.post(`/provider/appointments/${appointmentId}/update-status`, { 
        status: statusEnum 
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating appointment status:', error);
      return { success: false, message: 'Failed to update appointment status', data: null };
    }
  }

  async generateInvoice(appointmentId: number): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post(`/provider/appointments/${appointmentId}/invoice`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error generating invoice:', error);
      return { success: false, message: 'Failed to generate invoice', data: null };
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
      return { success: false, message: 'Failed to get payment history', data: null };
    }
  }

  // Enhanced Schedule Management
  async getWeekSchedule(weekStart: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(`/ProviderScheduleManagement/week?weekStart=${weekStart}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting week schedule:', error);
      return { success: false, message: 'Failed to get week schedule', data: null };
    }
  }

  async getMySchedule(): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get('/ProviderSchedule/my-schedule');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting my schedule:', error);
      return { success: false, message: 'Failed to get my schedule', data: null };
    }
  }

  async updateProviderAvailability(scheduleData: any[]): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post('/ProviderSchedule/set-schedule', scheduleData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating provider availability:', error);
      return { success: false, message: 'Failed to update availability', data: null };
    }
  }

  // Enhanced Availability Management with Breaks
  async getProviderAvailabilitySchedule(providerId?: string): Promise<ApiResponse<any>> {
    try {
      const userId = providerId || await this.getCurrentUserId();
      const response = await this.api.get(`/ProviderAvailability/${userId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting provider availability schedule:', error);
      return { success: false, message: 'Failed to get availability schedule', data: null };
    }
  }

  async updateProviderAvailabilitySchedule(scheduleData: any[]): Promise<ApiResponse<any>> {
    try {
      const userId = await this.getCurrentUserId();
      const response = await this.api.put(`/ProviderAvailability/${userId}`, scheduleData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating provider availability schedule:', error);
      return { success: false, message: 'Failed to update availability schedule', data: null };
    }
  }

  async addBreakToSchedule(dayOfWeek: number, breakData: any): Promise<ApiResponse<any>> {
    try {
      const userId = await this.getCurrentUserId();
      const response = await this.api.post(`/ProviderAvailability/${userId}/breaks`, {
        dayOfWeek,
        ...breakData
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error adding break to schedule:', error);
      return { success: false, message: 'Failed to add break', data: null };
    }
  }

  async updateBreak(breakId: number, breakData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.put(`/ProviderAvailability/breaks/${breakId}`, breakData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating break:', error);
      return { success: false, message: 'Failed to update break', data: null };
    }
  }

  async deleteBreak(breakId: number): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.delete(`/ProviderAvailability/breaks/${breakId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error deleting break:', error);
      return { success: false, message: 'Failed to delete break', data: null };
    }
  }

  async getProviderAvailabilityForDate(providerId: string, date: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(`/ProviderAvailability/${providerId}/availability?date=${date}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting provider availability for date:', error);
      return { success: false, message: 'Failed to get availability for date', data: null };
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
      return { success: false, message: 'Failed to block time slot', data: null };
    }
  }

  async unblockTimeSlot(blockId: number): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.delete(`/ProviderScheduleManagement/block/${blockId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error unblocking time slot:', error);
      return { success: false, message: 'Failed to unblock time slot', data: null };
    }
  }

  async getProviderAvailability(providerId: string, date: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(`/ProviderScheduleManagement/availability/${providerId}?date=${date}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.log('Provider availability endpoint not available');
      return { success: false, message: 'Failed to get provider availability', data: null };
    }
  }

  async getScheduleStats(): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get('/ProviderScheduleManagement/stats');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting schedule stats:', error);
      return { success: false, message: 'Failed to get schedule statistics', data: null };
    }
  }

  // Subscription Methods
  async getSubscriptionTiers(): Promise<any[]> {
    try {
      const response = await this.api.get('/payment/subscription-tiers');
      return response.data;
    } catch (error) {
      console.error('Error getting subscription tiers:', error);
      throw error;
    }
  }

  async getCurrentSubscription(): Promise<any> {
    try {
      const response = await this.api.get('/payment/subscription');
      return response.data;
    } catch (error) {
      console.error('Error getting current subscription:', error);
      throw error;
    }
  }

  async createSubscription(subscriptionData: {
    tier: number;
    billingInterval: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<any> {
    try {
      const response = await this.api.post('/payment/create-subscription', subscriptionData);
      return response.data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  async activateSubscription(sessionId?: string): Promise<any> {
    try {
      const response = await this.api.post('/payment/activate-subscription', {
        sessionId: sessionId
      });
      return response.data;
    } catch (error) {
      console.error('Error activating subscription:', error);
      throw error;
    }
  }

  async debugSubscription(): Promise<any> {
    try {
      const response = await this.api.get('/payment/debug-subscription');
      return response.data;
    } catch (error) {
      console.error('Error debugging subscription:', error);
      throw error;
    }
  }

  // Alias for getCurrentSubscription to match FeatureGatingService usage
  async getUserSubscription(): Promise<any> {
    return this.getCurrentSubscription();
  }

  async getServiceCount(): Promise<number> {
    try {
      const response = await this.api.get('/services/count');
      return response.data?.count || 0;
    } catch (error) {
      console.error('Error getting service count:', error);
      throw error;
    }
  }

  async getServicePhotoCount(serviceId: string): Promise<number> {
    try {
      const response = await this.api.get(`/services/${serviceId}/photos/count`);
      return response.data?.count || 0;
    } catch (error) {
      console.error('Error getting service photo count:', error);
      throw error;
    }
  }

  async getStripeConfig(): Promise<any> {
    try {
      const response = await this.api.get('/stripesetup/config');
      return response.data;
    } catch (error) {
      console.error('Error getting Stripe config:', error);
      throw error;
    }
  }

  // Advanced Features API Methods
  async getCustomBranding(): Promise<any> {
    try {
      const response = await this.api.get('/advancedfeatures/branding');
      return response.data;
    } catch (error) {
      console.error('Error getting custom branding:', error);
      throw error;
    }
  }

  async updateCustomBranding(branding: any): Promise<any> {
    try {
      const response = await this.api.put('/advancedfeatures/branding', branding);
      return response.data;
    } catch (error) {
      console.error('Error updating custom branding:', error);
      throw error;
    }
  }

  async getBusinessLocations(): Promise<any> {
    try {
      const response = await this.api.get('/advancedfeatures/locations');
      return response.data;
    } catch (error) {
      console.error('Error getting business locations:', error);
      throw error;
    }
  }

  async createBusinessLocation(location: any): Promise<any> {
    try {
      const response = await this.api.post('/advancedfeatures/locations', location);
      return response.data;
    } catch (error) {
      console.error('Error creating business location:', error);
      throw error;
    }
  }

  async getMarketingCampaigns(): Promise<any> {
    try {
      const response = await this.api.get('/advancedfeatures/marketing/campaigns');
      return response.data;
    } catch (error) {
      console.error('Error getting marketing campaigns:', error);
      throw error;
    }
  }

  async createMarketingCampaign(campaign: any): Promise<any> {
    try {
      const response = await this.api.post('/advancedfeatures/marketing/campaigns', campaign);
      return response.data;
    } catch (error) {
      console.error('Error creating marketing campaign:', error);
      throw error;
    }
  }

  async getMarketingAnalytics(): Promise<any> {
    try {
      const response = await this.api.get('/advancedfeatures/marketing/analytics');
      return response.data;
    } catch (error) {
      console.error('Error getting marketing analytics:', error);
      throw error;
    }
  }

  async getSupportTickets(): Promise<any> {
    try {
      const response = await this.api.get('/advancedfeatures/support/tickets');
      return response.data;
    } catch (error) {
      console.error('Error getting support tickets:', error);
      throw error;
    }
  }

  async createSupportTicket(ticket: any): Promise<any> {
    try {
      const response = await this.api.post('/advancedfeatures/support/tickets', ticket);
      return response.data;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw error;
    }
  }

  async addSupportTicketMessage(ticketId: number, message: any): Promise<any> {
    try {
      const response = await this.api.post(`/advancedfeatures/support/tickets/${ticketId}/messages`, message);
      return response.data;
    } catch (error) {
      console.error('Error adding support ticket message:', error);
      throw error;
    }
  }

  async getChairRentals(): Promise<any> {
    try {
      const response = await this.api.get('/chairrental/my-chairs');
      return response.data;
    } catch (error) {
      console.error('Error getting chair rentals:', error);
      throw error;
    }
  }

  async getAvailableChairs(): Promise<any> {
    try {
      const response = await this.api.get('/chairrental/available');
      return response.data;
    } catch (error) {
      console.error('Error getting available chairs:', error);
      throw error;
    }
  }

  async createChairRental(chair: any): Promise<any> {
    try {
      const response = await this.api.post('/chairrental/create', chair);
      return response.data;
    } catch (error) {
      console.error('Error creating chair rental:', error);
      throw error;
    }
  }

  async rentChair(chairId: number, rentalData: any): Promise<any> {
    try {
      const response = await this.api.post(`/chairrental/rent/${chairId}`, rentalData);
      return response.data;
    } catch (error) {
      console.error('Error renting chair:', error);
      throw error;
    }
  }

  async getChairRentalAnalytics(): Promise<any> {
    try {
      const response = await this.api.get('/chairrental/analytics');
      return response.data;
    } catch (error) {
      console.error('Error getting chair rental analytics:', error);
      throw error;
    }
  }

  async markChairPaymentAsPaid(paymentId: number): Promise<any> {
    try {
      const response = await this.api.post(`/chairrental/payments/${paymentId}/mark-paid`);
      return response.data;
    } catch (error) {
      console.error('Error marking chair payment as paid:', error);
      throw error;
    }
  }

  async toggleMarketingCampaign(campaignId: number): Promise<any> {
    try {
      const response = await this.api.post(`/advancedfeatures/marketing/campaigns/${campaignId}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Error toggling marketing campaign:', error);
      throw error;
    }
  }

  async updateMarketingAutomation(automationSettings: any): Promise<any> {
    try {
      const response = await this.api.post('/advancedfeatures/marketing/automation', automationSettings);
      return response.data;
    } catch (error) {
      console.error('Error updating marketing automation:', error);
      throw error;
    }
  }

  // Branding API methods
  async getBrandProfile(): Promise<any> {
    try {
      const response = await this.api.get('/branding/profile');
      return response.data;
    } catch (error) {
      console.error('Error getting brand profile:', error);
      throw error;
    }
  }

  async createBrandProfile(brandData: any): Promise<any> {
    try {
      const response = await this.api.post('/branding/profile', brandData);
      return response.data;
    } catch (error) {
      console.error('Error creating brand profile:', error);
      throw error;
    }
  }

  async updateBrandProfile(brandData: any): Promise<any> {
    try {
      const response = await this.api.put('/branding/profile', brandData);
      return response.data;
    } catch (error) {
      console.error('Error updating brand profile:', error);
      throw error;
    }
  }

  async uploadLogo(logoFile: FormData): Promise<any> {
    try {
      const response = await this.api.post('/branding/upload-logo', logoFile, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  }

  async getEmailTemplates(): Promise<any> {
    try {
      const response = await this.api.get('/branding/email-templates');
      return response.data;
    } catch (error) {
      console.error('Error getting email templates:', error);
      throw error;
    }
  }

  async updateEmailTemplate(templateId: number, templateData: any): Promise<any> {
    try {
      const response = await this.api.put(`/branding/email-templates/${templateId}`, templateData);
      return response.data;
    } catch (error) {
      console.error('Error updating email template:', error);
      throw error;
    }
  }

  async generateSocialMediaKit(): Promise<any> {
    try {
      const response = await this.api.get('/branding/social-media-kit');
      return response.data;
    } catch (error) {
      console.error('Error generating social media kit:', error);
      throw error;
    }
  }

  // Seat Rental API methods
  async searchSeatRentals(searchParams: any): Promise<any> {
    try {
      const response = await this.api.post('/seatrental/search', searchParams);
      return response.data;
    } catch (error) {
      console.error('Error searching seat rentals:', error);
      throw error;
    }
  }

  async getMySeatRentalListings(): Promise<any> {
    try {
      const response = await this.api.get('/seatrental/my-listings');
      return response.data;
    } catch (error) {
      console.error('Error getting my seat rental listings:', error);
      throw error;
    }
  }

  async getMySeatRentals(): Promise<any> {
    try {
      const response = await this.api.get('/seatrental/my-rentals');
      return response.data;
    } catch (error) {
      console.error('Error getting my seat rentals:', error);
      throw error;
    }
  }

  async createSeatRental(seatRentalData: any): Promise<any> {
    try {
      const response = await this.api.post('/seatrental', seatRentalData);
      return response.data;
    } catch (error) {
      console.error('Error creating seat rental:', error);
      throw error;
    }
  }

  async updateSeatRental(id: number, seatRentalData: any): Promise<any> {
    try {
      const response = await this.api.put(`/seatrental/${id}`, seatRentalData);
      return response.data;
    } catch (error) {
      console.error('Error updating seat rental:', error);
      throw error;
    }
  }

  async deleteSeatRental(id: number): Promise<any> {
    try {
      const response = await this.api.delete(`/seatrental/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting seat rental:', error);
      throw error;
    }
  }

  async bookSeatRental(id: number, bookingData: any): Promise<any> {
    try {
      const response = await this.api.post(`/seatrental/${id}/book`, bookingData);
      return response.data;
    } catch (error) {
      console.error('Error booking seat rental:', error);
      throw error;
    }
  }

  async updateSeatRentalBookingStatus(bookingId: number, statusData: any): Promise<any> {
    try {
      const response = await this.api.put(`/seatrental/bookings/${bookingId}/status`, statusData);
      return response.data;
    } catch (error) {
      console.error('Error updating seat rental booking status:', error);
      throw error;
    }
  }

  async getSeatRentalStats(): Promise<any> {
    try {
      const response = await this.api.get('/seatrental/stats');
      return response.data;
    } catch (error) {
      console.error('Error getting seat rental stats:', error);
      throw error;
    }
  }

  // ===============================
  // ENHANCED MARKETING CAMPAIGNS
  // ===============================

  async createCampaign(campaignData: any): Promise<any> {
    try {
      const response = await this.api.post('/marketing/campaigns', campaignData);
      return response.data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  async getCampaigns(): Promise<any> {
    try {
      const response = await this.api.get('/marketing/campaigns');
      return response.data;
    } catch (error) {
      console.error('Error getting campaigns:', error);
      throw error;
    }
  }

  async getCampaign(id: number): Promise<any> {
    try {
      const response = await this.api.get(`/marketing/campaigns/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting campaign:', error);
      throw error;
    }
  }

  async updateCampaign(id: number, updateData: any): Promise<any> {
    try {
      const response = await this.api.put(`/marketing/campaigns/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  }

  async launchCampaign(id: number): Promise<any> {
    try {
      const response = await this.api.post(`/marketing/campaigns/${id}/launch`);
      return response.data;
    } catch (error) {
      console.error('Error launching campaign:', error);
      throw error;
    }
  }

  async getCampaignAnalytics(id: number): Promise<any> {
    try {
      const response = await this.api.get(`/marketing/campaigns/${id}/analytics`);
      return response.data;
    } catch (error) {
      console.error('Error getting campaign analytics:', error);
      throw error;
    }
  }

  // ===============================
  // CUSTOMER SEGMENTS
  // ===============================

  async createSegment(segmentData: any): Promise<any> {
    try {
      const response = await this.api.post('/marketing/segments', segmentData);
      return response.data;
    } catch (error) {
      console.error('Error creating segment:', error);
      throw error;
    }
  }

  async getSegments(): Promise<any> {
    try {
      const response = await this.api.get('/marketing/segments');
      return response.data;
    } catch (error) {
      console.error('Error getting segments:', error);
      throw error;
    }
  }

  async getSegmentCustomers(id: number): Promise<any> {
    try {
      const response = await this.api.get(`/marketing/segments/${id}/customers`);
      return response.data;
    } catch (error) {
      console.error('Error getting segment customers:', error);
      throw error;
    }
  }

  // ===============================
  // MARKETING AUTOMATION
  // ===============================

  async createAutomation(automationData: any): Promise<any> {
    try {
      const response = await this.api.post('/marketing/automation', automationData);
      return response.data;
    } catch (error) {
      console.error('Error creating automation:', error);
      throw error;
    }
  }

  async getAutomations(): Promise<any> {
    try {
      const response = await this.api.get('/marketing/automation');
      return response.data;
    } catch (error) {
      console.error('Error getting automations:', error);
      throw error;
    }
  }

  async toggleAutomation(id: number): Promise<any> {
    try {
      const response = await this.api.put(`/marketing/automation/${id}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Error toggling automation:', error);
      throw error;
    }
  }

  // ===============================
  // LOYALTY PROGRAMS
  // ===============================

  async createLoyaltyProgram(programData: any): Promise<any> {
    try {
      const response = await this.api.post('/marketing/loyalty', programData);
      return response.data;
    } catch (error) {
      console.error('Error creating loyalty program:', error);
      throw error;
    }
  }

  async getLoyaltyPrograms(): Promise<any> {
    try {
      const response = await this.api.get('/marketing/loyalty');
      return response.data;
    } catch (error) {
      console.error('Error getting loyalty programs:', error);
      throw error;
    }
  }

  async getLoyaltyMembers(programId: number): Promise<any> {
    try {
      const response = await this.api.get(`/marketing/loyalty/${programId}/members`);
      return response.data;
    } catch (error) {
      console.error('Error getting loyalty members:', error);
      throw error;
    }
  }

  // ===============================
  // REFERRAL PROGRAMS
  // ===============================

  async createReferralProgram(programData: any): Promise<any> {
    try {
      const response = await this.api.post('/marketing/referral', programData);
      return response.data;
    } catch (error) {
      console.error('Error creating referral program:', error);
      throw error;
    }
  }

  async getReferralPrograms(): Promise<any> {
    try {
      const response = await this.api.get('/marketing/referral');
      return response.data;
    } catch (error) {
      console.error('Error getting referral programs:', error);
      throw error;
    }
  }

  async generateReferralCode(programId: number, codeData: any): Promise<any> {
    try {
      const response = await this.api.post(`/marketing/referral/${programId}/codes`, codeData);
      return response.data;
    } catch (error) {
      console.error('Error generating referral code:', error);
      throw error;
    }
  }

  // ===============================
  // PROMOTIONS
  // ===============================

  async createPromotion(promotionData: any): Promise<any> {
    try {
      const response = await this.api.post('/marketing/promotions', promotionData);
      return response.data;
    } catch (error) {
      console.error('Error creating promotion:', error);
      throw error;
    }
  }

  async getPromotions(): Promise<any> {
    try {
      const response = await this.api.get('/marketing/promotions');
      return response.data;
    } catch (error) {
      console.error('Error getting promotions:', error);
      throw error;
    }
  }

  async getPublicPromotions(serviceProviderId: string): Promise<any> {
    try {
      const response = await this.api.get(`/marketing/promotions/public?serviceProviderId=${serviceProviderId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting public promotions:', error);
      throw error;
    }
  }

  async getPublicBrandProfile(serviceProviderId: string): Promise<any> {
    try {
      const response = await this.api.get(`/branding/public/${serviceProviderId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting public brand profile:', error);
      throw error;
    }
  }

  async getClientLoyaltyStatus(serviceProviderId: string, clientId: string): Promise<any> {
    try {
      const response = await this.api.get(`/loyalty/client/${clientId}/provider/${serviceProviderId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting client loyalty status:', error);
      throw error;
    }
  }

  // ===============================
  // MARKETING ANALYTICS
  // ===============================

  async getMarketingOverview(): Promise<any> {
    try {
      const response = await this.api.get('/marketing/analytics/overview');
      return response.data;
    } catch (error) {
      console.error('Error getting marketing overview:', error);
      throw error;
    }
  }
}

export default new ApiService();
