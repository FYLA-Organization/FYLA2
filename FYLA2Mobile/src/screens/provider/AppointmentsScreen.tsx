import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Booking } from '../../types';
import ApiService from '../../services/api';

const AppointmentsScreen = () => {
  const [appointments, setAppointments] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');

  const loadAppointments = async () => {
    try {
      const bookings = await ApiService.getBookings();
      setAppointments(bookings);
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Error', 'Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  // Modern Luxe Status Colors
  const StatusColors = {
    'Pending': '#F5C451',      // Soft Gold - luxury pending
    'Confirmed': '#5A4FCF',    // Royal Indigo - confirmed elegance
    'Completed': '#6B6B6B',    // Sophisticated gray - completed
    'Cancelled': '#E74C3C',    // Elegant red for cancellation
    'InProgress': '#AFAAFF',   // Lavender for active sessions
  };  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'completed', label: 'Completed' },
  ];

  const filteredAppointments = appointments.filter(appointment => 
    selectedFilter === 'all' || appointment.status.toLowerCase() === selectedFilter
  );

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      await ApiService.updateBookingStatus(appointmentId, newStatus);
      await loadAppointments();
    } catch (error) {
      console.error('Error updating booking status:', error);
      Alert.alert('Error', 'Failed to update booking status. Please try again.');
    }
  };

  const renderStatusActions = (appointment: Booking) => {
    switch (appointment.status) {
      case 'Pending':
        return (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.success }]}
              onPress={() => handleStatusChange(appointment.id, 'Confirmed')}
            >
              <Ionicons name="checkmark" size={16} color="white" />
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.error }]}
              onPress={() => handleStatusChange(appointment.id, 'Cancelled')}
            >
              <Ionicons name="close" size={16} color="white" />
              <Text style={styles.actionButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        );
      case 'Confirmed':
        return (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.info }]}
            onPress={() => handleStatusChange(appointment.id, 'Completed')}
          >
            <Ionicons name="checkmark-circle" size={16} color="white" />
            <Text style={styles.actionButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  const renderAppointment = ({ item }: { item: Booking }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View>
          <Text style={styles.clientName}>
            {item.client?.firstName} {item.client?.lastName || 'Unknown Client'}
          </Text>
          <Text style={styles.serviceName}>{item.service?.name || 'Unknown Service'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: StatusColors[item.status] }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.appointmentDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={Colors.text.secondary} />
          <Text style={styles.detailText}>
            {new Date(item.bookingDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={Colors.text.secondary} />
          <Text style={styles.detailText}>
            {item.startTime} - {item.endTime}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color={Colors.accent.main} />
          <Text style={styles.detailText}>${item.totalAmount}</Text>
        </View>
      </View>
      
      {renderStatusActions(item)}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={styles.loadingText}>Loading appointments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Appointments</Text>
      
      <View style={styles.filterContainer}>
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterButton,
              selectedFilter === option.key && styles.activeFilterButton,
            ]}
            onPress={() => setSelectedFilter(option.key as any)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === option.key && styles.activeFilterButtonText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredAppointments}
        renderItem={renderAppointment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={Colors.text.tertiary} />
            <Text style={styles.emptyText}>No appointments found</Text>
            <Text style={styles.emptySubtext}>
              {selectedFilter === 'all' 
                ? 'Appointments will appear here when clients book your services'
                : `No ${selectedFilter} appointments at this time`
              }
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  loadingText: {
    ...Typography.body.large,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  title: {
    ...Typography.heading.h1,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.xs,
    ...Shadows.small,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: Colors.primary.main,
    ...Shadows.small,
  },
  filterButtonText: {
    ...Typography.label.medium,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: Spacing.lg,
  },
  appointmentCard: {
    ...ComponentStyles.cards.primary,
    backgroundColor: Colors.background.card,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  clientName: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  serviceName: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
  },
  statusBadge: {
    ...ComponentStyles.chips.selected,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.chip,
  },
  statusText: {
    ...Typography.label.small,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  appointmentDetails: {
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  detailText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    ...ComponentStyles.buttons.primary,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  actionButtonText: {
    ...Typography.button.medium,
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    ...Typography.heading.h2,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    ...Typography.body.medium,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
  },
});

export default AppointmentsScreen;
