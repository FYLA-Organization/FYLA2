import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/index';
import ApiService from '../../services/apiService';

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface AppointmentRequest {
  id: string;
  serviceName: string;
  clientName: string;
  clientImage?: string;
  clientEmail?: string;
  clientPhone?: string;
  requestedDate: string;
  requestedTime: string;
  duration: number;
  price: number;
  notes?: string;
  requestedAt: string;
  preferredLocation?: string;
  alternativeDates?: string[];
  urgency: 'low' | 'medium' | 'high';
}

const COLORS = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  white: '#FFFFFF',
  background: '#FAFAFA',
};

const URGENCY_COLORS = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
};

interface AppointmentRequestsScreenProps {
  tabBar?: React.ReactElement;
}

const AppointmentRequestsScreen: React.FC<AppointmentRequestsScreenProps> = ({ tabBar }) => {
  const navigation = useNavigation<NavigationProp>();
  
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [])
  );

  const loadRequests = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Loading appointment requests from API...');
      
      // Load real pending appointment requests from API
      const result = await ApiService.getProviderAppointments({
        status: 'pending',
        pageSize: 50
      });
      
      console.log('📊 API Result for requests:', result);
      
      if (result.success && result.data) {
        console.log('✅ Raw API request data:', result.data);
        
        // Transform API data to match our AppointmentRequest interface
        const appointments = result.data.appointments || result.data;
        const transformedRequests: AppointmentRequest[] = appointments.map((appointment: any, index: number) => {
          console.log('🔄 Transforming request:', appointment);
          return {
            id: appointment.id?.toString() || `request-${index}`,
            serviceName: appointment.serviceName || appointment.service?.name || 'Service',
            clientName: appointment.clientName || `${appointment.client?.firstName || ''} ${appointment.client?.lastName || ''}`.trim() || 'Client',
            clientImage: appointment.client?.profileImage || appointment.clientImage || 'https://images.unsplash.com/photo-1494790108755-2616b156d9b6?w=100',
            clientEmail: appointment.client?.email || appointment.clientEmail || 'client@email.com',
            clientPhone: appointment.client?.phoneNumber || appointment.clientPhone || '+1 (555) 000-0000',
            requestedDate: appointment.appointmentDate || appointment.date || new Date().toISOString().split('T')[0],
            requestedTime: appointment.startTime || '09:00',
            duration: appointment.duration || 60,
            price: appointment.totalAmount || appointment.price || 0,
            notes: appointment.notes || appointment.specialRequests || '',
            requestedAt: appointment.createdAt || appointment.requestedAt || new Date().toISOString(),
            preferredLocation: appointment.location || 'Studio',
            alternativeDates: [], // Could be enhanced if API provides alternative dates
            urgency: appointment.urgency || 'medium',
          };
        });
        
        setRequests(transformedRequests);
        console.log('✅ Loaded real appointment requests:', transformedRequests.length, 'requests');
        console.log('📋 Transformed requests:', transformedRequests);
      } else {
        // Fallback to mock data if API fails
        console.log('⚠️ API failed, using fallback mock data for requests. Result:', result);
        const mockRequests: AppointmentRequest[] = [
          {
            id: '1',
            serviceName: 'Haircut & Style',
            clientName: 'Emma Wilson',
            clientImage: 'https://images.unsplash.com/photo-1494790108755-2616b156d9b6?w=100',
            clientEmail: 'emma.wilson@email.com',
            clientPhone: '+1 (555) 123-4567',
            requestedDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            requestedTime: '14:00',
            duration: 60,
            price: 85,
            notes: 'First-time client, prefers natural styling',
            requestedAt: new Date(Date.now() - 3600000).toISOString(),
            preferredLocation: 'Main Studio',
            alternativeDates: [
              new Date(Date.now() + 172800000).toISOString().split('T')[0],
              new Date(Date.now() + 259200000).toISOString().split('T')[0]
            ],
            urgency: 'medium',
          },
        ];
        
        setRequests(mockRequests);
      }
    } catch (error) {
      console.error('❌ Error loading appointment requests:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      
      // Use mock data as fallback
      const mockRequests: AppointmentRequest[] = [
        {
          id: '1',
          serviceName: 'Haircut & Style',
          clientName: 'Emma Wilson',
          clientImage: 'https://images.unsplash.com/photo-1494790108755-2616b156d9b6?w=100',
          clientEmail: 'emma.wilson@email.com',
          clientPhone: '+1 (555) 123-4567',
          requestedDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          requestedTime: '14:00',
          duration: 60,
          price: 85,
          notes: 'First-time client, prefers natural styling',
          requestedAt: new Date(Date.now() - 3600000).toISOString(),
          preferredLocation: 'Main Studio',
          alternativeDates: [],
          urgency: 'medium',
        },
      ];
      setRequests(mockRequests);
    } finally {
      setLoading(false);
    }
  };
  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleAcceptRequest = async (request: AppointmentRequest) => {
    try {
      setProcessingRequest(request.id);
      
      // Call API to accept appointment
      const result = await ApiService.updateAppointmentStatus(parseInt(request.id), 'confirmed');
      
      if (result.success) {
        // Remove from requests list
        setRequests(prev => prev.filter(r => r.id !== request.id));
        
        Alert.alert(
          'Appointment Accepted',
          `${request.clientName}'s appointment has been confirmed and added to your calendar.`,
          [{ text: 'OK' }]
        );
        
        console.log('✅ Appointment accepted:', request.id);
      } else {
        throw new Error(result.message || 'Failed to accept appointment');
      }
      
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept appointment. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDeclineRequest = async (request: AppointmentRequest) => {
    Alert.alert(
      'Decline Appointment',
      `Are you sure you want to decline ${request.clientName}'s appointment request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingRequest(request.id);
              
              // Call API to decline appointment
              const result = await ApiService.updateAppointmentStatus(parseInt(request.id), 'cancelled');
              
              if (result.success) {
                // Remove from requests list
                setRequests(prev => prev.filter(r => r.id !== request.id));
                console.log('✅ Appointment declined:', request.id);
              } else {
                throw new Error(result.message || 'Failed to decline appointment');
              }
              
            } catch (error) {
              console.error('Error declining request:', error);
              Alert.alert('Error', 'Failed to decline appointment. Please try again.');
            } finally {
              setProcessingRequest(null);
            }
          }
        }
      ]
    );
  };

  const handleRescheduleRequest = (request: AppointmentRequest) => {
    Alert.alert(
      'Suggest Alternative',
      'Would you like to suggest an alternative time to the client?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suggest Time',
          onPress: () => {
            // Navigate to reschedule screen or show time picker
            console.log('Navigate to reschedule screen for request:', request.id);
          }
        }
      ]
    );
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const requestTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - requestTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - requestTime.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const renderHeader = () => (
    <LinearGradient
      colors={['#6366F1', '#8B5CF6']}
      style={styles.header}
    >
      <SafeAreaView>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Appointment Requests</Text>
              <Text style={styles.headerSubtitle}>
                {requests.length} pending request{requests.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.headerStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{requests.length}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  const renderRequestCard = (request: AppointmentRequest) => (
    <View key={request.id} style={styles.requestCard}>
      <View style={styles.cardHeader}>
        <View style={styles.clientInfo}>
          <Image 
            source={{ uri: request.clientImage || 'https://images.unsplash.com/photo-1494790108755-2616b156d9b6?w=100' }}
            style={styles.clientImage}
          />
          <View style={styles.clientDetails}>
            <Text style={styles.clientName}>{request.clientName}</Text>
            <Text style={styles.requestTime}>{getTimeAgo(request.requestedAt)}</Text>
          </View>
        </View>
        <View style={[styles.urgencyBadge, { backgroundColor: URGENCY_COLORS[request.urgency] }]}>
          <Text style={styles.urgencyText}>{request.urgency.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.serviceSection}>
        <Text style={styles.serviceName}>{request.serviceName}</Text>
        <View style={styles.serviceDetails}>
          <View style={styles.serviceDetailItem}>
            <Ionicons name="calendar" size={16} color={COLORS.gray500} />
            <Text style={styles.serviceDetailText}>
              {new Date(request.requestedDate).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </View>
          <View style={styles.serviceDetailItem}>
            <Ionicons name="time" size={16} color={COLORS.gray500} />
            <Text style={styles.serviceDetailText}>
              {request.requestedTime} ({request.duration}m)
            </Text>
          </View>
          <View style={styles.serviceDetailItem}>
            <Ionicons name="card" size={16} color={COLORS.gray500} />
            <Text style={styles.serviceDetailText}>${request.price}</Text>
          </View>
        </View>
      </View>

      {request.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Client Notes:</Text>
          <Text style={styles.notesText}>{request.notes}</Text>
        </View>
      )}

      <View style={styles.contactSection}>
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="call" size={16} color={COLORS.primary} />
          <Text style={styles.contactButtonText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="mail" size={16} color={COLORS.primary} />
          <Text style={styles.contactButtonText}>Email</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="chatbubble" size={16} color={COLORS.primary} />
          <Text style={styles.contactButtonText}>Message</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.declineButton]}
          onPress={() => handleDeclineRequest(request)}
          disabled={processingRequest === request.id}
        >
          <Ionicons name="close" size={16} color="white" />
          <Text style={styles.actionButtonText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.rescheduleButton]}
          onPress={() => handleRescheduleRequest(request)}
          disabled={processingRequest === request.id}
        >
          <Ionicons name="calendar" size={16} color="white" />
          <Text style={styles.actionButtonText}>Reschedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptRequest(request)}
          disabled={processingRequest === request.id}
        >
          {processingRequest === request.id ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="checkmark" size={16} color="white" />
              <Text style={styles.actionButtonText}>Accept</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {renderHeader()}
      {tabBar}
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={COLORS.gray300} />
            <Text style={styles.emptyStateTitle}>No Pending Requests</Text>
            <Text style={styles.emptyStateText}>
              New appointment requests will appear here for your review and approval.
            </Text>
          </View>
        ) : (
          requests.map(renderRequestCard)
        )}
      </ScrollView>
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
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray600,
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  headerStats: {
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
    borderWidth: 2,
    borderColor: COLORS.gray100,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray800,
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  requestTime: {
    fontSize: 13,
    color: COLORS.gray500,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    minWidth: 60,
    alignItems: 'center',
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  serviceSection: {
    marginBottom: 18,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray800,
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  serviceDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  serviceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
  },
  serviceDetailText: {
    fontSize: 14,
    color: COLORS.gray600,
    fontWeight: '500',
    marginLeft: 8,
    letterSpacing: 0.1,
  },
  notesSection: {
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gray600,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  notesText: {
    fontSize: 15,
    color: COLORS.gray700,
    lineHeight: 22,
    fontWeight: '500',
  },
  contactSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.gray200,
    marginBottom: 20,
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 6,
    letterSpacing: 0.2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  declineButton: {
    backgroundColor: COLORS.error,
  },
  rescheduleButton: {
    backgroundColor: COLORS.warning,
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
    flex: 1,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.gray600,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.gray500,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
});

export default AppointmentRequestsScreen;
