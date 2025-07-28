import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ServiceProvider, SocialPost, Service } from '../../types';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
  primary: '#5A4FCF',      // Royal Indigo
  accent: '#F5C451',        // Soft Gold
  background: '#FAFAFA',    // Light Background
  surface: '#FFFFFF',       // Card Backgrounds
  textPrimary: '#1A1A1A',   // Dark Text
  textSecondary: '#6B6B6B', // Secondary Text
  lavenderMist: '#AFAAFF',  // Lavender Mist
  success: '#4CAF50',       // Success color
  warning: '#FF9800',       // Warning color
  error: '#F44336',         // Error color
  border: '#E8E8E8',        // Subtle borders
  shadow: '#000000',        // Shadow color
  heart: '#FF3040',         // Heart red
  bookmark: '#8B5CF6',      // Bookmark purple
};

const { width: screenWidth } = Dimensions.get('window');

interface RouteParams {
  providerId: string;
}

const EnhancedProviderProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { providerId } = route.params as RouteParams;
  const { user } = useAuth();

  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedTab, setSelectedTab] = useState<'posts' | 'services' | 'about'>('posts');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviderProfile();
  }, [providerId]);

  const loadProviderProfile = async () => {
    try {
      setLoading(true);
      
      // Mock API calls - replace with actual API
      const [providerData, postsData, servicesData] = await Promise.all([
        getMockProvider(providerId),
        getMockProviderPosts(providerId),
        getMockProviderServices(providerId),
      ]);

      setProvider(providerData);
      setPosts(postsData);
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading provider profile:', error);
      Alert.alert('Error', 'Failed to load provider profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!provider) return;

    try {
      // Optimistic update
      setProvider(prev => prev ? {
        ...prev,
        isFollowedByCurrentUser: !prev.isFollowedByCurrentUser,
        followersCount: prev.isFollowedByCurrentUser 
          ? prev.followersCount - 1 
          : prev.followersCount + 1
      } : null);

      // API call would go here
      console.log('Toggle follow for provider:', providerId);
    } catch (error) {
      console.error('Error toggling follow:', error);
      // Revert optimistic update
      setProvider(prev => prev ? {
        ...prev,
        isFollowedByCurrentUser: !prev.isFollowedByCurrentUser,
        followersCount: prev.isFollowedByCurrentUser 
          ? prev.followersCount + 1 
          : prev.followersCount - 1
      } : null);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!provider) return;

    try {
      setProvider(prev => prev ? {
        ...prev,
        isBookmarkedByCurrentUser: !prev.isBookmarkedByCurrentUser
      } : null);

      // API call would go here
      console.log('Toggle bookmark for provider:', providerId);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleBookService = (service: Service) => {
    navigation.navigate('BookingFlow', {
      providerId: provider?.id,
      serviceId: service.id,
      service,
      provider,
    });
  };

  const handleMessageProvider = () => {
    navigation.navigate('Chat', {
      providerId: provider?.id,
      providerName: provider?.businessName,
    });
  };

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.lavenderMist]}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
          
          {/* Navigation Header */}
          <View style={styles.navHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.surface} />
            </TouchableOpacity>
            
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerAction}
                onPress={() => {/* Share profile */}}
              >
                <Ionicons name="share-outline" size={22} color={COLORS.surface} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerAction}
                onPress={handleBookmarkToggle}
              >
                <Ionicons
                  name={provider?.isBookmarkedByCurrentUser ? "bookmark" : "bookmark-outline"}
                  size={22}
                  color={provider?.isBookmarkedByCurrentUser ? COLORS.accent : COLORS.surface}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <Image
              source={{ uri: provider?.profilePictureUrl || 'https://via.placeholder.com/120' }}
              style={styles.profileImage}
            />
            
            <View style={styles.profileDetails}>
              <View style={styles.nameContainer}>
                <Text style={styles.businessName}>{provider?.businessName}</Text>
                {provider?.isVerified && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
                )}
              </View>
              
              <Text style={styles.businessDescription} numberOfLines={2}>
                {provider?.businessDescription}
              </Text>
              
              {/* Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{provider?.postsCount || 0}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{provider?.followersCount || 0}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{provider?.totalReviews || 0}</Text>
                  <Text style={styles.statLabel}>Reviews</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{provider?.averageRating || 0}</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={[styles.actionBtn, styles.followButton]}
        onPress={handleFollowToggle}
      >
        <LinearGradient
          colors={provider?.isFollowedByCurrentUser 
            ? [COLORS.textSecondary, COLORS.textSecondary] 
            : [COLORS.primary, COLORS.lavenderMist]
          }
          style={styles.buttonGradient}
        >
          <Text style={[styles.buttonText, 
            provider?.isFollowedByCurrentUser && styles.followingText
          ]}>
            {provider?.isFollowedByCurrentUser ? 'Following' : 'Follow'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionBtn, styles.messageButton]}
        onPress={handleMessageProvider}
      >
        <View style={styles.outlineButton}>
          <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
          <Text style={styles.outlineButtonText}>Message</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionBtn, styles.bookButton]}
        onPress={() => navigation.navigate('BookingFlow', { providerId: provider?.id })}
      >
        <LinearGradient
          colors={[COLORS.accent, '#F7D060']}
          style={styles.buttonGradient}
        >
          <Ionicons name="calendar-outline" size={18} color={COLORS.textPrimary} />
          <Text style={[styles.buttonText, { color: COLORS.textPrimary }]}>Book</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderTabSelector = () => (
    <View style={styles.tabSelector}>
      {[
        { key: 'posts', label: 'Posts', icon: 'grid-outline' },
        { key: 'services', label: 'Services', icon: 'list-outline' },
        { key: 'about', label: 'About', icon: 'information-circle-outline' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
          onPress={() => setSelectedTab(tab.key as any)}
        >
          <Ionicons
            name={tab.icon as any}
            size={20}
            color={selectedTab === tab.key ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[
            styles.tabLabel,
            selectedTab === tab.key && styles.activeTabLabel
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPostsGrid = () => (
    <View style={styles.postsGrid}>
      {posts.map((post, index) => (
        <TouchableOpacity
          key={post.id}
          style={styles.postThumbnail}
          onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
        >
          <Image
            source={{ uri: post.imageUrls[0] }}
            style={styles.thumbnailImage}
          />
          {post.imageUrls.length > 1 && (
            <View style={styles.multipleImagesIndicator}>
              <Ionicons name="copy-outline" size={16} color={COLORS.surface} />
            </View>
          )}
          <View style={styles.postStats}>
            <View style={styles.postStat}>
              <Ionicons name="heart" size={12} color={COLORS.surface} />
              <Text style={styles.postStatText}>{post.likesCount}</Text>
            </View>
            <View style={styles.postStat}>
              <Ionicons name="chatbubble" size={12} color={COLORS.surface} />
              <Text style={styles.postStatText}>{post.commentsCount}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderServicesList = () => (
    <View style={styles.servicesList}>
      {services.map((service) => (
        <View key={service.id} style={styles.serviceCard}>
          <LinearGradient
            colors={[COLORS.surface, COLORS.background]}
            style={styles.serviceGradient}
          >
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceDescription} numberOfLines={2}>
                {service.description}
              </Text>
              <View style={styles.serviceDetails}>
                <Text style={styles.serviceDuration}>{service.duration} min</Text>
                <Text style={styles.servicePrice}>${service.price}</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.bookServiceButton}
              onPress={() => handleBookService(service)}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.lavenderMist]}
                style={styles.smallButtonGradient}
              >
                <Text style={styles.smallButtonText}>Book</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      ))}
    </View>
  );

  const renderAboutSection = () => (
    <View style={styles.aboutSection}>
      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>About</Text>
        <Text style={styles.aboutText}>{provider?.businessDescription}</Text>
      </View>

      {provider?.specialties && provider.specialties.length > 0 && (
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>Specialties</Text>
          <View style={styles.specialtiesContainer}>
            {provider.specialties.map((specialty, index) => (
              <View key={index} style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>Experience</Text>
        <Text style={styles.aboutText}>
          {provider?.yearsOfExperience} years in the beauty industry
        </Text>
      </View>

      {provider?.businessAddress && (
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>Location</Text>
          <Text style={styles.aboutText}>{provider.businessAddress}</Text>
        </View>
      )}
    </View>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 'posts':
        return renderPostsGrid();
      case 'services':
        return renderServicesList();
      case 'about':
        return renderAboutSection();
      default:
        return renderPostsGrid();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Provider not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderProfileHeader()}
      {renderActionButtons()}
      {renderTabSelector()}
      {renderContent()}
    </ScrollView>
  );
};

// Mock data functions - replace with actual API calls
const getMockProvider = async (providerId: string): Promise<ServiceProvider> => {
  return {
    id: providerId,
    userId: 'user1',
    businessName: 'Glamour Studio',
    businessDescription: 'Premium beauty services with 8+ years of experience. Specializing in hair transformations, makeup artistry, and nail care.',
    businessAddress: '123 Beauty Lane, Downtown',
    averageRating: 4.8,
    totalReviews: 127,
    isVerified: true,
    profilePictureUrl: 'https://via.placeholder.com/120',
    specialties: ['Hair Coloring', 'Bridal Makeup', 'Nail Art', 'Extensions'],
    yearsOfExperience: 8,
    priceRange: '$$',
    followersCount: 1520,
    followingCount: 89,
    postsCount: 156,
    isFollowedByCurrentUser: false,
    isBookmarkedByCurrentUser: false,
    socialLinks: {
      instagram: '@glamourstudio',
      website: 'www.glamourstudio.com',
    },
  };
};

const getMockProviderPosts = async (providerId: string): Promise<SocialPost[]> => {
  return Array.from({ length: 12 }, (_, index) => ({
    id: `post-${index + 1}`,
    providerId,
    provider: {} as any,
    imageUrls: [`https://via.placeholder.com/300x300?text=Post${index + 1}`],
    caption: `Beautiful work from today! #transformation #beauty`,
    tags: ['transformation', 'beauty', 'hair'],
    serviceCategories: ['Hair'],
    likesCount: Math.floor(Math.random() * 100) + 10,
    commentsCount: Math.floor(Math.random() * 20) + 1,
    isLikedByCurrentUser: false,
    isBookmarkByCurrentUser: false,
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  }));
};

const getMockProviderServices = async (providerId: string): Promise<Service[]> => {
  return [
    {
      id: '1',
      serviceProviderId: providerId,
      name: 'Haircut & Style',
      description: 'Professional haircut with styling',
      duration: 60,
      price: 50,
      category: 'Hair',
      isActive: true,
    },
    {
      id: '2',
      serviceProviderId: providerId,
      name: 'Hair Coloring',
      description: 'Full hair color service with consultation',
      duration: 120,
      price: 95,
      category: 'Hair',
      isActive: true,
    },
    {
      id: '3',
      serviceProviderId: providerId,
      name: 'Makeup Application',
      description: 'Professional makeup for special events',
      duration: 45,
      price: 75,
      category: 'Makeup',
      isActive: true,
    },
  ];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
  },
  profileHeader: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerGradient: {
    paddingBottom: 16,
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface + '20',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerAction: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface + '20',
  },
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.surface,
    marginBottom: 12,
  },
  profileDetails: {
    alignItems: 'center',
    width: '100%',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginRight: 8,
  },
  businessDescription: {
    fontSize: 13,
    color: COLORS.surface + 'CC',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.surface + 'CC',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  followButton: {},
  messageButton: {},
  bookButton: {},
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
  followingText: {
    color: COLORS.surface,
  },
  outlineButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 22,
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  activeTabLabel: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 2,
  },
  postThumbnail: {
    width: (screenWidth - 6) / 3,
    height: (screenWidth - 6) / 3,
    margin: 1,
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  multipleImagesIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  postStats: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    fontSize: 12,
    color: COLORS.surface,
    fontWeight: '500',
  },
  servicesList: {
    padding: 16,
    gap: 12,
  },
  serviceCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 16,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceDuration: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  bookServiceButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  smallButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  smallButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
  },
  aboutSection: {
    padding: 16,
    gap: 16,
  },
  aboutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyTag: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specialtyText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
});

export default EnhancedProviderProfileScreen;
