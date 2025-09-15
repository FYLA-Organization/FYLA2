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
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import FeatureGatingService from '../../services/featureGatingService';
import { MODERN_COLORS, SPACING } from '../../constants/modernDesign';

interface BusinessLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  isMainLocation: boolean;
  isActive: boolean;
  operatingHours: {
    [key: string]: {
      isOpen: boolean;
      openTime: string;
      closeTime: string;
    };
  };
  services: string[];
  createdAt: string;
}

const MultiLocationScreen = () => {
  const navigation = useNavigation();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      setLoading(true);
      const accessCheck = await FeatureGatingService.canUseMultiLocation();
      setHasAccess(accessCheck.allowed);
      
      if (accessCheck.allowed) {
        await loadLocations();
      }
    } catch (error) {
      console.error('Error checking multi-location access:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      // Mock data for demonstration - in real app this would be an API call
      const mockLocations: BusinessLocation[] = [
        {
          id: '1',
          name: 'Downtown Location',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          phone: '(555) 123-4567',
          email: 'downtown@business.com',
          isMainLocation: true,
          isActive: true,
          operatingHours: {
            Monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
            Tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
            Wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
            Thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
            Friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
            Saturday: { isOpen: true, openTime: '10:00', closeTime: '16:00' },
            Sunday: { isOpen: false, openTime: '', closeTime: '' },
          },
          services: ['Hair Styling', 'Hair Coloring', 'Manicure'],
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'Uptown Branch',
          address: '456 Oak Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10002',
          phone: '(555) 987-6543',
          email: 'uptown@business.com',
          isMainLocation: false,
          isActive: true,
          operatingHours: {
            Monday: { isOpen: true, openTime: '10:00', closeTime: '19:00' },
            Tuesday: { isOpen: true, openTime: '10:00', closeTime: '19:00' },
            Wednesday: { isOpen: true, openTime: '10:00', closeTime: '19:00' },
            Thursday: { isOpen: true, openTime: '10:00', closeTime: '19:00' },
            Friday: { isOpen: true, openTime: '10:00', closeTime: '20:00' },
            Saturday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
            Sunday: { isOpen: true, openTime: '11:00', closeTime: '15:00' },
          },
          services: ['Hair Styling', 'Facial', 'Massage'],
          createdAt: '2024-01-15T00:00:00Z',
        }
      ];
      setLocations(mockLocations);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLocations();
    setRefreshing(false);
  };

  const addLocation = async () => {
    if (!newLocation.name.trim() || !newLocation.address.trim() || !newLocation.city.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      // Mock location creation - in real app this would be an API call
      const location: BusinessLocation = {
        id: Date.now().toString(),
        name: newLocation.name,
        address: newLocation.address,
        city: newLocation.city,
        state: newLocation.state,
        zipCode: newLocation.zipCode,
        phone: newLocation.phone,
        email: newLocation.email,
        isMainLocation: false,
        isActive: true,
        operatingHours: {
          Monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          Tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          Wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          Thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          Friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          Saturday: { isOpen: false, openTime: '', closeTime: '' },
          Sunday: { isOpen: false, openTime: '', closeTime: '' },
        },
        services: [],
        createdAt: new Date().toISOString(),
      };
      
      setLocations(prev => [...prev, location]);
      setNewLocation({ name: '', address: '', city: '', state: '', zipCode: '', phone: '', email: '' });
      setShowAddLocation(false);
      Alert.alert('Success', 'Location added successfully');
    } catch (error) {
      console.error('Error adding location:', error);
      Alert.alert('Error', 'Failed to add location');
    }
  };

  const toggleLocationStatus = async (locationId: string) => {
    try {
      setLocations(prev => prev.map(location => 
        location.id === locationId 
          ? { ...location, isActive: !location.isActive }
          : location
      ));
    } catch (error) {
      console.error('Error updating location status:', error);
    }
  };

  const formatOperatingHours = (hours: BusinessLocation['operatingHours']) => {
    const openDays = Object.entries(hours)
      .filter(([_, dayHours]) => dayHours.isOpen)
      .map(([day, dayHours]) => `${day}: ${dayHours.openTime}-${dayHours.closeTime}`);
    
    return openDays.length > 0 ? openDays.join(', ') : 'Closed';
  };

  const renderAddLocationForm = () => (
    <BlurView intensity={20} style={styles.addLocationModal}>
      <View style={styles.addLocationHeader}>
        <Text style={styles.addLocationTitle}>Add New Location</Text>
        <TouchableOpacity onPress={() => setShowAddLocation(false)}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Location Name *</Text>
          <TextInput
            style={styles.textInput}
            value={newLocation.name}
            onChangeText={(text) => setNewLocation(prev => ({ ...prev, name: text }))}
            placeholder="e.g., Downtown Branch"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Address *</Text>
          <TextInput
            style={styles.textInput}
            value={newLocation.address}
            onChangeText={(text) => setNewLocation(prev => ({ ...prev, address: text }))}
            placeholder="Street address"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
          />
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 2 }]}>
            <Text style={styles.formLabel}>City *</Text>
            <TextInput
              style={styles.textInput}
              value={newLocation.city}
              onChangeText={(text) => setNewLocation(prev => ({ ...prev, city: text }))}
              placeholder="City"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: SPACING.md }]}>
            <Text style={styles.formLabel}>State</Text>
            <TextInput
              style={styles.textInput}
              value={newLocation.state}
              onChangeText={(text) => setNewLocation(prev => ({ ...prev, state: text }))}
              placeholder="State"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>ZIP Code</Text>
            <TextInput
              style={styles.textInput}
              value={newLocation.zipCode}
              onChangeText={(text) => setNewLocation(prev => ({ ...prev, zipCode: text }))}
              placeholder="ZIP"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />
          </View>
          <View style={[styles.formGroup, { flex: 2, marginLeft: SPACING.md }]}>
            <Text style={styles.formLabel}>Phone</Text>
            <TextInput
              style={styles.textInput}
              value={newLocation.phone}
              onChangeText={(text) => setNewLocation(prev => ({ ...prev, phone: text }))}
              placeholder="(555) 123-4567"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Email</Text>
          <TextInput
            style={styles.textInput}
            value={newLocation.email}
            onChangeText={(text) => setNewLocation(prev => ({ ...prev, email: text }))}
            placeholder="location@business.com"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            keyboardType="email-address"
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={addLocation}>
          <Text style={styles.submitButtonText}>Add Location</Text>
        </TouchableOpacity>
      </ScrollView>
    </BlurView>
  );

  const renderLocationCard = (location: BusinessLocation) => (
    <BlurView key={location.id} intensity={20} style={styles.locationCard}>
      <View style={styles.locationHeader}>
        <View style={styles.locationInfo}>
          <View style={styles.locationNameRow}>
            <Text style={styles.locationName}>{location.name}</Text>
            {location.isMainLocation && (
              <View style={styles.mainBadge}>
                <Text style={styles.mainBadgeText}>MAIN</Text>
              </View>
            )}
          </View>
          <Text style={styles.locationAddress}>
            {location.address}, {location.city}, {location.state} {location.zipCode}
          </Text>
        </View>
        <View style={styles.locationActions}>
          <Switch
            value={location.isActive}
            onValueChange={() => toggleLocationStatus(location.id)}
            trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: MODERN_COLORS.success }}
            thumbColor="white"
          />
        </View>
      </View>
      
      <View style={styles.locationDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={16} color="rgba(255, 255, 255, 0.7)" />
          <Text style={styles.detailText}>{location.phone || 'No phone'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="mail-outline" size={16} color="rgba(255, 255, 255, 0.7)" />
          <Text style={styles.detailText}>{location.email || 'No email'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="rgba(255, 255, 255, 0.7)" />
          <Text style={styles.detailText} numberOfLines={2}>
            {formatOperatingHours(location.operatingHours)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="list-outline" size={16} color="rgba(255, 255, 255, 0.7)" />
          <Text style={styles.detailText}>
            {location.services.length} services
          </Text>
        </View>
      </View>
    </BlurView>
  );

  if (loading) {
    return (
      <LinearGradient colors={[MODERN_COLORS.primary, MODERN_COLORS.primaryDark]} style={[styles.container, styles.centered]}>
        <BlurView intensity={20} style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading locations...</Text>
        </BlurView>
      </LinearGradient>
    );
  }

  if (!hasAccess) {
    return (
      <LinearGradient colors={[MODERN_COLORS.primary, MODERN_COLORS.primaryDark]} style={[styles.container, styles.centered]}>
        <BlurView intensity={20} style={styles.upgradeCard}>
          <Ionicons name="business-outline" size={64} color="white" style={{ opacity: 0.7 }} />
          <Text style={styles.upgradeTitle}>Multi-Location Management</Text>
          <Text style={styles.upgradeDescription}>
            Manage multiple business locations with centralized scheduling, staff management, and analytics.
          </Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={MODERN_COLORS.success} />
              <Text style={styles.featureText}>Unlimited locations</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={MODERN_COLORS.success} />
              <Text style={styles.featureText}>Centralized scheduling</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={MODERN_COLORS.success} />
              <Text style={styles.featureText}>Cross-location analytics</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('SubscriptionPlans' as never)}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Business</Text>
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
          <Text style={styles.headerTitle}>Multi-Location</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddLocation(true)}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <BlurView intensity={20} style={styles.statCard}>
            <Text style={styles.statNumber}>{locations.length}</Text>
            <Text style={styles.statLabel}>Total Locations</Text>
          </BlurView>
          <BlurView intensity={20} style={styles.statCard}>
            <Text style={styles.statNumber}>{locations.filter(l => l.isActive).length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </BlurView>
        </View>

        <View style={styles.locationsSection}>
          <Text style={styles.sectionTitle}>Your Locations</Text>
          {locations.length === 0 ? (
            <BlurView intensity={20} style={styles.emptyState}>
              <Ionicons name="business-outline" size={48} color="rgba(255, 255, 255, 0.5)" />
              <Text style={styles.emptyStateText}>No locations yet</Text>
              <Text style={styles.emptyStateSubtext}>Add your first business location</Text>
            </BlurView>
          ) : (
            <View style={styles.locationsList}>
              {locations.map(renderLocationCard)}
            </View>
          )}
        </View>
      </ScrollView>

      {showAddLocation && renderAddLocationForm()}
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
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: SPACING.xs,
  },
  locationsSection: {
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
  locationsList: {
    gap: SPACING.md,
  },
  locationCard: {
    padding: SPACING.lg,
    borderRadius: 16,
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
  locationNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  mainBadge: {
    backgroundColor: MODERN_COLORS.accent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    marginLeft: SPACING.sm,
  },
  mainBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  locationAddress: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  locationActions: {
    alignItems: 'center',
  },
  locationDetails: {
    gap: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: SPACING.sm,
    flex: 1,
  },
  addLocationModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: SPACING.lg,
  },
  addLocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  addLocationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  formContainer: {
    flex: 1,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  formRow: {
    flexDirection: 'row',
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
  submitButton: {
    backgroundColor: MODERN_COLORS.success,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MultiLocationScreen;
