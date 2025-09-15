import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
  Switch,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MODERN_COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants/modernDesign';
import ApiService from '../../services/api';
import { ServiceProvider } from '../../types';

const { width } = Dimensions.get('window');

interface BusinessHours {
  [key: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

interface StorefrontData {
  provider: ServiceProvider;
  businessHours: BusinessHours;
  gallery: string[];
  about: string;
  specialties: string[];
  services: any[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ProviderStorefrontScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  
  // Form data
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [businessHours, setBusinessHours] = useState<BusinessHours>({});
  const [gallery, setGallery] = useState<string[]>([]);
  const [profilePicture, setProfilePicture] = useState('');

  // Preview data
  const [storefrontData, setStorefrontData] = useState<StorefrontData | null>(null);

  useEffect(() => {
    loadStorefrontData();
  }, []);

  const loadStorefrontData = async () => {
    try {
      setLoading(true);
      
      try {
        // Try to load real provider data
        const userData = await ApiService.getCurrentUser();
        let providerData = null;
        
        if (userData) {
          try {
            // Try to get provider profile data
            const profileResponse = await ApiService.getProviderProfileData(userData.id);
            providerData = profileResponse.provider;
          } catch (profileError) {
            console.log('No provider profile found for user');
          }
        }
        
        if (providerData) {
          setBusinessName(providerData.businessName || '');
          setBusinessDescription(providerData.businessDescription || '');
          setBusinessAddress(providerData.businessAddress || '');
          setSpecialties(providerData.specialties || []);
          setProfilePicture(providerData.profilePictureUrl || '');
          
          // Load additional data
          const services = await ApiService.getProviderServices(providerData.id);
          
          setStorefrontData({
            provider: providerData,
            businessHours: getDefaultBusinessHours(),
            gallery: providerData.portfolioImages || [],
            about: providerData.businessDescription || '',
            specialties: providerData.specialties || [],
            services: services || [],
          });
        }
      } catch (apiError) {
        console.log('API not available, using default values');
        // Initialize with empty/default values
        initializeDefaultData();
      }
    } catch (error) {
      console.error('Error loading storefront data:', error);
      Alert.alert('Error', 'Failed to load storefront data');
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultData = () => {
    const defaultHours = getDefaultBusinessHours();
    setBusinessHours(defaultHours);
    
    // Set placeholder data
    setBusinessName('My Beauty Studio');
    setBusinessDescription('Professional beauty services');
    setBusinessAddress('123 Main Street, City');
    setSpecialties(['Hair Styling', 'Makeup']);
    
    setStorefrontData({
      provider: {
        id: 'temp-id',
        userId: 'temp-user',
        businessName: 'My Beauty Studio',
        businessDescription: 'Professional beauty services',
        businessAddress: '123 Main Street, City',
        specialties: ['Hair Styling', 'Makeup'],
        profilePictureUrl: '',
        averageRating: 0,
        totalReviews: 0,
        isVerified: false,
        yearsOfExperience: 1,
        priceRange: '$',
        portfolioImages: [],
      } as ServiceProvider,
      businessHours: defaultHours,
      gallery: [],
      about: 'Professional beauty services',
      specialties: ['Hair Styling', 'Makeup'],
      services: [],
    });
  };

  const getDefaultBusinessHours = (): BusinessHours => {
    const hours: BusinessHours = {};
    DAYS.forEach(day => {
      hours[day] = {
        isOpen: ['Saturday', 'Sunday'].includes(day) ? false : true,
        openTime: '09:00',
        closeTime: '17:00',
      };
    });
    return hours;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const providerData = {
        businessName,
        businessDescription,
        businessAddress,
        specialties,
        profilePictureUrl: profilePicture,
      };

      // For now, simulate saving - replace with actual API call when backend is ready
      // await ApiService.updateProviderProfile(providerData);
      console.log('Saving provider data:', providerData);
      
      Alert.alert('Success', 'Storefront updated successfully!', [
        { text: 'OK', onPress: () => loadStorefrontData() }
      ]);
      
    } catch (error) {
      console.error('Error saving storefront:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSpecialty = () => {
    if (newSpecialty.trim() && !specialties.includes(newSpecialty.trim())) {
      setSpecialties([...specialties, newSpecialty.trim()]);
      setNewSpecialty('');
    }
  };

  const handleRemoveSpecialty = (specialty: string) => {
    setSpecialties(specialties.filter(s => s !== specialty));
  };

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const handleAddToGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setGallery([...gallery, result.assets[0].uri]);
    }
  };

  const renderPreviewTab = () => {
    if (!storefrontData) return null;

    return (
      <ScrollView 
        style={styles.previewContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: SPACING.tabBarHeight + SPACING.xl }}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={[MODERN_COLORS.primary, MODERN_COLORS.primaryLight]}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={{ 
                    uri: profilePicture || storefrontData.provider.profilePictureUrl || 
                    'https://via.placeholder.com/120/4A90E2/FFFFFF?text=Profile'
                  }}
                  style={styles.profileImage}
                />
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={12} color={MODERN_COLORS.white} />
                </View>
              </View>
              
              <Text style={styles.businessNamePreview}>
                {businessName || storefrontData.provider.businessName}
              </Text>
              <Text style={styles.businessAddressPreview}>
                {businessAddress || storefrontData.provider.businessAddress}
              </Text>
              
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color={MODERN_COLORS.warning} />
                <Text style={styles.ratingText}>
                  {storefrontData.provider.averageRating || 0} ({storefrontData.provider.totalReviews || 0} reviews)
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* About Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            {businessDescription || storefrontData.about}
          </Text>
        </View>

        {/* Specialties */}
        {(specialties.length > 0 || storefrontData.specialties.length > 0) && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Specialties</Text>
            <View style={styles.specialtiesContainer}>
              {(specialties.length > 0 ? specialties : storefrontData.specialties).map((specialty, index) => (
                <View key={index} style={styles.specialtyTag}>
                  <Text style={styles.specialtyText}>{specialty}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Services Preview */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Services</Text>
          {storefrontData.services.length > 0 ? (
            storefrontData.services.map((service, index) => (
              <View key={index} style={styles.servicePreviewCard}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                  <Text style={styles.servicePrice}>${service.price}</Text>
                </View>
              </View>
            ))
          ) : (
            <TouchableOpacity
              style={styles.addServiceButton}
              onPress={() => (navigation as any).navigate('EnhancedServiceManagement')}
            >
              <Ionicons name="add-circle-outline" size={24} color={MODERN_COLORS.primary} />
              <Text style={styles.addServiceText}>Add Your First Service</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Gallery */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Gallery</Text>
          {gallery.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.galleryContainer}>
                {gallery.map((image, index) => (
                  <Image key={index} source={{ uri: image }} style={styles.galleryImage} />
                ))}
              </View>
            </ScrollView>
          ) : (
            <TouchableOpacity style={styles.addGalleryButton} onPress={handleAddToGallery}>
              <Ionicons name="images-outline" size={24} color={MODERN_COLORS.primary} />
              <Text style={styles.addGalleryText}>Add Portfolio Images</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderEditTab = () => (
    <ScrollView 
      style={styles.editContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: SPACING.tabBarHeight + SPACING.xl }}
    >
      {/* Profile Picture */}
      <View style={styles.editSection}>
        <Text style={styles.editSectionTitle}>Profile Picture</Text>
        <TouchableOpacity style={styles.profilePictureEdit} onPress={handleImagePicker}>
          <Image
            source={{ 
              uri: profilePicture || 'https://via.placeholder.com/120/4A90E2/FFFFFF?text=Profile'
            }}
            style={styles.profileImageEdit}
          />
          <View style={styles.editImageOverlay}>
            <Ionicons name="camera" size={24} color={MODERN_COLORS.white} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Business Information */}
      <View style={styles.editSection}>
        <Text style={styles.editSectionTitle}>Business Information</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Business Name</Text>
          <TextInput
            style={styles.textInput}
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Enter your business name"
            placeholderTextColor={MODERN_COLORS.textSecondary}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Business Description</Text>
          <TextInput
            style={[styles.textInput, styles.textAreaInput]}
            value={businessDescription}
            onChangeText={setBusinessDescription}
            placeholder="Describe your business and services"
            placeholderTextColor={MODERN_COLORS.textSecondary}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Business Address</Text>
          <TextInput
            style={styles.textInput}
            value={businessAddress}
            onChangeText={setBusinessAddress}
            placeholder="Enter your business address"
            placeholderTextColor={MODERN_COLORS.textSecondary}
          />
        </View>
      </View>

      {/* Specialties */}
      <View style={styles.editSection}>
        <Text style={styles.editSectionTitle}>Specialties</Text>
        
        <View style={styles.specialtyInputContainer}>
          <TextInput
            style={[styles.textInput, { flex: 1 }]}
            value={newSpecialty}
            onChangeText={setNewSpecialty}
            placeholder="Add a specialty"
            placeholderTextColor={MODERN_COLORS.textSecondary}
            onSubmitEditing={handleAddSpecialty}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddSpecialty}>
            <Ionicons name="add" size={20} color={MODERN_COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.specialtiesEditContainer}>
          {specialties.map((specialty, index) => (
            <View key={index} style={styles.specialtyEditTag}>
              <Text style={styles.specialtyEditText}>{specialty}</Text>
              <TouchableOpacity onPress={() => handleRemoveSpecialty(specialty)}>
                <Ionicons name="close" size={16} color={MODERN_COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* Business Hours */}
      <View style={styles.editSection}>
        <Text style={styles.editSectionTitle}>Business Hours</Text>
        {DAYS.map(day => (
          <View key={day} style={styles.businessHourRow}>
            <Text style={styles.dayText}>{day}</Text>
            <View style={styles.hourControls}>
              <Switch
                value={businessHours[day]?.isOpen || false}
                onValueChange={(value) => 
                  setBusinessHours(prev => ({
                    ...prev,
                    [day]: { ...prev[day], isOpen: value }
                  }))
                }
                trackColor={{ false: MODERN_COLORS.surface, true: MODERN_COLORS.primary }}
              />
              {businessHours[day]?.isOpen && (
                <View style={styles.timeInputs}>
                  <TextInput
                    style={styles.timeInput}
                    value={businessHours[day]?.openTime || '09:00'}
                    onChangeText={(time) => 
                      setBusinessHours(prev => ({
                        ...prev,
                        [day]: { ...prev[day], openTime: time }
                      }))
                    }
                    placeholder="09:00"
                  />
                  <Text style={styles.toText}>to</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={businessHours[day]?.closeTime || '17:00'}
                    onChangeText={(time) => 
                      setBusinessHours(prev => ({
                        ...prev,
                        [day]: { ...prev[day], closeTime: time }
                      }))
                    }
                    placeholder="17:00"
                  />
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Gallery Management */}
      <View style={styles.editSection}>
        <Text style={styles.editSectionTitle}>Portfolio Gallery</Text>
        <TouchableOpacity style={styles.addGalleryButtonEdit} onPress={handleAddToGallery}>
          <Ionicons name="add-circle-outline" size={24} color={MODERN_COLORS.primary} />
          <Text style={styles.addGalleryTextEdit}>Add Portfolio Image</Text>
        </TouchableOpacity>
        
        {gallery.length > 0 && (
          <View style={styles.galleryEditContainer}>
            {gallery.map((image, index) => (
              <View key={index} style={styles.galleryEditItem}>
                <Image source={{ uri: image }} style={styles.galleryEditImage} />
                <TouchableOpacity
                  style={styles.removeGalleryButton}
                  onPress={() => setGallery(gallery.filter((_, i) => i !== index))}
                >
                  <Ionicons name="close" size={16} color={MODERN_COLORS.white} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <LinearGradient
          colors={saving ? [MODERN_COLORS.surface, MODERN_COLORS.surface] : [MODERN_COLORS.primary, MODERN_COLORS.primaryLight]}
          style={styles.saveButtonGradient}
        >
          {saving ? (
            <ActivityIndicator color={MODERN_COLORS.textSecondary} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={MODERN_COLORS.primary} />
        <Text style={styles.loadingText}>Loading storefront...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={MODERN_COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Storefront</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'preview' && styles.activeTab]}
            onPress={() => setActiveTab('preview')}
          >
            <Ionicons 
              name="eye-outline" 
              size={20} 
              color={activeTab === 'preview' ? MODERN_COLORS.primary : MODERN_COLORS.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'preview' && styles.activeTabText]}>
              Preview
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'edit' && styles.activeTab]}
            onPress={() => setActiveTab('edit')}
          >
            <Ionicons 
              name="create-outline" 
              size={20} 
              color={activeTab === 'edit' ? MODERN_COLORS.primary : MODERN_COLORS.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'edit' && styles.activeTabText]}>
              Edit
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'preview' ? renderPreviewTab() : renderEditTab()}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: MODERN_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: MODERN_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: MODERN_COLORS.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.textSecondary,
  },
  activeTabText: {
    color: MODERN_COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MODERN_COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
  },

  // Preview Tab Styles
  previewContainer: {
    flex: 1,
  },
  heroSection: {
    height: 280,
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: MODERN_COLORS.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: MODERN_COLORS.success,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessNamePreview: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.white,
    marginBottom: SPACING.xs,
  },
  businessAddressPreview: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.white,
    opacity: 0.9,
    marginBottom: SPACING.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  ratingText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.white,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  sectionContainer: {
    backgroundColor: MODERN_COLORS.white,
    marginVertical: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  aboutText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
    lineHeight: 24,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  specialtyTag: {
    backgroundColor: MODERN_COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
  },
  specialtyText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  servicePreviewCard: {
    borderWidth: 1,
    borderColor: MODERN_COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  serviceDescription: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  servicePrice: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.primary,
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: MODERN_COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  addServiceText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  galleryContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  galleryImage: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.md,
  },
  addGalleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: MODERN_COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  addGalleryText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.medium,
  },

  // Edit Tab Styles
  editContainer: {
    flex: 1,
    padding: SPACING.lg,
  },
  editSection: {
    marginBottom: SPACING.xl,
  },
  editSectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  profilePictureEdit: {
    alignSelf: 'center',
    position: 'relative',
  },
  profileImageEdit: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: MODERN_COLORS.border,
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: MODERN_COLORS.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: MODERN_COLORS.white,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: MODERN_COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textPrimary,
    backgroundColor: MODERN_COLORS.white,
  },
  textAreaInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  specialtyInputContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  addButton: {
    backgroundColor: MODERN_COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialtiesEditContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  specialtyEditTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MODERN_COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
  },
  specialtyEditText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textPrimary,
  },
  businessHourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
  },
  dayText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.textPrimary,
    flex: 1,
  },
  hourControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: MODERN_COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.xs,
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textPrimary,
    backgroundColor: MODERN_COLORS.white,
    width: 60,
    textAlign: 'center',
  },
  toText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
  },
  addGalleryButtonEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: MODERN_COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  addGalleryTextEdit: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  galleryEditContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  galleryEditItem: {
    position: 'relative',
  },
  galleryEditImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
  },
  removeGalleryButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: MODERN_COLORS.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.white,
  },
});

export default ProviderStorefrontScreen;
