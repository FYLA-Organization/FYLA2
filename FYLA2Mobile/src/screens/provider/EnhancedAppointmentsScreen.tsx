import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/colors';
import { RootStackParamList } from '../../types';
import ApiService from '../../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface ProviderAppointment {
  id: number;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceName: string;
  servicePrice: number;
  durationMinutes: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: 'Pending' | 'Confirmed' | 'InProgress' | 'Completed' | 'Cancelled' | 'Blocked';
  totalPrice: number;
  notes?: string;
  createdAt: string;
  completedAt?: string;
  paymentStatus: string;
  tipAmount?: number;
  hasReview: boolean;
  rating?: number;
  reviewText?: string;
  serviceCategory: string;
  clientTotalBookings: number;
  clientLifetimeValue: number;
  isFirstTimeClient: boolean;
  clientMembershipTier: string;
  clientLoyaltyPoints: number;
}

interface AppointmentStats {
  totalAppointments: number;
  totalRevenue: number;
  completedAppointments: number;
  averageRating: number;
  topServices: Array<{ serviceName: string; count: number; revenue: number }>;
}

interface PaymentHistory {
  id: string;
  amount: number;
  date: string;
  method: string;
  status: string;
}

interface AppointmentSearchResult {
  appointments: ProviderAppointment[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  stats: AppointmentStats;
}

interface AppointmentStats {
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
  averageAppointmentValue: number;
  uniqueClients: number;
  firstTimeClients: number;
  averageRating: number;
  serviceBreakdown: Record<string, number>;
  revenueBreakdown: Record<string, number>;
}

interface AppointmentSearchResult {
  appointments: ProviderAppointment[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  stats: AppointmentStats;
}

interface PaymentHistory {
  bookingId: number;
  clientName: string;
  serviceName: string;
  amount: number;
  tipAmount?: number;
  totalAmount: number;
  paymentDate: string;
  paymentMethod: string;
  paymentStatus: string;
  transactionId?: string;
  appointmentDate: string;
  canGenerateInvoice: boolean;
}

const EnhancedAppointmentsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  
  // State Management
  const [appointments, setAppointments] = useState<ProviderAppointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'startTime' | 'clientName' | 'amount' | 'status'>('startTime');
  const [sortDescending, setSortDescending] = useState(false);

  // Filter states
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [filterServiceCategory, setFilterServiceCategory] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [filterFirstTimeOnly, setFilterFirstTimeOnly] = useState(false);

  const statusColors = {
    'Pending': '#F5C451',
    'Confirmed': '#5A4FCF',
    'InProgress': '#AFAAFF',
    'Completed': '#6B6B6B',
    'Cancelled': '#E74C3C',
    'Blocked': '#95A5A6'
  };

  const membershipColors = {
    'Bronze': '#CD7F32',
    'Silver': '#C0C0C0',
    'Gold': '#FFD700',
    'Platinum': '#E5E4E2'
  };

  // Load appointments with filters
  const loadAppointments = useCallback(async (page = 1, resetData = false) => {
    try {
      const filters = {
        page,
        pageSize: 20,
        sortBy,
        sortDescending,
        ...(filterStartDate && { startDate: filterStartDate.toISOString().split('T')[0] }),
        ...(filterEndDate && { endDate: filterEndDate.toISOString().split('T')[0] }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(filterServiceCategory && { serviceCategory: filterServiceCategory }),
        ...(searchQuery && { clientName: searchQuery }),
        ...(filterMinAmount && { minAmount: parseFloat(filterMinAmount) }),
        ...(filterMaxAmount && { maxAmount: parseFloat(filterMaxAmount) }),
        ...(filterFirstTimeOnly && { isFirstTimeClient: true })
      };

      // Apply date filters based on selected filter
      const now = new Date();
      switch (selectedFilter) {
        case 'today':
          filters.startDate = now.toISOString().split('T')[0];
          filters.endDate = now.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
          const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
          filters.startDate = weekStart.toISOString().split('T')[0];
          filters.endDate = weekEnd.toISOString().split('T')[0];
          break;
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          filters.startDate = monthStart.toISOString().split('T')[0];
          filters.endDate = monthEnd.toISOString().split('T')[0];
          break;
      }

      const queryString = new URLSearchParams(filters as any).toString();
      const result = await ApiService.getProviderAppointments(filters);
        
      if (result.success && result.data) {
        if (resetData || page === 1) {
          setAppointments(result.data.appointments || []);
        } else {
          setAppointments(prev => [...prev, ...(result.data.appointments || [])]);
        }
        
        setStats(result.data.stats || null);
        setTotalPages(result.data.totalPages || 1);
        setCurrentPage(result.data.currentPage || 1);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFilter, selectedStatus, searchQuery, sortBy, sortDescending, filterStartDate, filterEndDate, filterServiceCategory, filterMinAmount, filterMaxAmount, filterFirstTimeOnly]);

  // Load payment history
  const loadPaymentHistory = useCallback(async () => {
    try {
      const result = await ApiService.getPaymentHistory();
      if (result.success && result.data) {
        setPaymentHistory(result.data);
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
    }
  }, []);

  const updateAppointmentStatus = async (appointmentId: number, status: string, notes?: string, tipAmount?: number) => {
    try {
      const result = await ApiService.updateAppointmentStatus(appointmentId, status);
      if (result.success) {
        loadAppointments(1, true);
        Alert.alert('Success', 'Appointment status updated successfully');
      } else {
        Alert.alert('Error', result.message || 'Failed to update appointment status');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Error', 'Failed to update appointment status');
    }
  };

  const generateInvoice = async (bookingId: number) => {
    try {
      const result = await ApiService.generateInvoice(bookingId);
      if (result.success) {
        Alert.alert('Invoice Generated', 'Invoice has been generated successfully!');
      } else {
        Alert.alert('Error', result.message || 'Failed to generate invoice');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      Alert.alert('Error', 'Failed to generate invoice');
    }
  };

  const getAuthToken = async (): Promise<string> => {
    const token = await AsyncStorage.getItem('authToken');
    return token || '';
  };

  useFocusEffect(
    useCallback(() => {
      loadAppointments(1, true);
    }, [loadAppointments])
  );

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    loadAppointments(1, true);
  };

  const loadMoreAppointments = () => {
    if (currentPage < totalPages && !loading) {
      loadAppointments(currentPage + 1, false);
    }
  };

  const showStatusModal = (appointment: ProviderAppointment) => {
    const statusOptions = ['Pending', 'Confirmed', 'InProgress', 'Completed', 'Cancelled'];
    
    Alert.alert(
      'Update Status',
      `Current status: ${appointment.status}`,
      statusOptions.map(status => ({
        text: status,
        onPress: () => {
          if (status === 'Completed') {
            // Ask for tip amount
            Alert.prompt(
              'Add Tip',
              'Enter tip amount (optional):',
              [
                { text: 'Skip', onPress: () => updateAppointmentStatus(appointment.id, status) },
                { 
                  text: 'Add Tip',
                  onPress: (tipText) => {
                    const tipAmount = tipText ? parseFloat(tipText) : undefined;
                    updateAppointmentStatus(appointment.id, status, undefined, tipAmount);
                  }
                }
              ],
              'plain-text'
            );
          } else {
            updateAppointmentStatus(appointment.id, status);
          }
        }
      }))
    );
  };

  const renderAppointmentCard = ({ item }: { item: ProviderAppointment }) => (
    <TouchableOpacity
      style={styles.appointmentCard}
      onPress={() => showStatusModal(item)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
        style={styles.cardGradient}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{item.clientName}</Text>
            <View style={styles.membershipBadge}>
              <View style={[styles.membershipDot, { backgroundColor: membershipColors[item.clientMembershipTier as keyof typeof membershipColors] }]} />
              <Text style={styles.membershipText}>{item.clientMembershipTier}</Text>
              <Text style={styles.loyaltyPoints}>• {item.clientLoyaltyPoints} pts</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        {/* Service & Time */}
        <View style={styles.serviceSection}>
          <Text style={styles.serviceName}>{item.serviceName}</Text>
          <Text style={styles.serviceCategory}>{item.serviceCategory}</Text>
          <View style={styles.timeInfo}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.timeText}>
              {new Date(item.bookingDate).toLocaleDateString()} at {new Date(item.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Text>
          </View>
        </View>

        {/* Client Stats */}
        <View style={styles.clientStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{item.clientTotalBookings}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>${item.clientLifetimeValue.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Lifetime</Text>
          </View>
          {item.isFirstTimeClient && (
            <View style={styles.firstTimeBadge}>
              <Text style={styles.firstTimeText}>First Time</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.priceSection}>
            <Text style={styles.price}>${item.totalPrice.toFixed(2)}</Text>
            {item.tipAmount && item.tipAmount > 0 && (
              <Text style={styles.tipAmount}>+${item.tipAmount.toFixed(2)} tip</Text>
            )}
          </View>
          <View style={styles.paymentStatus}>
            <View style={[styles.paymentDot, { backgroundColor: item.paymentStatus === 'Paid' ? '#4CAF50' : '#F5C451' }]} />
            <Text style={styles.paymentText}>{item.paymentStatus}</Text>
          </View>
        </View>

        {/* Rating */}
        {item.hasReview && item.rating && (
          <View style={styles.reviewSection}>
            <View style={styles.rating}>
              {[1, 2, 3, 4, 5].map(star => (
                <Ionicons
                  key={star}
                  name="star"
                  size={14}
                  color={star <= item.rating! ? '#FFD700' : '#E0E0E0'}
                />
              ))}
            </View>
            {item.reviewText && (
              <Text style={styles.reviewText} numberOfLines={2}>{item.reviewText}</Text>
            )}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderStatsCard = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.statsGradient}
        >
          <Text style={styles.statsTitle}>Appointments Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalAppointments}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.completedAppointments}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.pendingAppointments}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>${stats.totalRevenue.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <BlurView intensity={100} style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Appointments</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent}>
            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['all', 'Pending', 'Confirmed', 'InProgress', 'Completed', 'Cancelled'].map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.filterChip, selectedStatus === status && styles.filterChipActive]}
                    onPress={() => setSelectedStatus(status)}
                  >
                    <Text style={[styles.filterChipText, selectedStatus === status && styles.filterChipTextActive]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Service Category Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Service Category</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Enter service category"
                value={filterServiceCategory}
                onChangeText={setFilterServiceCategory}
              />
            </View>

            {/* Amount Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Amount Range</Text>
              <View style={styles.rangeInputs}>
                <TextInput
                  style={[styles.filterInput, { flex: 1 }]}
                  placeholder="Min amount"
                  value={filterMinAmount}
                  onChangeText={setFilterMinAmount}
                  keyboardType="numeric"
                />
                <Text style={styles.rangeConnector}>to</Text>
                <TextInput
                  style={[styles.filterInput, { flex: 1 }]}
                  placeholder="Max amount"
                  value={filterMaxAmount}
                  onChangeText={setFilterMaxAmount}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[
                  { key: 'startTime', label: 'Date/Time' },
                  { key: 'clientName', label: 'Client Name' },
                  { key: 'amount', label: 'Amount' },
                  { key: 'status', label: 'Status' }
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.filterChip, sortBy === option.key && styles.filterChipActive]}
                    onPress={() => setSortBy(option.key as any)}
                  >
                    <Text style={[styles.filterChipText, sortBy === option.key && styles.filterChipTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Apply Filters Button */}
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => {
                setShowFilters(false);
                setCurrentPage(1);
                loadAppointments(1, true);
              }}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.buttonGradient}
              >
                <Text style={styles.applyFiltersText}>Apply Filters</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );

  if (loading && appointments.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading appointments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Appointments</Text>
          <TouchableOpacity onPress={() => setShowPaymentHistory(true)}>
            <Ionicons name="card-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by client name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => loadAppointments(1, true)}
            />
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
            <Ionicons name="options-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Quick Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFilters}>
          {[
            { key: 'all', label: 'All' },
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' }
          ].map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.quickFilterChip, selectedFilter === filter.key && styles.quickFilterChipActive]}
              onPress={() => setSelectedFilter(filter.key as any)}
            >
              <Text style={[styles.quickFilterText, selectedFilter === filter.key && styles.quickFilterTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Stats Card */}
      {renderStatsCard()}

      {/* Appointments List */}
      <FlatList
        data={appointments}
        renderItem={renderAppointmentCard}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMoreAppointments}
        onEndReachedThreshold={0.1}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No appointments found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters or check back later</Text>
          </View>
        }
      />

      {/* Filter Modal */}
      {renderFilterModal()}
    </View>
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
    backgroundColor: COLORS.background,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  header: {
    paddingTop: 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: 'white',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    ...TYPOGRAPHY.body,
  },
  filterButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
  },
  quickFilters: {
    marginBottom: SPACING.sm,
  },
  quickFilterChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
  },
  quickFilterChipActive: {
    backgroundColor: 'white',
  },
  quickFilterText: {
    ...TYPOGRAPHY.caption,
    color: 'white',
    fontWeight: '600',
  },
  quickFilterTextActive: {
    color: COLORS.primary,
  },
  statsContainer: {
    margin: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsGradient: {
    padding: SPACING.md,
  },
  statsTitle: {
    ...TYPOGRAPHY.h3,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.h2,
    color: 'white',
    fontWeight: 'bold',
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  listContainer: {
    padding: SPACING.md,
  },
  appointmentCard: {
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membershipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  membershipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  loyaltyPoints: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    color: 'white',
    fontWeight: 'bold',
  },
  serviceSection: {
    marginBottom: SPACING.md,
  },
  serviceName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  serviceCategory: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  clientStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  statNumber: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  firstTimeBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  firstTimeText: {
    ...TYPOGRAPHY.caption,
    color: 'white',
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  tipAmount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    marginLeft: SPACING.sm,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  paymentText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  reviewSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  rating: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  reviewText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  filterContent: {
    padding: SPACING.md,
  },
  filterSection: {
    marginBottom: SPACING.lg,
  },
  filterLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  filterChip: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: 'white',
  },
  filterInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...TYPOGRAPHY.body,
  },
  rangeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangeConnector: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.sm,
  },
  applyFiltersButton: {
    marginTop: SPACING.lg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  applyFiltersText: {
    ...TYPOGRAPHY.body,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default EnhancedAppointmentsScreen;
