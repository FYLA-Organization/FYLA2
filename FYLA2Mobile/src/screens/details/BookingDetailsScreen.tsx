import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Booking, BookingStatus, RootStackParamList } from '../../types';
import ApiService from '../../services/api';

type BookingDetailsScreenRouteProp = {
  key: string;
  name: 'BookingDetails';
  params: {
    bookingId: string;
  };
};

type BookingDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const BookingDetailsScreen: React.FC = () => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const route = useRoute<BookingDetailsScreenRouteProp>();
  const navigation = useNavigation<BookingDetailsScreenNavigationProp>();
  const { bookingId } = route.params;

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setIsLoading(true);
      const bookingData = await ApiService.getBooking(bookingId);
      setBooking(bookingData);
    } catch (error) {
      console.error('Error loading booking details:', error);
      Alert.alert('Error', 'Failed to load booking details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
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
        return '#27AE60';
      case BookingStatus.Cancelled:
        return '#E74C3C';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.Pending:
        return 'time-outline';
      case BookingStatus.Confirmed:
        return 'checkmark-circle-outline';
      case BookingStatus.InProgress:
        return 'play-circle-outline';
      case BookingStatus.Completed:
        return 'checkmark-done-circle-outline';
      case BookingStatus.Cancelled:
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;

    if (!cancelReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for cancellation');
      return;
    }

    setIsUpdating(true);
    try {
      await ApiService.updateBookingStatus(bookingId, 'Cancelled');
      
      setBooking(prev => prev ? { ...prev, status: BookingStatus.Cancelled } : null);
      setShowCancelModal(false);
      setCancelReason('');
      
      Alert.alert('Success', 'Booking has been cancelled successfully');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Alert.alert('Error', 'Failed to cancel booking. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReschedule = () => {
    if (!booking) return;
    
    // Navigate to booking flow for rescheduling
    navigation.navigate('BookingFlow', {
      service: booking.service!,
      provider: booking.serviceProvider!,
    });
  };

  const handleContactProvider = () => {
    if (!booking?.serviceProvider) return;
    
    navigation.navigate('Chat', {
      userId: booking.serviceProvider.id,
      userName: booking.serviceProvider.businessName || 'Provider',
    });
  };

  const renderActionButton = (title: string, icon: string, onPress: () => void, color = '#FF6B6B', disabled = false) => (
    <TouchableOpacity
      style={[styles.actionButton, { backgroundColor: color }, disabled && styles.disabledButton]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name={icon as any} size={20} color="white" />
      <Text style={styles.actionButtonText}>{title}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#E74C3C" />
        <Text style={styles.errorText}>Booking not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#FF6B6B', '#FFE66D']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
            <Ionicons name={getStatusIcon(booking.status) as any} size={24} color="white" />
            <Text style={styles.statusText}>{booking.status}</Text>
          </View>
        </View>

        {/* Service Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Service Details</Text>
          <View style={styles.serviceInfo}>
            {booking.service?.imageUrl && (
              <Image source={{ uri: booking.service.imageUrl }} style={styles.serviceImage} />
            )}
            <View style={styles.serviceDetails}>
              <Text style={styles.serviceName}>{booking.service?.name}</Text>
              <Text style={styles.serviceDescription}>{booking.service?.description}</Text>
              <Text style={styles.serviceCategory}>{booking.service?.category}</Text>
            </View>
          </View>
        </View>

        {/* Provider Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Provider</Text>
          <View style={styles.providerInfo}>
            <Image
              source={{
                uri: booking.serviceProvider?.profilePictureUrl || 'https://via.placeholder.com/60',
              }}
              style={styles.providerImage}
            />
            <View style={styles.providerDetails}>
              <Text style={styles.providerName}>{booking.serviceProvider?.businessName}</Text>
              <Text style={styles.providerDescription}>
                {booking.serviceProvider?.businessDescription || 'Professional Service Provider'}
              </Text>
            </View>
          </View>
        </View>

        {/* Appointment Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Appointment Details</Text>
          <View style={styles.appointmentDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(booking.bookingDate)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>
                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="time" size={20} color="#666" />
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>{booking.service?.duration} minutes</Text>
            </View>
            
            <View style={[styles.detailRow, styles.priceRow]}>
              <Ionicons name="card-outline" size={20} color="#FF6B6B" />
              <Text style={styles.detailLabel}>Total</Text>
              <Text style={styles.priceValue}>${booking.totalAmount}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {booking.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{booking.notes}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {booking.status === BookingStatus.Pending && (
            <>
              {renderActionButton('Cancel Booking', 'close', () => setShowCancelModal(true), '#E74C3C')}
              {renderActionButton('Reschedule', 'calendar', handleReschedule, '#4ECDC4')}
            </>
          )}
          
          {booking.status === BookingStatus.Confirmed && (
            <>
              {renderActionButton('Cancel Booking', 'close', () => setShowCancelModal(true), '#E74C3C')}
              {renderActionButton('Contact Provider', 'chatbubble', handleContactProvider, '#007AFF')}
            </>
          )}
          
          {(booking.status === BookingStatus.Completed || booking.status === BookingStatus.InProgress) && (
            <>
              {renderActionButton('Contact Provider', 'chatbubble', handleContactProvider, '#007AFF')}
              {booking.status === BookingStatus.Completed && 
                renderActionButton('Leave Review', 'star', () => {}, '#FFD700')}
            </>
          )}
        </View>
      </ScrollView>

      {/* Cancel Modal */}
      <Modal
        visible={showCancelModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cancelModal}>
            <Text style={styles.modalTitle}>Cancel Booking</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalCancelText}>Keep Booking</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalConfirmButton, isUpdating && styles.disabledButton]}
                onPress={handleCancelBooking}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalConfirmText}>Cancel Booking</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  serviceInfo: {
    flexDirection: 'row',
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  serviceCategory: {
    fontSize: 12,
    color: '#FF6B6B',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  providerDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  appointmentDetails: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  priceRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  notesText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  actionsContainer: {
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginTop: 16,
    marginBottom: 20,
  },
  backButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cancelModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default BookingDetailsScreen;
