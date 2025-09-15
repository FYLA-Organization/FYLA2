import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Switch,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/colors';
import ApiService from '../../services/api';
import FeatureGatingService from '../../services/featureGatingService';
import { RootStackParamList } from '../../types';

const { width } = Dimensions.get('window');

type SeatRentalNavigationProp = StackNavigationProp<RootStackParamList>;

interface ChairRental {
  id: string;
  stationNumber: number;
  rentalPrice: number;
  description: string;
  amenities: string[];
  isOccupied: boolean;
  currentRenter?: {
    name: string;
    email: string;
    phone: string;
    startDate: string;
    endDate: string;
  };
  bookings: ChairBooking[];
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  createdAt: string;
  updatedAt: string;
}

interface ChairBooking {
  id: string;
  renterName: string;
  renterEmail: string;
  renterPhone: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
}

interface SeatRentalStats {
  totalChairs: number;
  occupiedChairs: number;
  monthlyRevenue: number;
  pendingBookings: number;
  occupancyRate: number;
}

const SeatRentalScreen: React.FC = () => {
  const navigation = useNavigation<SeatRentalNavigationProp>();
  
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chairs, setChairs] = useState<ChairRental[]>([]);
  const [stats, setStats] = useState<SeatRentalStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedChair, setSelectedChair] = useState<ChairRental | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'chairs' | 'bookings'>('overview');

  // Form states for new chair
  const [newChair, setNewChair] = useState({
    stationNumber: '',
    rentalPrice: '',
    description: '',
    amenities: [] as string[],
  });

  // Form states for new booking
  const [newBooking, setNewBooking] = useState({
    renterName: '',
    renterEmail: '',
    renterPhone: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      // Use canUseAutomatedMarketing as proxy for Business plan features
      const accessResult = await FeatureGatingService.canUseAutomatedMarketing();
      const access = accessResult.allowed;
      setHasAccess(access);
      if (access) {
        await loadData();
      }
    } catch (error) {
      console.error('Error checking access:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Use demo data for now since chair rental APIs don't exist yet
      // TODO: Replace with real API calls when backend is ready
      setChairs(generateDemoChairs());
      setStats({
        totalChairs: 12,
        occupiedChairs: 8,
        monthlyRevenue: 4800,
        pendingBookings: 3,
        occupancyRate: 67,
      });
    } catch (error) {
      console.error('Error loading seat rental data:', error);
      setChairs(generateDemoChairs());
      setStats({
        totalChairs: 12,
        occupiedChairs: 8,
        monthlyRevenue: 4800,
        pendingBookings: 3,
        occupancyRate: 67,
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDemoChairs = (): ChairRental[] => {
    return Array.from({ length: 12 }, (_, index) => ({
      id: `chair-${index + 1}`,
      stationNumber: index + 1,
      rentalPrice: 400 + (index * 50),
      description: `Premium salon chair #${index + 1}`,
      amenities: ['Mirror', 'Storage', 'Power Outlet', 'Good Lighting'],
      isOccupied: Math.random() > 0.3,
      status: Math.random() > 0.3 ? 'occupied' : 'available',
      currentRenter: Math.random() > 0.3 ? {
        name: `Stylist ${index + 1}`,
        email: `stylist${index + 1}@example.com`,
        phone: `(555) 000-${(index + 1).toString().padStart(4, '0')}`,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      } : undefined,
      bookings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddChair = async () => {
    try {
      if (!newChair.stationNumber || !newChair.rentalPrice) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const chairData = {
        ...newChair,
        stationNumber: parseInt(newChair.stationNumber),
        rentalPrice: parseFloat(newChair.rentalPrice),
      };

      // TODO: Replace with real API call when backend is ready
      console.log('Creating chair rental:', chairData);
      
      setShowAddModal(false);
      setNewChair({
        stationNumber: '',
        rentalPrice: '',
        description: '',
        amenities: [],
      });
      await loadData();
      Alert.alert('Success', 'Chair rental created successfully!');
    } catch (error) {
      console.error('Error creating chair rental:', error);
      Alert.alert('Error', 'Failed to create chair rental');
    }
  };

  const handleCreateBooking = async () => {
    try {
      if (!selectedChair || !newBooking.renterName || !newBooking.renterEmail) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const bookingData = {
        ...newBooking,
        chairId: selectedChair.id,
      };

      // TODO: Replace with real API call when backend is ready
      console.log('Creating chair booking:', bookingData);
      
      setShowBookingModal(false);
      setNewBooking({
        renterName: '',
        renterEmail: '',
        renterPhone: '',
        startDate: '',
        endDate: '',
      });
      setSelectedChair(null);
      await loadData();
      Alert.alert('Success', 'Booking created successfully!');
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Error', 'Failed to create booking');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return COLORS.success;
      case 'occupied': return COLORS.primary;
      case 'maintenance': return COLORS.warning;
      case 'reserved': return COLORS.accent;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return 'checkmark-circle';
      case 'occupied': return 'person';
      case 'maintenance': return 'construct';
      case 'reserved': return 'time';
      default: return 'help-circle';
    }
  };

  const renderUpgradePrompt = () => (
    <View style={styles.upgradeContainer}>
      <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.upgradeGradient}>
        <View style={styles.upgradeContent}>
          <Ionicons name="business-outline" size={64} color="#FFFFFF" />
          <Text style={styles.upgradeTitle}>Seat Rental Management</Text>
          <Text style={styles.upgradeSubtitle}>
            Manage chair rentals, track occupancy, and maximize your salon's revenue potential.
          </Text>
          <View style={styles.upgradeFeatures}>
            <View style={styles.upgradeFeature}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.upgradeFeatureText}>Chair inventory management</Text>
            </View>
            <View style={styles.upgradeFeature}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.upgradeFeatureText}>Renter booking system</Text>
            </View>
            <View style={styles.upgradeFeature}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.upgradeFeatureText}>Revenue tracking & analytics</Text>
            </View>
            <View style={styles.upgradeFeature}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.upgradeFeatureText}>Automated payment processing</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('SubscriptionPlans')}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Business Plan</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Ionicons name="business" size={24} color={COLORS.primary} />
        <Text style={styles.statValue}>{stats?.totalChairs || 0}</Text>
        <Text style={styles.statLabel}>Total Chairs</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="person" size={24} color={COLORS.success} />
        <Text style={styles.statValue}>{stats?.occupiedChairs || 0}</Text>
        <Text style={styles.statLabel}>Occupied</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="cash" size={24} color={COLORS.warning} />
        <Text style={styles.statValue}>${(stats?.monthlyRevenue || 0).toLocaleString()}</Text>
        <Text style={styles.statLabel}>Monthly Revenue</Text>
      </View>
      <View style={styles.statCard}>
        <Ionicons name="trending-up" size={24} color={COLORS.accent} />
        <Text style={styles.statValue}>{stats?.occupancyRate || 0}%</Text>
        <Text style={styles.statLabel}>Occupancy Rate</Text>
      </View>
    </View>
  );

  const renderChairCard = (chair: ChairRental) => (
    <TouchableOpacity 
      key={chair.id} 
      style={styles.chairCard}
      onPress={() => {
        setSelectedChair(chair);
        if (chair.status === 'available') {
          setShowBookingModal(true);
        }
      }}
    >
      <View style={styles.chairHeader}>
        <View style={styles.chairInfo}>
          <Text style={styles.chairNumber}>Chair #{chair.stationNumber}</Text>
          <Text style={styles.chairPrice}>${chair.rentalPrice}/month</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(chair.status) }]}>
          <Ionicons name={getStatusIcon(chair.status)} size={16} color="#FFFFFF" />
          <Text style={styles.statusText}>{chair.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.chairDescription}>{chair.description}</Text>
      
      {chair.currentRenter && (
        <View style={styles.renterInfo}>
          <Text style={styles.renterName}>{chair.currentRenter.name}</Text>
          <Text style={styles.renterContact}>{chair.currentRenter.email}</Text>
        </View>
      )}
      
      <View style={styles.amenitiesContainer}>
        {chair.amenities.slice(0, 3).map((amenity, index) => (
          <View key={index} style={styles.amenityTag}>
            <Text style={styles.amenityText}>{amenity}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View>
            {renderStatsCards()}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            </View>
            <View style={styles.activityCard}>
              <Text style={styles.activityText}>• New booking: Chair #3 - Sarah Johnson</Text>
              <Text style={styles.activityText}>• Payment received: Chair #7 - $450</Text>
              <Text style={styles.activityText}>• Maintenance completed: Chair #2</Text>
            </View>
          </View>
        );
      
      case 'chairs':
        return (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Chair Inventory</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddModal(true)}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add Chair</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.chairsGrid}>
              {chairs.map(renderChairCard)}
            </View>
          </View>
        );
      
      case 'bookings':
        return (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Bookings</Text>
            </View>
            <View style={styles.bookingsList}>
              {chairs.filter(chair => chair.currentRenter).map(chair => (
                <View key={chair.id} style={styles.bookingCard}>
                  <View style={styles.bookingHeader}>
                    <Text style={styles.bookingChair}>Chair #{chair.stationNumber}</Text>
                    <Text style={styles.bookingAmount}>${chair.rentalPrice}</Text>
                  </View>
                  <Text style={styles.bookingRenter}>{chair.currentRenter?.name}</Text>
                  <Text style={styles.bookingDates}>
                    {chair.currentRenter?.startDate} - {chair.currentRenter?.endDate}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading seat rental data...</Text>
      </View>
    );
  }

  if (!hasAccess) {
    return renderUpgradePrompt();
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Seat Rental Management</Text>
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        {['overview', 'chairs', 'bookings'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>

      {/* Add Chair Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <BlurView intensity={50} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Chair</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Station Number *</Text>
              <TextInput
                style={styles.input}
                value={newChair.stationNumber}
                onChangeText={(text) => setNewChair({...newChair, stationNumber: text})}
                placeholder="Enter station number"
                keyboardType="numeric"
              />
              
              <Text style={styles.inputLabel}>Monthly Rental Price *</Text>
              <TextInput
                style={styles.input}
                value={newChair.rentalPrice}
                onChangeText={(text) => setNewChair({...newChair, rentalPrice: text})}
                placeholder="Enter rental price"
                keyboardType="numeric"
              />
              
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newChair.description}
                onChangeText={(text) => setNewChair({...newChair, description: text})}
                placeholder="Describe the chair and its features"
                multiline
                numberOfLines={4}
              />
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddChair}
              >
                <Text style={styles.saveButtonText}>Add Chair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* Booking Modal */}
      <Modal visible={showBookingModal} animationType="slide" transparent>
        <BlurView intensity={50} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Book Chair #{selectedChair?.stationNumber}
              </Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Renter Name *</Text>
              <TextInput
                style={styles.input}
                value={newBooking.renterName}
                onChangeText={(text) => setNewBooking({...newBooking, renterName: text})}
                placeholder="Enter renter's full name"
              />
              
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                value={newBooking.renterEmail}
                onChangeText={(text) => setNewBooking({...newBooking, renterEmail: text})}
                placeholder="Enter email address"
                keyboardType="email-address"
              />
              
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={newBooking.renterPhone}
                onChangeText={(text) => setNewBooking({...newBooking, renterPhone: text})}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowBookingModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleCreateBooking}
              >
                <Text style={styles.saveButtonText}>Create Booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
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
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  header: {
    paddingTop: 50,
    paddingBottom: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: SPACING.lg,
    marginTop: -SPACING.md,
    borderRadius: RADIUS.lg,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  
  // Upgrade Prompt Styles
  upgradeContainer: {
    flex: 1,
    margin: SPACING.lg,
  },
  upgradeGradient: {
    flex: 1,
    borderRadius: RADIUS.xl,
  },
  upgradeContent: {
    flex: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  upgradeSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 24,
  },
  upgradeFeatures: {
    marginTop: SPACING.xl,
    alignSelf: 'stretch',
  },
  upgradeFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  upgradeFeatureText: {
    color: '#FFFFFF',
    marginLeft: SPACING.sm,
    fontSize: 16,
  },
  upgradeButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.xl,
  },
  upgradeButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Stats Styles
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: (width - SPACING.lg * 3) / 2,
    backgroundColor: '#FFFFFF',
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Section Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  
  // Activity Styles
  activityCard: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  
  // Chair Styles
  chairsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  chairCard: {
    width: (width - SPACING.lg * 3) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chairHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  chairInfo: {
    flex: 1,
  },
  chairNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  chairPrice: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 2,
  },
  chairDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  renterInfo: {
    marginBottom: SPACING.sm,
  },
  renterName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  renterContact: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityTag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginRight: 4,
    marginBottom: 4,
  },
  amenityText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  
  // Booking Styles
  bookingsList: {
    gap: SPACING.sm,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  bookingChair: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  bookingAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  bookingRenter: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  bookingDates: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalBody: {
    padding: SPACING.lg,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  modalButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.surface,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});

export default SeatRentalScreen;
