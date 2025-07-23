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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Booking } from '../../types';
import ApiService from '../../services/api';

const AppointmentsScreen = () => {
  const [appointments, setAppointments] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

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
      case 'Pending': return '#F39C12';
      case 'Confirmed': return '#27AE60';
      case 'Completed': return '#3498DB';
      case 'Cancelled': return '#E74C3C';
      default: return '#666';
    }
  };

  const renderStatusActions = (item: Booking) => {
    if (item.status === 'Pending') {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#27AE60', flex: 1 }]}
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
          style={[styles.actionButton, { backgroundColor: '#9B59B6', flex: 1 }]}
          onPress={() => handleStatusChange(item.id, 'InProgress')}
        >
          <Ionicons name="play" size={16} color="white" />
          <Text style={styles.actionButtonText}>Start Service</Text>
        </TouchableOpacity>
      );
    } else if (item.status === 'InProgress') {
      return (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#3498DB', flex: 1 }]}
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
    <View style={styles.appointmentCard}>
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
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {new Date(item.bookingDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.startTime} - {item.endTime}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.detailText}>${item.totalAmount}</Text>
        </View>
      </View>
      
      {renderStatusActions(item)}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text>Loading appointments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Appointments ({appointments.length})</Text>
      <FlatList
        data={appointments}
        renderItem={renderAppointment}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No appointments found</Text>
            <Text style={styles.emptySubtext}>
              Appointments will appear here when clients book your services
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
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1a1a1a',
  },
  appointmentCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
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
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});

export default AppointmentsScreen;
