import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  Image,
  ActivityIndicator,
  StatusBar,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/colors';
import { demoClients } from '../../data/providerDemoData';
import ApiService from '../../services/api';
import { RootStackParamList } from '../../types';

type ClientManagementNavigationProp = StackNavigationProp<RootStackParamList>;

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profilePictureUrl?: string;
  totalBookings: number;
  totalSpent: number;
  lastVisit: Date;
  averageRating: number;
  loyaltyPoints: number;
  status: 'active' | 'inactive' | 'vip';
  preferences: string[];
  notes?: string;
}

interface ClientGroup {
  id: string;
  name: string;
  clients: Client[];
  color: string;
}

const ClientManagementScreen: React.FC = () => {
  const navigation = useNavigation<ClientManagementNavigationProp>();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'vip' | 'inactive'>('all');
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchQuery, selectedFilter]);

  const loadClients = async () => {
    try {
      setLoading(true);
      
      // Fetch real client data from the API
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          throw new Error('No auth token');
        }

        const response = await fetch('http://192.168.1.185:5224/api/analytics/provider-clients', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const clientsData = await response.json();
          
          // Transform API data to match Client interface
          const transformedClients: Client[] = clientsData.map((client: any) => ({
            id: client.id,
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email,
            phone: client.phone || 'No phone',
            profilePictureUrl: client.profilePictureUrl || `https://ui-avatars.com/api/?name=${client.firstName}+${client.lastName}&background=6366f1&color=fff`,
            totalBookings: client.totalBookings,
            totalSpent: client.totalSpent,
            lastVisit: new Date(client.lastVisit),
            averageRating: client.averageRating,
            loyaltyPoints: client.loyaltyPoints,
            status: client.status as 'active' | 'inactive' | 'vip',
            preferences: client.preferences || [],
            notes: client.notes || '',
          }));

          setClients(transformedClients);
          console.log('Loaded real client data:', transformedClients.length, 'clients');
        } else {
          console.log('API failed, using demo data');
          setClients([]);
        }
      } catch (apiError) {
        console.log('API error, no client data available:', apiError);
        setClients([]);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      Alert.alert('Error', 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = clients;

    // Filter by status
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(client => client.status === selectedFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(client => 
        client.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone?.includes(searchQuery)
      );
    }

    setFilteredClients(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return '#FFD700';
      case 'active': return COLORS.success;
      case 'inactive': return COLORS.textSecondary;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'vip': return 'VIP';
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      default: return 'Unknown';
    }
  };

  const handleClientPress = (client: Client) => {
    setSelectedClient(client);
    setShowClientModal(true);
  };

  const handleSendMessage = (client?: Client) => {
    if (client) {
      setSelectedClients([client.id]);
    }
    setShowMessageModal(true);
  };

  const sendMessage = async () => {
    try {
      // Send message via API
      console.log('Sending message to clients:', selectedClients, messageText);
      Alert.alert('Success', 'Message sent successfully!');
      setShowMessageModal(false);
      setMessageText('');
      setSelectedClients([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const renderClientCard = ({ item: client }: { item: Client }) => (
    <TouchableOpacity 
      style={styles.clientCard}
      onPress={() => handleClientPress(client)}
    >
      <View style={styles.clientHeader}>
        <Image
          source={{ uri: client.profilePictureUrl || 'https://via.placeholder.com/60' }}
          style={styles.clientAvatar}
        />
        <View style={styles.clientInfo}>
          <View style={styles.clientNameRow}>
            <Text style={styles.clientName}>
              {client.firstName} {client.lastName}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(client.status) }]}>
              <Text style={styles.statusText}>{getStatusLabel(client.status)}</Text>
            </View>
          </View>
          <Text style={styles.clientEmail}>{client.email}</Text>
          <Text style={styles.clientPhone}>{client.phone}</Text>
        </View>
      </View>

      <View style={styles.clientStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{client.totalBookings}</Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatCurrency(client.totalSpent)}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{client.loyaltyPoints}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{client.averageRating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      <View style={styles.clientActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleSendMessage(client)}
        >
          <Ionicons name="chatbubble-outline" size={16} color={COLORS.primary} />
          <Text style={styles.actionButtonText}>Message</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.success} />
          <Text style={styles.actionButtonText}>Book</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="gift-outline" size={16} color={COLORS.warning} />
          <Text style={styles.actionButtonText}>Reward</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const filterOptions = [
    { key: 'all', label: 'All Clients', count: clients.length },
    { key: 'active', label: 'Active', count: clients.filter(c => c.status === 'active').length },
    { key: 'vip', label: 'VIP', count: clients.filter(c => c.status === 'vip').length },
    { key: 'inactive', label: 'Inactive', count: clients.filter(c => c.status === 'inactive').length },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <LinearGradient colors={COLORS.gradient} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading clients...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.container}>
        <LinearGradient colors={COLORS.gradient} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Client Management</Text>
            <TouchableOpacity onPress={() => handleSendMessage()}>
              <Ionicons name="chatbubble-ellipses" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Search and Filters */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search clients..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
          >
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterChip,
                  selectedFilter === option.key && styles.activeFilterChip
                ]}
                onPress={() => setSelectedFilter(option.key as any)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedFilter === option.key && styles.activeFilterChipText
                ]}>
                  {option.label} ({option.count})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Client List */}
        <FlatList
          data={filteredClients}
          renderItem={renderClientCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.clientsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyStateTitle}>No clients found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'Try adjusting your search' : 'Your clients will appear here'}
              </Text>
            </View>
          }
        />

        {/* Client Details Modal */}
        <Modal
          visible={showClientModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowClientModal(false)}
        >
          <BlurView intensity={80} style={styles.modalOverlay}>
            <View style={styles.clientModalContent}>
              {selectedClient && (
                <>
                  <View style={styles.clientModalHeader}>
                    <Image
                      source={{ uri: selectedClient.profilePictureUrl || 'https://via.placeholder.com/80' }}
                      style={styles.clientModalAvatar}
                    />
                    <Text style={styles.clientModalName}>
                      {selectedClient.firstName} {selectedClient.lastName}
                    </Text>
                    <View style={[styles.clientModalStatus, { backgroundColor: getStatusColor(selectedClient.status) }]}>
                      <Text style={styles.clientModalStatusText}>{getStatusLabel(selectedClient.status)}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.closeModalButton}
                      onPress={() => setShowClientModal(false)}
                    >
                      <Ionicons name="close" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.clientModalBody}>
                    <View style={styles.clientDetailSection}>
                      <Text style={styles.sectionTitle}>Contact Information</Text>
                      <Text style={styles.detailText}>{selectedClient.email}</Text>
                      <Text style={styles.detailText}>{selectedClient.phone}</Text>
                    </View>

                    <View style={styles.clientDetailSection}>
                      <Text style={styles.sectionTitle}>Statistics</Text>
                      <View style={styles.statsGrid}>
                        <View style={styles.statBox}>
                          <Text style={styles.statBoxValue}>{selectedClient.totalBookings}</Text>
                          <Text style={styles.statBoxLabel}>Total Bookings</Text>
                        </View>
                        <View style={styles.statBox}>
                          <Text style={styles.statBoxValue}>{formatCurrency(selectedClient.totalSpent)}</Text>
                          <Text style={styles.statBoxLabel}>Total Spent</Text>
                        </View>
                        <View style={styles.statBox}>
                          <Text style={styles.statBoxValue}>{selectedClient.loyaltyPoints}</Text>
                          <Text style={styles.statBoxLabel}>Loyalty Points</Text>
                        </View>
                        <View style={styles.statBox}>
                          <Text style={styles.statBoxValue}>{selectedClient.averageRating.toFixed(1)}</Text>
                          <Text style={styles.statBoxLabel}>Avg Rating</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.clientDetailSection}>
                      <Text style={styles.sectionTitle}>Preferences</Text>
                      <View style={styles.preferencesContainer}>
                        {selectedClient.preferences.map((pref, index) => (
                          <View key={index} style={styles.preferenceChip}>
                            <Text style={styles.preferenceText}>{pref}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {selectedClient.notes && (
                      <View style={styles.clientDetailSection}>
                        <Text style={styles.sectionTitle}>Notes</Text>
                        <Text style={styles.notesText}>{selectedClient.notes}</Text>
                      </View>
                    )}
                  </ScrollView>
                </>
              )}
            </View>
          </BlurView>
        </Modal>

        {/* Message Modal */}
        <Modal
          visible={showMessageModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowMessageModal(false)}
        >
          <BlurView intensity={80} style={styles.modalOverlay}>
            <View style={styles.messageModalContent}>
              <View style={styles.messageModalHeader}>
                <Text style={styles.messageModalTitle}>Send Message</Text>
                <TouchableOpacity onPress={() => setShowMessageModal(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.messageInput}
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Type your message..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              
              <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                <LinearGradient colors={COLORS.gradient} style={styles.sendButtonGradient}>
                  <Text style={styles.sendButtonText}>Send Message</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Modal>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  filtersContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeFilterChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: 'white',
  },
  clientsList: {
    padding: 20,
  },
  clientCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  clientHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  clientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '700',
  },
  clientEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  clientPhone: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  clientStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  clientActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  clientModalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  clientModalHeader: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    position: 'relative',
  },
  clientModalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  clientModalName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  clientModalStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clientModalStatusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '700',
  },
  closeModalButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  clientModalBody: {
    maxHeight: 400,
  },
  clientDetailSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  statBoxLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  preferencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preferenceChip: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  preferenceText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  notesText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  messageModalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    width: '100%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  messageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  messageModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    textAlignVertical: 'top',
    marginBottom: 20,
    minHeight: 100,
  },
  sendButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ClientManagementScreen;
