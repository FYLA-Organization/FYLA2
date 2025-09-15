import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  FlatList,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/index';
import ApiService from '../../services/api';
import { MODERN_COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../../constants/modernDesign';

type BookingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Booking {
  id: string;
  serviceName: string;
  providerName: string;
  providerImage: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  price: number;
  location: string;
  duration: string;
  notes?: string;
}

interface BookingTab {
  id: string;
  title: string;
  status: string;
  count: number;
}

const BookingsScreen: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  const navigation = useNavigation<BookingsScreenNavigationProp>();

  const bookingTabs: BookingTab[] = [
    { id: 'upcoming', title: 'Upcoming', status: 'upcoming', count: 0 },
    { id: 'completed', title: 'Completed', status: 'completed', count: 0 },
    { id: 'cancelled', title: 'Cancelled', status: 'cancelled', count: 0 },
  ];

  // Update tab counts based on bookings
  const updatedTabs = bookingTabs.map(tab => ({
    ...tab,
    count: bookings.filter(booking => booking.status === tab.status).length
  }));

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [activeTab, bookings]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      
      // Mock data for demo
      const mockBookings: Booking[] = [
        {
          id: '1',
          serviceName: 'Balayage & Cut',
          providerName: 'Sarah Johnson',
          providerImage: 'https://images.unsplash.com/photo-1494790108755-2616b156d9b6?w=150',
          date: '2025-09-15',
          time: '10:00 AM',
          status: 'upcoming',
          price: 150,
          location: 'Glamour Studio',
          duration: '2h 30m',
          notes: 'Bring inspiration photos',
        },
        {
          id: '2',
          serviceName: 'Bridal Makeup Trial',
          providerName: 'Maria Rodriguez',
          providerImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
          date: '2025-09-20',
          time: '2:00 PM',
          status: 'upcoming',
          price: 85,
          location: 'Beauty Bliss',
          duration: '1h 30m',
        },
        {
          id: '3',
          serviceName: 'Gel Manicure',
          providerName: 'Jessica Chen',
          providerImage: 'https://images.unsplash.com/photo-1619895862022-09114b41f16f?w=150',
          date: '2025-09-05',
          time: '11:00 AM',
          status: 'completed',
          price: 45,
          location: 'Nail Artistry',
          duration: '1h',
        },
        {
          id: '4',
          serviceName: 'Eyebrow Threading',
          providerName: 'Priya Patel',
          providerImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
          date: '2025-08-28',
          time: '4:00 PM',
          status: 'completed',
          price: 25,
          location: 'Brow Bar',
          duration: '30m',
        },
        {
          id: '5',
          serviceName: 'Facial Treatment',
          providerName: 'Emily Davis',
          providerImage: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=150',
          date: '2025-08-15',
          time: '1:00 PM',
          status: 'cancelled',
          price: 120,
          location: 'Spa Serenity',
          duration: '1h 15m',
          notes: 'Cancelled due to illness',
        },
      ];

      setBookings(mockBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterBookings = () => {
    const filtered = bookings.filter(booking => booking.status === activeTab);
    setFilteredBookings(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return MODERN_COLORS.primary;
      case 'completed':
        return MODERN_COLORS.success;
      case 'cancelled':
        return MODERN_COLORS.error;
      default:
        return MODERN_COLORS.gray500;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'time-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleBookingPress = (booking: Booking) => {
    navigation.navigate('BookingDetails', { bookingId: booking.id });
  };

  const handleReschedule = (bookingId: string) => {
    console.log('Reschedule booking:', bookingId);
    // Navigate to reschedule screen
  };

  const handleCancel = (bookingId: string) => {
    console.log('Cancel booking:', bookingId);
    // Show cancel confirmation
  };

  const handleReview = (bookingId: string) => {
    console.log('Review booking:', bookingId);
    // Navigate to review screen
  };

  const renderBooking = ({ item: booking }: { item: Booking }) => (
    <TouchableOpacity 
      style={styles.bookingCard}
      onPress={() => handleBookingPress(booking)}
    >
      {/* Booking Header */}
      <View style={styles.bookingHeader}>
        <View style={styles.providerInfo}>
          <Image source={{ uri: booking.providerImage }} style={styles.providerImage} />
          <View style={styles.providerDetails}>
            <Text style={styles.serviceName}>{booking.serviceName}</Text>
            <Text style={styles.providerName}>{booking.providerName}</Text>
            <Text style={styles.location}>{booking.location}</Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
            <Ionicons 
              name={getStatusIcon(booking.status) as any} 
              size={16} 
              color={getStatusColor(booking.status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      {/* Booking Details */}
      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color={MODERN_COLORS.gray500} />
            <Text style={styles.detailText}>{formatDate(booking.date)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color={MODERN_COLORS.gray500} />
            <Text style={styles.detailText}>{booking.time}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="hourglass-outline" size={16} color={MODERN_COLORS.gray500} />
            <Text style={styles.detailText}>{booking.duration}</Text>
          </View>
        </View>
        
        <View style={styles.priceRow}>
          <Text style={styles.price}>${booking.price}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {booking.status === 'upcoming' && (
          <>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rescheduleButton]}
              onPress={() => handleReschedule(booking.id)}
            >
              <Text style={styles.rescheduleButtonText}>Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancel(booking.id)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
        {booking.status === 'completed' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.reviewButton]}
            onPress={() => handleReview(booking.id)}
          >
            <Text style={styles.reviewButtonText}>Leave Review</Text>
          </TouchableOpacity>
        )}
      </View>

      {booking.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText}>{booking.notes}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={MODERN_COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="search-outline" size={24} color={MODERN_COLORS.gray700} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {updatedTabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && styles.activeTabButton
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.title}
            </Text>
            {tab.count > 0 && (
              <View style={[
                styles.tabBadge,
                activeTab === tab.id && styles.activeTabBadge
              ]}>
                <Text style={[
                  styles.tabBadgeText,
                  activeTab === tab.id && styles.activeTabBadgeText
                ]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MODERN_COLORS.primary} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={MODERN_COLORS.primary}
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons 
                name="calendar-outline" 
                size={64} 
                color={MODERN_COLORS.gray400} 
              />
              <Text style={styles.emptyTitle}>No {activeTab} bookings</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'upcoming' 
                  ? 'Book your next beauty appointment to see it here'
                  : `You don't have any ${activeTab} bookings yet`
                }
              </Text>
              {activeTab === 'upcoming' && (
                <TouchableOpacity 
                  style={styles.bookNowButton}
                  onPress={() => navigation.navigate('Search')}
                >
                  <Text style={styles.bookNowButtonText}>Book Now</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: MODERN_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.textPrimary,
  },
  headerButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: MODERN_COLORS.gray50,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: MODERN_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: MODERN_COLORS.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.base,
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
    minWidth: 20,
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

  // Booking List
  listContainer: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  bookingCard: {
    backgroundColor: MODERN_COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  providerInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  providerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: SPACING.sm,
  },
  providerDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },
  providerName: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
  },
  location: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textTertiary,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs / 2,
  },
  statusText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },

  // Booking Details
  bookingDetails: {
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  detailText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
  },
  priceRow: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.success,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  rescheduleButton: {
    backgroundColor: MODERN_COLORS.primary,
  },
  rescheduleButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.white,
  },
  cancelButton: {
    backgroundColor: MODERN_COLORS.gray100,
    borderWidth: 1,
    borderColor: MODERN_COLORS.border,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.gray700,
  },
  reviewButton: {
    backgroundColor: MODERN_COLORS.accent,
  },
  reviewButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.white,
  },

  // Notes
  notesContainer: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: MODERN_COLORS.gray50,
    borderRadius: BORDER_RADIUS.sm,
  },
  notesText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
    fontStyle: 'italic',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: SPACING.lg,
  },
  bookNowButton: {
    backgroundColor: MODERN_COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  bookNowButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.white,
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
});

export default BookingsScreen;
