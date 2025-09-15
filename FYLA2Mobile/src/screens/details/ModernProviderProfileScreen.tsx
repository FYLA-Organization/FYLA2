import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  FlatList,
  SafeAreaView,
  StatusBar,
  Alert,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ServiceProvider, Service, RootStackParamList, Review } from '../../types';
import ApiService from '../../services/api';
import { MODERN_COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../../constants/modernDesign';

const { width } = Dimensions.get('window');

type ProviderProfileScreenRouteProp = {
  key: string;
  name: 'ProviderProfile';
  params: { providerId: string };
};

type ProviderProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface TabItem {
  id: 'services' | 'portfolio' | 'reviews';
  title: string;
  icon: string;
  count?: number;
}

const ProviderProfileScreen: React.FC = () => {
  const [provider, setProvider] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'services' | 'portfolio' | 'reviews'>('services');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  
  const route = useRoute<ProviderProfileScreenRouteProp>();
  const navigation = useNavigation<ProviderProfileScreenNavigationProp>();
  const { providerId } = route.params;

  const tabs: TabItem[] = [
    { id: 'services', title: 'Services', icon: 'cut-outline', count: services.length },
    { id: 'portfolio', title: 'Portfolio', icon: 'images-outline', count: portfolio.length },
    { id: 'reviews', title: 'Reviews', icon: 'star-outline', count: reviews.length },
  ];

  useEffect(() => {
    loadProviderData();
  }, [providerId]);

  const loadProviderData = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for demo
      const mockProvider: ServiceProvider = {
        id: providerId,
        userId: '1',
        businessName: 'Glamour Studio',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah@glamourstudio.com',
        phoneNumber: '+1 (555) 123-4567',
        bio: 'Professional hair stylist with 8+ years of experience specializing in balayage, cuts, and color transformations. Passionate about making every client feel beautiful and confident.',
        profilePictureUrl: 'https://images.unsplash.com/photo-1494790108755-2616b156d9b6?w=400',
        address: '123 Beauty Blvd, Fashion District',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        rating: 4.8,
        totalReviews: 127,
        followersCount: 2453,
        followingCount: 892,
        isVerified: true,
        specialties: ['Balayage', 'Hair Cutting', 'Color Treatment', 'Styling'],
        workingHours: {
          monday: '9:00 AM - 6:00 PM',
          tuesday: '9:00 AM - 6:00 PM',
          wednesday: '9:00 AM - 6:00 PM',
          thursday: '9:00 AM - 7:00 PM',
          friday: '9:00 AM - 7:00 PM',
          saturday: '8:00 AM - 5:00 PM',
          sunday: 'Closed'
        },
        createdAt: '2023-01-15T00:00:00Z'
      };

      const mockServices: Service[] = [
        {
          id: '1',
          name: 'Balayage & Highlights',
          description: 'Hand-painted highlights for a natural, sun-kissed look',
          price: 180,
          duration: 180,
          category: 'Hair Coloring',
          providerId: providerId,
          imageUrl: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=300',
          isActive: true,
          createdAt: '2023-01-15T00:00:00Z'
        },
        {
          id: '2',
          name: 'Precision Cut & Style',
          description: 'Professional haircut with personalized styling',
          price: 85,
          duration: 90,
          category: 'Hair Cutting',
          providerId: providerId,
          imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=300',
          isActive: true,
          createdAt: '2023-01-15T00:00:00Z'
        },
        {
          id: '3',
          name: 'Deep Conditioning Treatment',
          description: 'Restorative treatment for damaged and dry hair',
          price: 65,
          duration: 60,
          category: 'Hair Treatment',
          providerId: providerId,
          imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300',
          isActive: true,
          createdAt: '2023-01-15T00:00:00Z'
        },
      ];

      const mockReviews: Review[] = [
        {
          id: '1',
          rating: 5,
          comment: 'Amazing experience! Sarah really listened to what I wanted and exceeded my expectations. My balayage looks incredible!',
          createdAt: '2024-01-15T00:00:00Z',
          userId: '1',
          serviceProviderId: providerId,
          reviewer: {
            id: '1',
            firstName: 'Emma',
            lastName: 'Williams',
            profilePictureUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100'
          }
        },
        {
          id: '2',
          rating: 5,
          comment: 'Best haircut I\'ve ever had! Professional, friendly, and the studio is beautiful. Will definitely be back!',
          createdAt: '2024-01-10T00:00:00Z',
          userId: '2',
          serviceProviderId: providerId,
          reviewer: {
            id: '2',
            firstName: 'Jessica',
            lastName: 'Chen',
            profilePictureUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100'
          }
        },
      ];

      const mockPortfolio = [
        {
          id: '1',
          imageUrl: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400',
          title: 'Balayage Transformation',
          likes: 45,
        },
        {
          id: '2',
          imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400',
          title: 'Modern Bob Cut',
          likes: 32,
        },
        {
          id: '3',
          imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
          title: 'Color Correction',
          likes: 28,
        },
        {
          id: '4',
          imageUrl: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=400',
          title: 'Bridal Styling',
          likes: 67,
        },
      ];

      setProvider(mockProvider);
      setServices(mockServices);
      setReviews(mockReviews);
      setPortfolio(mockPortfolio);
      setFollowersCount(mockProvider.followersCount || 0);
    } catch (error) {
      console.error('Error loading provider data:', error);
      Alert.alert('Error', 'Failed to load provider information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!provider || isFollowLoading) return;

    try {
      setIsFollowLoading(true);
      setIsFollowing(!isFollowing);
      setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Error toggling follow status:', error);
      setIsFollowing(isFollowing); // Revert on error
      setFollowersCount(prev => isFollowing ? prev + 1 : prev - 1);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleBookService = (service: any) => {
    if (!provider) return;
    navigation.navigate('BookingFlow', {
      service: service,
      provider: provider
    });
  };

  const handleStartChat = () => {
    if (provider) {
      navigation.navigate('Chat', { 
        userId: provider.userId, 
        userName: provider.businessName,
        userImage: provider.profilePictureUrl
      });
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${provider?.businessName} on FYLA! ${provider?.bio}`,
        title: provider?.businessName,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderService = ({ item: service }: { item: any }) => (
    <TouchableOpacity style={styles.serviceCard}>
      <Image source={{ uri: service.imageUrl }} style={styles.serviceImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.serviceGradient}
      />
      <View style={styles.serviceContent}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.serviceDescription} numberOfLines={2}>
            {service.description}
          </Text>
          <View style={styles.serviceDetails}>
            <View style={styles.serviceDetailItem}>
              <Ionicons name="time-outline" size={14} color={MODERN_COLORS.white} />
              <Text style={styles.serviceDetailText}>{service.duration}min</Text>
            </View>
            <View style={styles.serviceDetailItem}>
              <Ionicons name="pricetag-outline" size={14} color={MODERN_COLORS.white} />
              <Text style={styles.serviceDetailText}>{service.category}</Text>
            </View>
          </View>
        </View>
        <View style={styles.servicePricing}>
          <Text style={styles.servicePrice}>${service.price}</Text>
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => handleBookService(service)}
          >
            <Text style={styles.bookButtonText}>Book</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPortfolioItem = ({ item, index }: { item: any, index: number }) => (
    <TouchableOpacity style={styles.portfolioItem}>
      <Image source={{ uri: item.imageUrl }} style={styles.portfolioImage} />
      <View style={styles.portfolioOverlay}>
        <View style={styles.portfolioLikes}>
          <Ionicons name="heart" size={16} color={MODERN_COLORS.white} />
          <Text style={styles.portfolioLikesText}>{item.likes}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderReview = ({ item: review }: { item: any }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: review.reviewer?.profilePictureUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' }}
          style={styles.reviewerImage}
        />
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>
            {review.reviewer?.firstName} {review.reviewer?.lastName}
          </Text>
          <View style={styles.reviewRating}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= review.rating ? "star" : "star-outline"}
                size={14}
                color={MODERN_COLORS.warning}
              />
            ))}
          </View>
        </View>
        <Text style={styles.reviewDate}>
          {new Date(review.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'services':
        return (
          <FlatList
            data={services}
            renderItem={renderService}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.serviceRow}
            contentContainerStyle={styles.tabContent}
            showsVerticalScrollIndicator={false}
          />
        );
      case 'portfolio':
        return (
          <FlatList
            data={portfolio}
            renderItem={renderPortfolioItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.portfolioRow}
            contentContainerStyle={styles.tabContent}
            showsVerticalScrollIndicator={false}
          />
        );
      case 'reviews':
        return (
          <FlatList
            data={reviews}
            renderItem={renderReview}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.tabContent}
            showsVerticalScrollIndicator={false}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MODERN_COLORS.primary} />
          <Text style={styles.loadingText}>Loading provider...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!provider) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={MODERN_COLORS.error} />
          <Text style={styles.errorText}>Provider not found</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadProviderData}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={MODERN_COLORS.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[MODERN_COLORS.primary, MODERN_COLORS.accent]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={MODERN_COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{provider.businessName}</Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={24} color={MODERN_COLORS.white} />
          </TouchableOpacity>
        </View>
        
        {/* Provider Info */}
        <View style={styles.providerInfo}>
          <View style={styles.providerImageContainer}>
            <Image source={{ uri: provider.profilePictureUrl }} style={styles.providerImage} />
            {provider.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={16} color={MODERN_COLORS.white} />
              </View>
            )}
          </View>
          
          <View style={styles.providerDetails}>
            <Text style={styles.providerName}>{provider.businessName}</Text>
            <Text style={styles.providerLocation}>{provider.city}, {provider.state}</Text>
            
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color={MODERN_COLORS.warning} />
              <Text style={styles.rating}>{provider.rating}</Text>
              <Text style={styles.reviewCount}>({provider.totalReviews} reviews)</Text>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{services.length}</Text>
                <Text style={styles.statLabel}>Services</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{followersCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{provider.followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Bio */}
        <Text style={styles.bio}>{provider.bio}</Text>
        
        {/* Specialties */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.specialtiesContainer}
        >
          {provider.specialties?.map((specialty: any, index: number) => (
            <View key={index} style={styles.specialtyTag}>
              <Text style={styles.specialtyText}>{specialty}</Text>
            </View>
          ))}
        </ScrollView>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.followButton, isFollowing && styles.followingButton]}
            onPress={handleFollow}
            disabled={isFollowLoading}
          >
            {isFollowLoading ? (
              <ActivityIndicator size="small" color={MODERN_COLORS.white} />
            ) : (
              <>
                <Ionicons 
                  name={isFollowing ? "person-remove-outline" : "person-add-outline"} 
                  size={16} 
                  color={MODERN_COLORS.white} 
                />
                <Text style={styles.actionButtonText}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.messageButton]}
            onPress={handleStartChat}
          >
            <Ionicons name="chatbubble-outline" size={16} color={MODERN_COLORS.primary} />
            <Text style={[styles.actionButtonText, { color: MODERN_COLORS.primary }]}>Message</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, selectedTab === tab.id && styles.activeTab]}
            onPress={() => setSelectedTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={20} 
              color={selectedTab === tab.id ? MODERN_COLORS.primary : MODERN_COLORS.gray500} 
            />
            <Text style={[
              styles.tabText,
              selectedTab === tab.id && styles.activeTabText
            ]}>
              {tab.title}
            </Text>
            {tab.count !== undefined && tab.count > 0 && (
              <View style={[
                styles.tabBadge,
                selectedTab === tab.id && styles.activeTabBadge
              ]}>
                <Text style={[
                  styles.tabBadgeText,
                  selectedTab === tab.id && styles.activeTabBadgeText
                ]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  
  // Loading & Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: TYPOGRAPHY.lg,
    color: MODERN_COLORS.textPrimary,
    marginVertical: SPACING.md,
  },
  retryButton: {
    backgroundColor: MODERN_COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.white,
  },

  // Header
  header: {
    padding: SPACING.md,
    paddingTop: SPACING.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.white,
  },

  // Provider Info
  providerInfo: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  providerImageContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  providerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: MODERN_COLORS.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: MODERN_COLORS.success,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: MODERN_COLORS.white,
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.white,
    marginBottom: SPACING.xs / 2,
  },
  providerLocation: {
    fontSize: TYPOGRAPHY.base,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: SPACING.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  rating: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.white,
    marginLeft: SPACING.xs / 2,
    marginRight: SPACING.xs,
  },
  reviewCount: {
    fontSize: TYPOGRAPHY.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.white,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  // Bio & Specialties
  bio: {
    fontSize: TYPOGRAPHY.base,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  specialtiesContainer: {
    marginBottom: SPACING.md,
  },
  specialtyTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    marginRight: SPACING.sm,
  },
  specialtyText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.white,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  followButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  followingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageButton: {
    backgroundColor: MODERN_COLORS.white,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.white,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: MODERN_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs / 2,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: MODERN_COLORS.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.gray500,
  },
  activeTabText: {
    color: MODERN_COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
  tabBadge: {
    backgroundColor: MODERN_COLORS.gray200,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: MODERN_COLORS.primary,
  },
  tabBadgeText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.gray600,
  },
  activeTabBadgeText: {
    color: MODERN_COLORS.white,
  },

  // Content
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    padding: SPACING.md,
  },

  // Services
  serviceRow: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  serviceCard: {
    width: (width - SPACING.md * 3) / 2,
    backgroundColor: MODERN_COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  serviceImage: {
    width: '100%',
    height: 120,
  },
  serviceGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  serviceContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.sm,
  },
  serviceInfo: {
    marginBottom: SPACING.xs,
  },
  serviceName: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.white,
    marginBottom: SPACING.xs / 2,
  },
  serviceDescription: {
    fontSize: TYPOGRAPHY.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: SPACING.xs,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  serviceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  serviceDetailText: {
    fontSize: TYPOGRAPHY.xs,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  servicePricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.white,
  },
  bookButton: {
    backgroundColor: MODERN_COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  bookButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.white,
  },

  // Portfolio
  portfolioRow: {
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  portfolioItem: {
    width: (width - SPACING.md * 3) / 2,
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
  },
  portfolioOverlay: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
  portfolioLikes: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs / 2,
  },
  portfolioLikesText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.white,
  },

  // Reviews
  reviewCard: {
    backgroundColor: MODERN_COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  reviewerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.sm,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textTertiary,
  },
  reviewComment: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default ProviderProfileScreen;
