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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Booking } from '../../types';
import ApiService from '../../services/api';

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
            style={[styles.actionButton, { backgroundColor: '#4ECDC4' }]}
            onPress={() => handleStatusChange(item.id, 'Confirmed')}
          >
            <Ionicons name="checkmark" size={16} color="white" />
            <Text style={styles.actionButtonText}>Accept Booking</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (item.status === 'Confirmed') {
      return (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#45B7D1' }]}
          onPress={() => handleStatusChange(item.id, 'InProgress')}
        >
          <Ionicons name="play" size={16} color="white" />
          <Text style={styles.actionButtonText}>Start Service</Text>
        </TouchableOpacity>
      );
    } else if (item.status === 'InProgress') {
      return (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#96CEB4' }]}
          onPress={() => handleStatusChange(item.id, 'Completed')}
        >
          <Ionicons name="checkmark-circle" size={16} color="white" />
          <Text style={styles.actionButtonText}>Mark Complete</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderAppointment = ({ item }: { item: Booking }) => (
    <BlurView intensity={20} style={styles.appointmentCard}>
      {/* Status Bar */}
      <View style={[styles.statusBar, { backgroundColor: getStatusColor(item.status) }]} />
      
      {/* Main Content */}
      <View style={styles.cardContent}>
        {/* Top Row - Client & Service Info */}
        <View style={styles.topSection}>
          <View style={styles.clientSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {(item.client?.firstName?.[0] || 'U')}
                {(item.client?.lastName?.[0] || '')}
              </Text>
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>
                {item.client?.firstName} {item.client?.lastName || 'Unknown Client'}
              </Text>
              <Text style={styles.serviceName}>
                {item.service?.name || 'Unknown Service'}
              </Text>
            </View>
          </View>
          <View style={[styles.statusPill, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar" size={18} color="#4ECDC4" />
            </View>
            <View>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {new Date(item.bookingDate).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Ionicons name="time" size={18} color="#45B7D1" />
            </View>
            <View>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>
                {item.startTime} - {item.endTime}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Ionicons name="card" size={18} color="#FFD93D" />
            </View>
            <View>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={[styles.detailValue, styles.priceText]}>${item.totalAmount}</Text>
            </View>
          </View>
        </View>

        {/* Action Section */}
        {renderStatusActions(item)}
      </View>
    </BlurView>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={[styles.container, styles.loadingContainer]}>
        <BlurView intensity={20} style={styles.loadingCard}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </BlurView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <BlurView intensity={20} style={styles.header}>
          <Text style={styles.title}>My Appointments ({filteredAppointments.length})</Text>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={20} color="white" />
            {getActiveFilterCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </BlurView>

        {/* Filter Panel */}
        {showFilters && (
          <BlurView intensity={20} style={styles.filterPanel}>
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
                  <Ionicons name="refresh" size={16} color="white" />
                  <Text style={styles.clearButtonText}>Clear All Filters</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </BlurView>
        )}

        <FlatList
          data={filteredAppointments}
          renderItem={renderAppointment}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
          }
          ListEmptyComponent={
            <BlurView intensity={20} style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="rgba(255, 255, 255, 0.5)" />
              <Text style={styles.emptyText}>
                {getActiveFilterCount() > 0 ? 'No appointments match your filters' : 'No appointments found'}
              </Text>
              <Text style={styles.emptySubtext}>
                {getActiveFilterCount() > 0 
                  ? 'Try adjusting your filter criteria'
                  : 'Appointments will appear here when clients book your services'
                }
              </Text>
            </BlurView>
          }
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },

  // Header
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  filterButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Filter Panel
  filterPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    maxHeight: 300,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterChipActive: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  filterChipText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    color: 'white',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    color: 'white',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  amountSeparator: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  clearButtonText: {
    color: 'white',
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

  // Cards
  appointmentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  statusBar: {
    height: 4,
    width: '100%',
  },
  cardContent: {
    padding: 20,
  },
  
  // Top Section
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  clientSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

  // Details Grid
  detailsGrid: {
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  priceText: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Old styles to remove
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appointmentInfo: {
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    minWidth: 70,
    alignItems: 'center',
  },

  // Details (old)
  appointmentDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Empty
  emptyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default AppointmentsScreen;
