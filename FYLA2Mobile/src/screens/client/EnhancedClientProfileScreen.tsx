import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList, User, ServiceProvider, Booking } from '../../types';
import { COLORS, COMMON_STYLES } from '../../constants/colors';
import ApiService from '../../services/api';

type EnhancedClientProfileNavigationProp = StackNavigationProp<RootStackParamList>;

interface LoyaltyProgram {
  providerId: string;
  providerName: string;
  totalPoints: number;
  tierLevel: string;
  availableRewards: number;
}

interface PromoGroup {
  providerId: string;
  providerName: string;
  promos: {
    id: string;
    title: string;
    description: string;
    discountValue: number;
    validUntil: string;
  }[];
}

interface ClientProfileData {
  user: User;
  socialStats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
  };
  loyaltyPrograms: LoyaltyProgram[];
  availablePromos: PromoGroup[];
  recentBookings: Booking[];
  favoriteProviders: ServiceProvider[];
}

const { width } = Dimensions.get('window');

const EnhancedClientProfileScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<EnhancedClientProfileNavigationProp>();
  const route = useRoute();
  
  const [profileData, setProfileData] = useState<ClientProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'promos' | 'loyalty' | 'bookings'>('overview');

  const clientId = (route.params as any)?.clientId || user?.id;

  useEffect(() => {
    loadClientProfile();
  }, [clientId]);

  const loadClientProfile = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getClientProfileData(clientId);
      setProfileData(data);
    } catch (error) {
      console.error('Error loading client profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClientProfile();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderPromoCard = ({ item }: { item: PromoGroup }) => (
    <View style={styles.promoCard}>
      <View style={styles.promoHeader}>
        <Text style={styles.providerName}>{item.providerName}</Text>
        <View style={styles.promoBadge}>
          <Text style={styles.promoBadgeText}>{item.promos.length} Active</Text>
        </View>
      </View>
      
      {item.promos.map((promo) => (
        <View key={promo.id} style={styles.promoItem}>
          <LinearGradient
            colors={COLORS.gradientPrimary}
            style={styles.promoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.promoContent}>
              <View style={styles.promoLeft}>
                <Text style={styles.promoTitle}>{promo.title}</Text>
                <Text style={styles.promoDescription}>{promo.description}</Text>
                <Text style={styles.promoExpiry}>Valid until {formatDate(promo.validUntil)}</Text>
              </View>
              <View style={styles.promoRight}>
                <Text style={styles.discountValue}>{promo.discountValue}%</Text>
                <Text style={styles.discountLabel}>OFF</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      ))}
    </View>
  );

  const renderLoyaltyCard = ({ item }: { item: LoyaltyProgram }) => (
    <TouchableOpacity 
      style={styles.loyaltyCard}
      onPress={() => navigation.navigate('ProviderProfile', { providerId: item.providerId })}
    >
      <LinearGradient
        colors={COLORS.gradientSecondary}
        style={styles.loyaltyGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.loyaltyContent}>
          <View style={styles.loyaltyHeader}>
            <Text style={styles.loyaltyProvider}>{item.providerName}</Text>
            <View style={styles.tierBadge}>
              <Text style={styles.tierText}>{item.tierLevel}</Text>
            </View>
          </View>
          
          <View style={styles.loyaltyStats}>
            <View style={styles.loyaltyStat}>
              <Text style={styles.loyaltyPoints}>{item.totalPoints}</Text>
              <Text style={styles.loyaltyLabel}>Points</Text>
            </View>
            <View style={styles.loyaltyStat}>
              <Text style={styles.loyaltyPoints}>{item.availableRewards}</Text>
              <Text style={styles.loyaltyLabel}>Rewards</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.viewRewardsButton}>
            <Text style={styles.viewRewardsText}>View Rewards</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.surface} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderBookingCard = ({ item }: { item: Booking }) => (
    <TouchableOpacity 
      style={styles.bookingCard}
      onPress={() => navigation.navigate('BookingDetails', { bookingId: item.id })}
    >
      <View style={styles.bookingHeader}>
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingService}>{item.service?.name}</Text>
          <Text style={styles.bookingProvider}>{item.serviceProvider?.businessName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.bookingDetails}>
        <View style={styles.bookingDetail}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.bookingDetailText}>{formatDate(item.startTime)}</Text>
        </View>
        <View style={styles.bookingDetail}>
          <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.bookingDetailText}>{new Date(item.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        <View style={styles.bookingDetail}>
          <Ionicons name="card-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.bookingDetailText}>${item.totalAmount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return COLORS.success;
      case 'pending': return COLORS.warning;
      case 'completed': return COLORS.verified;
      case 'cancelled': return COLORS.accent;
      default: return COLORS.textSecondary;
    }
  };

  const renderTabContent = () => {
    if (!profileData) return null;

    switch (selectedTab) {
      case 'promos':
        return (
          <FlatList
            data={profileData.availablePromos}
            renderItem={renderPromoCard}
            keyExtractor={(item) => item.providerId}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.tabContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="pricetag-outline" size={64} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>No Active Promos</Text>
                <Text style={styles.emptySubtext}>Follow providers to see their latest offers</Text>
              </View>
            }
          />
        );
        
      case 'loyalty':
        return (
          <FlatList
            data={profileData.loyaltyPrograms}
            renderItem={renderLoyaltyCard}
            keyExtractor={(item) => item.providerId}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.tabContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="trophy-outline" size={64} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>No Loyalty Programs</Text>
                <Text style={styles.emptySubtext}>Book services to start earning rewards</Text>
              </View>
            }
          />
        );
        
      case 'bookings':
        return (
          <FlatList
            data={profileData.recentBookings}
            renderItem={renderBookingCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.tabContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>No Recent Bookings</Text>
                <Text style={styles.emptySubtext}>Book your first service to get started</Text>
              </View>
            }
          />
        );
        
      default: // overview
        return (
          <ScrollView style={styles.overviewContent} showsVerticalScrollIndicator={false}>
            {/* Quick Stats */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Activity Overview</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
                  <Text style={styles.statValue}>{profileData.recentBookings.length}</Text>
                  <Text style={styles.statLabel}>Bookings</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="pricetag-outline" size={24} color={COLORS.accent} />
                  <Text style={styles.statValue}>{profileData.availablePromos.reduce((acc, group) => acc + group.promos.length, 0)}</Text>
                  <Text style={styles.statLabel}>Active Promos</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="trophy-outline" size={24} color={COLORS.warning} />
                  <Text style={styles.statValue}>{profileData.loyaltyPrograms.reduce((acc, program) => acc + program.totalPoints, 0)}</Text>
                  <Text style={styles.statLabel}>Total Points</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="heart-outline" size={24} color={COLORS.accent} />
                  <Text style={styles.statValue}>{profileData.favoriteProviders.length}</Text>
                  <Text style={styles.statLabel}>Favorites</Text>
                </View>
              </View>
            </View>

            {/* Recent Activity Preview */}
            {profileData.recentBookings.length > 0 && (
              <View style={styles.previewSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Bookings</Text>
                  <TouchableOpacity onPress={() => setSelectedTab('bookings')}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>
                {profileData.recentBookings.slice(0, 2).map((booking) => (
                  <View key={booking.id} style={styles.previewBooking}>
                    {renderBookingCard({ item: booking })}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadClientProfile}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <LinearGradient
              colors={COLORS.gradientPrimary}
              style={styles.profileGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.profileContent}>
                <Image
                  source={{
                    uri: profileData.user.profilePictureUrl || 'https://via.placeholder.com/100',
                  }}
                  style={styles.profileImage}
                />
                <Text style={styles.profileName}>
                  {profileData.user.firstName} {profileData.user.lastName}
                </Text>
                <Text style={styles.profileEmail}>{profileData.user.email}</Text>
                
                {/* Social Stats */}
                <View style={styles.socialStats}>
                  <View style={styles.socialStat}>
                    <Text style={styles.socialNumber}>{profileData.socialStats.postsCount}</Text>
                    <Text style={styles.socialLabel}>Posts</Text>
                  </View>
                  <View style={styles.socialStat}>
                    <Text style={styles.socialNumber}>{profileData.socialStats.followersCount}</Text>
                    <Text style={styles.socialLabel}>Followers</Text>
                  </View>
                  <View style={styles.socialStat}>
                    <Text style={styles.socialNumber}>{profileData.socialStats.followingCount}</Text>
                    <Text style={styles.socialLabel}>Following</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabNavigation}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                { key: 'overview', label: 'Overview', icon: 'grid-outline' },
                { key: 'promos', label: 'Promos', icon: 'pricetag-outline' },
                { key: 'loyalty', label: 'Loyalty', icon: 'trophy-outline' },
                { key: 'bookings', label: 'Bookings', icon: 'calendar-outline' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabButton, selectedTab === tab.key && styles.activeTabButton]}
                  onPress={() => setSelectedTab(tab.key as any)}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={20}
                    color={selectedTab === tab.key ? COLORS.surface : COLORS.textSecondary}
                  />
                  <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tab Content */}
          <View style={styles.contentContainer}>
            {renderTabContent()}
          </View>
        </ScrollView>
      </View>
    </>
  );
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
    backgroundColor: COLORS.surface,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Profile Header
  profileHeader: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileGradient: {
    padding: 24,
  },
  profileContent: {
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.surface,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.surface,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: COLORS.surface,
    opacity: 0.9,
    marginBottom: 20,
  },
  socialStats: {
    flexDirection: 'row',
    gap: 32,
  },
  socialStat: {
    alignItems: 'center',
  },
  socialNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.surface,
  },
  socialLabel: {
    fontSize: 12,
    color: COLORS.surface,
    opacity: 0.8,
    marginTop: 4,
  },

  // Tab Navigation
  tabNavigation: {
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    ...COMMON_STYLES.shadow,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 8,
    gap: 8,
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.surface,
  },

  // Content
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tabContent: {
    paddingBottom: 20,
  },

  // Overview Tab
  overviewContent: {
    flex: 1,
  },
  statsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: (width - 48) / 2 - 6,
    ...COMMON_STYLES.shadow,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  previewSection: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  previewBooking: {
    marginBottom: 8,
  },

  // Promo Cards
  promoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...COMMON_STYLES.shadow,
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  promoBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  promoBadgeText: {
    fontSize: 12,
    color: COLORS.surface,
    fontWeight: '600',
  },
  promoItem: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  promoGradient: {
    padding: 16,
  },
  promoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoLeft: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
    marginBottom: 4,
  },
  promoDescription: {
    fontSize: 14,
    color: COLORS.surface,
    opacity: 0.9,
    marginBottom: 4,
  },
  promoExpiry: {
    fontSize: 12,
    color: COLORS.surface,
    opacity: 0.8,
  },
  promoRight: {
    alignItems: 'center',
    marginLeft: 16,
  },
  discountValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.surface,
  },
  discountLabel: {
    fontSize: 12,
    color: COLORS.surface,
    fontWeight: '600',
  },

  // Loyalty Cards
  loyaltyCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  loyaltyGradient: {
    padding: 20,
  },
  loyaltyContent: {},
  loyaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  loyaltyProvider: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.surface,
  },
  tierBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tierText: {
    fontSize: 12,
    color: COLORS.surface,
    fontWeight: '600',
  },
  loyaltyStats: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 16,
  },
  loyaltyStat: {
    alignItems: 'center',
  },
  loyaltyPoints: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.surface,
  },
  loyaltyLabel: {
    fontSize: 12,
    color: COLORS.surface,
    opacity: 0.8,
    marginTop: 4,
  },
  viewRewardsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  viewRewardsText: {
    fontSize: 14,
    color: COLORS.surface,
    fontWeight: '600',
  },

  // Booking Cards
  bookingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    ...COMMON_STYLES.shadow,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingService: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  bookingProvider: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.surface,
    fontWeight: '600',
  },
  bookingDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  bookingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingDetailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  // Empty States
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default EnhancedClientProfileScreen;
