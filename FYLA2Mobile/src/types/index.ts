// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isServiceProvider: boolean;
  profilePictureUrl?: string;
  dateOfBirth?: string;
  bio?: string;
  createdAt: string;
  // Enhanced Profile Fields
  preferences?: UserPreferences;
  location?: UserLocation;
  stats?: UserStats;
}

// Enhanced User Profile Types
export interface UserPreferences {
  budgetRange: {
    min: number;
    max: number;
  };
  serviceCategories: string[];
  preferredDistance: number; // in miles
  preferredTimeSlots: string[]; // e.g., ['morning', 'afternoon', 'evening']
  notifications: {
    bookingReminders: boolean;
    promotionalOffers: boolean;
    newProviderAlerts: boolean;
    priceDropAlerts: boolean;
  };
  accessibility: {
    wheelchairAccessible: boolean;
    hearingImpaired: boolean;
    visuallyImpaired: boolean;
  };
}

export interface UserLocation {
  address?: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface UserStats {
  totalBookings: number;
  totalSpent: number;
  averageRating: number; // rating they give to providers
  favoriteCategory: string;
  memberSince: string;
  loyaltyPoints: number;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isServiceProvider: boolean;
  dateOfBirth?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

// Service Provider Types
export interface ServiceProvider {
  id: string;
  userId: string;
  businessName: string;
  businessDescription?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  profilePictureUrl?: string;
  portfolioImages?: string[];
  specialties?: string[];
  yearsOfExperience?: number;
  priceRange?: string;
  user?: User;
  services?: Service[];
}

// Service Types
export interface Service {
  id: string;
  serviceProviderId: string;
  name: string;
  description?: string;
  duration: number; // in minutes
  price: number;
  category: string;
  isActive: boolean;
  imageUrl?: string;
  serviceProvider?: ServiceProvider;
}

// Booking Types
export enum BookingStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled'
}

export interface Booking {
  id: string;
  clientId: string;
  serviceProviderId: string;
  serviceId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalAmount: number;
  notes?: string;
  cancellationReason?: string;
  client?: User;
  serviceProvider?: ServiceProvider;
  service?: Service;
  createdAt: string;
}

export interface CreateBookingRequest {
  serviceProviderId: string;
  serviceId: number;
  bookingDate: string;
  startTime: string;
  notes?: string;
}

// Chat & Messaging Types
export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  messageType: 'text' | 'image' | 'file' | 'booking';
  status: 'Sent' | 'Delivered' | 'Read';
  deliveredAt?: string;
  readAt?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentSize?: number;
  attachmentName?: string;
}

export interface FileUploadResponse {
  url: string;
  fileName: string;
  size: number;
  type: string;
  mimeType: string;
}

// Legacy interface for backward compatibility
export interface Message extends ChatMessage {
  sentAt: string;
  sender?: User;
  receiver?: User;
}

export interface ChatRoom {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
  lastMessage: {
    id: string;
    content: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount: number;
}

// Review Types
export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer?: User;
  reviewee?: User;
}

// Social Media Types
export interface Post {
  id: string;
  userId: string;
  content?: string;
  imageUrl?: string;
  videoUrl?: string;
  likesCount: number;
  commentsCount: number;
  isLikedByCurrentUser?: boolean;
  createdAt: string;
  user?: User;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: User;
}

export interface Conversation {
  otherUserId: string;
  otherUser: User;
  lastMessage?: Message;
  unreadCount: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Search Types
export interface SearchFilters {
  category?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  distance?: string;
  availableToday?: boolean;
  availableThisWeek?: boolean;
  sortBy?: 'price' | 'rating' | 'distance' | 'availability' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  createdAt: Date;
}

export interface RecentSearch {
  query: string;
  filters: SearchFilters;
  timestamp: Date;
}

// Navigation Types
export type RootStackParamList = {
  Main: undefined;
  Home: undefined;
  Search: undefined;
  Bookings: undefined;
  Profile: undefined;
  ServiceDetails: { serviceId: number };
  ProviderProfile: { providerId: string };
  BookingDetails: { bookingId: string };
  BookingFlow: { 
    service: Service; 
    provider: ServiceProvider; 
  };
  Chat: {
    userId: string;
    userName: string;
    userImage?: string;
  };
  ChatScreen: {
    userId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      profilePictureUrl?: string;
    };
  };
  UserSelection: undefined;
  NotificationSettings: undefined;
  NotificationTest: undefined;
  EnhancedProfile: undefined;
  Auth: undefined;
  ClientMain: undefined;
  ProviderMain: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Client Navigation (Consumer-focused)
export type ClientTabParamList = {
  Home: undefined;
  Search: undefined;
  Bookings: undefined;
  Messages: undefined;
  Profile: undefined;
};

// Provider Navigation (Business Dashboard)
export type ProviderTabParamList = {
  Dashboard: undefined;
  Appointments: undefined;
  Analytics: undefined;
  Schedule: undefined;
  Clients: undefined;
  Profile: undefined;
};

// Legacy - keeping for backward compatibility
export type MainTabParamList = ClientTabParamList;

// Additional Chat Types
export interface SendMessageRequest {
  receiverId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file' | 'booking';
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentSize?: number;
  attachmentName?: string;
}

export interface ChatContextType {
  messages: ChatMessage[];
  rooms: ChatRoom[];
  isConnected: boolean;
  sendMessage: (message: SendMessageRequest) => Promise<void>;
  loadChatRooms: () => Promise<void>;
  loadMessages: (userId: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  unreadCount: number;
}

// Analytics Types
export interface ProviderDashboard {
  todayAppointments: number;
  pendingAppointments: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  totalClients: number;
  averageRating: number;
  nextAppointment?: NextAppointment;
  recentBookings: RecentBooking[];
}

export interface NextAppointment {
  id: number;
  clientName: string;
  serviceName: string;
  scheduledDate: string;
  duration: number;
  totalAmount: number;
}

export interface RecentBooking {
  id: number;
  clientName: string;
  serviceName: string;
  scheduledDate: string;
  status: string;
  totalAmount: number;
}

export interface RevenueAnalytics {
  period: string;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalBookings: number;
  averageBookingValue: number;
  growthPercentage: number;
  dailyRevenue: DailyRevenue[];
  topServices: ServicePerformance[];
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  bookingCount: number;
}

export interface ServicePerformance {
  serviceId: number;
  serviceName: string;
  bookingCount: number;
  totalRevenue: number;
  averagePrice: number;
}

export interface ClientAnalytics {
  period: string;
  totalClients: number;
  newClients: number;
  returningClients: number;
  newClientPercentage: number;
  topClients: TopClient[];
  clientAcquisition: ClientAcquisition[];
  popularTimeSlots: TimeSlot[];
}

export interface TopClient {
  userId: string;
  clientName: string;
  bookingCount: number;
  totalSpent: number;
  lastBooking: string;
}

export interface ClientAcquisition {
  date: string;
  newClients: number;
}

export interface TimeSlot {
  hour: number;
  timeSlot: string;
  bookingCount: number;
}
