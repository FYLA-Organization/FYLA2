import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  Modal,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Booking, BookingStatus, RootStackParamList } from '../../types';
import ApiService from '../../services/api';
import ReviewModal from '../../components/ReviewModal';

type BookingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// Instagram-style Color Palette
const COLORS = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#262626',
  textSecondary: '#8E8E8E',
  border: '#DBDBDB',
  borderLight: '#EFEFEF',
  primary: '#3797F0',
  accent: '#FF3040',
  success: '#00D26A',
  warning: '#FFB800',
  verified: '#3797F0',
  instagram: '#E1306C',
  instagramBlue: '#4267B2',
  gradient1: '#667eea',
  gradient2: '#764ba2',
};

interface FilterOptions {
  status: BookingStatus[];
  categories: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  priceRange: {
    min: number;
    max: number;
  };
  searchTerm: string;
}

const BookingsScreen: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    categories: [],
    dateRange: { start: null, end: null },
    priceRange: { min: 0, max: 1000 },
    searchTerm: '',
  });
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);
  const [bookingReviews, setBookingReviews] = useState<{[key: string]: boolean}>({});
  
  const navigation = useNavigation<BookingsScreenNavigationProp>();

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    updateActiveFiltersCount();
  }, [filters]);

  useEffect(() => {
    setFilters(prev => ({ ...prev, searchTerm }));
  }, [searchTerm]);

  // Load existing reviews for completed bookings
  useEffect(() => {
    checkExistingReviews();
  }, [bookings]);

  const checkExistingReviews = async () => {
    const completedBookings = bookings.filter(b => b.status === BookingStatus.Completed);
    const reviewChecks: {[key: string]: boolean} = {};
    
    for (const booking of completedBookings) {
      try {
        const existingReview = await ApiService.getBookingReview(booking.id);
        reviewChecks[booking.id] = !!existingReview;
      } catch (error) {
        console.error('Error checking review for booking:', booking.id, error);
        reviewChecks[booking.id] = false;
      }
    }
    
    setBookingReviews(reviewChecks);
  };

  const handleReviewPress = (booking: Booking) => {
    setSelectedBookingForReview(booking);
    setReviewModalVisible(true);
  };

  const handleReviewSubmitted = () => {
    if (selectedBookingForReview) {
      setBookingReviews(prev => ({
        ...prev,
        [selectedBookingForReview.id]: true
      }));
    }
    setReviewModalVisible(false);
    setSelectedBookingForReview(null);
  };

  const updateActiveFiltersCount = () => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.categories.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.priceRange.min > 0 || filters.priceRange.max < 1000) count++;
    if (filters.searchTerm.trim().length > 0) count++;
    setActiveFiltersCount(count);
  };

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
      
      // Time-based filtering (upcoming/past)
      let passesTimeFilter = false;
      if (selectedTab === 'upcoming') {
        passesTimeFilter = bookingDate >= now && booking.status !== BookingStatus.Completed && booking.status !== BookingStatus.Cancelled;
      } else {
        passesTimeFilter = bookingDate < now || booking.status === BookingStatus.Completed || booking.status === BookingStatus.Cancelled;
      }
      
      if (!passesTimeFilter) return false;

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(booking.status)) {
        return false;
      }

      // Category filter
      if (filters.categories.length > 0 && booking.service?.category) {
        if (!filters.categories.includes(booking.service.category)) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        if (filters.dateRange.start && bookingDate < filters.dateRange.start) {
          return false;
        }
        if (filters.dateRange.end && bookingDate > filters.dateRange.end) {
          return false;
        }
      }

      // Price range filter
      if (booking.totalAmount < filters.priceRange.min || booking.totalAmount > filters.priceRange.max) {
        return false;
      }

      // Search term filter
      if (filters.searchTerm.trim().length > 0) {
        const searchLower = filters.searchTerm.toLowerCase();
        const providerName = (booking.serviceProvider?.businessName || '').toLowerCase();
        const serviceName = (booking.service?.name || '').toLowerCase();
        
        if (!providerName.includes(searchLower) && !serviceName.includes(searchLower)) {
          return false;
        }
      }

      return true;
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

  const getUniqueCategories = () => {
    const categories = new Set<string>();
    bookings.forEach(booking => {
      if (booking.service?.category) {
        categories.add(booking.service.category);
      }
    });
    return Array.from(categories).sort();
  };

  const toggleStatusFilter = (status: BookingStatus) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }));
  };

  const toggleCategoryFilter = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      status: [],
      categories: [],
      dateRange: { start: null, end: null },
      priceRange: { min: 0, max: 1000 },
      searchTerm: '',
    });
    setSearchTerm('');
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} style={styles.modalBlur}>
          <View style={styles.modalContainer}>
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter Bookings</Text>
                <TouchableOpacity 
                  onPress={() => setShowFilters(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
                {/* Status Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Status</Text>
                  <View style={styles.filterOptionsContainer}>
                    {Object.values(BookingStatus).map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.filterOption,
                          filters.status.includes(status) && styles.filterOptionActive
                        ]}
                        onPress={() => toggleStatusFilter(status)}
                      >
                        <Text style={[
                          styles.filterOptionText,
                          filters.status.includes(status) && styles.filterOptionTextActive
                        ]}>
                          {status}
                        </Text>
                        {filters.status.includes(status) && (
                          <Ionicons name="checkmark" size={16} color="white" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Category Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Service Categories</Text>
                  <View style={styles.filterOptionsContainer}>
                    {getUniqueCategories().map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.filterOption,
                          filters.categories.includes(category) && styles.filterOptionActive
                        ]}
                        onPress={() => toggleCategoryFilter(category)}
                      >
                        <Text style={[
                          styles.filterOptionText,
                          filters.categories.includes(category) && styles.filterOptionTextActive
                        ]}>
                          {category}
                        </Text>
                        {filters.categories.includes(category) && (
                          <Ionicons name="checkmark" size={16} color="white" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Price Range Filter */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Price Range</Text>
                  <View style={styles.priceRangeContainer}>
                    <View style={styles.priceInputContainer}>
                      <Text style={styles.priceLabel}>Min: $</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={filters.priceRange.min.toString()}
                        onChangeText={(text) => {
                          const value = parseInt(text) || 0;
                          setFilters(prev => ({
                            ...prev,
                            priceRange: { ...prev.priceRange, min: value }
                          }));
                        }}
                        keyboardType="numeric"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      />
                    </View>
                    <View style={styles.priceInputContainer}>
                      <Text style={styles.priceLabel}>Max: $</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={filters.priceRange.max.toString()}
                        onChangeText={(text) => {
                          const value = parseInt(text) || 1000;
                          setFilters(prev => ({
                            ...prev,
                            priceRange: { ...prev.priceRange, max: value }
                          }));
                        }}
                        keyboardType="numeric"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      />
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={clearAllFilters}
                >
                  <Text style={styles.clearFiltersText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyFiltersButton}
                  onPress={() => setShowFilters(false)}
                >
                  <Text style={styles.applyFiltersText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </BlurView>
      </View>
    </Modal>
  );

  const renderBookingCard = (booking: Booking) => (
    <BlurView
      key={booking.id}
      intensity={80}
      style={styles.bookingCard}
    >
      <TouchableOpacity
        onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })}
        style={styles.bookingCardContent}
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
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryAction, bookingReviews[booking.id] && styles.reviewedButton]}
            onPress={() => handleReviewPress(booking)}
            disabled={bookingReviews[booking.id]}
          >
            <Text style={[styles.actionButtonText, styles.primaryActionText, bookingReviews[booking.id] && styles.reviewedButtonText]}>
              {bookingReviews[booking.id] ? 'Reviewed' : 'Review'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
    </BlurView>
  );

  const filteredBookings = getFilteredBookings();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="filter" size={24} color={COLORS.text} />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by provider or service..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
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

      {/* Filter Modal */}
      {renderFilterModal()}

      {/* Review Modal */}
      {selectedBookingForReview && (
        <ReviewModal
          visible={reviewModalVisible}
          onClose={() => setReviewModalVisible(false)}
          booking={selectedBookingForReview}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Base Layout
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingBottom: 100,
  },
  
  // Header Section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.instagram,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.surface,
  },
  
  // Search Section
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '400',
  },
  
  // Filter Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBlur: {
    flex: 1,
  },
  modalContainer: {
    height: '80%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    marginTop: 60, // Added margin to avoid dynamic island
  },
  modalContent: {
    flex: 1,
    paddingTop: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.3,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  filterSection: {
    marginBottom: 32,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  filterOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    gap: 8,
  },
  filterOptionActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderColor: '#FFD700',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  filterOptionTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  priceInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    gap: 16,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    borderWidth: 1,
    borderColor: '#FFD700',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  applyFiltersText: {
    fontSize: 16,
    fontWeight: '800',
    color: 'white',
  },
  
  // Tab Section
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginHorizontal: 8,
    borderRadius: 8,
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
    backgroundColor: COLORS.background,
  },
  tabText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  
  // Bookings List
  bookingsList: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },
  bookingCard: {
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bookingCardContent: {
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  providerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  bookingInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  dateText: {
    fontSize: 13,
    color: 'white',
    marginLeft: 6,
    fontWeight: '600',
  },
  timeIcon: {
    marginLeft: 16,
    opacity: 0.9,
  },
  timeText: {
    fontSize: 13,
    color: 'white',
    marginLeft: 6,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 0.2,
  },
  
  // Notes Section
  notesContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: 'white',
    marginBottom: 6,
    letterSpacing: 0.3,
    opacity: 0.9,
  },
  notesText: {
    fontSize: 15,
    color: 'white',
    lineHeight: 22,
    fontWeight: '500',
    opacity: 0.9,
  },
  
  // Action Buttons
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryAction: {
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    borderColor: '#FFD700',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.3,
    opacity: 0.9,
  },
  primaryActionText: {
    color: 'white',
    opacity: 1,
  },
  reviewedButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderColor: '#4CAF50',
  },
  reviewedButtonText: {
    color: 'white',
    opacity: 0.9,
  },
  
  // Loading & Empty States
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginTop: 20,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptySubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  bookNowButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
    marginTop: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  bookNowText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

export default BookingsScreen;
