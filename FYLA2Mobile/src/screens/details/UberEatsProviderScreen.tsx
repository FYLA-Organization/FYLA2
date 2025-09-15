import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  ImageBackground,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MODERN_COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../../constants/modernDesign';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 300;

type ProviderProfileScreenRouteProp = {
  key: string;
  name: 'ProviderProfile';
  params: { providerId: string };
};

type ProviderProfileScreenNavigationProp = StackNavigationProp<any>;

interface Provider {
  id: string;
  businessName: string;
  category: string;
  rating: number;
  reviewCount: number;
  coverImage: string;
  profileImage: string;
  bio: string;
  location: string;
  distance: string;
  isOpen: boolean;
  openingHours: string;
  priceRange: string;
  deliveryTime: string;
  isVerified: boolean;
  isPromoted: boolean;
  badges: string[];
  photos: string[];
  specialties: string[];
  features: string[];
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  image: string;
  category: string;
  isPopular: boolean;
  rating: number;
  reviewCount: number;
}

interface Review {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  rating: number;
  comment: string;
  date: string;
  photos?: string[];
  helpful: number;
}

const UberEatsProviderScreen: React.FC = () => {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation<ProviderProfileScreenNavigationProp>();
  const route = useRoute<ProviderProfileScreenRouteProp>();
  const { providerId } = route.params;

  const categories = ['All', 'Hair', 'Makeup', 'Nails', 'Skincare', 'Massage'];

  useEffect(() => {
    loadProviderData();
  }, []);

  const loadProviderData = async () => {
    try {
      setIsLoading(true);
      
      // Mock data inspired by UberEats/Airbnb
      const mockProvider: Provider = {
        id: providerId,
        businessName: 'Luxe Beauty Studio',
        category: 'Premium Salon & Spa',
        rating: 4.8,
        reviewCount: 1247,
        coverImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
        profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b156d9b6?w=200',
        bio: 'Award-winning beauty studio specializing in luxury treatments. Our expert team provides personalized beauty experiences using premium products and cutting-edge techniques.',
        location: 'Beverly Hills, CA',
        distance: '2.1 mi away',
        isOpen: true,
        openingHours: 'Open until 8:00 PM',
        priceRange: '$$$',
        deliveryTime: '30-45 min appointment',
        isVerified: true,
        isPromoted: true,
        badges: ['Top Rated', 'Premium Partner', 'Eco-Friendly'],
        photos: [
          'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
          'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400',
          'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400',
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400',
          'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=400',
          'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
        ],
        specialties: ['Balayage', 'Bridal Makeup', 'Luxury Facials', 'Nail Art'],
        features: ['Free WiFi', 'Refreshments', 'Parking Available', 'Air Conditioning'],
      };

      const mockServices: Service[] = [
        {
          id: '1',
          name: 'Signature Balayage',
          description: 'Hand-painted highlights with our premium color line for natural, sun-kissed results',
          price: 280,
          duration: '3 hours',
          image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=300',
          category: 'Hair',
          isPopular: true,
          rating: 4.9,
          reviewCount: 156,
        },
        {
          id: '2',
          name: 'Luxury Hydrating Facial',
          description: 'Deep cleansing and hydrating treatment with premium skincare products',
          price: 180,
          duration: '90 minutes',
          image: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=300',
          category: 'Skincare',
          isPopular: true,
          rating: 4.8,
          reviewCount: 89,
        },
        {
          id: '3',
          name: 'Bridal Makeup Package',
          description: 'Complete bridal look with trial session and touch-up kit included',
          price: 350,
          duration: '2.5 hours',
          image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=300',
          category: 'Makeup',
          isPopular: false,
          rating: 5.0,
          reviewCount: 42,
        },
        {
          id: '4',
          name: 'Gel Manicure & Art',
          description: 'Long-lasting gel polish with custom nail art design',
          price: 85,
          duration: '75 minutes',
          image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300',
          category: 'Nails',
          isPopular: false,
          rating: 4.7,
          reviewCount: 67,
        },
      ];

      const mockReviews: Review[] = [
        {
          id: '1',
          user: {
            name: 'Emma Wilson',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
          },
          rating: 5,
          comment: 'Absolutely incredible experience! The balayage turned out exactly like the inspiration photo I showed. Sarah is a true artist!',
          date: '2024-08-15',
          photos: ['https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=200'],
          helpful: 23,
        },
        {
          id: '2',
          user: {
            name: 'Jessica Chen',
            avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100',
          },
          rating: 5,
          comment: 'The luxury facial was amazing! My skin feels so refreshed and glowing. Will definitely be back!',
          date: '2024-08-10',
          helpful: 18,
        },
      ];

      setProvider(mockProvider);
      setServices(mockServices);
      setReviews(mockReviews);
    } catch (error) {
      console.error('Error loading provider data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookService = (service: Service) => {
    navigation.navigate('BookingFlow', { service, provider });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${provider?.businessName} on FYLA!`,
        title: provider?.businessName,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const filteredServices = selectedCategory === 'All' 
    ? services 
    : services.filter(service => service.category === selectedCategory);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT - 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const renderHeader = () => (
    <View style={styles.header}>
      <ImageBackground
        source={{ uri: provider?.coverImage }}
        style={styles.coverImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={styles.coverGradient}
        />
        
        {/* Navigation Bar */}
        <SafeAreaView style={styles.navBar}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigation.goBack()}
          >
            <BlurView intensity={20} style={styles.blurButton}>
              <Ionicons name="arrow-back" size={24} color={MODERN_COLORS.white} />
            </BlurView>
          </TouchableOpacity>
          
          <View style={styles.navActions}>
            <TouchableOpacity style={styles.navButton} onPress={handleShare}>
              <BlurView intensity={20} style={styles.blurButton}>
                <Ionicons name="share-outline" size={24} color={MODERN_COLORS.white} />
              </BlurView>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => setIsFollowing(!isFollowing)}
            >
              <BlurView intensity={20} style={styles.blurButton}>
                <Ionicons 
                  name={isFollowing ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isFollowing ? MODERN_COLORS.error : MODERN_COLORS.white} 
                />
              </BlurView>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Provider Info Overlay */}
        <View style={styles.providerOverlay}>
          <View style={styles.providerInfo}>
            <Image source={{ uri: provider?.profileImage }} style={styles.profileImage} />
            <View style={styles.providerDetails}>
              <View style={styles.titleRow}>
                <Text style={styles.businessName}>{provider?.businessName}</Text>
                {provider?.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark" size={16} color={MODERN_COLORS.white} />
                  </View>
                )}
              </View>
              <Text style={styles.category}>{provider?.category}</Text>
              <View style={styles.ratingRow}>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color={MODERN_COLORS.warning} />
                  <Text style={styles.rating}>{provider?.rating}</Text>
                  <Text style={styles.reviewCount}>({provider?.reviewCount}+)</Text>
                </View>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.location}>{provider?.location}</Text>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.distance}>{provider?.distance}</Text>
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );

  const renderStatusBar = () => (
    <View style={styles.statusBar}>
      <View style={styles.statusIndicator}>
        <View style={[styles.statusDot, { backgroundColor: provider?.isOpen ? MODERN_COLORS.success : MODERN_COLORS.error }]} />
        <Text style={styles.statusText}>
          {provider?.isOpen ? provider?.openingHours : 'Closed'}
        </Text>
      </View>
      <View style={styles.statusDetails}>
        <Text style={styles.priceRange}>{provider?.priceRange}</Text>
        <Text style={styles.separator}>•</Text>
        <Text style={styles.deliveryTime}>{provider?.deliveryTime}</Text>
      </View>
    </View>
  );

  const renderBadges = () => (
    <View style={styles.badgesContainer}>
      {provider?.badges.map((badge, index) => (
        <View key={index} style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ))}
    </View>
  );

  const renderDescription = () => (
    <View style={styles.descriptionContainer}>
      <Text style={styles.sectionTitle}>About</Text>
      <Text 
        style={styles.description}
        numberOfLines={showFullDescription ? undefined : 3}
      >
        {provider?.bio}
      </Text>
      <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)}>
        <Text style={styles.readMoreText}>
          {showFullDescription ? 'Read less' : 'Read more'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPhotos = () => (
    <View style={styles.photosContainer}>
      <Text style={styles.sectionTitle}>Photos</Text>
      <FlatList
        data={provider?.photos.slice(0, 6)}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity style={styles.photoItem}>
            <Image source={{ uri: item }} style={styles.photo} />
            {index === 5 && provider?.photos && provider.photos.length > 6 && (
              <View style={styles.photoOverlay}>
                <Text style={styles.photoCount}>+{provider.photos.length - 6}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.photosList}
      />
    </View>
  );

  const renderCategoryTabs = () => (
    <View style={styles.categoryContainer}>
      <Text style={styles.sectionTitle}>Services</Text>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryTab,
              selectedCategory === item && styles.activeCategoryTab
            ]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text style={[
              styles.categoryTabText,
              selectedCategory === item && styles.activeCategoryTabText
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.categoriesList}
      />
    </View>
  );

  const renderService = ({ item: service }: { item: Service }) => (
    <Pressable 
      style={styles.serviceCard}
      onPress={() => handleBookService(service)}
    >
      <Image source={{ uri: service.image }} style={styles.serviceImage} />
      <View style={styles.serviceContent}>
        <View style={styles.serviceHeader}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{service.name}</Text>
            {service.isPopular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Popular</Text>
              </View>
            )}
          </View>
          <Text style={styles.servicePrice}>${service.price}</Text>
        </View>
        
        <Text style={styles.serviceDescription} numberOfLines={2}>
          {service.description}
        </Text>
        
        <View style={styles.serviceFooter}>
          <View style={styles.serviceRating}>
            <Ionicons name="star" size={14} color={MODERN_COLORS.warning} />
            <Text style={styles.serviceRatingText}>{service.rating}</Text>
            <Text style={styles.serviceReviewCount}>({service.reviewCount})</Text>
          </View>
          <Text style={styles.serviceDuration}>{service.duration}</Text>
        </View>
      </View>
    </Pressable>
  );

  const renderReviews = () => (
    <View style={styles.reviewsContainer}>
      <View style={styles.reviewsHeader}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>
      
      {reviews.slice(0, 2).map((review) => (
        <View key={review.id} style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Image source={{ uri: review.user.avatar }} style={styles.reviewerAvatar} />
            <View style={styles.reviewerInfo}>
              <Text style={styles.reviewerName}>{review.user.name}</Text>
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
            <Text style={styles.reviewDate}>{review.date}</Text>
          </View>
          
          <Text style={styles.reviewComment}>{review.comment}</Text>
          
          {review.photos && (
            <FlatList
              data={review.photos}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.reviewPhoto} />
              )}
              style={styles.reviewPhotos}
            />
          )}
          
          <View style={styles.reviewFooter}>
            <TouchableOpacity style={styles.helpfulButton}>
              <Ionicons name="thumbs-up-outline" size={16} color={MODERN_COLORS.gray500} />
              <Text style={styles.helpfulText}>Helpful ({review.helpful})</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Animated Header */}
      <Animated.View style={[styles.animatedHeader, { opacity: headerOpacity }]}>
        <BlurView intensity={90} style={styles.headerBlur}>
          <SafeAreaView style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={MODERN_COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{provider?.businessName}</Text>
            <TouchableOpacity onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color={MODERN_COLORS.textPrimary} />
            </TouchableOpacity>
          </SafeAreaView>
        </BlurView>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {renderHeader()}
        
        <View style={styles.content}>
          {renderStatusBar()}
          {renderBadges()}
          {renderDescription()}
          {renderPhotos()}
          {renderCategoryTabs()}
          
          <FlatList
            data={filteredServices}
            renderItem={renderService}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.servicesList}
          />
          
          {renderReviews()}
          
          <View style={styles.bottomSpacing} />
        </View>
      </Animated.ScrollView>

      {/* Floating Book Button */}
      <View style={styles.floatingButton}>
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => navigation.navigate('BookingFlow', { provider })}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  
  // Loading
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

  // Animated Header
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBlur: {
    paddingTop: StatusBar.currentHeight || 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
  },

  // Header
  scrollView: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: HEADER_HEIGHT,
  },
  
  // Navigation
  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  navButton: {
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  blurButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },

  // Provider Info
  providerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 3,
    borderColor: MODERN_COLORS.white,
    marginRight: SPACING.md,
  },
  providerDetails: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  businessName: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.white,
  },
  verifiedBadge: {
    backgroundColor: MODERN_COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  category: {
    fontSize: TYPOGRAPHY.base,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: SPACING.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  rating: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.white,
  },
  reviewCount: {
    fontSize: TYPOGRAPHY.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  separator: {
    fontSize: TYPOGRAPHY.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: SPACING.sm,
  },
  location: {
    fontSize: TYPOGRAPHY.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  distance: {
    fontSize: TYPOGRAPHY.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Content
  content: {
    backgroundColor: MODERN_COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    marginTop: -20,
    paddingTop: SPACING.lg,
  },

  // Status Bar
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: MODERN_COLORS.surface,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.textPrimary,
  },
  statusDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceRange: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.textSecondary,
  },
  deliveryTime: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
  },

  // Badges
  badgesContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  badge: {
    backgroundColor: MODERN_COLORS.primary + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.primary,
  },

  // Description
  descriptionContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.sm,
  },
  readMoreText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.primary,
  },

  // Photos
  photosContainer: {
    marginBottom: SPACING.lg,
  },
  photosList: {
    paddingHorizontal: SPACING.md,
  },
  photoItem: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  photo: {
    width: 120,
    height: 90,
    borderRadius: BORDER_RADIUS.md,
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCount: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.white,
  },

  // Categories
  categoryContainer: {
    marginBottom: SPACING.lg,
  },
  categoriesList: {
    paddingHorizontal: SPACING.md,
  },
  categoryTab: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: MODERN_COLORS.gray100,
    marginRight: SPACING.sm,
  },
  activeCategoryTab: {
    backgroundColor: MODERN_COLORS.primary,
  },
  categoryTabText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.textSecondary,
  },
  activeCategoryTabText: {
    color: MODERN_COLORS.white,
  },

  // Services
  servicesList: {
    paddingHorizontal: SPACING.md,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: MODERN_COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  serviceImage: {
    width: 100,
    height: 100,
  },
  serviceContent: {
    flex: 1,
    padding: SPACING.md,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  serviceInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  serviceName: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
    flex: 1,
  },
  popularBadge: {
    backgroundColor: MODERN_COLORS.warning,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  popularText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.white,
  },
  servicePrice: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.primary,
  },
  serviceDescription: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  serviceRatingText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.textPrimary,
  },
  serviceReviewCount: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textTertiary,
  },
  serviceDuration: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
  },

  // Reviews
  reviewsContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  seeAllText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.primary,
  },
  reviewCard: {
    backgroundColor: MODERN_COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  reviewerAvatar: {
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
    marginBottom: 2,
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
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  reviewPhotos: {
    marginBottom: SPACING.sm,
  },
  reviewPhoto: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.sm,
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  helpfulText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
  },

  // Floating Button
  floatingButton: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.md,
    right: SPACING.md,
  },
  bookButton: {
    backgroundColor: MODERN_COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  bookButtonText: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.white,
  },

  // Spacing
  bottomSpacing: {
    height: 100,
  },
});

export default UberEatsProviderScreen;
