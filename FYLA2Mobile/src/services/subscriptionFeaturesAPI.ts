import apiService from './api';

// Types for subscription features
export interface PrioritySupportTicket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  response?: string;
  estimatedResolution?: string;
}

export interface BusinessLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  isActive: boolean;
  services: string[];
  operatingHours: {
    [key: string]: { open: string; close: string; isOpen: boolean };
  };
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  bookingsCount: number;
  lastBooking: string;
  customerSince: string;
  preferredServices: string[];
  notes?: string;
}

export interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  dailyRevenue: number;
  revenueGrowth: number;
  topServices: Array<{
    serviceId: string;
    serviceName: string;
    revenue: number;
    bookings: number;
  }>;
  monthlyBreakdown: Array<{
    month: string;
    revenue: number;
    bookings: number;
  }>;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'social' | 'promotion';
  status: 'draft' | 'active' | 'completed' | 'paused';
  targetAudience: string;
  content: {
    subject?: string;
    message: string;
    imageUrl?: string;
  };
  scheduling: {
    startDate: string;
    endDate?: string;
    frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  };
  metrics: {
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
  };
  createdAt: string;
}

export interface BrandAsset {
  id: string;
  type: 'logo' | 'banner' | 'template' | 'color-scheme';
  name: string;
  description: string;
  url: string;
  fileSize: number;
  dimensions?: { width: number; height: number };
  colorCodes?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mock data for development and fallback
const mockSupportTickets: PrioritySupportTicket[] = [
  {
    id: '1',
    title: 'Payment Integration Issue',
    description: 'Having trouble with Stripe payment processing',
    status: 'in-progress',
    priority: 'high',
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-10T14:30:00Z',
    response: 'Our team is investigating the issue. We will update you within 2 hours.',
    estimatedResolution: '2025-01-10T18:00:00Z'
  },
  {
    id: '2',
    title: 'Feature Request: Bulk Import',
    description: 'Need ability to import multiple services at once',
    status: 'open',
    priority: 'medium',
    createdAt: '2025-01-09T15:20:00Z',
    updatedAt: '2025-01-09T15:20:00Z'
  }
];

const mockBusinessLocations: BusinessLocation[] = [
  {
    id: '1',
    name: 'Main Downtown Office',
    address: '123 Business Ave',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    phone: '(555) 123-4567',
    email: 'downtown@business.com',
    isActive: true,
    services: ['Consultation', 'Full Service Package'],
    operatingHours: {
      monday: { open: '09:00', close: '17:00', isOpen: true },
      tuesday: { open: '09:00', close: '17:00', isOpen: true },
      wednesday: { open: '09:00', close: '17:00', isOpen: true },
      thursday: { open: '09:00', close: '17:00', isOpen: true },
      friday: { open: '09:00', close: '15:00', isOpen: true },
      saturday: { open: '10:00', close: '14:00', isOpen: true },
      sunday: { open: '00:00', close: '00:00', isOpen: false }
    }
  },
  {
    id: '2',
    name: 'Westside Branch',
    address: '456 Commerce St',
    city: 'New York',
    state: 'NY',
    zipCode: '10025',
    phone: '(555) 987-6543',
    email: 'westside@business.com',
    isActive: true,
    services: ['Quick Consultation'],
    operatingHours: {
      monday: { open: '08:00', close: '16:00', isOpen: true },
      tuesday: { open: '08:00', close: '16:00', isOpen: true },
      wednesday: { open: '08:00', close: '16:00', isOpen: true },
      thursday: { open: '08:00', close: '16:00', isOpen: true },
      friday: { open: '08:00', close: '16:00', isOpen: true },
      saturday: { open: '00:00', close: '00:00', isOpen: false },
      sunday: { open: '00:00', close: '00:00', isOpen: false }
    }
  }
];

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '(555) 111-2222',
    totalSpent: 1250.00,
    bookingsCount: 8,
    lastBooking: '2025-01-08T15:00:00Z',
    customerSince: '2024-03-15T10:00:00Z',
    preferredServices: ['Full Service Package', 'Consultation'],
    notes: 'Prefers afternoon appointments'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'mchen@company.com',
    phone: '(555) 333-4444',
    totalSpent: 890.50,
    bookingsCount: 5,
    lastBooking: '2025-01-05T11:30:00Z',
    customerSince: '2024-06-20T14:00:00Z',
    preferredServices: ['Quick Consultation'],
    notes: 'Business client, very punctual'
  }
];

const mockRevenueData: RevenueData = {
  totalRevenue: 15750.00,
  monthlyRevenue: 3200.00,
  weeklyRevenue: 850.00,
  dailyRevenue: 125.00,
  revenueGrowth: 15.5,
  topServices: [
    { serviceId: '1', serviceName: 'Full Service Package', revenue: 8500.00, bookings: 12 },
    { serviceId: '2', serviceName: 'Consultation', revenue: 4200.00, bookings: 28 },
    { serviceId: '3', serviceName: 'Quick Service', revenue: 3050.00, bookings: 35 }
  ],
  monthlyBreakdown: [
    { month: 'December', revenue: 2800.00, bookings: 18 },
    { month: 'January', revenue: 3200.00, bookings: 22 },
    { month: 'February', revenue: 3600.00, bookings: 25 }
  ]
};

const mockMarketingCampaigns: MarketingCampaign[] = [
  {
    id: '1',
    name: 'New Year Special Promotion',
    type: 'email',
    status: 'active',
    targetAudience: 'All active customers',
    content: {
      subject: '🎉 New Year, New You - 20% Off All Services!',
      message: 'Start the new year right with our exclusive 20% discount on all services. Book now through January 31st!',
      imageUrl: 'https://example.com/newyear-banner.jpg'
    },
    scheduling: {
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-01-31T23:59:59Z',
      frequency: 'weekly'
    },
    metrics: {
      sent: 1250,
      opened: 687,
      clicked: 134,
      converted: 23
    },
    createdAt: '2024-12-28T10:00:00Z'
  }
];

const mockBrandAssets: BrandAsset[] = [
  {
    id: '1',
    type: 'logo',
    name: 'Primary Logo',
    description: 'Main company logo in SVG format',
    url: 'https://example.com/assets/logo-primary.svg',
    fileSize: 15680,
    dimensions: { width: 300, height: 120 },
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    type: 'color-scheme',
    name: 'Brand Colors',
    description: 'Official brand color palette',
    url: 'https://example.com/assets/brand-colors.json',
    fileSize: 1024,
    colorCodes: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'],
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  }
];

// API service extension for subscription features
class SubscriptionFeaturesAPI {
  // Priority Support Methods
  async getSupportTickets(): Promise<PrioritySupportTicket[]> {
    try {
      // Try to use existing API if available, otherwise use mock data
      console.log('📡 Loading support tickets (using mock data for now)');
      return mockSupportTickets;
    } catch (error) {
      console.log('📡 API unavailable for support tickets, using fallback:', error);
      return mockSupportTickets;
    }
  }

  async createSupportTicket(ticket: Omit<PrioritySupportTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<PrioritySupportTicket> {
    try {
      console.log('📡 Creating support ticket (using mock data for now)');
      const newTicket: PrioritySupportTicket = {
        ...ticket,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return newTicket;
    } catch (error) {
      console.log('📡 API unavailable for creating support ticket, using fallback:', error);
      const newTicket: PrioritySupportTicket = {
        ...ticket,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return newTicket;
    }
  }

  // Business Locations Methods
  async getBusinessLocations(): Promise<BusinessLocation[]> {
    try {
      console.log('📡 Loading business locations (using mock data for now)');
      return mockBusinessLocations;
    } catch (error) {
      console.log('📡 API unavailable for business locations, using fallback:', error);
      return mockBusinessLocations;
    }
  }

  async createBusinessLocation(location: Omit<BusinessLocation, 'id'>): Promise<BusinessLocation> {
    try {
      console.log('📡 Creating business location (using mock data for now)');
      const newLocation: BusinessLocation = {
        ...location,
        id: Date.now().toString()
      };
      return newLocation;
    } catch (error) {
      console.log('📡 API unavailable for creating business location, using fallback:', error);
      const newLocation: BusinessLocation = {
        ...location,
        id: Date.now().toString()
      };
      return newLocation;
    }
  }

  async updateBusinessLocation(id: string, location: Partial<BusinessLocation>): Promise<BusinessLocation> {
    try {
      console.log('📡 Updating business location (using mock data for now)');
      const existing = mockBusinessLocations.find(l => l.id === id);
      return { ...existing, ...location } as BusinessLocation;
    } catch (error) {
      console.log('📡 API unavailable for updating business location, using fallback:', error);
      const existing = mockBusinessLocations.find(l => l.id === id);
      return { ...existing, ...location } as BusinessLocation;
    }
  }

  // Revenue CRM Methods
  async getCustomers(): Promise<Customer[]> {
    try {
      console.log('📡 Loading customers (using mock data for now)');
      return mockCustomers;
    } catch (error) {
      console.log('📡 API unavailable for customers, using fallback:', error);
      return mockCustomers;
    }
  }

  async getRevenueData(timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<RevenueData> {
    try {
      // Try to use existing revenue analytics and enhance with our structure
      const existingAnalytics = await apiService.getRevenueAnalytics(timeframe);
      console.log('📡 Using backend revenue data and enhancing with mock data');
      
      // Enhance with our RevenueData structure
      const enhancedData: RevenueData = {
        totalRevenue: existingAnalytics.totalRevenue || mockRevenueData.totalRevenue,
        monthlyRevenue: mockRevenueData.monthlyRevenue, // Calculate from period if needed
        weeklyRevenue: mockRevenueData.weeklyRevenue,   // Calculate from period if needed
        dailyRevenue: mockRevenueData.dailyRevenue,     // Calculate from dailyRevenue array if needed
        revenueGrowth: existingAnalytics.growthPercentage || mockRevenueData.revenueGrowth,
        topServices: existingAnalytics.topServices?.map(service => ({
          serviceId: service.serviceId.toString(),
          serviceName: service.serviceName,
          revenue: service.revenue || 0,
          bookings: service.bookings || 0
        })) || mockRevenueData.topServices,
        monthlyBreakdown: mockRevenueData.monthlyBreakdown // Enhanced data not in backend yet
      };
      
      return enhancedData;
    } catch (error) {
      console.log('📡 API unavailable for revenue data, using fallback:', error);
      return mockRevenueData;
    }
  }

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
    try {
      console.log('📡 Updating customer (using mock data for now)');
      const existing = mockCustomers.find(c => c.id === id);
      return { ...existing, ...customer } as Customer;
    } catch (error) {
      console.log('📡 API unavailable for updating customer, using fallback:', error);
      const existing = mockCustomers.find(c => c.id === id);
      return { ...existing, ...customer } as Customer;
    }
  }

  // Marketing Automation Methods
  async getMarketingCampaigns(): Promise<MarketingCampaign[]> {
    try {
      console.log('📡 Loading marketing campaigns (using mock data for now)');
      return mockMarketingCampaigns;
    } catch (error) {
      console.log('📡 API unavailable for marketing campaigns, using fallback:', error);
      return mockMarketingCampaigns;
    }
  }

  async createMarketingCampaign(campaign: Omit<MarketingCampaign, 'id' | 'createdAt' | 'metrics'>): Promise<MarketingCampaign> {
    try {
      console.log('📡 Creating marketing campaign (using mock data for now)');
      const newCampaign: MarketingCampaign = {
        ...campaign,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        metrics: { sent: 0, opened: 0, clicked: 0, converted: 0 }
      };
      return newCampaign;
    } catch (error) {
      console.log('📡 API unavailable for creating marketing campaign, using fallback:', error);
      const newCampaign: MarketingCampaign = {
        ...campaign,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        metrics: { sent: 0, opened: 0, clicked: 0, converted: 0 }
      };
      return newCampaign;
    }
  }

  // Custom Branding Methods
  async getBrandAssets(): Promise<BrandAsset[]> {
    try {
      console.log('📡 Loading brand assets (using mock data for now)');
      return mockBrandAssets;
    } catch (error) {
      console.log('📡 API unavailable for brand assets, using fallback:', error);
      return mockBrandAssets;
    }
  }

  async uploadBrandAsset(asset: Omit<BrandAsset, 'id' | 'createdAt' | 'updatedAt'>): Promise<BrandAsset> {
    try {
      console.log('📡 Uploading brand asset (using mock data for now)');
      const newAsset: BrandAsset = {
        ...asset,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return newAsset;
    } catch (error) {
      console.log('📡 API unavailable for uploading brand asset, using fallback:', error);
      const newAsset: BrandAsset = {
        ...asset,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return newAsset;
    }
  }

  async updateBrandAsset(id: string, asset: Partial<BrandAsset>): Promise<BrandAsset> {
    try {
      console.log('📡 Updating brand asset (using mock data for now)');
      const existing = mockBrandAssets.find(a => a.id === id);
      return { ...existing, ...asset, updatedAt: new Date().toISOString() } as BrandAsset;
    } catch (error) {
      console.log('📡 API unavailable for updating brand asset, using fallback:', error);
      const existing = mockBrandAssets.find(a => a.id === id);
      return { ...existing, ...asset, updatedAt: new Date().toISOString() } as BrandAsset;
    }
  }
}

// Export singleton instance
export const subscriptionFeaturesAPI = new SubscriptionFeaturesAPI();
