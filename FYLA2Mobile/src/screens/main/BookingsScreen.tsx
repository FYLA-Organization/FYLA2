import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Booking, BookingStatus, RootStackParamList } from '../../types';
import ApiService from '../../services/api';

type BookingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const BookingsScreen: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past'>('upcoming');
  
  const navigation = useNavigation<BookingsScreenNavigationProp>();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const allBookings = await ApiService.getBookings();
      setBookings(allBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const getFilteredBookings = () => {
    const now = new Date();
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.bookingDate);
      if (selectedTab === 'upcoming') {
        return bookingDate >= now && booking.status !== BookingStatus.Completed && booking.status !== BookingStatus.Cancelled;
      } else {
        return bookingDate < now || booking.status === BookingStatus.Completed || booking.status === BookingStatus.Cancelled;
      }
    });
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.Pending:
        return '#FFE66D';
      case BookingStatus.Confirmed:
        return '#4ECDC4';
      case BookingStatus.InProgress:
        return '#FF6B6B';
      case BookingStatus.Completed:
        return '#A8E6CF';
      case BookingStatus.Cancelled:
        return '#ff6b6b';
      default:
        return '#666';
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

  const formatTime = (timeString: string) => {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderBookingCard = (booking: Booking) => (
    <TouchableOpacity
      key={booking.id}
      style={styles.bookingCard}
      onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })}
    >
      <View style={styles.bookingHeader}>
        <Image
          source={{
            uri: booking.serviceProvider?.profilePictureUrl || 'https://via.placeholder.com/50',
          }}
          style={styles.providerImage}
        />
        <View style={styles.bookingInfo}>
          <Text style={styles.providerName}>
            {booking.serviceProvider?.businessName || 'Provider'}
          </Text>
          <Text style={styles.serviceName}>{booking.service?.name || 'Service'}</Text>
          <View style={styles.dateTimeContainer}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.dateText}>{formatDate(booking.bookingDate)}</Text>
            <Ionicons name="time-outline" size={14} color="#666" style={styles.timeIcon} />
            <Text style={styles.timeText}>{formatTime(booking.startTime)}</Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
            <Text style={styles.statusText}>{booking.status}</Text>
          </View>
          <Text style={styles.priceText}>${booking.totalAmount}</Text>
        </View>
      </View>
      
      {booking.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{booking.notes}</Text>
        </View>
      )}
      
      <View style={styles.bookingActions}>
        {booking.status === BookingStatus.Pending && (
          <>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.primaryAction]}>
              <Text style={[styles.actionButtonText, styles.primaryActionText]}>Reschedule</Text>
            </TouchableOpacity>
          </>
        )}
        {booking.status === BookingStatus.Confirmed && (
          <>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.primaryAction]}>
              <Text style={[styles.actionButtonText, styles.primaryActionText]}>Contact</Text>
            </TouchableOpacity>
          </>
        )}
        {booking.status === BookingStatus.Completed && (
          <TouchableOpacity style={[styles.actionButton, styles.primaryAction]}>
            <Text style={[styles.actionButtonText, styles.primaryActionText]}>Review</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const filteredBookings = getFilteredBookings();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'upcoming' && styles.activeTab]}
          onPress={() => setSelectedTab('upcoming')}
        >
          <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'past' && styles.activeTab]}
          onPress={() => setSelectedTab('past')}
        >
          <Text style={[styles.tabText, selectedTab === 'past' && styles.activeTabText]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <ScrollView
        style={styles.bookingsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading...</Text>
          </View>
        ) : filteredBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              No {selectedTab} bookings
            </Text>
            <Text style={styles.emptySubtext}>
              {selectedTab === 'upcoming'
                ? 'Book your next appointment!'
                : 'Your past bookings will appear here'}
            </Text>
            {selectedTab === 'upcoming' && (
              <TouchableOpacity style={styles.bookNowButton}>
                <Text style={styles.bookNowText}>Book Now</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredBookings.map(renderBookingCard)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FF6B6B',
  },
  bookingsList: {
    flex: 1,
    padding: 20,
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  providerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  timeIcon: {
    marginLeft: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  notesContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  primaryAction: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  primaryActionText: {
    color: 'white',
  },
  loadingContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  bookNowButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  bookNowText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BookingsScreen;
