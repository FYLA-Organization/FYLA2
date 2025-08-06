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
import { Booking, BookingStatus, RootStackParamList } from '../../types/index';
import ApiService from '../../services/api';
import ReviewModal from '../../components/ReviewModal';
import { useAuth } from '../../context/AuthContext';

type BookingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// Instagram-style Color Palette - Enhanced for better visibility
const COLORS = {
  background: '#F0F0F0', // Slightly darker from #FAFAFA
  surface: '#FFFFFF',
  text: '#1A1A1A', // Darker from #262626 for better readability
  textSecondary: '#666666', // Darker from #8E8E8E for better contrast
  border: '#C0C0C0', // Darker from #DBDBDB
  borderLight: '#E0E0E0', // Darker from #EFEFEF
  primary: '#2B7CE6', // Deeper blue, darker from #3797F0
  accent: '#E6283A', // Deeper red, darker from #FF3040
  success: '#00B355', // Deeper green, darker from #00D26A
  warning: '#E6A800', // Deeper yellow, darker from #FFB800
  verified: '#2B7CE6', // Matches primary
  instagram: '#C7285F', // Darker from #E1306C for better visibility
  instagramBlue: '#365899', // Deeper blue, darker from #4267B2
  gradient1: '#5A6FD8', // Deeper purple, darker from #667eea
  gradient2: '#674BA8', // Deeper purple, darker from #764ba2
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
  const { user } = useAuth();
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
  const [expandedCards, setExpandedCards] = useState<{ [bookingId: string]: boolean }>({});
  
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

  const toggleCardExpansion = (bookingId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [bookingId]: !prev[bookingId]
    }));
  };

  const toggleAllCards = () => {
    const filteredBookings = getFilteredBookings();
    const allExpanded = filteredBookings.every(booking => expandedCards[booking.id]);
    
    if (allExpanded) {
      // Collapse all cards
      setExpandedCards({});
    } else {
      // Expand all cards
      const newExpanded: { [key: string]: boolean } = {};
      filteredBookings.forEach(booking => {
        newExpanded[booking.id] = true;
      });
      setExpandedCards(newExpanded);
    }
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
        return '#E6A800'; // Deeper amber for better visibility
      case BookingStatus.Confirmed:
        return '#00B4A6'; // Deeper teal for better contrast
      case BookingStatus.InProgress:
        return '#E6283A'; // Using our vibrant red
      case BookingStatus.Completed:
        return '#00B355'; // Using our vibrant green
      case BookingStatus.Cancelled:
        return '#B0B0B0'; // Neutral gray for cancelled items
      default:
        return '#666666';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: new Date().getFullYear() !== date.getFullYear() ? 'numeric' : undefined,
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    try {
      const time = new Date(`2000-01-01T${timeString}`);
      return time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return timeString;
    }
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
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowFilters(false)}
        />
        <View style={styles.filterModalContainer}>
          {/* Modal Handle */}
          <View style={styles.modalHandle} />
          
          {/* Modal Header */}
          <View style={styles.filterModalHeader}>
            <TouchableOpacity 
              onPress={clearAllFilters}
              style={styles.clearAllButton}
            >
              <Text style={styles.clearAllButtonText}>Clear All</Text>
            </TouchableOpacity>
            
            <Text style={styles.filterModalTitle}>Filter Bookings</Text>
            
            <TouchableOpacity 
              onPress={() => setShowFilters(false)}
              style={styles.doneButton}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.filterModalContent} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {/* Active Filters Count */}
            {activeFiltersCount > 0 && (
              <View style={styles.activeFiltersIndicator}>
                <Ionicons name="funnel" size={16} color={COLORS.primary} />
                <Text style={styles.activeFiltersText}>
                  {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
                </Text>
              </View>
            )}

            {/* Status Filter */}
            <View style={styles.filterSection}>
              <View style={styles.filterSectionHeader}>
                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.filterSectionTitle}>Booking Status</Text>
              </View>
              <View style={styles.filterOptionsContainer}>
                {Object.values(BookingStatus).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterChip,
                      filters.status.includes(status) && styles.filterChipActive
                    ]}
                    onPress={() => toggleStatusFilter(status)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      filters.status.includes(status) && styles.filterChipTextActive
                    ]}>
                      {status}
                    </Text>
                    {filters.status.includes(status) && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category Filter */}
            <View style={styles.filterSection}>
              <View style={styles.filterSectionHeader}>
                <Ionicons name="pricetag-outline" size={20} color={COLORS.primary} />
                <Text style={styles.filterSectionTitle}>Service Categories</Text>
              </View>
              <View style={styles.filterOptionsContainer}>
                {getUniqueCategories().map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterChip,
                      filters.categories.includes(category) && styles.filterChipActive
                    ]}
                    onPress={() => toggleCategoryFilter(category)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      filters.categories.includes(category) && styles.filterChipTextActive
                    ]}>
                      {category}
                    </Text>
                    {filters.categories.includes(category) && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Range Filter */}
            <View style={styles.filterSection}>
              <View style={styles.filterSectionHeader}>
                <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
                <Text style={styles.filterSectionTitle}>Price Range</Text>
              </View>
              <View style={styles.priceRangeContainer}>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.priceInputLabel}>Min Price</Text>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
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
                      placeholder="0"
                      placeholderTextColor={COLORS.textSecondary}
                    />
                  </View>
                </View>
                
                <View style={styles.priceRangeSeparator}>
                  <Text style={styles.priceRangeSeparatorText}>to</Text>
                </View>
                
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.priceInputLabel}>Max Price</Text>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
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
                      placeholder="1000"
                      placeholderTextColor={COLORS.textSecondary}
                    />
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderBookingCard = (booking: Booking) => {
    const isExpanded = expandedCards[booking.id] || false;
    
    return (
      <View key={booking.id} style={styles.bookingCard}>
        {/* Status Strip */}
        <View style={[styles.statusStrip, { backgroundColor: getStatusColor(booking.status) }]} />
        
        {/* Card Header - Always Visible */}
        <TouchableOpacity
          onPress={() => toggleCardExpansion(booking.id)}
          style={styles.cardHeader}
          activeOpacity={0.8}
        >
          <View style={styles.providerSection}>
            <View style={styles.providerImageContainer}>
              <Image
                source={{
                  uri: booking.serviceProvider?.profilePictureUrl || 'https://via.placeholder.com/60',
                }}
                style={styles.providerImage}
              />
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(booking.status) }]} />
            </View>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName} numberOfLines={1}>
                {booking.serviceProvider?.businessName || 'Provider'}
              </Text>
              <Text style={styles.serviceName} numberOfLines={1}>
                {booking.service?.name || 'Service'}
              </Text>
              <View style={styles.serviceCategory}>
                <Ionicons name="pricetag-outline" size={12} color="#E6A800" />
                <Text style={styles.categoryText}>
                  {booking.service?.category || 'General Service'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.priceStatusContainer}>
            <Text style={styles.priceText}>${booking.totalAmount?.toFixed(2) || '0.00'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
              <Text style={styles.statusText}>{booking.status}</Text>
            </View>
            <TouchableOpacity style={styles.expandButton}>
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={COLORS.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Quick Info - Always Visible */}
        <View style={styles.quickInfo}>
          <View style={styles.quickInfoItem}>
            <Ionicons name="calendar" size={14} color="#00B4A6" />
            <Text style={styles.quickInfoText}>{formatDate(booking.bookingDate)}</Text>
          </View>
          <View style={styles.quickInfoItem}>
            <Ionicons name="time" size={14} color="#E6283A" />
            <Text style={styles.quickInfoText}>{formatTime(booking.startTime)}</Text>
          </View>
          {!isExpanded && booking.notes && (
            <View style={styles.quickInfoItem}>
              <Ionicons name="chatbubble-outline" size={14} color="#E6A800" />
              <Text style={styles.quickInfoText}>Has Notes</Text>
            </View>
          )}
        </View>

        {/* Expandable Content */}
        {isExpanded && (
          <View style={styles.expandableContent}>
            {/* Detailed Booking Info */}
            <View style={styles.bookingDetails}>
              {booking.endTime && (
                <View style={styles.durationContainer}>
                  <Ionicons name="stopwatch-outline" size={14} color="#E6A800" />
                  <Text style={styles.durationText}>
                    Duration: {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                  </Text>
                </View>
              )}

              {booking.serviceProvider?.businessAddress && (
                <View style={styles.locationContainer}>
                  <Ionicons name="location" size={14} color="#00B355" />
                  <Text style={styles.locationText} numberOfLines={2}>
                    {booking.serviceProvider.businessAddress}
                  </Text>
                </View>
              )}
            </View>

            {/* Additional Info Section */}
            {booking.notes && (
              <View style={styles.additionalInfo}>
                <View style={styles.notesSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="chatbubble-outline" size={14} color="#E6A800" />
                    <Text style={styles.sectionTitle}>Notes</Text>
                  </View>
                  <Text style={styles.notesText} numberOfLines={3}>
                    {booking.notes}
                  </Text>
                </View>
                
                {booking.cancellationReason && booking.status === BookingStatus.Cancelled && (
                  <View style={styles.requestsSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="close-circle-outline" size={14} color="#E6283A" />
                      <Text style={styles.sectionTitle}>Cancellation Reason</Text>
                    </View>
                    <Text style={styles.requestsText} numberOfLines={2}>
                      {booking.cancellationReason}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Progress Indicator for Active Bookings */}
            {(booking.status === BookingStatus.Confirmed || booking.status === BookingStatus.InProgress) && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>Booking Progress</Text>
                  <Text style={styles.progressPercentage}>
                    {booking.status === BookingStatus.Confirmed ? '25%' : '75%'}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: booking.status === BookingStatus.Confirmed ? '25%' : '75%' }
                    ]} 
                  />
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              {booking.status === BookingStatus.Pending && (
                <>
                  <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]}>
                    <Ionicons name="close-circle-outline" size={16} color="#FF6B6B" />
                    <Text style={[styles.actionButtonText, styles.secondaryActionText]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.primaryAction]}>
                    <Ionicons name="calendar-outline" size={16} color="white" />
                    <Text style={[styles.actionButtonText, styles.primaryActionText]}>Reschedule</Text>
                  </TouchableOpacity>
                </>
              )}
              
              {booking.status === BookingStatus.Confirmed && (
                <>
                  <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]}>
                    <Ionicons name="close-circle-outline" size={16} color="#FF6B6B" />
                    <Text style={[styles.actionButtonText, styles.secondaryActionText]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.primaryAction]}>
                    <Ionicons name="chatbubble-outline" size={16} color="white" />
                    <Text style={[styles.actionButtonText, styles.primaryActionText]}>Contact</Text>
                  </TouchableOpacity>
                </>
              )}
              
              {booking.status === BookingStatus.InProgress && user?.isServiceProvider && (
                <TouchableOpacity style={[styles.actionButton, styles.inProgressAction]}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                  <Text style={[styles.actionButtonText, styles.primaryActionText]}>Mark Complete</Text>
                </TouchableOpacity>
              )}
              
              {booking.status === BookingStatus.Completed && (
                <TouchableOpacity 
                  style={[
                    styles.actionButton, 
                    bookingReviews[booking.id] ? styles.reviewedAction : styles.primaryAction
                  ]}
                  onPress={() => handleReviewPress(booking)}
                  disabled={bookingReviews[booking.id]}
                >
                  <Ionicons 
                    name={bookingReviews[booking.id] ? "checkmark-circle" : "star-outline"} 
                    size={16} 
                    color="white" 
                  />
                  <Text style={[styles.actionButtonText, styles.primaryActionText]}>
                    {bookingReviews[booking.id] ? 'Reviewed' : 'Write Review'}
                  </Text>
                </TouchableOpacity>
              )}
              
              {booking.status === BookingStatus.Cancelled && (
                <TouchableOpacity style={[styles.actionButton, styles.rebookAction]}>
                  <Ionicons name="refresh-outline" size={16} color="white" />
                  <Text style={[styles.actionButtonText, styles.primaryActionText]}>Book Again</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* View Details Button */}
            <TouchableOpacity
              onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })}
              style={styles.viewDetailsButton}
            >
              <Text style={styles.viewDetailsText}>View Full Details</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const filteredBookings = getFilteredBookings();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.toggleAllButton}
            onPress={toggleAllCards}
          >
            <Ionicons 
              name={getFilteredBookings().every(booking => expandedCards[booking.id]) ? "contract-outline" : "expand-outline"} 
              size={20} 
              color={COLORS.text} 
            />
          </TouchableOpacity>
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
  toggleAllButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  filterModalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.background,
  },
  clearAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  filterModalContent: {
    flex: 1,
  },
  filterScrollContent: {
    paddingBottom: 20,
  },
  activeFiltersIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  activeFiltersText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 6,
  },
  filterSection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 8,
    letterSpacing: -0.2,
  },
  filterOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  filterChipTextActive: {
    color: 'white',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  priceInputWrapper: {
    flex: 1,
  },
  priceInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  priceRangeSeparator: {
    paddingBottom: 12,
    alignItems: 'center',
  },
  priceRangeSeparatorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
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
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bookingCardContent: {
    position: 'relative',
  },
  
  // Status Strip
  statusStrip: {
    height: 4,
    width: '100%',
  },
  
  // Card Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
  },
  providerSection: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  providerImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  providerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  providerInfo: {
    flex: 1,
    paddingTop: 2,
  },
  providerName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  serviceName: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  serviceCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 168, 0, 0.1)', // Updated to our amber
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(230, 168, 0, 0.3)',
  },
  categoryText: {
    fontSize: 12,
    color: '#E6A800', // Updated to our amber
    fontWeight: '700',
    marginLeft: 4,
  },
  priceStatusContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 60,
  },
  priceText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#E6A800', // Updated to our vibrant amber
    letterSpacing: -0.5,
    textShadowColor: 'rgba(230, 168, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
    textTransform: 'uppercase',
  },
  
  // Quick Info Section
  quickInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  quickInfoText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Expandable Content
  expandableContent: {
    overflow: 'hidden',
  },
  
  // View Details Button
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  viewDetailsText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  // Booking Details
  bookingDetails: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '700',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 168, 0, 0.1)', // Updated to our amber
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(230, 168, 0, 0.2)',
  },
  durationText: {
    fontSize: 13,
    color: '#E6A800', // Updated to our amber
    fontWeight: '600',
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 179, 85, 0.1)', // Updated to our green
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 179, 85, 0.2)',
  },
  locationText: {
    fontSize: 13,
    color: '#00B355', // Updated to our green
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  
  // Additional Info
  additionalInfo: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 8,
    paddingTop: 16,
  },
  notesSection: {
    marginBottom: 12,
  },
  requestsSection: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  requestsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
    backgroundColor: 'rgba(230, 40, 58, 0.1)', // Updated to our red
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(230, 40, 58, 0.2)',
  },
  
  // Progress Section
  progressSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 8,
    paddingTop: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00B4A6', // Updated to our vibrant teal
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00B4A6', // Updated to our vibrant teal
    borderRadius: 3,
  },
  
  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryAction: {
    backgroundColor: '#00B4A6', // Updated to our vibrant teal
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 166, 0.3)',
  },
  secondaryAction: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inProgressAction: {
    backgroundColor: '#E6283A', // Updated to our vibrant red
    borderWidth: 1,
    borderColor: 'rgba(230, 40, 58, 0.3)',
  },
  reviewedAction: {
    backgroundColor: '#00B355', // Updated to our vibrant green
    borderWidth: 1,
    borderColor: 'rgba(0, 179, 85, 0.3)',
  },
  rebookAction: {
    backgroundColor: '#E6A800', // Updated to our vibrant amber
    borderWidth: 1,
    borderColor: 'rgba(230, 168, 0, 0.3)',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  primaryActionText: {
    color: 'white',
  },
  secondaryActionText: {
    color: COLORS.textSecondary,
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
    color: COLORS.text,
    marginTop: 20,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptySubtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  bookNowButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
    marginTop: 32,
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
