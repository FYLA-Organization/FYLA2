// Demo data for social media features
import { SocialPost, ServiceProvider } from '../../../types';

export const demoSocialPosts: SocialPost[] = [
  {
    id: '1',
    providerId: 'provider-1',
    provider: {
      id: 'provider-1',
      businessName: 'Luxe Beauty Studio',
      profilePictureUrl: 'https://example.com/provider1.jpg',
      followersCount: 1250,
      isFollowedByCurrentUser: false,
    } as ServiceProvider,
    content: 'Just finished this stunning bridal look for our beautiful client! ✨ #bridalbeauty #makeup #luxebeauty',
    images: [
      'https://example.com/bridal1.jpg',
      'https://example.com/bridal2.jpg'
    ],
    hashtags: ['bridalbeauty', 'makeup', 'luxebeauty'],
    serviceCategory: 'makeup',
    location: 'Beverly Hills, CA',
    likesCount: 89,
    commentsCount: 15,
    isLikedByCurrentUser: false,
    isBookmarkedByCurrentUser: true,
    createdAt: '2025-07-23T10:30:00Z',
    updatedAt: '2025-07-23T10:30:00Z'
  },
  {
    id: '2',
    providerId: 'provider-2',
    provider: {
      id: 'provider-2',
      businessName: 'Elite Hair Salon',
      profilePictureUrl: 'https://example.com/provider2.jpg',
      followersCount: 892,
      isFollowedByCurrentUser: true,
    } as ServiceProvider,
    content: 'Color transformation Tuesday! From brunette to gorgeous blonde balayage 💫 #balayage #colortransformation #hair',
    images: [
      'https://example.com/hair1.jpg'
    ],
    hashtags: ['balayage', 'colortransformation', 'hair'],
    serviceCategory: 'hair',
    location: 'West Hollywood, CA',
    likesCount: 156,
    commentsCount: 23,
    isLikedByCurrentUser: true,
    isBookmarkedByCurrentUser: false,
    createdAt: '2025-07-23T08:15:00Z',
    updatedAt: '2025-07-23T08:15:00Z'
  },
  {
    id: '3',
    providerId: 'provider-3',
    provider: {
      id: 'provider-3',
      businessName: 'Zen Spa & Wellness',
      profilePictureUrl: 'https://example.com/provider3.jpg',
      followersCount: 2100,
      isFollowedByCurrentUser: false,
    } as ServiceProvider,
    content: 'Self-care Sunday vibes 🧘‍♀️ Book your relaxing facial today and feel refreshed for the week ahead!',
    images: [
      'https://example.com/spa1.jpg',
      'https://example.com/spa2.jpg',
      'https://example.com/spa3.jpg'
    ],
    hashtags: ['selfcare', 'facial', 'wellness', 'relaxation'],
    serviceCategory: 'skincare',
    location: 'Santa Monica, CA',
    likesCount: 203,
    commentsCount: 31,
    isLikedByCurrentUser: false,
    isBookmarkedByCurrentUser: false,
    createdAt: '2025-07-23T06:45:00Z',
    updatedAt: '2025-07-23T06:45:00Z'
  }
];

export const demoProviders: ServiceProvider[] = [
  {
    id: 'provider-1',
    userId: 'user-1',
    businessName: 'Luxe Beauty Studio',
    businessDescription: 'Premium beauty services specializing in bridal makeup and special occasions.',
    profilePictureUrl: 'https://example.com/provider1.jpg',
    businessAddress: '123 Rodeo Drive, Beverly Hills, CA 90210',
    businessPhone: '(310) 555-0123',
    businessEmail: 'info@luxebeautystudio.com',
    rating: 4.9,
    reviewCount: 127,
    isVerified: true,
    serviceCategories: ['makeup', 'skincare'],
    priceRange: 'premium',
    businessHours: {
      monday: { open: '09:00', close: '18:00', isOpen: true },
      tuesday: { open: '09:00', close: '18:00', isOpen: true },
      wednesday: { open: '09:00', close: '18:00', isOpen: true },
      thursday: { open: '09:00', close: '18:00', isOpen: true },
      friday: { open: '09:00', close: '20:00', isOpen: true },
      saturday: { open: '08:00', close: '20:00', isOpen: true },
      sunday: { open: '10:00', close: '16:00', isOpen: true }
    },
    availabilityCalendar: [],
    portfolio: [
      {
        id: '1',
        imageUrl: 'https://example.com/portfolio1.jpg',
        caption: 'Bridal makeup transformation',
        serviceType: 'makeup'
      }
    ],
    socialStats: {
      postsCount: 45,
      followersCount: 1250,
      followingCount: 230
    },
    followersCount: 1250,
    isFollowedByCurrentUser: false,
    socialLinks: {
      instagram: '@luxebeautystudio',
      facebook: 'LuxeBeautyStudioCA'
    },
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-07-23T00:00:00Z'
  }
];
