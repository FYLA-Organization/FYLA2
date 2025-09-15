import ApiService from './api';

export enum SubscriptionTier {
  Free = 0,        // Free tier - basic features only
  Pro = 1,         // Pro tier - access to promotions + loyalty programs  
  Business = 2     // Business tier - access to all marketing features including campaigns
}

export interface SubscriptionLimits {
  maxServices: number;
  maxPhotosPerService: number;
  canUseAdvancedAnalytics: boolean;
  canUseCustomBranding: boolean;
  canUseAutomatedMarketing: boolean;
  canAcceptOnlinePayments: boolean;
  hasPrioritySupport: boolean;
  canManageMultipleLocations: boolean;
  maxTeamMembers: number;
  // Marketing feature access based on subscription tier
  canUsePromotions: boolean;
  canUseLoyaltyPrograms: boolean;
  canUseMarketingCampaigns: boolean;
}

export interface UserSubscription {
  tier: SubscriptionTier;
  limits: SubscriptionLimits;
  isActive: boolean;
  expiresAt?: Date;
  renewalDate?: Date;
}

class FeatureGatingService {
  private currentSubscription: UserSubscription | null = null;
  private isLoaded = false;
  private serviceCount = 0;
  private lastServiceCountFetch = 0;
  private readonly SERVICE_COUNT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private getDefaultLimits(tier: SubscriptionTier): SubscriptionLimits {
    switch (tier) {
      case SubscriptionTier.Free:
        return {
          maxServices: 3,
          maxPhotosPerService: 5,
          canUseAdvancedAnalytics: false,
          canUseCustomBranding: false,
          canUseAutomatedMarketing: false,
          canAcceptOnlinePayments: false,
          hasPrioritySupport: false,
          canManageMultipleLocations: false,
          maxTeamMembers: 1,
          canUsePromotions: false,
          canUseLoyaltyPrograms: false,
          canUseMarketingCampaigns: false
        };
      case SubscriptionTier.Pro:  // Pro Plan - access to promotions + loyalty programs
        return {
          maxServices: 25,
          maxPhotosPerService: 30,
          canUseAdvancedAnalytics: true,
          canUseCustomBranding: false,
          canUseAutomatedMarketing: false,
          canAcceptOnlinePayments: true,
          hasPrioritySupport: true,
          canManageMultipleLocations: false,
          maxTeamMembers: 5,
          canUsePromotions: true,
          canUseLoyaltyPrograms: true,
          canUseMarketingCampaigns: false
        };
      case SubscriptionTier.Business:  // Business Plan - ALL marketing features
        return {
          maxServices: -1, // Unlimited
          maxPhotosPerService: -1, // Unlimited
          canUseAdvancedAnalytics: true,
          canUseCustomBranding: true,
          canUseAutomatedMarketing: true,
          canAcceptOnlinePayments: true,
          hasPrioritySupport: true,
          canManageMultipleLocations: true,
          maxTeamMembers: -1, // Unlimited
          canUsePromotions: true,
          canUseLoyaltyPrograms: true,
          canUseMarketingCampaigns: true
        };
      default:
        return this.getDefaultLimits(SubscriptionTier.Free);
    }
  }

  private async loadUserSubscription(): Promise<UserSubscription> {
    if (this.currentSubscription && this.isLoaded) {
      return this.currentSubscription;
    }

    try {
      const response = await ApiService.getCurrentSubscription();
      console.log('🔍 Raw subscription response:', JSON.stringify(response, null, 2));
      
      // The backend returns subscription data directly, not nested under 'subscription'
      if (response && (response.tier !== undefined || response.subscription)) {
        // Handle both direct response and nested subscription response
        const subscriptionData = response.subscription || response;
        
        // Map the response to our UserSubscription format
        // The backend sends: limits: { maxServices, canUseAdvancedAnalytics, etc. }
        const limits: SubscriptionLimits = {
          maxServices: subscriptionData.limits?.maxServices ?? this.getDefaultLimits(subscriptionData.tier || SubscriptionTier.Free).maxServices,
          maxPhotosPerService: subscriptionData.limits?.maxPhotosPerService ?? this.getDefaultLimits(subscriptionData.tier || SubscriptionTier.Free).maxPhotosPerService,
          canUseAdvancedAnalytics: subscriptionData.limits?.canUseAdvancedAnalytics ?? this.getDefaultLimits(subscriptionData.tier || SubscriptionTier.Free).canUseAdvancedAnalytics,
          canUseCustomBranding: subscriptionData.limits?.canUseCustomBranding ?? this.getDefaultLimits(subscriptionData.tier || SubscriptionTier.Free).canUseCustomBranding,
          canUseAutomatedMarketing: subscriptionData.limits?.canUseAutomatedMarketing ?? this.getDefaultLimits(subscriptionData.tier || SubscriptionTier.Free).canUseAutomatedMarketing,
          canAcceptOnlinePayments: subscriptionData.limits?.canAcceptOnlinePayments ?? this.getDefaultLimits(subscriptionData.tier || SubscriptionTier.Free).canAcceptOnlinePayments,
          hasPrioritySupport: subscriptionData.limits?.hasPrioritySupport ?? this.getDefaultLimits(subscriptionData.tier || SubscriptionTier.Free).hasPrioritySupport,
          canManageMultipleLocations: subscriptionData.limits?.canManageMultipleLocations ?? this.getDefaultLimits(subscriptionData.tier || SubscriptionTier.Free).canManageMultipleLocations,
          maxTeamMembers: subscriptionData.limits?.maxTeamMembers ?? this.getDefaultLimits(subscriptionData.tier || SubscriptionTier.Free).maxTeamMembers,
          canUsePromotions: subscriptionData.limits?.canUsePromotions ?? this.getDefaultLimits(subscriptionData.tier || SubscriptionTier.Free).canUsePromotions,
          canUseLoyaltyPrograms: subscriptionData.limits?.canUseLoyaltyPrograms ?? this.getDefaultLimits(subscriptionData.tier || SubscriptionTier.Free).canUseLoyaltyPrograms,
          canUseMarketingCampaigns: subscriptionData.limits?.canUseMarketingCampaigns ?? this.getDefaultLimits(subscriptionData.tier || SubscriptionTier.Free).canUseMarketingCampaigns
        };
        
        this.currentSubscription = {
          tier: subscriptionData.tier || SubscriptionTier.Free,
          limits: limits,
          isActive: subscriptionData.isActive || false,
          expiresAt: subscriptionData.endDate ? new Date(subscriptionData.endDate) : undefined,
          renewalDate: subscriptionData.renewalDate ? new Date(subscriptionData.renewalDate) : undefined
        };
        
        console.log('✅ Processed subscription:', JSON.stringify(this.currentSubscription, null, 2));
      } else {
        // Fallback to Free tier if no subscription data
        console.log('⚠️ No subscription data found, using Free tier');
        this.currentSubscription = {
          tier: SubscriptionTier.Free,
          limits: this.getDefaultLimits(SubscriptionTier.Free),
          isActive: true
        };
      }
      
      this.isLoaded = true;
      return this.currentSubscription;
    } catch (error) {
      console.error('❌ Error loading subscription:', error);
      // Return Free tier on error
      const fallbackSubscription: UserSubscription = {
        tier: SubscriptionTier.Free,
        limits: this.getDefaultLimits(SubscriptionTier.Free),
        isActive: true
      };
      
      this.currentSubscription = fallbackSubscription;
      this.isLoaded = true;
      return fallbackSubscription;
    }
  }

  private async getServiceCount(): Promise<number> {
    const now = Date.now();
    
    // Use cached count if it's fresh
    if (this.serviceCount > 0 && (now - this.lastServiceCountFetch) < this.SERVICE_COUNT_CACHE_DURATION) {
      return this.serviceCount;
    }

    try {
      const response = await ApiService.getServiceCount();
      this.serviceCount = response;
      this.lastServiceCountFetch = now;
      return this.serviceCount;
    } catch (error) {
      console.error('Error fetching service count:', error);
      return this.serviceCount; // Return cached count on error
    }
  }

  async canCreateService(): Promise<{ allowed: boolean; currentCount?: number; limit?: number; message?: string }> {
    const subscription = await this.loadUserSubscription();
    const currentServiceCount = await this.getServiceCount();
    
    // Check if unlimited (Business/Enterprise)
    if (subscription.limits.maxServices === -1) {
      return { 
        allowed: true, 
        currentCount: currentServiceCount 
      };
    }
    
    if (currentServiceCount >= subscription.limits.maxServices) {
      const tierName = this.getTierDisplayName(subscription.tier);
      return {
        allowed: false,
        currentCount: currentServiceCount,
        limit: subscription.limits.maxServices,
        message: `You've reached your service limit (${subscription.limits.maxServices}). Upgrade to Pro or Business plan to create more services.`
      };
    }
    
    return { 
      allowed: true, 
      currentCount: currentServiceCount, 
      limit: subscription.limits.maxServices 
    };
  }

  async canAddPhoto(serviceId: string): Promise<{ allowed: boolean; currentCount?: number; limit?: number; message?: string }> {
    const subscription = await this.loadUserSubscription();
    
    // Check if unlimited photos
    if (subscription.limits.maxPhotosPerService === -1) {
      return { allowed: true };
    }
    
    try {
      const currentPhotoCount = await ApiService.getServicePhotoCount(parseInt(serviceId));
      
      if (currentPhotoCount >= subscription.limits.maxPhotosPerService) {
        const tierName = this.getTierDisplayName(subscription.tier);
        return {
          allowed: false,
          currentCount: currentPhotoCount,
          limit: subscription.limits.maxPhotosPerService,
          message: `You've reached the photo limit for this service (${subscription.limits.maxPhotosPerService}). Upgrade to Pro or Business plan for more photos.`
        };
      }
      
      return { 
        allowed: true, 
        currentCount: currentPhotoCount, 
        limit: subscription.limits.maxPhotosPerService 
      };
    } catch (error) {
      console.error('Error checking photo count:', error);
      return { allowed: true }; // Allow on error
    }
  }

  async canAccessAdvancedAnalytics(): Promise<{ allowed: boolean; message?: string }> {
    const subscription = await this.loadUserSubscription();
    
    if (!subscription.limits.canUseAdvancedAnalytics) {
      const tierName = this.getTierDisplayName(subscription.tier);
      return {
        allowed: false,
        message: `Advanced analytics are available with Pro and Business plans. You're currently on the ${tierName} plan.`
      };
    }
    
    return { allowed: true };
  }

  async canUseCustomBranding(): Promise<{ allowed: boolean; message?: string }> {
    const subscription = await this.loadUserSubscription();
    
    if (!subscription.limits.canUseCustomBranding) {
      const tierName = this.getTierDisplayName(subscription.tier);
      return {
        allowed: false,
        message: `Custom branding is exclusive to Business plan subscribers. You're currently on the ${tierName} plan.`
      };
    }
    
    return { allowed: true };
  }

  async canUseAutomatedMarketing(): Promise<{ allowed: boolean; message?: string }> {
    const subscription = await this.loadUserSubscription();
    
    if (!subscription.limits.canUseAutomatedMarketing) {
      const tierName = this.getTierDisplayName(subscription.tier);
      return {
        allowed: false,
        message: `Automated marketing tools are exclusive to Business plan subscribers. You're currently on the ${tierName} plan.`
      };
    }
    
    return { allowed: true };
  }

  async canAcceptOnlinePayments(): Promise<{ allowed: boolean; message?: string }> {
    const subscription = await this.loadUserSubscription();
    
    if (!subscription.limits.canAcceptOnlinePayments) {
      const tierName = this.getTierDisplayName(subscription.tier);
      return {
        allowed: false,
        message: `Online payment processing is available with Pro and Business plans. You're currently on the ${tierName} plan.`
      };
    }
    
    return { allowed: true };
  }

  async canAccessPrioritySupport(): Promise<{ allowed: boolean; message?: string }> {
    const subscription = await this.loadUserSubscription();
    
    if (!subscription.limits.hasPrioritySupport) {
      const tierName = this.getTierDisplayName(subscription.tier);
      return {
        allowed: false,
        message: `Priority support is available with Pro and Business plans. You're currently on the ${tierName} plan.`
      };
    }
    
    return { allowed: true };
  }

  async canUseMultiLocation(): Promise<{ allowed: boolean; message?: string }> {
    const subscription = await this.loadUserSubscription();
    
    if (!subscription.limits.canManageMultipleLocations) {
      const tierName = this.getTierDisplayName(subscription.tier);
      return {
        allowed: false,
        message: `Multi-location management is exclusive to Business plan subscribers. You're currently on the ${tierName} plan.`
      };
    }
    
    return { allowed: true };
  }

  async canUseCRM(): Promise<{ allowed: boolean; message?: string }> {
    const subscription = await this.loadUserSubscription();
    
    // CRM is only available for Business tier (tier 2) and above
    if (subscription.tier < SubscriptionTier.Business) {
      const tierName = this.getTierDisplayName(subscription.tier);
      return {
        allowed: false,
        message: `Advanced CRM and revenue tracking is available with Business plan. You're currently on the ${tierName} plan.`
      };
    }
    
    return { allowed: true };
  }

  async canUseAdvancedBookingFeatures(): Promise<{ allowed: boolean; message?: string }> {
    const subscription = await this.loadUserSubscription();
    
    // Advanced booking features available from Pro tier
    if (subscription.tier < SubscriptionTier.Pro) {
      const tierName = this.getTierDisplayName(subscription.tier);
      return {
        allowed: false,
        message: `Advanced booking features are available with Pro and Business plans. You're currently on the ${tierName} plan.`
      };
    }
    
    return { allowed: true };
  }

  getTierDisplayName(tier: SubscriptionTier): string {
    switch (tier) {
      case SubscriptionTier.Free: return 'Free';
      case SubscriptionTier.Pro: return 'Pro';
      case SubscriptionTier.Business: return 'Business';
      default: return 'Unknown';
    }
  }

  async getSubscriptionInfo(): Promise<UserSubscription> {
    return this.loadUserSubscription();
  }

  async getTierName(): Promise<string> {
    const subscription = await this.loadUserSubscription();
    return this.getTierDisplayName(subscription.tier);
  }

  async showUpgradePrompt(feature: string): Promise<{ title: string; message: string; suggestedTier?: string }> {
    const subscription = await this.loadUserSubscription();
    const tierName = this.getTierDisplayName(subscription.tier);
    
    if (subscription.tier === SubscriptionTier.Free) {
      return {
        title: 'Upgrade Required',
        message: `${feature} is available with Pro ($19.99/month) and Business ($49.99/month) plans.`,
        suggestedTier: 'Pro'
      };
    } else if (subscription.tier === SubscriptionTier.Pro) {
      return {
        title: 'Upgrade to Business',
        message: `${feature} is available with the Business plan ($49.99/month).`,
        suggestedTier: 'Business'
      };
    }
    
    return {
      title: 'Feature Not Available',
      message: `${feature} is not available on your current plan.`
    };
  }

  private resetCache(): void {
    this.currentSubscription = null;
    this.isLoaded = false;
    this.serviceCount = 0;
    this.lastServiceCountFetch = 0;
  }

  // Force refresh subscription data from server
  async refreshSubscription(): Promise<UserSubscription> {
    this.resetCache();
    return this.loadUserSubscription();
  }

  // Activate subscription after payment (with retry logic)
  async activateSubscriptionAfterPayment(sessionId?: string): Promise<boolean> {
    try {
      console.log('🚀 Attempting to activate subscription after payment...');
      
      // Try manual activation first
      const activationResult = await ApiService.activateSubscription(sessionId);
      console.log('✅ Activation result:', activationResult);
      
      // Wait a moment for database updates
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Force refresh subscription data
      await this.refreshSubscription();
      
      return true;
    } catch (error) {
      console.error('❌ Error activating subscription:', error);
      
      // Still try to refresh subscription in case webhook worked
      await this.refreshSubscription();
      
      return false;
    }
  }

  // Debug subscription status
  async debugSubscription(): Promise<any> {
    try {
      const debugInfo = await ApiService.debugSubscription();
      console.log('🔍 Debug subscription info:', debugInfo);
      return debugInfo;
    } catch (error) {
      console.error('❌ Error debugging subscription:', error);
      throw error;
    }
  }

  // Check if user has access to a specific screen/feature
  async canAccessScreen(screenName: string): Promise<{ allowed: boolean; message?: string }> {
    switch (screenName) {
      case 'Analytics':
      case 'AdvancedAnalytics':
        return this.canAccessAdvancedAnalytics();
      case 'CustomBranding':
        return this.canUseCustomBranding();
      case 'AutomatedMarketing':
        return this.canUseAutomatedMarketing();
      case 'MultiLocation':
        return this.canUseMultiLocation();
      case 'RevenueCRM':
        return this.canUseCRM();
      case 'PrioritySupport':
        return this.canAccessPrioritySupport();
      default:
        return { allowed: true };
    }
  }

  // Helper methods to check subscription levels
  async hasProPlan(): Promise<boolean> {
    const subscription = await this.loadUserSubscription();
    return subscription.tier >= SubscriptionTier.Pro;
  }

  async hasBusinessPlan(): Promise<boolean> {
    const subscription = await this.loadUserSubscription();
    return subscription.tier >= SubscriptionTier.Business;
  }

  // Business plan should have access to ALL features
  async hasAccessToAllFeatures(): Promise<boolean> {
    const subscription = await this.loadUserSubscription();
    return subscription.tier >= SubscriptionTier.Business;
  }

  // Marketing feature access methods
  async canUsePromotions(): Promise<boolean> {
    const subscription = await this.loadUserSubscription();
    return subscription.limits.canUsePromotions;
  }

  async canUseLoyaltyPrograms(): Promise<boolean> {
    const subscription = await this.loadUserSubscription();
    return subscription.limits.canUseLoyaltyPrograms;
  }

  async canUseMarketingCampaigns(): Promise<boolean> {
    const subscription = await this.loadUserSubscription();
    return subscription.limits.canUseMarketingCampaigns;
  }

  // Debug method to check current subscription status
  async debugCurrentSubscription(): Promise<any> {
    const subscription = await this.loadUserSubscription();
    console.log('🔍 Current subscription debug info:');
    console.log('Tier:', subscription.tier, '(' + this.getTierDisplayName(subscription.tier) + ')');
    console.log('Is Active:', subscription.isActive);
    console.log('Limits:', subscription.limits);
    
    // Test all features
    const featureTests = {
      canCreateService: await this.canCreateService(),
      canAccessAdvancedAnalytics: await this.canAccessAdvancedAnalytics(),
      canUseCustomBranding: await this.canUseCustomBranding(),
      canUseAutomatedMarketing: await this.canUseAutomatedMarketing(),
      canAcceptOnlinePayments: await this.canAcceptOnlinePayments(),
      canUseMultiLocation: await this.canUseMultiLocation(),
      canUseCRM: await this.canUseCRM()
    };
    
    console.log('Feature Test Results:', featureTests);
    return {
      subscription,
      featureTests
    };
  }
}

export default new FeatureGatingService();
