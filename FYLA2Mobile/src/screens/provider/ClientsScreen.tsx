import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  totalSpent: number;
  lastVisit: string;
  averageRating: number;
  preferredServices: string[];
  notes?: string;
  avatar?: string;
}

const ClientsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'vip' | 'new' | 'inactive'>('all');
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [clients] = useState<Client[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '+1 234 567 8901',
      totalBookings: 15,
      totalSpent: 1200,
      lastVisit: '2025-07-20',
      averageRating: 5.0,
      preferredServices: ['Hair Cut', 'Color'],
      notes: 'Prefers natural looks, allergic to certain dyes',
    },
    {
      id: '2',
      name: 'Emma Davis',
      email: 'emma@example.com',
      phone: '+1 234 567 8902',
      totalBookings: 8,
      totalSpent: 640,
      lastVisit: '2025-07-18',
      averageRating: 4.8,
      preferredServices: ['Hair Cut', 'Styling'],
    },
    {
      id: '3',
      name: 'Lisa Chen',
      email: 'lisa@example.com',
      phone: '+1 234 567 8903',
      totalBookings: 22,
      totalSpent: 2200,
      lastVisit: '2025-07-19',
      averageRating: 4.9,
      preferredServices: ['Color', 'Highlights', 'Treatment'],
      notes: 'VIP client, books monthly appointments',
    },
    {
      id: '4',
      name: 'Maria Garcia',
      email: 'maria@example.com',
      phone: '+1 234 567 8904',
      totalBookings: 3,
      totalSpent: 240,
      lastVisit: '2025-07-15',
      averageRating: 4.7,
      preferredServices: ['Hair Cut'],
    },
  ]);

  const filterOptions = [
    { key: 'all', label: 'All Clients' },
    { key: 'vip', label: 'VIP' },
    { key: 'new', label: 'New' },
    { key: 'inactive', label: 'Inactive' },
  ];

  const getClientCategory = (client: Client) => {
    if (client.totalSpent > 1000) return 'vip';
    if (client.totalBookings <= 3) return 'new';
    const daysSinceLastVisit = Math.floor((Date.now() - new Date(client.lastVisit).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastVisit > 30) return 'inactive';
    return 'regular';
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (selectedFilter === 'all') return true;
    return getClientCategory(client) === selectedFilter;
  });

  const openClientModal = (client: Client) => {
    setSelectedClient(client);
    setShowClientModal(true);
  };

  const renderClient = ({ item }: { item: Client }) => {
    const category = getClientCategory(item);
    const categoryColors = {
      vip: '#FFD700',
      new: '#4ECDC4',
      inactive: '#E74C3C',
      regular: '#95A5A6',
    };

    return (
      <TouchableOpacity
        style={styles.clientCard}
        onPress={() => openClientModal(item)}
      >
        <View style={styles.clientHeader}>
          <View style={styles.clientAvatar}>
            <Text style={styles.clientInitials}>
              {item.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <View style={styles.clientInfo}>
            <View style={styles.clientNameRow}>
              <Text style={styles.clientName}>{item.name}</Text>
              <View style={[styles.categoryBadge, { backgroundColor: categoryColors[category] }]}>
                <Text style={styles.categoryText}>{category.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.clientEmail}>{item.email}</Text>
            <Text style={styles.clientPhone}>{item.phone}</Text>
          </View>
        </View>

        <View style={styles.clientStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.totalBookings}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${item.totalSpent}</Text>
            <Text style={styles.statLabel}>Spent</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.statValue}>{item.averageRating}</Text>
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <View style={styles.clientServices}>
          <Text style={styles.servicesLabel}>Preferred Services:</Text>
          <View style={styles.servicesTags}>
            {item.preferredServices.slice(0, 3).map((service, index) => (
              <View key={index} style={styles.serviceTag}>
                <Text style={styles.serviceTagText}>{service}</Text>
              </View>
            ))}
            {item.preferredServices.length > 3 && (
              <Text style={styles.moreServices}>+{item.preferredServices.length - 3} more</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clients</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="person-add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clients..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

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
        data={filteredClients}
        renderItem={renderClient}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Client Detail Modal */}
      <Modal
        visible={showClientModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Client Details</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowClientModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {selectedClient && (
            <View style={styles.modalContent}>
              <View style={styles.clientDetailHeader}>
                <View style={[styles.clientAvatar, { width: 80, height: 80 }]}>
                  <Text style={[styles.clientInitials, { fontSize: 24 }]}>
                    {selectedClient.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <View style={styles.clientDetailInfo}>
                  <Text style={styles.clientDetailName}>{selectedClient.name}</Text>
                  <Text style={styles.clientDetailEmail}>{selectedClient.email}</Text>
                  <Text style={styles.clientDetailPhone}>{selectedClient.phone}</Text>
                </View>
              </View>

              <View style={styles.clientDetailStats}>
                <View style={styles.detailStatCard}>
                  <Text style={styles.detailStatValue}>{selectedClient.totalBookings}</Text>
                  <Text style={styles.detailStatLabel}>Total Bookings</Text>
                </View>
                <View style={styles.detailStatCard}>
                  <Text style={styles.detailStatValue}>${selectedClient.totalSpent}</Text>
                  <Text style={styles.detailStatLabel}>Total Spent</Text>
                </View>
                <View style={styles.detailStatCard}>
                  <Text style={styles.detailStatValue}>{selectedClient.averageRating}</Text>
                  <Text style={styles.detailStatLabel}>Avg Rating</Text>
                </View>
              </View>

              {selectedClient.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesTitle}>Notes</Text>
                  <Text style={styles.notesText}>{selectedClient.notes}</Text>
                </View>
              )}

              <View style={styles.actionsSection}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="calendar" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Book Appointment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#4ECDC4' }]}>
                  <Ionicons name="chatbubbles" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#FF6B6B',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: 'white',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  activeFilterButton: {
    backgroundColor: '#FF6B6B',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  listContainer: {
    padding: 15,
  },
  clientCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clientHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientInitials: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clientInfo: {
    flex: 1,
  },
  clientNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  clientEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  clientPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  clientStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientServices: {
    marginTop: 8,
  },
  servicesLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  servicesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  serviceTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  serviceTagText: {
    fontSize: 12,
    color: '#666',
  },
  moreServices: {
    fontSize: 12,
    color: '#FF6B6B',
    fontStyle: 'italic',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  clientDetailHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  clientDetailInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  clientDetailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  clientDetailEmail: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  clientDetailPhone: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  clientDetailStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  detailStatCard: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  detailStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  detailStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  notesSection: {
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default ClientsScreen;
