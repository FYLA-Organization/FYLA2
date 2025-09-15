import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MODERN_COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/modernDesign';
import ApiService from '../services/apiService';

interface BookingActionsModalProps {
  visible: boolean;
  onClose: () => void;
  booking: any;
  onActionComplete: () => void;
}

const BookingActionsModal: React.FC<BookingActionsModalProps> = ({
  visible,
  onClose,
  booking,
  onActionComplete,
}) => {
  const [activeAction, setActiveAction] = useState<'none' | 'cancel' | 'reschedule'>('none');
  const [loading, setLoading] = useState(false);
  const [cancellationInfo, setCancellationInfo] = useState<any>(null);
  const [reason, setReason] = useState('');
  
  // Reschedule states
  const [newDate, setNewDate] = useState(new Date());
  const [newTime, setNewTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Business hours constraints (9 AM to 6 PM)
  const getMinTime = () => {
    const minTime = new Date();
    minTime.setHours(9, 0, 0, 0); // 9:00 AM
    return minTime;
  };

  const getMaxTime = () => {
    const maxTime = new Date();
    maxTime.setHours(18, 0, 0, 0); // 6:00 PM
    return maxTime;
  };

  const validateTimeSelection = (selectedTime: Date) => {
    const minTime = getMinTime();
    const maxTime = getMaxTime();
    
    if (selectedTime < minTime) {
      return minTime;
    }
    if (selectedTime > maxTime) {
      return maxTime;
    }
    return selectedTime;
  };

  useEffect(() => {
    if (visible && booking) {
      loadCancellationInfo();
    }
  }, [visible, booking]);

  const loadCancellationInfo = async () => {
    try {
      setLoading(true);
      const info = await ApiService.getCancellationInfo(booking.id);
      setCancellationInfo(info);
    } catch (error) {
      console.error('Error loading cancellation info:', error);
      Alert.alert('Error', 'Failed to load cancellation information');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!reason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for cancellation');
      return;
    }

    const confirmCancel = () => Alert.alert(
      'Confirm Cancellation',
      `This will cancel your booking and charge a fee of $${cancellationInfo?.cancellationFee?.toFixed(2) || 0}. You will receive a refund of $${cancellationInfo?.refundAmount?.toFixed(2) || 0}. This action cannot be undone.`,
      [
        { text: 'Keep Booking', style: 'cancel' },
        { 
          text: 'Cancel Booking', 
          style: 'destructive',
          onPress: confirmCancellation 
        }
      ]
    );

    const confirmCancellation = async () => {
      try {
        setLoading(true);
        await ApiService.cancelBooking(booking.id, reason);
        
        Alert.alert(
          '✅ Booking Cancelled',
          `Your booking has been cancelled. ${cancellationInfo?.refundAmount > 0 ? 'Your refund will be processed within 3-5 business days.' : ''}`,
          [{ text: 'OK', onPress: () => {
            onActionComplete();
            onClose();
          }}]
        );
      } catch (error) {
        console.error('Error cancelling booking:', error);
        Alert.alert('Error', 'Failed to cancel booking. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    confirmCancel();
  };

  const handleReschedule = async () => {
    if (!reason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for rescheduling');
      return;
    }

    try {
      setLoading(true);
      const newDateStr = newDate.toISOString().split('T')[0];
      const newTimeStr = newTime.toTimeString().substring(0, 5);
      
      const result = await ApiService.rescheduleBooking(booking.id, newDateStr, newTimeStr, reason);
      
      const message = result.status === 'Approved' 
        ? '✅ Booking rescheduled successfully!'
        : '📋 Reschedule request sent to provider for approval';
        
      Alert.alert(
        'Reschedule Request',
        `${message}${result.rescheduleFee > 0 ? ` A fee of $${result.rescheduleFee.toFixed(2)} applies.` : ''}`,
        [{ text: 'OK', onPress: () => {
          onActionComplete();
          onClose();
        }}]
      );
    } catch (error: any) {
      console.error('Error rescheduling booking:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reschedule booking. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderCancellationView = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Cancellation Details</Text>
        
        {cancellationInfo && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Time until appointment:</Text>
              <Text style={styles.infoValue}>{cancellationInfo.hoursUntilAppointment}h</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cancellation timeframe:</Text>
              <Text style={styles.infoValue}>{cancellationInfo.timeFrame}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cancellation fee:</Text>
              <Text style={[styles.infoValue, styles.fee]}>${cancellationInfo.cancellationFee?.toFixed(2)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Refund amount:</Text>
              <Text style={[styles.infoValue, styles.refund]}>${cancellationInfo.refundAmount?.toFixed(2)}</Text>
            </View>
          </View>
        )}
        
        {cancellationInfo?.policy?.description && (
          <View style={styles.policyCard}>
            <Text style={styles.policyTitle}>📋 Cancellation Policy</Text>
            <Text style={styles.policyText}>{cancellationInfo.policy.description}</Text>
            {cancellationInfo.policy.specialCircumstances && (
              <Text style={styles.specialCircumstances}>
                ⚠️ {cancellationInfo.policy.specialCircumstances}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💬 Reason for Cancellation</Text>
        <TextInput
          style={styles.textInput}
          value={reason}
          onChangeText={setReason}
          placeholder="Please explain why you're cancelling..."
          multiline
          numberOfLines={3}
          maxLength={500}
        />
      </View>

      <TouchableOpacity
        style={[styles.actionButton, styles.cancelButton]}
        onPress={handleCancel}
        disabled={loading || !cancellationInfo?.canCancel}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="close-circle" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Cancel Booking</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderRescheduleView = () => (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 New Date & Time</Text>
        
        <View style={styles.dateTimeContainer}>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color={MODERN_COLORS.primary} />
            <Text style={styles.dateTimeText}>
              {newDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time" size={20} color={MODERN_COLORS.primary} />
            <Text style={styles.dateTimeText}>
              {newTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={newDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setNewDate(selectedDate);
                }
              }}
              minimumDate={new Date()}
              textColor="#000000"
              accentColor="#000000"
              style={{ backgroundColor: '#FFFFFF' }}
            />
          </View>
        )}

        {showTimePicker && (
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={newTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'} 
              onChange={(event, selectedTime) => {
                setShowTimePicker(Platform.OS === 'ios');
                if (selectedTime) {
                  const validatedTime = validateTimeSelection(selectedTime);
                  setNewTime(validatedTime);
                  
                  // Show alert if time was adjusted
                  if (validatedTime.getTime() !== selectedTime.getTime()) {
                    Alert.alert(
                      'Time Adjusted',
                      'Selected time has been adjusted to fit within business hours (9:00 AM - 6:00 PM)',
                      [{ text: 'OK' }]
                    );
                  }
                }
              }}
              minimumDate={getMinTime()}
              maximumDate={getMaxTime()}
              textColor="#000000"
              accentColor="#000000"
              style={{ backgroundColor: '#FFFFFF' }}
            />
          </View>
        )}

        {cancellationInfo?.policy && (
          <View style={styles.rescheduleInfo}>
            <Text style={styles.rescheduleInfoText}>
              💡 Free reschedules: {cancellationInfo.policy.freeReschedulesAllowed}
            </Text>
            <Text style={styles.rescheduleInfoText}>
              📝 Fee after free reschedules: {cancellationInfo.policy.rescheduleFeePercentage}%
            </Text>
            <Text style={styles.rescheduleInfoText}>
              🕘 Available hours: 9:00 AM - 6:00 PM
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💬 Reason for Rescheduling</Text>
        <TextInput
          style={styles.textInput}
          value={reason}
          onChangeText={setReason}
          placeholder="Please explain why you're rescheduling..."
          multiline
          numberOfLines={3}
          maxLength={500}
        />
      </View>

      <TouchableOpacity
        style={[styles.actionButton, styles.rescheduleButton]}
        onPress={handleReschedule}
        disabled={loading || !cancellationInfo?.canReschedule}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Request Reschedule</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderMainMenu = () => (
    <View style={styles.content}>
      <View style={styles.bookingHeader}>
        <Text style={styles.bookingTitle}>{booking?.serviceName}</Text>
        <Text style={styles.bookingDate}>
          {booking?.date} at {booking?.time}
        </Text>
        <Text style={styles.bookingProvider}>with {booking?.providerName}</Text>
      </View>

      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={[styles.actionCard, cancellationInfo?.canCancel ? {} : styles.disabledCard]}
          onPress={() => cancellationInfo?.canCancel && setActiveAction('cancel')}
          disabled={!cancellationInfo?.canCancel}
        >
          <Ionicons name="close-circle" size={32} color={cancellationInfo?.canCancel ? "#DC2626" : "#9CA3AF"} />
          <Text style={[styles.actionCardTitle, !cancellationInfo?.canCancel && styles.disabledText]}>
            Cancel Booking
          </Text>
          <Text style={[styles.actionCardSubtitle, !cancellationInfo?.canCancel && styles.disabledText]}>
            {cancellationInfo?.canCancel ? 'Get refund (fees may apply)' : 'Cannot cancel at this time'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, cancellationInfo?.canReschedule ? {} : styles.disabledCard]}
          onPress={() => cancellationInfo?.canReschedule && setActiveAction('reschedule')}
          disabled={!cancellationInfo?.canReschedule}
        >
          <Ionicons name="refresh" size={32} color={cancellationInfo?.canReschedule ? MODERN_COLORS.primary : "#9CA3AF"} />
          <Text style={[styles.actionCardTitle, !cancellationInfo?.canReschedule && styles.disabledText]}>
            Reschedule
          </Text>
          <Text style={[styles.actionCardSubtitle, !cancellationInfo?.canReschedule && styles.disabledText]}>
            {cancellationInfo?.canReschedule ? 'Change date or time' : `Need ${cancellationInfo?.policy?.minimumRescheduleHours || 24}h notice`}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MODERN_COLORS.primary} />
          <Text style={styles.loadingText}>Loading policy information...</Text>
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            if (activeAction !== 'none') {
              setActiveAction('none');
            } else {
              onClose();
            }
          }}>
            <Ionicons name={activeAction !== 'none' ? "arrow-back" : "close"} size={24} color={MODERN_COLORS.textPrimary} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {activeAction === 'cancel' ? 'Cancel Booking' : 
             activeAction === 'reschedule' ? 'Reschedule Booking' : 'Booking Options'}
          </Text>
          
          <View style={{ width: 24 }} />
        </View>

        {activeAction === 'none' && renderMainMenu()}
        {activeAction === 'cancel' && renderCancellationView()}
        {activeAction === 'reschedule' && renderRescheduleView()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  bookingHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  bookingTitle: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  bookingDate: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.primary,
    marginBottom: SPACING.xs,
  },
  bookingProvider: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginVertical: SPACING.lg,
  },
  actionCard: {
    flex: 1,
    backgroundColor: MODERN_COLORS.surface,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  disabledCard: {
    opacity: 0.5,
  },
  actionCardTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  actionCardSubtitle: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
    textAlign: 'center',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  section: {
    marginVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  infoCard: {
    backgroundColor: MODERN_COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
  },
  fee: {
    color: '#DC2626',
  },
  refund: {
    color: '#059669',
  },
  policyCard: {
    backgroundColor: '#FEF3C7',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
  },
  policyTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: '#92400E',
    marginBottom: SPACING.sm,
  },
  policyText: {
    fontSize: TYPOGRAPHY.sm,
    color: '#92400E',
    lineHeight: 18,
  },
  specialCircumstances: {
    fontSize: TYPOGRAPHY.sm,
    color: '#DC2626',
    fontStyle: 'italic',
    marginTop: SPACING.sm,
  },
  textInput: {
    backgroundColor: MODERN_COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textPrimary,
    textAlignVertical: 'top',
    minHeight: 80,
    borderWidth: 1,
    borderColor: MODERN_COLORS.border,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  dateTimeButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 2,
    borderColor: '#000000',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  dateTimeText: {
    fontSize: TYPOGRAPHY.base,
    color: '#000000',
    fontWeight: '600',
    textAlign: 'center',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  rescheduleInfo: {
    backgroundColor: '#EFF6FF',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
  },
  rescheduleInfoText: {
    fontSize: TYPOGRAPHY.sm,
    color: '#1E40AF',
    marginBottom: SPACING.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
    marginVertical: SPACING.lg,
  },
  cancelButton: {
    backgroundColor: '#DC2626',
  },
  rescheduleButton: {
    backgroundColor: MODERN_COLORS.primary,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
});

export default BookingActionsModal;
