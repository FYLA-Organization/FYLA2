import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ScrollView,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Booking } from '../../types';
import { COLORS, COMMON_STYLES } from '../../constants/colors';
import ApiService from '../../services/api';

const { width } = Dimensions.get('window');

const AppointmentsScreen = () => {
  const [appointments, setAppointments] = useState<Booking[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'All',
    dateRange: 'All',
    client: '',
    service: '',
    minAmount: '',
    maxAmount: '',
  });

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [appointments, filters]);

  const loadAppointments = async () => {
    try {
      console.log('Loading appointments...');
      const bookings = await ApiService.getBookings();
      console.log('Appointments loaded:', bookings);
      console.log('First booking ID type:', typeof bookings[0]?.id, 'Value:', bookings[0]?.id);
      setAppointments(bookings);
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...appointments];

    // Filter by status
    if (filters.status !== 'All') {
      filtered = filtered.filter(apt => apt.status === filters.status);
    }

    // Filter by date range
    if (filters.dateRange !== 'All') {
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
      
      switch (filters.dateRange) {
        case 'Today':
          const todayStr = new Date().toDateString();
          filtered = filtered.filter(apt => 
            new Date(apt.bookingDate).toDateString() === todayStr
          );
          break;
        case 'This Week':
          filtered = filtered.filter(apt => {
            const aptDate = new Date(apt.bookingDate);
            return aptDate >= startOfWeek && aptDate <= endOfWeek;
          });
          break;
        case 'Past':
          filtered = filtered.filter(apt => 
            new Date(apt.bookingDate) < new Date()
          );
          break;
        case 'Upcoming':
          filtered = filtered.filter(apt => 
            new Date(apt.bookingDate) >= new Date()
          );
          break;
      }
    }

    // Filter by client name
    if (filters.client.trim()) {
      const clientQuery = filters.client.toLowerCase();
      filtered = filtered.filter(apt => 
        (apt.client?.firstName?.toLowerCase().includes(clientQuery) || false) ||
        (apt.client?.lastName?.toLowerCase().includes(clientQuery) || false)
      );
    }

    // Filter by service name
    if (filters.service.trim()) {
      const serviceQuery = filters.service.toLowerCase();
      filtered = filtered.filter(apt => 
        apt.service?.name?.toLowerCase().includes(serviceQuery) || false
      );
    }

    // Filter by amount range
    if (filters.minAmount || filters.maxAmount) {
      const minAmt = parseFloat(filters.minAmount) || 0;
      const maxAmt = parseFloat(filters.maxAmount) || Infinity;
      filtered = filtered.filter(apt => 
        apt.totalAmount >= minAmt && apt.totalAmount <= maxAmt
      );
    }

    setFilteredAppointments(filtered);
  };

  const clearFilters = () => {
    setFilters({
      status: 'All',
      dateRange: 'All',
      client: '',
      service: '',
      minAmount: '',
      maxAmount: '',
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status !== 'All') count++;
    if (filters.dateRange !== 'All') count++;
    if (filters.client.trim()) count++;
    if (filters.service.trim()) count++;
    if (filters.minAmount || filters.maxAmount) count++;
    return count;
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      console.log('Attempting to update booking:', { appointmentId, newStatus });
      await ApiService.updateBookingStatus(appointmentId, newStatus);
      await loadAppointments(); // Reload to get updated data
      Alert.alert('Success', `Appointment ${newStatus.toLowerCase()} successfully`);
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      console.error('Error details:', error.response?.data);
      Alert.alert('Error', `Failed to update booking status: ${error.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#FFD93D'; // Yellow for pending
      case 'Confirmed': return '#4ECDC4'; // Teal for confirmed
      case 'InProgress': return '#45B7D1'; // Blue for in progress
      case 'Completed': return '#96CEB4'; // Mint for completed
      case 'Cancelled': return '#FF6B6B'; // Red for cancelled
      default: return '#666';
    }
  };

  const renderStatusActions = (item: Booking) => {
    if (item.status === 'Pending') {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.success }]}
            onPress={() => handleStatusChange(item.id, 'Confirmed')}
          >
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (item.status === 'Confirmed') {
      return (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
          onPress={() => handleStatusChange(item.id, 'InProgress')}
        >
          <Ionicons name="play" size={14} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Start</Text>
        </TouchableOpacity>
      );
    } else if (item.status === 'InProgress') {
      return (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.verified }]}
          onPress={() => handleStatusChange(item.id, 'Completed')}
        >
          <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Complete</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderAppointment = ({ item }: { item: Booking }) => (
    <TouchableOpacity style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentInfo}>
          <Text style={styles.clientName}>
            {item.client?.firstName} {item.client?.lastName || 'Unknown Client'}
          </Text>
          <Text style={styles.serviceName}>
            {item.service?.name || 'Unknown Service'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.appointmentDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.textLight} />
          <Text style={styles.detailText}>
            {new Date(item.bookingDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={COLORS.textLight} />
          <Text style={styles.detailText}>
            {new Date(item.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="card-outline" size={16} color={COLORS.textLight} />
          <Text style={styles.detailText}>${item.totalAmount}</Text>
        </View>
      </View>

      {/* Action buttons for status changes */}
      {renderStatusActions(item)}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Appointments ({filteredAppointments.length})</Text>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={20} color={COLORS.primary} />
            {getActiveFilterCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Filter Panel */}
        {showFilters && (
          <View style={styles.filterPanel}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Status</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                  {['All', 'Pending', 'Confirmed', 'InProgress', 'Completed', 'Cancelled'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.filterChip,
                        filters.status === status && styles.filterChipActive
                      ]}
                      onPress={() => setFilters({...filters, status})}
                    >
                      <Text style={[
                        styles.filterChipText,
                        filters.status === status && styles.filterChipTextActive
                      ]}>{status}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Date Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Date</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                  {['All', 'Today', 'This Week', 'Upcoming', 'Past'].map((dateRange) => (
                    <TouchableOpacity
                      key={dateRange}
                      style={[
                        styles.filterChip,
                        filters.dateRange === dateRange && styles.filterChipActive
                      ]}
                      onPress={() => setFilters({...filters, dateRange})}
                    >
                      <Text style={[
                        styles.filterChipText,
                        filters.dateRange === dateRange && styles.filterChipTextActive
                      ]}>{dateRange}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Search Filters */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Search</Text>
                <View style={styles.searchRow}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Client name..."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={filters.client}
                    onChangeText={(text) => setFilters({...filters, client: text})}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Service name..."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={filters.service}
                    onChangeText={(text) => setFilters({...filters, service: text})}
                  />
                </View>
              </View>

              {/* Amount Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Amount Range</Text>
                <View style={styles.amountRow}>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="Min $"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={filters.minAmount}
                    onChangeText={(text) => setFilters({...filters, minAmount: text})}
                    keyboardType="numeric"
                  />
                  <Text style={styles.amountSeparator}>to</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="Max $"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={filters.maxAmount}
                    onChangeText={(text) => setFilters({...filters, maxAmount: text})}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Clear Filters */}
              {getActiveFilterCount() > 0 && (
                <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                  <Ionicons name="refresh" size={16} color={COLORS.primary} />
                  <Text style={styles.clearButtonText}>Clear All Filters</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        <FlatList
          data={filteredAppointments}
          renderItem={renderAppointment}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={COLORS.textLight} />
              <Text style={styles.emptyText}>
                {getActiveFilterCount() > 0 ? 'No appointments match your filters' : 'No appointments found'}
              </Text>
              <Text style={styles.emptySubtext}>
                {getActiveFilterCount() > 0 
                  ? 'Try adjusting your filter criteria'
                  : 'Appointments will appear here when clients book your services'
                }
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 90,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },

  // Header
  header: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  filterButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Filter Panel
  filterPanel: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 300,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textLight,
    fontSize: 12,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  amountSeparator: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },

  // Appointment Cards (matching client booking card style)
  appointmentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    ...COMMON_STYLES.shadow,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textLight,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Empty
  emptyContainer: {
    backgroundColor: COLORS.surface,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default AppointmentsScreen;
