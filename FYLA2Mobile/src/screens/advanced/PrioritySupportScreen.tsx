import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ApiService from '../../services/apiService';

// Theme constants
const MODERN_COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1D1D1F',
  gray100: '#F2F2F7',
  gray300: '#C7C7CC',
  gray400: '#AEAEB2',
  gray500: '#8E8E93',
  gray600: '#636366',
  white: '#FFFFFF',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  purple: '#AF52DE',
  indigo: '#5856D6',
  teal: '#5AC8FA',
  orange: '#FF9500',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const TYPOGRAPHY = {
  sm: 12,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
};

const BORDER_RADIUS = {
  md: 8,
  lg: 12,
};

const SHADOWS = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
};

interface SupportTicket {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  submittedAt: string;
  lastUpdated: string;
  responseTime: string;
  messages: SupportMessage[];
}

interface SupportMessage {
  id: number;
  message: string;
  isFromSupport: boolean;
  sentAt: string;
  senderName: string;
}

interface PrioritySupportScreenProps {
  navigation: any;
}

const PrioritySupportScreen: React.FC<PrioritySupportScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'closed'>('all');
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'general',
  });
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getSupportTickets();
      setTickets(response || []);
    } catch (error: any) {
      console.error('Error loading support tickets:', error);
      if (error.response?.status === 400) {
        Alert.alert('Access Denied', 'Priority support requires a Business plan subscription.');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to load support tickets.');
      }
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async () => {
    if (!newTicket.title || !newTicket.description) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    try {
      setSaving(true);
      await ApiService.createSupportTicket({
        title: newTicket.title,
        description: newTicket.description,
        priority: newTicket.priority,
        category: newTicket.category,
      });
      
      Alert.alert('Success', 'Support ticket created successfully! Our team will respond within 1 hour.');
      setShowCreateModal(false);
      setNewTicket({
        title: '',
        description: '',
        priority: 'medium',
        category: 'general',
      });
      loadTickets();
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      Alert.alert('Error', 'Failed to create support ticket.');
    } finally {
      setSaving(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      await ApiService.addSupportTicketMessage(selectedTicket.id, {
        message: newMessage.trim()
      });
      setNewMessage('');
      // Reload ticket details
      loadTickets();
    } catch (error) {
      Alert.alert('Error', 'Failed to send message.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return MODERN_COLORS.error;
      case 'medium': return MODERN_COLORS.warning;
      case 'low': return MODERN_COLORS.success;
      default: return MODERN_COLORS.gray500;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return MODERN_COLORS.primary;
      case 'in_progress': return MODERN_COLORS.warning;
      case 'resolved': return MODERN_COLORS.success;
      case 'closed': return MODERN_COLORS.gray500;
      default: return MODERN_COLORS.gray500;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'technical': return 'build';
      case 'billing': return 'card';
      case 'feature_request': return 'bulb';
      case 'bug_report': return 'bug';
      case 'account': return 'person';
      default: return 'help-circle';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredTickets = tickets.filter(ticket => {
    switch (activeTab) {
      case 'open': return ticket.status !== 'closed' && ticket.status !== 'resolved';
      case 'closed': return ticket.status === 'closed' || ticket.status === 'resolved';
      default: return true;
    }
  });

  const TicketCard: React.FC<{ ticket: SupportTicket }> = ({ ticket }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => {
        setSelectedTicket(ticket);
        setShowTicketModal(true);
      }}
    >
      <View style={styles.ticketHeader}>
        <View style={styles.ticketInfo}>
          <View style={styles.ticketTitleRow}>
            <Ionicons 
              name={getCategoryIcon(ticket.category) as any} 
              size={16} 
              color={MODERN_COLORS.gray500} 
            />
            <Text style={styles.ticketTitle} numberOfLines={1}>{ticket.title}</Text>
          </View>
          <Text style={styles.ticketDescription} numberOfLines={2}>
            {ticket.description}
          </Text>
        </View>
        <View style={styles.ticketBadges}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) + '20' }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(ticket.priority) }]}>
              {ticket.priority.toUpperCase()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
              {ticket.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.ticketFooter}>
        <View style={styles.ticketMeta}>
          <Text style={styles.ticketTime}>Created {formatRelativeTime(ticket.submittedAt)}</Text>
          <Text style={styles.ticketResponse}>Response: {ticket.responseTime}</Text>
        </View>
        <View style={styles.messageCount}>
          <Ionicons name="chatbubble" size={14} color={MODERN_COLORS.gray500} />
          <Text style={styles.messageCountText}>{ticket.messages.length}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const MessageBubble: React.FC<{ message: SupportMessage }> = ({ message }) => (
    <View style={[
      styles.messageBubble,
      message.isFromSupport ? styles.supportMessage : styles.userMessage
    ]}>
      <View style={styles.messageHeader}>
        <Text style={[
          styles.messageSender,
          { color: message.isFromSupport ? MODERN_COLORS.primary : MODERN_COLORS.text }
        ]}>
          {message.senderName}
        </Text>
        <Text style={styles.messageTime}>{formatRelativeTime(message.sentAt)}</Text>
      </View>
      <Text style={[
        styles.messageText,
        { color: message.isFromSupport ? MODERN_COLORS.primary : MODERN_COLORS.text }
      ]}>
        {message.message}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MODERN_COLORS.primary} />
          <Text style={styles.loadingText}>Loading support tickets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={MODERN_COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Priority Support</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color={MODERN_COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Priority Support Info */}
      <View style={styles.priorityInfoCard}>
        <View style={styles.priorityIcon}>
          <Ionicons name="flash" size={24} color={MODERN_COLORS.warning} />
        </View>
        <View style={styles.priorityInfo}>
          <Text style={styles.priorityTitle}>Business Plan Priority Support</Text>
          <Text style={styles.priorityDescription}>
            ⚡ 1 hour response time • 📞 Direct phone support • 🎯 Dedicated specialist
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All ({tickets.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'open' && styles.activeTab]}
          onPress={() => setActiveTab('open')}
        >
          <Text style={[styles.tabText, activeTab === 'open' && styles.activeTabText]}>
            Open ({tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'closed' && styles.activeTab]}
          onPress={() => setActiveTab('closed')}
        >
          <Text style={[styles.tabText, activeTab === 'closed' && styles.activeTabText]}>
            Closed ({tickets.filter(t => t.status === 'closed' || t.status === 'resolved').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tickets List */}
      <ScrollView style={styles.ticketsList}>
        {filteredTickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="headset" size={64} color={MODERN_COLORS.gray400} />
            <Text style={styles.emptyStateTitle}>No support tickets</Text>
            <Text style={styles.emptyStateText}>
              Need help? Create a support ticket and get priority assistance from our team.
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.emptyStateButtonText}>Create Ticket</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))
        )}
      </ScrollView>

      {/* Create Ticket Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Support Ticket</Text>
            <TouchableOpacity
              style={[styles.modalSaveButton, saving && styles.savingButton]}
              onPress={createTicket}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={MODERN_COLORS.white} />
              ) : (
                <Text style={styles.modalSaveText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView}>
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Issue Details</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Subject *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newTicket.title}
                  onChangeText={(text) => setNewTicket(prev => ({ ...prev, title: text }))}
                  placeholder="Brief description of your issue"
                  placeholderTextColor={MODERN_COLORS.gray400}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity style={styles.picker}>
                    <Text style={styles.pickerText}>
                      {newTicket.category.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={MODERN_COLORS.gray500} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Priority</Text>
                <View style={styles.priorityButtons}>
                  {['low', 'medium', 'high'].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityButton,
                        newTicket.priority === priority && styles.selectedPriorityButton,
                        { borderColor: getPriorityColor(priority) }
                      ]}
                      onPress={() => setNewTicket(prev => ({ ...prev, priority }))}
                    >
                      <Text style={[
                        styles.priorityButtonText,
                        newTicket.priority === priority && { color: getPriorityColor(priority) }
                      ]}>
                        {priority.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={newTicket.description}
                  onChangeText={(text) => setNewTicket(prev => ({ ...prev, description: text }))}
                  placeholder="Please provide detailed information about your issue..."
                  placeholderTextColor={MODERN_COLORS.gray400}
                  multiline
                  numberOfLines={6}
                />
              </View>
            </View>

            <View style={styles.prioritySupportInfo}>
              <Text style={styles.prioritySupportTitle}>🚀 Business Plan Benefits</Text>
              <Text style={styles.prioritySupportText}>
                • Priority queue - 1 hour response time{'\n'}
                • Direct phone support during business hours{'\n'}
                • Dedicated technical specialist{'\n'}
                • Screen sharing and remote assistance
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Ticket Detail Modal */}
      <Modal
        visible={showTicketModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTicketModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Ticket #{selectedTicket?.id}</Text>
            <View style={styles.ticketStatusContainer}>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: selectedTicket ? getStatusColor(selectedTicket.status) : MODERN_COLORS.gray300 }
              ]} />
            </View>
          </View>

          {selectedTicket && (
            <View style={styles.ticketDetailContainer}>
              <View style={styles.ticketDetailHeader}>
                <Text style={styles.ticketDetailTitle}>{selectedTicket.title}</Text>
                <View style={styles.ticketDetailMeta}>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedTicket.priority) + '20' }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(selectedTicket.priority) }]}>
                      {selectedTicket.priority.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.ticketDetailTime}>
                    Created {formatRelativeTime(selectedTicket.submittedAt)}
                  </Text>
                </View>
              </View>

              <FlatList
                data={selectedTicket.messages}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <MessageBubble message={item} />}
                style={styles.messagesList}
                showsVerticalScrollIndicator={false}
              />

              <View style={styles.messageInputContainer}>
                <TextInput
                  style={styles.messageInput}
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder="Type your message..."
                  placeholderTextColor={MODERN_COLORS.gray400}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
                  onPress={sendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Ionicons name="send" size={20} color={MODERN_COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.md,
    color: MODERN_COLORS.gray600,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.gray100,
    backgroundColor: MODERN_COLORS.surface,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '600',
    color: MODERN_COLORS.text,
  },
  addButton: {
    backgroundColor: MODERN_COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MODERN_COLORS.warning + '10',
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderLeftWidth: 4,
    borderLeftColor: MODERN_COLORS.warning,
  },
  priorityIcon: {
    marginRight: SPACING.md,
  },
  priorityInfo: {
    flex: 1,
  },
  priorityTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
    color: MODERN_COLORS.text,
  },
  priorityDescription: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    marginTop: SPACING.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: MODERN_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.gray100,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: MODERN_COLORS.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
  },
  activeTabText: {
    color: MODERN_COLORS.primary,
    fontWeight: '600',
  },
  ticketsList: {
    flex: 1,
    padding: SPACING.md,
  },
  ticketCard: {
    backgroundColor: MODERN_COLORS.surface,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  ticketHeader: {
    marginBottom: SPACING.md,
  },
  ticketInfo: {
    marginBottom: SPACING.sm,
  },
  ticketTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  ticketTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
    color: MODERN_COLORS.text,
    flex: 1,
  },
  ticketDescription: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    lineHeight: 18,
  },
  ticketBadges: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  priorityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  priorityText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  statusText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: MODERN_COLORS.gray100,
  },
  ticketMeta: {
    flex: 1,
  },
  ticketTime: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray500,
  },
  ticketResponse: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.primary,
    marginTop: SPACING.xs,
  },
  messageCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  messageCountText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray500,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: MODERN_COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  emptyStateTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '600',
    color: MODERN_COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.md,
    color: MODERN_COLORS.gray600,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  emptyStateButton: {
    backgroundColor: MODERN_COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  emptyStateButtonText: {
    color: MODERN_COLORS.white,
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.gray100,
    backgroundColor: MODERN_COLORS.surface,
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  modalCloseText: {
    fontSize: TYPOGRAPHY.md,
    color: MODERN_COLORS.primary,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '600',
    color: MODERN_COLORS.text,
  },
  modalSaveButton: {
    backgroundColor: MODERN_COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 60,
    alignItems: 'center',
  },
  savingButton: {
    opacity: 0.7,
  },
  modalSaveText: {
    color: MODERN_COLORS.white,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
  },
  modalScrollView: {
    flex: 1,
  },
  formSection: {
    backgroundColor: MODERN_COLORS.surface,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  formSectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: MODERN_COLORS.text,
    marginBottom: SPACING.md,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
    color: MODERN_COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: MODERN_COLORS.gray300,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.md,
    color: MODERN_COLORS.text,
    backgroundColor: MODERN_COLORS.white,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: MODERN_COLORS.gray300,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: MODERN_COLORS.white,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  pickerText: {
    fontSize: TYPOGRAPHY.md,
    color: MODERN_COLORS.text,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  selectedPriorityButton: {
    backgroundColor: MODERN_COLORS.gray100,
  },
  priorityButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
    color: MODERN_COLORS.gray600,
  },
  prioritySupportInfo: {
    backgroundColor: MODERN_COLORS.primary + '10',
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderLeftWidth: 4,
    borderLeftColor: MODERN_COLORS.primary,
  },
  prioritySupportTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
    color: MODERN_COLORS.text,
    marginBottom: SPACING.xs,
  },
  prioritySupportText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    lineHeight: 20,
  },
  ticketStatusContainer: {
    padding: SPACING.xs,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  ticketDetailContainer: {
    flex: 1,
  },
  ticketDetailHeader: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.gray100,
    backgroundColor: MODERN_COLORS.surface,
  },
  ticketDetailTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '600',
    color: MODERN_COLORS.text,
    marginBottom: SPACING.sm,
  },
  ticketDetailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  ticketDetailTime: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  messageBubble: {
    marginVertical: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    maxWidth: '80%',
  },
  supportMessage: {
    backgroundColor: MODERN_COLORS.primary + '10',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: SPACING.xs,
  },
  userMessage: {
    backgroundColor: MODERN_COLORS.gray100,
    alignSelf: 'flex-end',
    borderBottomRightRadius: SPACING.xs,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  messageSender: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
  },
  messageTime: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray500,
  },
  messageText: {
    fontSize: TYPOGRAPHY.md,
    lineHeight: 20,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: MODERN_COLORS.gray100,
    backgroundColor: MODERN_COLORS.surface,
    gap: SPACING.sm,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: MODERN_COLORS.gray300,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.md,
    color: MODERN_COLORS.text,
    backgroundColor: MODERN_COLORS.white,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: MODERN_COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: MODERN_COLORS.gray300,
  },
});

export default PrioritySupportScreen;
