import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, ClientDashboard } from '../../types';
import ApiService from '../../services/api';
import ProfilePicture from '../../components/ProfilePicture';

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
  cardBackground: '#F8F9FA', // Card backgrounds
};

const { width } = Dimensions.get('window');

type ClientDashboardScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ClientDashboardScreen: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<ClientDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<ClientDashboardScreenNavigationProp>();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await ApiService.getClientDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading client dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status?: string) => {
    if (!status) return COLORS.textSecondary;
    
    switch (status.toLowerCase()) {
      case 'completed': return COLORS.success;
      case 'confirmed': return COLORS.primary;
      case 'pending': return COLORS.warning;
      case 'cancelled': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const renderStatsCard = (title: string, value: string, icon: string, color: string, onPress?: () => void) => (
    <TouchableOpacity style={styles.statsCard} onPress={onPress} disabled={!onPress}>
      <LinearGradient
        colors={[COLORS.surface, COLORS.cardBackground]}
        style={styles.statsCardGradient}
      >
        <View style={styles.statsIconContainer}>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
        <View style={styles.statsTextContainer}>
          <Text style={styles.statsValue}>{value}</Text>
          <Text style={styles.statsTitle}>{title}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderUpcomingAppointment = (appointment: any) => (
    <TouchableOpacity
      key={appointment.bookingId}
      style={styles.appointmentCard}
      onPress={() => navigation.navigate('BookingDetails', { bookingId: appointment.bookingId })}
    >
      <LinearGradient
        colors={[COLORS.surface, COLORS.cardBackground]}
        style={styles.appointmentGradient}
      >
        <View style={styles.appointmentHeader}>
          <Image
            source={{ uri: appointment.providerImage || 'https://via.placeholder.com/60' }}
            style={styles.providerAvatar}
          />
          <View style={styles.appointmentInfo}>
            <Text style={styles.serviceName}>{appointment.serviceName}</Text>
            <Text style={styles.providerName}>{appointment.providerName}</Text>
            <Text style={styles.appointmentDate}>{formatDate(appointment.bookingDate)}</Text>
          </View>
          <View style={styles.appointmentStatus}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
              <Text style={styles.statusText}>{appointment.status || 'Pending'}</Text>
            </View>
            <Text style={styles.appointmentPrice}>{formatCurrency(appointment.amount)}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderFavoriteProvider = (provider: any) => (
    <TouchableOpacity
      key={provider.providerId}
      style={styles.providerCard}
      onPress={() => navigation.navigate('ProviderProfile', { providerId: provider.providerId })}
    >
      <LinearGradient
        colors={[COLORS.surface, COLORS.cardBackground]}
        style={styles.providerGradient}
      >
        <Image
          source={{ uri: provider.profileImage || 'https://via.placeholder.com/80' }}
          style={styles.providerImage}
        />
        <Text style={styles.providerName}>{provider.businessName}</Text>
        <Text style={styles.providerSpecialty}>{provider.specialty}</Text>
        <View style={styles.providerStats}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={COLORS.accent} />
            <Text style={styles.rating}>{provider.averageRating}</Text>
          </View>
          <Text style={styles.bookingCount}>{provider.bookingCount} visits</Text>
        </View>
        <Text style={styles.totalSpent}>Spent: {formatCurrency(provider.totalSpent)}</Text>
        {provider.isAvailable && (
          <View style={styles.availableBadge}>
            <Text style={styles.availableText}>Available</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderRecentBooking = (booking: any) => (
    <TouchableOpacity
      key={booking.bookingId}
      style={styles.recentBookingCard}
      onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.bookingId })}
    >
      <LinearGradient
        colors={[COLORS.surface, COLORS.cardBackground]}
        style={styles.recentBookingGradient}
      >
        <View style={styles.bookingHeader}>
          <Image
            source={{ uri: booking.providerImage || 'https://via.placeholder.com/50' }}
            style={styles.bookingProviderImage}
          />
          <View style={styles.bookingInfo}>
            <Text style={styles.bookingService}>{booking.serviceName}</Text>
            <Text style={styles.bookingProvider}>{booking.providerName}</Text>
            <Text style={styles.bookingDate}>{formatDate(booking.bookingDate)}</Text>
          </View>
          <View style={styles.bookingMeta}>
            <Text style={styles.bookingAmount}>{formatCurrency(booking.amount)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
              <Text style={styles.statusText}>{booking.status || 'Completed'}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.bookingActions}>
          {booking.canRate && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.bookingId })}
            >
              <Ionicons name="star-outline" size={16} color={COLORS.accent} />
              <Text style={styles.actionText}>Rate</Text>
            </TouchableOpacity>
          )}
          {booking.canRebook && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Search')}
            >
              <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
              <Text style={styles.actionText}>Rebook</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (!dashboardData) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>Unable to load dashboard</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { personalStats, upcomingAppointments, favoriteProviders, recentBookings, spendingInsights } = dashboardData;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Luxe Header */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.lavenderMist]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>My Beauty Journey</Text>
          <Text style={styles.headerSubtitle}>
            {personalStats.totalBookings} appointments • {formatCurrency(personalStats.totalSpent)} total spent
          </Text>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            {renderStatsCard(
              'This Month',
              `${personalStats.bookingsThisMonth} visits`,
              'calendar-outline',
              COLORS.primary,
              () => navigation.navigate('Bookings')
            )}
            {renderStatsCard(
              'Monthly Spend',
              formatCurrency(personalStats.spentThisMonth),
              'wallet-outline',
              COLORS.success,
              () => navigation.navigate('Bookings')
            )}
            {renderStatsCard(
              'Avg. Visit',
              formatCurrency(personalStats.averageBookingValue),
              'trending-up-outline',
              COLORS.warning,
              () => navigation.navigate('Bookings')
            )}
            {renderStatsCard(
              'Favorite Service',
              personalStats.mostBookedService,
              'heart-outline',
              COLORS.accent,
              () => navigation.navigate('Search')
            )}
          </View>
        </View>

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {upcomingAppointments.slice(0, 3).map(renderUpcomingAppointment)}
          </View>
        )}

        {/* Favorite Providers */}
        {favoriteProviders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Favorite Providers</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                <Text style={styles.seeAllText}>Find More</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.providersScroll}>
              {favoriteProviders.map(renderFavoriteProvider)}
            </ScrollView>
          </View>
        )}

        {/* Spending Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending Insights</Text>
          <TouchableOpacity style={styles.insightsCard} onPress={() => navigation.navigate('Bookings')}>
            <LinearGradient
              colors={[COLORS.surface, COLORS.cardBackground]}
              style={styles.insightsGradient}
            >
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>Monthly Average</Text>
                <Text style={styles.insightValue}>{formatCurrency(spendingInsights.monthlyAverage)}</Text>
              </View>
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>Year to Date</Text>
                <Text style={styles.insightValue}>{formatCurrency(spendingInsights.yearToDateSpending)}</Text>
              </View>
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>Top Category</Text>
                <Text style={styles.insightValue}>{spendingInsights.topSpendingCategory}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
              <Text style={styles.seeAllText}>View History</Text>
            </TouchableOpacity>
          </View>
          {recentBookings.slice(0, 3).map(renderRecentBooking)}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.surface + 'CC',
    opacity: 0.9,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsCard: {
    width: (width - 60) / 2,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statsCardGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsTextContainer: {
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statsTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  appointmentCard: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  appointmentGradient: {
    padding: 16,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  appointmentInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  providerName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  appointmentStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 10,
    color: COLORS.surface,
    fontWeight: '600',
  },
  appointmentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  providersScroll: {
    marginBottom: 16,
  },
  providerCard: {
    width: 120,
    marginRight: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  providerGradient: {
    padding: 16,
    alignItems: 'center',
  },
  providerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  providerSpecialty: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  providerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  bookingCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  totalSpent: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  availableBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableText: {
    fontSize: 10,
    color: COLORS.surface,
    fontWeight: '600',
  },
  insightsCard: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  insightsGradient: {
    padding: 16,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  insightLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  recentBookingCard: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  recentBookingGradient: {
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingProviderImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingService: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  bookingProvider: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bookingDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  bookingMeta: {
    alignItems: 'flex-end',
  },
  bookingAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
    borderRadius: 16,
    backgroundColor: COLORS.cardBackground,
  },
  actionText: {
    fontSize: 12,
    marginLeft: 4,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 80,
  },
});

export default ClientDashboardScreen;
