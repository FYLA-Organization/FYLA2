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
  // Follow-related properties
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  isFollowedByCurrentUser?: boolean;
  // Location properties
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  // Social properties for compatibility
  postsCount?: number;
  firstName?: string;
  lastName?: string;
  isBookmarkedByCurrentUser?: boolean;
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

// Loyalty Points Types
export interface LoyaltyPointsEarned {
  pointsEarned: number;
  totalPoints: number;
  providerName: string;
  serviceName: string;
  amountSpent: number;
  description: string;
}

export interface BookingCreationResponse {
  booking: Booking;
  loyaltyPoints?: LoyaltyPointsEarned;
}

export interface ClientLoyaltyStatus {
  totalPoints: number;
  pointsWithProvider: number;
  totalBookings: number;
  totalSpent: number;
  membershipTier: string;
  recentTransactions: LoyaltyTransaction[];
}

export interface LoyaltyTransaction {
  id: number;
  userId: string;
  providerId: string;
  bookingId?: number;
  points: number;
  transactionType: string;
  description?: string;
  createdAt: string;
  expiresAt?: string;
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
export interface ReviewQuestionnaire {
  punctuality: number; // 1-5 scale
  professionalism: number; // 1-5 scale
  valueForMoney: number; // 1-5 scale
  wouldRecommend: boolean; // yes/no
  wouldUseAgain: boolean; // yes/no
  communicationRating: number; // 1-5 scale
  cleanlinessRating: number; // 1-5 scale (if applicable)
}

export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  questionnaire?: ReviewQuestionnaire;
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
  imageUrls?: string[]; // Support multiple images
  videoUrl?: string;
  likesCount: number;
  commentsCount: number;
  bookmarksCount?: number;
  isLikedByCurrentUser?: boolean;
  isBookmarkedByCurrentUser?: boolean;
  isBookmarkByCurrentUser?: boolean; // Compatibility alias
  isBusinessPost?: boolean;
  createdAt: string;
  user?: User;
  comments?: Comment[];
  // Social media properties
  caption?: string;
  tags?: string[];
  location?: string;
  serviceCategories?: string[];
  provider?: ServiceProvider;
  providerId?: string;
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
  BookingCalendar: {
    serviceId: string;
    providerId: string;
    rescheduleBookingId?: string;
  };
  Chat: {
    userId: string;
    userName: string;
    userImage?: string;
  };
  Messages: undefined;
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
  // Provider Dashboard Navigation
  Analytics: undefined;
  Schedule: undefined;
  EnhancedSchedule: undefined;
  EnhancedScheduleManagement: undefined;
  EnhancedAppointments: undefined;
  Clients: undefined;
  Reviews: undefined;
  // Enhanced Provider Business Management
  ClientManagement: undefined;
  CouponsLoyalty: undefined;
  ServiceManagement: undefined;
  ServicesManagement: undefined;
  // Social Media Screens
  SocialFeed: undefined;
  InstagramSearch: undefined;
  CreatePost: undefined;
  PostComments: { postId: string };
  PostDetail: { postId: string };
  UserProfile: { userId: string };
  FollowingBookmarks: undefined;
  EnhancedProviderProfile: { providerId: string };
  CreateReview: { providerId: string };
  SocialSearch: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
};

// Client Navigation (Consumer-focused)
export type ClientTabParamList = {
  Home: undefined;
  Search: undefined;
  AddPost: undefined;
  Bookings: undefined;
  Profile: undefined;
};

// Provider Navigation (Business Dashboard)
export type ProviderTabParamList = {
  Home: undefined;
  Dashboard: undefined;
  AddPost: undefined;
  Appointments: undefined;
  Profile: undefined;
  ClientManagement: undefined;
  CouponsLoyalty: undefined;
  Schedule: undefined;
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
  serviceId: string | number; // Allow both string and number for flexibility
  serviceName: string;
  bookingCount: number;
  totalRevenue: number;
  averagePrice: number;
  averageRating?: number; // Add missing property
  // Add missing properties for compatibility
  revenue?: number;
  bookings?: number;
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

// Enhanced Payment Types
export enum PaymentMethod {
  Stripe = 0,
  PayPal = 1,
  ApplePay = 2,
  GooglePay = 3,
  Klarna = 4,
  BankTransfer = 5
}

export enum PaymentStructure {
  FullPaymentUpfront = 0,
  DepositThenRemainder = 1,
  PaymentAfterService = 2
}

export enum TransactionType {
  Payment = 0,
  Deposit = 1,
  FinalPayment = 2,
  Refund = 3,
  PartialRefund = 4
}

export enum PaymentStatus {
  Pending = 0,
  Processing = 1,
  Succeeded = 2,
  Failed = 3,
  Cancelled = 4,
  RequiresAction = 5
}

export interface PaymentSettings {
  id: number;
  providerId: string;
  paymentStructure: PaymentStructure;
  depositPercentage: number;
  taxRate: number;
  acceptStripe: boolean;
  acceptPayPal: boolean;
  acceptApplePay: boolean;
  acceptGooglePay: boolean;
  acceptKlarna: boolean;
  acceptBankTransfer: boolean;
  autoRefundEnabled: boolean;
  refundTimeoutHours: number;
  stripeConnectAccountId?: string;
  payPalBusinessEmail?: string;
}

export interface PaymentCalculation {
  serviceAmount: number;
  taxAmount: number;
  platformFeeAmount: number;
  totalAmount: number;
  paymentStructure: PaymentStructure;
  depositAmount?: number;
  remainingAmount?: number;
  availablePaymentMethods: PaymentMethod[];
}

export interface PaymentTransaction {
  id: number;
  bookingId: number;
  userId: string;
  providerId: string;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  amount: number;
  serviceAmount: number;
  taxAmount: number;
  platformFeeAmount: number;
  currency: string;
  status: PaymentStatus;
  externalTransactionId?: string;
  description?: string;
  failureReason?: string;
  processedAt?: string;
  createdAt: string;
}

export interface CreatePaymentIntentRequest {
  bookingId: number;
  paymentMethod: PaymentMethod;
  transactionType: TransactionType;
  returnUrl?: string;
}

export interface PaymentIntentResponse {
  paymentIntentId: string;
  clientSecret?: string;
  redirectUrl?: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  additionalData?: any;
}

export interface RefundRequest {
  transactionId: number;
  refundAmount?: number;
  reason: string;
}

// Follow-related types
export interface UserFollow {
  id: number;
  followerId: string;
  followingId: string;
  createdAt: string;
  follower?: User;
  following?: User;
}

export interface FollowResponse {
  success: boolean;
  isFollowing: boolean;
  followerCount: number;
  message: string;
}

// ===== ENHANCED PROVIDER BUSINESS MANAGEMENT TYPES =====

// Client Management Types
export interface ProviderClient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  totalBookings: number;
  totalSpent: number;
  averageRating?: number;
  lastVisit?: string;
  loyaltyPoints: number;
  notes?: string;
  preferences: string[];
  tags: string[];
  createdAt: string;
}

export interface ClientStats {
  totalClients: number;
  newClientsThisMonth: number;
  topSpendingClients: ProviderClient[];
  clientRetentionRate: number;
  averageClientValue: number;
}

// Coupon Management Types
export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  applicableServices: string[];
  createdAt: string;
}

// Loyalty Program Types
export interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  pointsPerDollar: number;
  redemptionRate: number; // points per dollar discount
  minimumRedemption: number;
  bonusMultiplier?: number;
  tierThresholds?: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  tierBenefits?: {
    [tier: string]: string[];
  };
  isActive: boolean;
  createdAt: string;
}

// Auto Message Types
export interface AutoMessage {
  id: string;
  name: string;
  message: string;
  trigger: 'booking_confirmed' | 'booking_completed' | 'birthday' | 'no_visit_30_days' | 'loyalty_milestone';
  triggerValue?: string; // Additional trigger data
  delay?: number; // Minutes after trigger
  isActive: boolean;
  lastSent?: string;
  sentCount: number;
  createdAt: string;
}

// Schedule Management Types
export interface DaySchedule {
  date: string;
  isWorkingDay: boolean;
  startTime: string;
  endTime: string;
  breakTimes: TimeSlot[];
  blockedTimes: BlockedTimeSlot[];
  appointments: ScheduleAppointment[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface BlockedTimeSlot extends TimeSlot {
  id: string;
  reason: string;
  createdAt: string;
}

export interface ScheduleAppointment {
  id: string;
  clientName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  clientId: string;
  serviceId: string;
}

export interface WeekSchedule {
  weekStart: string;
  weekEnd: string;
  days: DaySchedule[];
}

// Business Location Types
export interface BusinessLocation {
  id: string;
  businessName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  contactPhone?: string;
  businessHours: {
    [day: string]: {
      isOpen: boolean;
      openTime: string;
      closeTime: string;
    };
  };
  amenities: string[];
  description?: string;
  photos: string[];
}

// Enhanced Analytics Types
export interface DashboardMetrics {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  totalClients: number;
  newClientsThisMonth: number;
  appointmentsToday: number;
  appointmentsThisWeek: number;
  averageRating: number;
  topServices: {
    name: string;
    revenue: number;
    bookings: number;
  }[];
  recentActivity: {
    type: 'booking' | 'payment' | 'review' | 'new_client';
    message: string;
    timestamp: string;
  }[];
}

// Missing Type Exports - Add these for compatibility
export type SocialPost = Post;
export type SocialFeed = {
  posts: SocialPost[];
  hasMore: boolean;
  nextCursor?: string;
};

export interface ClientDashboard {
  upcomingBookings: number;
  totalBookings: number;
  totalSpent: number;
  favoriteProviders: ServiceProvider[];
  recentBookings: Booking[];
  recommendedServices: Service[];
}
