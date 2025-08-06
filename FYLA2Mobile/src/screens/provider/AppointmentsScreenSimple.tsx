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
  Modal,
  Dimensions,
  StatusBar,
  Image,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Booking } from '../../types';
import ApiService from '../../services/api';

const { width } = Dimensions.get('window');

// Modern Clean Color Palette
const COLORS = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  primary: '#3B82F6',
  primaryLight: '#EFF6FF',
  accent: '#EF4444',
  accentLight: '#FEF2F2',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  verified: '#3B82F6',
  instagram: '#E11D48',
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  inProgress: '#8B5CF6',
  completed: '#10B981',
  cancelled: '#EF4444',
};

interface AppointmentFilters {
  status: string;
  dateRange: string;
  client: string;
  service: string;
  minAmount: string;
  maxAmount: string;
}

const AppointmentsScreen = () => {
  const [appointments, setAppointments] = useState<Booking[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCards, setExpandedCards] = useState<{ [appointmentId: string]: boolean }>({});
  
  // Filter states
  const [filters, setFilters] = useState<AppointmentFilters>({
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return COLORS.pending;
      case 'Confirmed': return COLORS.confirmed;
      case 'InProgress': return COLORS.inProgress;
      case 'Completed': return COLORS.completed;
      case 'Cancelled': return COLORS.cancelled;
      default: return COLORS.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (timeString: string) => {
    const time = new Date(timeString);
    return time.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  const toggleCardExpansion = (appointmentId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [appointmentId]: !prev[appointmentId]
    }));
  };

  const renderAppointmentCard = ({ item }: { item: Booking }) => {
    const isExpanded = expandedCards[item.id] || false;
    
    return (
      <View style={styles.appointmentCard}>
        {/* Status Strip */}
        <View style={[styles.statusStrip, { backgroundColor: getStatusColor(item.status) }]} />
        
        {/* Card Header - Always Visible */}
        <TouchableOpacity
          onPress={() => toggleCardExpansion(item.id)}
          style={styles.cardHeader}
          activeOpacity={0.8}
        >
          <View style={styles.clientSection}>
            <View style={styles.clientImageContainer}>
              <Image
                source={{
                  uri: item.client?.profilePictureUrl || `https://ui-avatars.com/api/?name=${item.client?.firstName}+${item.client?.lastName}&background=5A6FD8&color=fff`,
                }}
                style={styles.clientImage}
              />
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName} numberOfLines={1}>
                {item.client?.firstName} {item.client?.lastName || 'Unknown Client'}
              </Text>
              <Text style={styles.serviceName} numberOfLines={1}>
                {item.service?.name || 'Unknown Service'}
              </Text>
              <View style={styles.serviceCategory}>
                <Ionicons name="cut-outline" size={12} color={COLORS.warning} />
                <Text style={styles.categoryText}>
                  {item.service?.category || 'General Service'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.priceStatusContainer}>
            <Text style={styles.priceText}>${item.totalAmount?.toFixed(2) || '0.00'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status}</Text>
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
            <Ionicons name="calendar" size={14} color={COLORS.primary} />
            <Text style={styles.quickInfoText}>{formatDate(item.bookingDate)}</Text>
          </View>
          <View style={styles.quickInfoItem}>
            <Ionicons name="time" size={14} color={COLORS.accent} />
            <Text style={styles.quickInfoText}>{formatTime(item.startTime)}</Text>
          </View>
          {!isExpanded && item.notes && (
            <View style={styles.quickInfoItem}>
              <Ionicons name="chatbubble-outline" size={14} color={COLORS.warning} />
              <Text style={styles.quickInfoText}>Has Notes</Text>
            </View>
          )}
        </View>

        {/* Expandable Content */}
        {isExpanded && (
          <View style={styles.expandableContent}>
            {/* Detailed Info */}
            <View style={styles.appointmentDetails}>
              {item.endTime && (
                <View style={styles.durationContainer}>
                  <Ionicons name="stopwatch-outline" size={14} color={COLORS.warning} />
                  <Text style={styles.durationText}>
                    Duration: {formatTime(item.startTime)} - {formatTime(item.endTime)}
                  </Text>
                </View>
              )}

              {item.notes && (
                <View style={styles.notesSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="chatbubble-outline" size={14} color={COLORS.warning} />
                    <Text style={styles.sectionTitle}>Notes</Text>
                  </View>
                  <Text style={styles.notesText} numberOfLines={3}>
                    {item.notes}
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            {renderStatusActions(item)}
          </View>
        )}
      </View>
    );
  };  if (loading) {
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
          renderItem={renderAppointmentCard}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={COLORS.textSecondary} />
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
  // Base Layout
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 60, // Extra top padding to avoid dynamic island
    paddingBottom: 100, // Extra padding for tab navigation
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: COLORS.surface,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
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
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    letterSpacing: -0.5,
  },
  filterButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.accent,
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontWeight: '400',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 12,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  amountSeparator: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 16,
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
    paddingBottom: 100,
  },

  // Modern Appointment Cards
  appointmentCard: {
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  
  statusStrip: {
    height: 4,
    width: '100%',
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
  },
  clientSection: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  clientImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  clientImage: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  clientInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  serviceName: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  serviceCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 168, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.warning,
    marginLeft: 4,
    fontWeight: '600',
  },
  
  priceStatusContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.success,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expandButton: {
    padding: 4,
  },
  
  quickInfo: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
  },
  quickInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(43, 124, 230, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quickInfoText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
  
  expandableContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  appointmentDetails: {
    marginBottom: 16,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 168, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  durationText: {
    fontSize: 14,
    color: COLORS.warning,
    marginLeft: 8,
    fontWeight: '600',
  },
  notesSection: {
    backgroundColor: 'rgba(102, 102, 102, 0.05)',
    padding: 12,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 6,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  emptyContainer: {
    backgroundColor: COLORS.surface,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptySubtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
});

export default AppointmentsScreen;
