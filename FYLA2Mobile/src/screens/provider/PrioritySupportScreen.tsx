import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import FeatureGatingService from '../../services/featureGatingService';
import { MODERN_COLORS, SPACING } from '../../constants/modernDesign';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  lastUpdated: string;
  responses: Array<{
    id: string;
    message: string;
    isFromSupport: boolean;
    timestamp: string;
  }>;
}

const PrioritySupportScreen = () => {
  const navigation = useNavigation();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
  });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      setLoading(true);
      const accessCheck = await FeatureGatingService.canAccessPrioritySupport();
      setHasAccess(accessCheck.allowed);
      
      if (accessCheck.allowed) {
        await loadTickets();
      }
    } catch (error) {
      console.error('Error checking priority support access:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      // Mock data for demonstration - in real app this would be an API call
      const mockTickets: SupportTicket[] = [
        {
          id: '1',
          subject: 'Payment integration issue',
          description: 'Having trouble with Stripe payment processing',
          status: 'in_progress',
          priority: 'high',
          createdAt: '2024-01-15T10:00:00Z',
          lastUpdated: '2024-01-15T14:30:00Z',
          responses: [
            {
              id: '1',
              message: 'Thank you for contacting support. We\'re looking into this issue.',
              isFromSupport: true,
              timestamp: '2024-01-15T10:15:00Z',
            }
          ]
        },
        {
          id: '2',
          subject: 'Analytics data not updating',
          description: 'My revenue analytics haven\'t updated in 24 hours',
          status: 'resolved',
          priority: 'normal',
          createdAt: '2024-01-14T09:00:00Z',
          lastUpdated: '2024-01-14T16:45:00Z',
          responses: [
            {
              id: '2',
              message: 'This has been resolved. Analytics should now update in real-time.',
              isFromSupport: true,
              timestamp: '2024-01-14T16:45:00Z',
            }
          ]
        }
      ];
      setTickets(mockTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  };

  const createTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      // Mock ticket creation - in real app this would be an API call
      const ticket: SupportTicket = {
        id: Date.now().toString(),
        subject: newTicket.subject,
        description: newTicket.description,
        status: 'open',
        priority: newTicket.priority,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        responses: []
      };
      
      setTickets(prev => [ticket, ...prev]);
      setNewTicket({ subject: '', description: '', priority: 'normal' });
      setShowCreateTicket(false);
      Alert.alert('Success', 'Support ticket created successfully');
    } catch (error) {
      console.error('Error creating ticket:', error);
      Alert.alert('Error', 'Failed to create support ticket');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F97316';
      case 'normal': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#F59E0B';
      case 'in_progress': return '#3B82F6';
      case 'resolved': return '#10B981';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderCreateTicketForm = () => (
    <BlurView intensity={20} style={styles.createTicketModal}>
      <View style={styles.createTicketHeader}>
        <Text style={styles.createTicketTitle}>Create Support Ticket</Text>
        <TouchableOpacity onPress={() => setShowCreateTicket(false)}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Subject</Text>
        <TextInput
          style={styles.textInput}
          value={newTicket.subject}
          onChangeText={(text) => setNewTicket(prev => ({ ...prev, subject: text }))}
          placeholder="Brief description of the issue"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Priority</Text>
        <View style={styles.prioritySelector}>
          {['low', 'normal', 'high', 'urgent'].map((priority) => (
            <TouchableOpacity
              key={priority}
              style={[
                styles.priorityOption,
                { backgroundColor: newTicket.priority === priority ? getPriorityColor(priority) : 'rgba(255, 255, 255, 0.1)' }
              ]}
              onPress={() => setNewTicket(prev => ({ ...prev, priority: priority as any }))}
            >
              <Text style={styles.priorityText}>{priority.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Description</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={newTicket.description}
          onChangeText={(text) => setNewTicket(prev => ({ ...prev, description: text }))}
          placeholder="Detailed description of the issue..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={createTicket}>
        <Text style={styles.submitButtonText}>Create Ticket</Text>
      </TouchableOpacity>
    </BlurView>
  );

  const renderTicketItem = (ticket: SupportTicket) => (
    <BlurView key={ticket.id} intensity={20} style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <View style={styles.ticketInfo}>
          <Text style={styles.ticketSubject}>{ticket.subject}</Text>
          <Text style={styles.ticketDate}>{formatDate(ticket.lastUpdated)}</Text>
        </View>
        <View style={styles.ticketBadges}>
          <View style={[styles.badge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
            <Text style={styles.badgeText}>{ticket.priority.toUpperCase()}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: getStatusColor(ticket.status) }]}>
            <Text style={styles.badgeText}>{ticket.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.ticketDescription}>{ticket.description}</Text>
      
      {ticket.responses.length > 0 && (
        <View style={styles.responseSection}>
          <Text style={styles.responseHeader}>Latest Response:</Text>
          <Text style={styles.responseText}>{ticket.responses[ticket.responses.length - 1].message}</Text>
        </View>
      )}
    </BlurView>
  );

  if (loading) {
    return (
      <LinearGradient colors={[MODERN_COLORS.primary, MODERN_COLORS.primaryDark]} style={[styles.container, styles.centered]}>
        <BlurView intensity={20} style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading support...</Text>
        </BlurView>
      </LinearGradient>
    );
  }

  if (!hasAccess) {
    return (
      <LinearGradient colors={[MODERN_COLORS.primary, MODERN_COLORS.primaryDark]} style={[styles.container, styles.centered]}>
        <BlurView intensity={20} style={styles.upgradeCard}>
          <Ionicons name="headset-outline" size={64} color="white" style={{ opacity: 0.7 }} />
          <Text style={styles.upgradeTitle}>Priority Support</Text>
          <Text style={styles.upgradeDescription}>
            Get priority access to our support team with faster response times and dedicated assistance.
          </Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={MODERN_COLORS.success} />
              <Text style={styles.featureText}>24-hour response time</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={MODERN_COLORS.success} />
              <Text style={styles.featureText}>Dedicated support agent</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={MODERN_COLORS.success} />
              <Text style={styles.featureText}>Phone & video call support</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('SubscriptionPlans' as never)}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Professional</Text>
          </TouchableOpacity>
        </BlurView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[MODERN_COLORS.primary, MODERN_COLORS.primaryDark]} style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Priority Support</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setShowCreateTicket(true)}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.supportInfo}>
          <BlurView intensity={20} style={styles.infoCard}>
            <Ionicons name="time-outline" size={24} color={MODERN_COLORS.success} />
            <Text style={styles.infoText}>Response time: Under 24 hours</Text>
          </BlurView>
        </View>

        <View style={styles.ticketsSection}>
          <Text style={styles.sectionTitle}>Your Support Tickets</Text>
          {tickets.length === 0 ? (
            <BlurView intensity={20} style={styles.emptyState}>
              <Ionicons name="ticket-outline" size={48} color="rgba(255, 255, 255, 0.5)" />
              <Text style={styles.emptyStateText}>No support tickets yet</Text>
              <Text style={styles.emptyStateSubtext}>Create your first ticket to get help</Text>
            </BlurView>
          ) : (
            <View style={styles.ticketsList}>
              {tickets.map(renderTicketItem)}
            </View>
          )}
        </View>
      </ScrollView>

      {showCreateTicket && renderCreateTicketForm()}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  loadingContainer: {
    padding: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: SPACING.md,
  },
  upgradeCard: {
    padding: SPACING.xl,
    borderRadius: 20,
    alignItems: 'center',
    margin: SPACING.lg,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  upgradeDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 24,
  },
  featureList: {
    marginBottom: SPACING.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  featureText: {
    color: 'white',
    fontSize: 16,
    marginLeft: SPACING.sm,
  },
  upgradeButton: {
    backgroundColor: MODERN_COLORS.success,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  createButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportInfo: {
    marginBottom: SPACING.lg,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
  },
  infoText: {
    color: 'white',
    fontSize: 16,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  ticketsSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: SPACING.md,
  },
  emptyState: {
    padding: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginTop: SPACING.md,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: SPACING.sm,
  },
  ticketsList: {
    gap: SPACING.md,
  },
  ticketCard: {
    padding: SPACING.lg,
    borderRadius: 16,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketSubject: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: SPACING.xs,
  },
  ticketDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  ticketBadges: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  ticketDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  responseSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: SPACING.md,
  },
  responseHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: SPACING.xs,
  },
  responseText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  createTicketModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  createTicketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  createTicketTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: SPACING.sm,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: SPACING.md,
    color: 'white',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  priorityOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: MODERN_COLORS.success,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PrioritySupportScreen;
