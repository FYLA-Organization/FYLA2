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
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MODERN_COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants/modernDesign';
import ApiService from '../../services/api';
import { Service } from '../../types';

const { width } = Dimensions.get('window');

interface EnhancedService extends Service {
  images?: string[];
  availability?: {
    [key: string]: {
      available: boolean;
      startTime?: string;
      endTime?: string;
    };
  };
  customization?: {
    allowCustomRequests: boolean;
    customizationOptions: string[];
  };
  addOns?: Array<{
    id: string;
    name: string;
    price: number;
    description: string;
  }>;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SERVICE_CATEGORIES = ['Hair', 'Makeup', 'Nails', 'Skincare', 'Massage', 'Wellness', 'Other'];

const EnhancedServiceManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<EnhancedService[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<EnhancedService | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('Hair');
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [availability, setAvailability] = useState<{[key: string]: {available: boolean; startTime?: string; endTime?: string}}>({});
  const [allowCustomRequests, setAllowCustomRequests] = useState(false);
  const [customizationOptions, setCustomizationOptions] = useState<string[]>([]);
  const [addOns, setAddOns] = useState<Array<{id: string; name: string; price: number; description: string}>>([]);
  
  // Add-on form
  const [addOnModalVisible, setAddOnModalVisible] = useState(false);
  const [addOnName, setAddOnName] = useState('');
  const [addOnPrice, setAddOnPrice] = useState('');
  const [addOnDescription, setAddOnDescription] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      
      try {
        // Try to load real services from API
        const userData = await ApiService.getCurrentUser();
        if (userData && userData.isServiceProvider) {
          const servicesData = await ApiService.getProviderServices(userData.id);
          const enhancedServices = servicesData.map(service => ({
            ...service,
            images: [],
            availability: getDefaultAvailability(),
            customization: {
              allowCustomRequests: false,
              customizationOptions: [],
            },
            addOns: [],
          }));
          setServices(enhancedServices);
        }
      } catch (apiError) {
        console.log('API not available, using mock data');
        // Initialize with mock data
        setServices([
          {
            id: '1',
            serviceProviderId: 'provider-1',
            name: 'Hair Cut & Style',
            description: 'Professional haircut with styling consultation',
            price: 75,
            duration: 60,
            category: 'Hair',
            isActive: true,
            images: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300'],
            availability: getDefaultAvailability(),
            customization: {
              allowCustomRequests: true,
              customizationOptions: ['Length preference', 'Style preference'],
            },
            addOns: [
              { id: '1', name: 'Hair Wash', price: 15, description: 'Deep cleansing shampoo and conditioner' },
              { id: '2', name: 'Blow Dry', price: 25, description: 'Professional blow dry and styling' },
            ],
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultAvailability = () => {
    const avail: {[key: string]: {available: boolean; startTime?: string; endTime?: string}} = {};
    DAYS.forEach(day => {
      avail[day] = {
        available: !['Saturday', 'Sunday'].includes(day),
        startTime: '09:00',
        endTime: '17:00',
      };
    });
    return avail;
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (service: EnhancedService) => {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description || '');
    setPrice(service.price.toString());
    setDuration(service.duration.toString());
    setCategory(service.category);
    setIsActive(service.isActive);
    setImages(service.images || []);
    setAvailability(service.availability || getDefaultAvailability());
    setAllowCustomRequests(service.customization?.allowCustomRequests || false);
    setCustomizationOptions(service.customization?.customizationOptions || []);
    setAddOns(service.addOns || []);
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setPrice('');
    setDuration('');
    setCategory('Hair');
    setIsActive(true);
    setImages([]);
    setAvailability(getDefaultAvailability());
    setAllowCustomRequests(false);
    setCustomizationOptions([]);
    setAddOns([]);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!name.trim() || !description.trim() || !price.trim() || !duration.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
      const serviceData: EnhancedService = {
        id: editingService?.id || `temp-${Date.now()}`,
        serviceProviderId: editingService?.serviceProviderId || 'provider-1',
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        duration: parseInt(duration),
        category,
        isActive,
        images,
        availability,
        customization: {
          allowCustomRequests,
          customizationOptions,
        },
        addOns,
      };

      if (editingService) {
        // Update existing service
        try {
          // await ApiService.updateService(editingService.id, serviceData);
          setServices(services.map(s => s.id === editingService.id ? serviceData : s));
        } catch (apiError) {
          // Fallback to local update
          setServices(services.map(s => s.id === editingService.id ? serviceData : s));
        }
      } else {
        // Create new service
        try {
          // const newService = await ApiService.createService(serviceData);
          setServices([...services, serviceData]);
        } catch (apiError) {
          // Fallback to local creation
          setServices([...services, serviceData]);
        }
      }

      Alert.alert('Success', `Service ${editingService ? 'updated' : 'created'} successfully!`);
      closeModal();
    } catch (error) {
      console.error('Error saving service:', error);
      Alert.alert('Error', 'Failed to save service. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = (serviceId: string) => {
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // await ApiService.deleteService(serviceId);
              setServices(services.filter(s => s.id !== serviceId));
              Alert.alert('Success', 'Service deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete service');
            }
          },
        },
      ]
    );
  };

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map(asset => asset.uri);
      setImages([...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddAddOn = () => {
    if (!addOnName.trim() || !addOnPrice.trim()) {
      Alert.alert('Error', 'Please enter add-on name and price');
      return;
    }

    const newAddOn = {
      id: `addon-${Date.now()}`,
      name: addOnName.trim(),
      price: parseFloat(addOnPrice),
      description: addOnDescription.trim(),
    };

    setAddOns([...addOns, newAddOn]);
    setAddOnName('');
    setAddOnPrice('');
    setAddOnDescription('');
    setAddOnModalVisible(false);
  };

  const removeAddOn = (addOnId: string) => {
    setAddOns(addOns.filter(addon => addon.id !== addOnId));
  };

  const renderServiceItem = (service: EnhancedService) => (
    <View key={service.id} style={styles.serviceItem}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceMainInfo}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.serviceDescription} numberOfLines={2}>
            {service.description}
          </Text>
          <View style={styles.serviceMeta}>
            <Text style={styles.servicePrice}>${service.price}</Text>
            <Text style={styles.serviceDuration}>{service.duration} min</Text>
            <Text style={styles.serviceCategory}>{service.category}</Text>
          </View>
        </View>
        
        <View style={styles.serviceActions}>
          <Switch
            value={service.isActive}
            onValueChange={(value) => {
              const updatedService = { ...service, isActive: value };
              setServices(services.map(s => s.id === service.id ? updatedService : s));
            }}
            trackColor={{ false: MODERN_COLORS.gray300, true: MODERN_COLORS.primary }}
          />
          
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openEditModal(service)}
          >
            <Ionicons name="create-outline" size={20} color={MODERN_COLORS.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteService(service.id)}
          >
            <Ionicons name="trash-outline" size={20} color={MODERN_COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      {service.images && service.images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.serviceImages}>
          {service.images.map((image, index) => (
            <Image key={index} source={{ uri: image }} style={styles.serviceImage} />
          ))}
        </ScrollView>
      )}

      {service.addOns && service.addOns.length > 0 && (
        <View style={styles.addOnsContainer}>
          <Text style={styles.addOnsTitle}>Add-ons:</Text>
          {service.addOns.map(addon => (
            <Text key={addon.id} style={styles.addOnItem}>
              • {addon.name} (+${addon.price})
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  const renderModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingService ? 'Edit Service' : 'Add New Service'}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color={MODERN_COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Basic Information */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Service Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter service name"
                  placeholderTextColor={MODERN_COLORS.textSecondary}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[styles.textInput, styles.textAreaInput]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe your service"
                  placeholderTextColor={MODERN_COLORS.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.rowContainer}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: SPACING.sm }]}>
                  <Text style={styles.inputLabel}>Price ($) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0.00"
                    keyboardType="numeric"
                    placeholderTextColor={MODERN_COLORS.textSecondary}
                  />
                </View>

                <View style={[styles.inputContainer, { flex: 1, marginLeft: SPACING.sm }]}>
                  <Text style={styles.inputLabel}>Duration (min) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={duration}
                    onChangeText={setDuration}
                    placeholder="60"
                    keyboardType="numeric"
                    placeholderTextColor={MODERN_COLORS.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryContainer}>
                    {SERVICE_CATEGORIES.map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryChip,
                          category === cat && styles.categoryChipSelected
                        ]}
                        onPress={() => setCategory(cat)}
                      >
                        <Text style={[
                          styles.categoryChipText,
                          category === cat && styles.categoryChipTextSelected
                        ]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>

            {/* Service Images */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Service Images</Text>
              
              <TouchableOpacity style={styles.addImageButton} onPress={handleImagePicker}>
                <Ionicons name="add-circle-outline" size={24} color={MODERN_COLORS.primary} />
                <Text style={styles.addImageText}>Add Images</Text>
              </TouchableOpacity>

              {images.length > 0 && (
                <View style={styles.imagesContainer}>
                  {images.map((image, index) => (
                    <View key={index} style={styles.imageItem}>
                      <Image source={{ uri: image }} style={styles.serviceImagePreview} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons name="close" size={16} color={MODERN_COLORS.white} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Availability */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Availability</Text>
              {DAYS.map(day => (
                <View key={day} style={styles.availabilityRow}>
                  <Text style={styles.dayText}>{day}</Text>
                  <View style={styles.availabilityControls}>
                    <Switch
                      value={availability[day]?.available || false}
                      onValueChange={(value) => 
                        setAvailability(prev => ({
                          ...prev,
                          [day]: { ...prev[day], available: value }
                        }))
                      }
                      trackColor={{ false: MODERN_COLORS.gray300, true: MODERN_COLORS.primary }}
                    />
                    {availability[day]?.available && (
                      <View style={styles.timeInputs}>
                        <TextInput
                          style={styles.timeInput}
                          value={availability[day]?.startTime || '09:00'}
                          onChangeText={(time) => 
                            setAvailability(prev => ({
                              ...prev,
                              [day]: { ...prev[day], startTime: time }
                            }))
                          }
                          placeholder="09:00"
                        />
                        <Text style={styles.toText}>to</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={availability[day]?.endTime || '17:00'}
                          onChangeText={(time) => 
                            setAvailability(prev => ({
                              ...prev,
                              [day]: { ...prev[day], endTime: time }
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

            {/* Add-ons */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Add-ons</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setAddOnModalVisible(true)}
                >
                  <Ionicons name="add" size={20} color={MODERN_COLORS.white} />
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {addOns.map(addon => (
                <View key={addon.id} style={styles.addOnRow}>
                  <View style={styles.addOnInfo}>
                    <Text style={styles.addOnName}>{addon.name}</Text>
                    <Text style={styles.addOnPrice}>+${addon.price}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeAddOn(addon.id)}>
                    <Ionicons name="trash-outline" size={20} color={MODERN_COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Customization Options */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Customization</Text>
              
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Allow Custom Requests</Text>
                <Switch
                  value={allowCustomRequests}
                  onValueChange={setAllowCustomRequests}
                  trackColor={{ false: MODERN_COLORS.gray300, true: MODERN_COLORS.primary }}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <LinearGradient
                colors={saving ? [MODERN_COLORS.gray300, MODERN_COLORS.gray300] : [MODERN_COLORS.primary, MODERN_COLORS.primaryLight]}
                style={styles.saveButtonGradient}
              >
                {saving ? (
                  <ActivityIndicator color={MODERN_COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingService ? 'Update' : 'Create'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Add-on Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addOnModalVisible}
        onRequestClose={() => setAddOnModalVisible(false)}
      >
        <View style={styles.addOnModalOverlay}>
          <View style={styles.addOnModalContent}>
            <Text style={styles.addOnModalTitle}>Add Service Add-on</Text>
            
            <TextInput
              style={styles.textInput}
              value={addOnName}
              onChangeText={setAddOnName}
              placeholder="Add-on name"
              placeholderTextColor={MODERN_COLORS.textSecondary}
            />
            
            <TextInput
              style={styles.textInput}
              value={addOnPrice}
              onChangeText={setAddOnPrice}
              placeholder="Price"
              keyboardType="numeric"
              placeholderTextColor={MODERN_COLORS.textSecondary}
            />
            
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              value={addOnDescription}
              onChangeText={setAddOnDescription}
              placeholder="Description (optional)"
              placeholderTextColor={MODERN_COLORS.textSecondary}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.addOnModalButtons}>
              <TouchableOpacity
                style={styles.addOnCancelButton}
                onPress={() => setAddOnModalVisible(false)}
              >
                <Text style={styles.addOnCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.addOnSaveButton} onPress={handleAddAddOn}>
                <Text style={styles.addOnSaveButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={MODERN_COLORS.primary} />
        <Text style={styles.loadingText}>Loading services...</Text>
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
          <Text style={styles.headerTitle}>Service Management</Text>
          <TouchableOpacity style={styles.addHeaderButton} onPress={openAddModal}>
            <Ionicons name="add" size={24} color={MODERN_COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Services List */}
        <ScrollView 
          style={styles.content}
          contentContainerStyle={{ paddingBottom: SPACING.tabBarHeight + SPACING.xl }}
          showsVerticalScrollIndicator={false}
        >
          {services.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={64} color={MODERN_COLORS.textSecondary} />
              <Text style={styles.emptyStateText}>No services yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Add your first service to start accepting bookings
              </Text>
              <TouchableOpacity style={styles.addFirstButton} onPress={openAddModal}>
                <LinearGradient
                  colors={[MODERN_COLORS.primary, MODERN_COLORS.primaryLight]}
                  style={styles.addFirstButtonGradient}
                >
                  <Text style={styles.addFirstButtonText}>Add Service</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            services.map(renderServiceItem)
          )}
        </ScrollView>

        {renderModal()}
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
  addHeaderButton: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
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
  serviceItem: {
    backgroundColor: MODERN_COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  serviceMainInfo: {
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
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  servicePrice: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.primary,
  },
  serviceDuration: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
    backgroundColor: MODERN_COLORS.gray100,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  serviceCategory: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.primary,
    backgroundColor: MODERN_COLORS.primaryLight + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  serviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  editButton: {
    padding: SPACING.sm,
    backgroundColor: MODERN_COLORS.primaryLight + '20',
    borderRadius: BORDER_RADIUS.sm,
  },
  deleteButton: {
    padding: SPACING.sm,
    backgroundColor: MODERN_COLORS.error + '20',
    borderRadius: BORDER_RADIUS.sm,
  },
  serviceImages: {
    marginBottom: SPACING.md,
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.sm,
  },
  addOnsContainer: {
    marginTop: SPACING.sm,
  },
  addOnsTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  addOnItem: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  emptyStateSubtext: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  addFirstButton: {
    borderRadius: BORDER_RADIUS.lg,
  },
  addFirstButtonGradient: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  addFirstButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.white,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: MODERN_COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: MODERN_COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.textPrimary,
  },
  modalBody: {
    flex: 1,
    padding: SPACING.lg,
  },
  formSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
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
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: MODERN_COLORS.border,
    backgroundColor: MODERN_COLORS.white,
  },
  categoryChipSelected: {
    backgroundColor: MODERN_COLORS.primary,
    borderColor: MODERN_COLORS.primary,
  },
  categoryChipText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
  },
  categoryChipTextSelected: {
    color: MODERN_COLORS.white,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: MODERN_COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  addImageText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  imageItem: {
    position: 'relative',
  },
  serviceImagePreview: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
  },
  removeImageButton: {
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
  availabilityRow: {
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
  availabilityControls: {
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MODERN_COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  addButtonText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.white,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  addOnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
  },
  addOnInfo: {
    flex: 1,
  },
  addOnName: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.textPrimary,
  },
  addOnPrice: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.primary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  switchLabel: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textPrimary,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: MODERN_COLORS.border,
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: MODERN_COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.textSecondary,
  },
  saveButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.white,
  },

  // Add-on Modal Styles
  addOnModalOverlay: {
    flex: 1,
    backgroundColor: MODERN_COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addOnModalContent: {
    backgroundColor: MODERN_COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: width * 0.9,
    maxWidth: 400,
  },
  addOnModalTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  addOnModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  addOnCancelButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: MODERN_COLORS.border,
    alignItems: 'center',
  },
  addOnCancelButtonText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
  },
  addOnSaveButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: MODERN_COLORS.primary,
    alignItems: 'center',
  },
  addOnSaveButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.white,
  },
});

export default EnhancedServiceManagementScreen;
