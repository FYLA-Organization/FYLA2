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
  Modal,
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
  black: '#000000',
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

interface BusinessLocation {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  isActive: boolean;
  chairCount: number;
  rentedChairCount: number;
  createdAt: string;
}

interface MultiLocationScreenProps {
  navigation: any;
}

const MultiLocationScreen: React.FC<MultiLocationScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: '',
    email: '',
    website: '',
    description: '',
    businessHours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '09:00', close: '17:00', closed: true },
    }
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getBusinessLocations();
      setLocations(response || []);
    } catch (error: any) {
      console.error('Error loading locations:', error);
      if (error.response?.status === 400) {
        Alert.alert('Access Denied', 'Multi-location management requires a Business plan subscription.');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to load business locations.');
      }
    } finally {
      setLoading(false);
    }
  };

  const addLocation = async () => {
    try {
      setSaving(true);
      await ApiService.createBusinessLocation(newLocation);
      Alert.alert('Success', 'Business location added successfully!');
      setShowAddModal(false);
      setNewLocation({
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US',
        phone: '',
        email: '',
        website: '',
        description: '',
        businessHours: {
          monday: { open: '09:00', close: '17:00', closed: false },
          tuesday: { open: '09:00', close: '17:00', closed: false },
          wednesday: { open: '09:00', close: '17:00', closed: false },
          thursday: { open: '09:00', close: '17:00', closed: false },
          friday: { open: '09:00', close: '17:00', closed: false },
          saturday: { open: '09:00', close: '17:00', closed: false },
          sunday: { open: '09:00', close: '17:00', closed: true },
        }
      });
      loadLocations();
    } catch (error: any) {
      console.error('Error adding location:', error);
      Alert.alert('Error', 'Failed to add business location.');
    } finally {
      setSaving(false);
    }
  };

  const LocationCard: React.FC<{ location: BusinessLocation }> = ({ location }) => (
    <View style={styles.locationCard}>
      <View style={styles.locationHeader}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationName}>{location.name}</Text>
          <Text style={styles.locationAddress}>
            {location.address}, {location.city}, {location.state} {location.zipCode}
          </Text>
        </View>
        <View style={[styles.statusBadge, location.isActive ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={[styles.statusText, location.isActive ? styles.activeText : styles.inactiveText]}>
            {location.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.locationStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{location.chairCount}</Text>
          <Text style={styles.statLabel}>Total Chairs</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{location.rentedChairCount}</Text>
          <Text style={styles.statLabel}>Rented</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{location.chairCount - location.rentedChairCount}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {location.chairCount > 0 ? Math.round((location.rentedChairCount / location.chairCount) * 100) : 0}%
          </Text>
          <Text style={styles.statLabel}>Occupancy</Text>
        </View>
      </View>

      <View style={styles.locationDetails}>
        {location.phone && (
          <View style={styles.detailRow}>
            <Ionicons name="call" size={16} color={MODERN_COLORS.gray500} />
            <Text style={styles.detailText}>{location.phone}</Text>
          </View>
        )}
        {location.email && (
          <View style={styles.detailRow}>
            <Ionicons name="mail" size={16} color={MODERN_COLORS.gray500} />
            <Text style={styles.detailText}>{location.email}</Text>
          </View>
        )}
        {location.website && (
          <View style={styles.detailRow}>
            <Ionicons name="globe" size={16} color={MODERN_COLORS.gray500} />
            <Text style={styles.detailText}>{location.website}</Text>
          </View>
        )}
      </View>

      <View style={styles.locationActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="pencil" size={16} color={MODERN_COLORS.primary} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="home" size={16} color={MODERN_COLORS.secondary} />
          <Text style={styles.actionButtonText}>Manage Chairs</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MODERN_COLORS.primary} />
          <Text style={styles.loadingText}>Loading locations...</Text>
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
        <Text style={styles.headerTitle}>Multi-Location</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color={MODERN_COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Summary Stats */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Business Overview</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{locations.length}</Text>
              <Text style={styles.summaryLabel}>Locations</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {locations.reduce((sum, loc) => sum + loc.chairCount, 0)}
              </Text>
              <Text style={styles.summaryLabel}>Total Chairs</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {locations.reduce((sum, loc) => sum + loc.rentedChairCount, 0)}
              </Text>
              <Text style={styles.summaryLabel}>Rented Chairs</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {locations.filter(loc => loc.isActive).length}
              </Text>
              <Text style={styles.summaryLabel}>Active Locations</Text>
            </View>
          </View>
        </View>

        {/* Locations List */}
        {locations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business" size={64} color={MODERN_COLORS.gray400} />
            <Text style={styles.emptyStateTitle}>No locations yet</Text>
            <Text style={styles.emptyStateText}>
              Add your first business location to start managing multiple venues
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.emptyStateButtonText}>Add Location</Text>
            </TouchableOpacity>
          </View>
        ) : (
          locations.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))
        )}
      </ScrollView>

      {/* Add Location Modal */}
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
            <Text style={styles.modalTitle}>Add Location</Text>
            <TouchableOpacity
              style={[styles.modalSaveButton, saving && styles.savingButton]}
              onPress={addLocation}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={MODERN_COLORS.white} />
              ) : (
                <Text style={styles.modalSaveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView}>
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Basic Information</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Location Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newLocation.name}
                  onChangeText={(text) => setNewLocation(prev => ({ ...prev, name: text }))}
                  placeholder="e.g., Downtown Salon"
                  placeholderTextColor={MODERN_COLORS.gray400}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Address *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newLocation.address}
                  onChangeText={(text) => setNewLocation(prev => ({ ...prev, address: text }))}
                  placeholder="Street address"
                  placeholderTextColor={MODERN_COLORS.gray400}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, { flex: 2 }]}>
                  <Text style={styles.inputLabel}>City *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newLocation.city}
                    onChangeText={(text) => setNewLocation(prev => ({ ...prev, city: text }))}
                    placeholder="City"
                    placeholderTextColor={MODERN_COLORS.gray400}
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>State</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newLocation.state}
                    onChangeText={(text) => setNewLocation(prev => ({ ...prev, state: text }))}
                    placeholder="State"
                    placeholderTextColor={MODERN_COLORS.gray400}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>ZIP Code</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newLocation.zipCode}
                    onChangeText={(text) => setNewLocation(prev => ({ ...prev, zipCode: text }))}
                    placeholder="ZIP"
                    placeholderTextColor={MODERN_COLORS.gray400}
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Country</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newLocation.country}
                    onChangeText={(text) => setNewLocation(prev => ({ ...prev, country: text }))}
                    placeholder="Country"
                    placeholderTextColor={MODERN_COLORS.gray400}
                  />
                </View>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Contact Information</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.textInput}
                  value={newLocation.phone}
                  onChangeText={(text) => setNewLocation(prev => ({ ...prev, phone: text }))}
                  placeholder="(555) 123-4567"
                  placeholderTextColor={MODERN_COLORS.gray400}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  value={newLocation.email}
                  onChangeText={(text) => setNewLocation(prev => ({ ...prev, email: text }))}
                  placeholder="location@business.com"
                  placeholderTextColor={MODERN_COLORS.gray400}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Website</Text>
                <TextInput
                  style={styles.textInput}
                  value={newLocation.website}
                  onChangeText={(text) => setNewLocation(prev => ({ ...prev, website: text }))}
                  placeholder="https://website.com"
                  placeholderTextColor={MODERN_COLORS.gray400}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={newLocation.description}
                  onChangeText={(text) => setNewLocation(prev => ({ ...prev, description: text }))}
                  placeholder="Describe this location..."
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
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: MODERN_COLORS.surface,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: MODERN_COLORS.text,
    marginBottom: SPACING.md,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: '700',
    color: MODERN_COLORS.primary,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    marginTop: SPACING.xs,
  },
  locationCard: {
    backgroundColor: MODERN_COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: MODERN_COLORS.text,
    marginBottom: SPACING.xs,
  },
  locationAddress: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  activeBadge: {
    backgroundColor: MODERN_COLORS.success + '20',
  },
  inactiveBadge: {
    backgroundColor: MODERN_COLORS.gray300,
  },
  statusText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
  },
  activeText: {
    color: MODERN_COLORS.success,
  },
  inactiveText: {
    color: MODERN_COLORS.gray600,
  },
  locationStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: MODERN_COLORS.gray100,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: MODERN_COLORS.text,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    marginTop: SPACING.xs,
  },
  locationDetails: {
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  detailText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
  },
  locationActions: {
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
});

export default MultiLocationScreen;
