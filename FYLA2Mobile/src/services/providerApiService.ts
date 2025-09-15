import ApiService from './api';
import Config from '../config/environment';

export interface ProviderPortfolioItem {
  id: number;
  providerId: string;
  imageUrl: string;
  caption?: string;
  category?: string;
  displayOrder: number;
  createdAt: string;
}

export interface ProviderBusinessHours {
  id: number;
  providerId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderSpecialty {
  id: number;
  providerId: string;
  name: string;
  isVerified: boolean;
  createdAt: string;
}

export interface ServiceAddOn {
  id: number;
  serviceId: number;
  name: string;
  description?: string;
  price: number;
  durationMinutes?: number;
  isRequired: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderAnalytics {
  totalRevenue: number;
  totalBookings: number;
  averageRating: number;
  clientCount: number;
  completionRate: number;
  popularServices: Array<{
    serviceName: string;
    bookingCount: number;
    revenue: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    bookingCount: number;
  }>;
  clientRetentionRate: number;
  topClients: Array<{
    clientName: string;
    totalSpent: number;
    bookingCount: number;
  }>;
}

/**
 * Enhanced Provider API Service
 * Connects mobile app to the real backend provider endpoints
 */
export class ProviderApiService {
  private baseURL: string = 'http://localhost:5224/api';

  constructor() {
    this.initializeBaseURL();
  }

  private async initializeBaseURL() {
    try {
      await Config.initialize();
      this.baseURL = Config.baseURL;
    } catch (error) {
      console.error('Error initializing base URL:', error);
      // Keep default URL
    }
  }

  /**
   * Portfolio Management
   */
  async getProviderPortfolio(providerId: string): Promise<ProviderPortfolioItem[]> {
    try {
      const response = await fetch(`${this.baseURL}/provider/portfolio/${providerId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching provider portfolio:', error);
      return [];
    }
  }

  async uploadPortfolioImage(
    providerId: string, 
    imageUri: string, 
    caption?: string, 
    category?: string
  ): Promise<ProviderPortfolioItem | null> {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'portfolio.jpg',
      } as any);
      
      if (caption) formData.append('caption', caption);
      if (category) formData.append('category', category);

      const response = await fetch(`${this.baseURL}/provider/portfolio/${providerId}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error uploading portfolio image:', error);
      return null;
    }
  }

  async deletePortfolioItem(portfolioId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/provider/portfolio/item/${portfolioId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting portfolio item:', error);
      return false;
    }
  }

  /**
   * Business Hours Management
   */
  async getProviderBusinessHours(providerId: string): Promise<ProviderBusinessHours[]> {
    try {
      const response = await fetch(`${this.baseURL}/provider/business-hours/${providerId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching business hours:', error);
      return [];
    }
  }

  async updateBusinessHours(
    providerId: string, 
    businessHours: Omit<ProviderBusinessHours, 'id' | 'providerId' | 'createdAt' | 'updatedAt'>[]
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/provider/business-hours/${providerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessHours),
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating business hours:', error);
      return false;
    }
  }

  /**
   * Specialties Management
   */
  async getProviderSpecialties(providerId: string): Promise<ProviderSpecialty[]> {
    try {
      const response = await fetch(`${this.baseURL}/provider/specialties/${providerId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching specialties:', error);
      return [];
    }
  }

  async addProviderSpecialty(providerId: string, specialtyName: string): Promise<ProviderSpecialty | null> {
    try {
      const response = await fetch(`${this.baseURL}/provider/specialties/${providerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: specialtyName }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding specialty:', error);
      return null;
    }
  }

  async deleteProviderSpecialty(specialtyId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/provider/specialties/item/${specialtyId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting specialty:', error);
      return false;
    }
  }

  /**
   * Provider Analytics
   */
  async getProviderAnalytics(providerId: string): Promise<ProviderAnalytics | null> {
    try {
      const response = await fetch(`${this.baseURL}/provider/analytics/${providerId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching provider analytics:', error);
      return null;
    }
  }

  /**
   * Provider Verification
   */
  async requestProviderVerification(providerId: string, documents: string[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/provider/verification/${providerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documents }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error requesting verification:', error);
      return false;
    }
  }

  /**
   * Service Add-ons
   */
  async getServiceAddOns(serviceId: number): Promise<ServiceAddOn[]> {
    try {
      const response = await fetch(`${this.baseURL}/provider/services/${serviceId}/addons`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching service add-ons:', error);
      return [];
    }
  }

  async createServiceAddOn(
    serviceId: number, 
    addOn: Omit<ServiceAddOn, 'id' | 'serviceId' | 'createdAt' | 'updatedAt'>
  ): Promise<ServiceAddOn | null> {
    try {
      const response = await fetch(`${this.baseURL}/provider/services/${serviceId}/addons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addOn),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating service add-on:', error);
      return null;
    }
  }

  async updateServiceAddOn(
    addOnId: number, 
    addOn: Partial<Omit<ServiceAddOn, 'id' | 'serviceId' | 'createdAt' | 'updatedAt'>>
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/provider/services/addons/${addOnId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addOn),
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating service add-on:', error);
      return false;
    }
  }

  async deleteServiceAddOn(addOnId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/provider/services/addons/${addOnId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting service add-on:', error);
      return false;
    }
  }

  /**
   * Provider Profile Management
   */
  async getProviderProfile(providerId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/provider/profile/${providerId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching provider profile:', error);
      return null;
    }
  }

  async updateProviderProfile(providerId: string, profileData: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/provider/profile/${providerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating provider profile:', error);
      return false;
    }
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/provider/health`);
      return response.ok;
    } catch (error) {
      console.error('Provider API health check failed:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const providerApiService = new ProviderApiService();
