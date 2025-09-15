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

interface ChairRental {
  id: number;
  locationName: string;
  chairNumber: string;
  monthlyRent: number;
  depositAmount: number;
  renterName?: string;
  status: string;
  rentalStartDate?: string;
  rentalEndDate?: string;
  description: string;
  amenities: string[];
  createdAt: string;
}

interface ChairRentalAnalytics {
  totalChairs: number;
  rentedChairs: number;
  availableChairs: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  averageRent: number;
  occupancyRate: number;
  recentRentals: ChairRental[];
  pendingPayments: any[];
}

interface ChairRentalScreenProps {
  navigation: any;
}

const ChairRentalScreen: React.FC<ChairRentalScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [chairs, setChairs] = useState<ChairRental[]>([]);
  const [analytics, setAnalytics] = useState<ChairRentalAnalytics | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'chairs' | 'analytics'>('overview');
  const [locations, setLocations] = useState<any[]>([]);
  const [newChair, setNewChair] = useState({
    locationId: '',
    chairNumber: '',
    monthlyRent: '',
    depositAmount: '',
    description: '',
    amenities: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [chairsResponse, analyticsResponse, locationsResponse] = await Promise.all([
        ApiService.getChairRentals(),
        ApiService.getChairRentalAnalytics(),
        ApiService.getBusinessLocations()
      ]);
      
      setChairs(chairsResponse || []);
      setAnalytics(analyticsResponse);
      setLocations(locationsResponse || []);
    } catch (error: any) {
      console.error('Error loading chair rental data:', error);
      if (error.response?.status === 400) {
        Alert.alert('Access Denied', 'Chair rental management requires a Business plan subscription.');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to load chair rental data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const createChair = async () => {
    if (!newChair.locationId || !newChair.chairNumber || !newChair.monthlyRent) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    try {
      setSaving(true);
      await ApiService.createChairRental({
        locationId: newChair.locationId,
        chairNumber: newChair.chairNumber,
        monthlyRent: parseFloat(newChair.monthlyRent),
        depositAmount: parseFloat(newChair.depositAmount) || 0,
        description: newChair.description,
        amenities: newChair.amenities
      });
      
      Alert.alert('Success', 'Chair rental created successfully!');
      setShowAddModal(false);
      setNewChair({
        locationId: '',
        chairNumber: '',
        monthlyRent: '',
        depositAmount: '',
        description: '',
        amenities: [],
      });
      loadData();
    } catch (error: any) {
      console.error('Error creating chair:', error);
      Alert.alert('Error', 'Failed to create chair rental.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available': return MODERN_COLORS.success;
      case 'rented': return MODERN_COLORS.primary;
      case 'maintenance': return MODERN_COLORS.warning;
      default: return MODERN_COLORS.gray500;
    }
  };

  const ChairCard: React.FC<{ chair: ChairRental }> = ({ chair }) => (
    <View style={styles.chairCard}>
      <View style={styles.chairHeader}>
        <View style={styles.chairInfo}>
          <Text style={styles.chairNumber}>Chair {chair.chairNumber}</Text>
          <Text style={styles.chairLocation}>{chair.locationName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(chair.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(chair.status) }]}>
            {chair.status}
          </Text>
        </View>
      </View>

      <View style={styles.chairDetails}>
        <View style={styles.rentInfo}>
          <Text style={styles.rentAmount}>{formatCurrency(chair.monthlyRent)}/month</Text>
          <Text style={styles.depositAmount}>Deposit: {formatCurrency(chair.depositAmount)}</Text>
        </View>

        {chair.renterName && (
          <View style={styles.renterInfo}>
            <Ionicons name="person" size={16} color={MODERN_COLORS.gray500} />
            <Text style={styles.renterName}>{chair.renterName}</Text>
          </View>
        )}

        {chair.description && (
          <Text style={styles.chairDescription}>{chair.description}</Text>
        )}

        {chair.amenities.length > 0 && (
          <View style={styles.amenitiesContainer}>
            {chair.amenities.map((amenity, index) => (
              <View key={index} style={styles.amenityTag}>
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.chairActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="pencil" size={16} color={MODERN_COLORS.primary} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="cash" size={16} color={MODERN_COLORS.success} />
          <Text style={styles.actionButtonText}>Payments</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const OverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      {analytics && (
        <>
          {/* Analytics Cards */}
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsValue}>{analytics.totalChairs}</Text>
              <Text style={styles.analyticsLabel}>Total Chairs</Text>
            </View>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsValue}>{analytics.rentedChairs}</Text>
              <Text style={styles.analyticsLabel}>Rented</Text>
            </View>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsValue}>{analytics.availableChairs}</Text>
              <Text style={styles.analyticsLabel}>Available</Text>
            </View>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsValue}>{Math.round(analytics.occupancyRate)}%</Text>
              <Text style={styles.analyticsLabel}>Occupancy</Text>
            </View>
          </View>

          {/* Revenue Cards */}
          <View style={styles.revenueGrid}>
            <View style={styles.revenueCard}>
              <Text style={styles.revenueValue}>{formatCurrency(analytics.monthlyRevenue)}</Text>
              <Text style={styles.revenueLabel}>This Month</Text>
            </View>
            <View style={styles.revenueCard}>
              <Text style={styles.revenueValue}>{formatCurrency(analytics.yearlyRevenue)}</Text>
              <Text style={styles.revenueLabel}>This Year</Text>
            </View>
          </View>

          {/* Recent Rentals */}
          {analytics.recentRentals.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Rentals</Text>
              {analytics.recentRentals.map((rental) => (
                <ChairCard key={rental.id} chair={rental} />
              ))}
            </View>
          )}

          {/* Pending Payments */}
          {analytics.pendingPayments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pending Payments</Text>
              {analytics.pendingPayments.map((payment, index) => (
                <View key={index} style={styles.paymentCard}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                    <Text style={styles.paymentType}>{payment.paymentType}</Text>
                    <Text style={styles.paymentDue}>Due: {new Date(payment.dueDate).toLocaleDateString()}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.markPaidButton}
                    onPress={() => {
                      Alert.alert(
                        'Mark as Paid',
                        'Mark this payment as received?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Mark Paid', 
                            onPress: async () => {
                              try {
                                await ApiService.markChairPaymentAsPaid(payment.id);
                                loadData();
                                Alert.alert('Success', 'Payment marked as paid.');
                              } catch (error) {
                                Alert.alert('Error', 'Failed to mark payment as paid.');
                              }
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.markPaidText}>Mark Paid</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );

  const ChairsTab = () => (
    <ScrollView style={styles.tabContent}>
      {chairs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="home" size={64} color={MODERN_COLORS.gray400} />
          <Text style={styles.emptyStateTitle}>No chairs yet</Text>
          <Text style={styles.emptyStateText}>
            Create your first chair rental to start earning passive income
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.emptyStateButtonText}>Add Chair</Text>
          </TouchableOpacity>
        </View>
      ) : (
        chairs.map((chair) => (
          <ChairCard key={chair.id} chair={chair} />
        ))
      )}
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MODERN_COLORS.primary} />
          <Text style={styles.loadingText}>Loading chair rentals...</Text>
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
        <Text style={styles.headerTitle}>Chair Rental</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color={MODERN_COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chairs' && styles.activeTab]}
          onPress={() => setActiveTab('chairs')}
        >
          <Text style={[styles.tabText, activeTab === 'chairs' && styles.activeTabText]}>
            Chairs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'chairs' && <ChairsTab />}
      {activeTab === 'analytics' && <OverviewTab />}

      {/* Add Chair Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Chair</Text>
            <TouchableOpacity
              style={[styles.modalSaveButton, saving && styles.savingButton]}
              onPress={createChair}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={MODERN_COLORS.white} />
              ) : (
                <Text style={styles.modalSaveText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView}>
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Chair Details</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Location *</Text>
                <View style={styles.pickerContainer}>
                  {/* Simple picker simulation - in real app use proper picker */}
                  <TouchableOpacity style={styles.picker}>
                    <Text style={styles.pickerText}>
                      {locations.find(loc => loc.id.toString() === newChair.locationId)?.name || 'Select Location'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={MODERN_COLORS.gray500} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Chair Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newChair.chairNumber}
                  onChangeText={(text) => setNewChair(prev => ({ ...prev, chairNumber: text }))}
                  placeholder="e.g., A1, B2, Station 1"
                  placeholderTextColor={MODERN_COLORS.gray400}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Monthly Rent *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newChair.monthlyRent}
                    onChangeText={(text) => setNewChair(prev => ({ ...prev, monthlyRent: text }))}
                    placeholder="0"
                    placeholderTextColor={MODERN_COLORS.gray400}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Security Deposit</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newChair.depositAmount}
                    onChangeText={(text) => setNewChair(prev => ({ ...prev, depositAmount: text }))}
                    placeholder="0"
                    placeholderTextColor={MODERN_COLORS.gray400}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={newChair.description}
                  onChangeText={(text) => setNewChair(prev => ({ ...prev, description: text }))}
                  placeholder="Describe this chair rental..."
                  placeholderTextColor={MODERN_COLORS.gray400}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </ScrollView>
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
    fontSize: TYPOGRAPHY.md,
    color: MODERN_COLORS.gray600,
  },
  activeTabText: {
    color: MODERN_COLORS.primary,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  analyticsCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: MODERN_COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  analyticsValue: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: '700',
    color: MODERN_COLORS.primary,
  },
  analyticsLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    marginTop: SPACING.xs,
  },
  revenueGrid: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  revenueCard: {
    flex: 1,
    backgroundColor: MODERN_COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  revenueValue: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: MODERN_COLORS.success,
  },
  revenueLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    marginTop: SPACING.xs,
  },
  section: {
    margin: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: MODERN_COLORS.text,
    marginBottom: SPACING.md,
  },
  chairCard: {
    backgroundColor: MODERN_COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  chairHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  chairInfo: {
    flex: 1,
  },
  chairNumber: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: MODERN_COLORS.text,
  },
  chairLocation: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    marginTop: SPACING.xs,
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
  chairDetails: {
    marginBottom: SPACING.md,
  },
  rentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  rentAmount: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: MODERN_COLORS.success,
  },
  depositAmount: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
  },
  renterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  renterName: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.text,
  },
  chairDescription: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    marginBottom: SPACING.sm,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  amenityTag: {
    backgroundColor: MODERN_COLORS.gray100,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  amenityText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
  },
  chairActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: MODERN_COLORS.gray300,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
    color: MODERN_COLORS.text,
  },
  paymentCard: {
    backgroundColor: MODERN_COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: MODERN_COLORS.warning,
    ...SHADOWS.sm,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: MODERN_COLORS.text,
  },
  paymentType: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    marginTop: SPACING.xs,
  },
  paymentDue: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.warning,
    marginTop: SPACING.xs,
  },
  markPaidButton: {
    backgroundColor: MODERN_COLORS.success,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  markPaidText: {
    color: MODERN_COLORS.white,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    margin: SPACING.md,
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
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.md,
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
    height: 80,
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
});

export default ChairRentalScreen;
