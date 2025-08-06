import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Service } from '../../types/index';
import ApiService from '../../services/api';
import { useAuth } from '../../context/AuthContext';

type ServicesManagementScreenNavigationProp = StackNavigationProp<any>;

// Instagram-style Color Palette
const COLORS = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#262626',
  textSecondary: '#8E8E8E',
  border: '#DBDBDB',
  borderLight: '#EFEFEF',
  primary: '#3797F0',
  accent: '#FF3040',
  success: '#00D26A',
  warning: '#FFB800',
  instagram: '#E1306C',
  gradient1: '#667eea',
  gradient2: '#764ba2',
};

interface ServiceFormData {
  name: string;
  description: string;
  price: string;
  duration: string;
  category: string;
}

const ServicesManagementScreen: React.FC = () => {
  const navigation = useNavigation<ServicesManagementScreenNavigationProp>();
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: '',
  });

  const serviceCategories = [
    'Beauty & Wellness',
    'Hair Care',
    'Nail Care',
    'Massage Therapy',
    'Fitness Training',
    'Makeup Artistry',
    'Skin Care',
    'Other'
  ];

  useEffect(() => {
    if (user?.isServiceProvider) {
      loadServices();
    }
  }, [user]);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      if (user?.id) {
        const userServices = await ApiService.getProviderServices(user.id);
        setServices(userServices);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  };

  const handleAddService = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      category: '',
    });
    setShowAddModal(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      duration: service.duration?.toString() || '',
      category: service.category || '',
    });
    setShowAddModal(true);
  };

  const handleDeleteService = (service: Service) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteService(service.id) },
      ]
    );
  };

  const deleteService = async (serviceId: number) => {
    try {
      await ApiService.deleteService(serviceId);
      await loadServices();
      Alert.alert('Success', 'Service deleted successfully');
    } catch (error) {
      console.error('Error deleting service:', error);
      Alert.alert('Error', 'Failed to delete service');
    }
  };

  const handleSubmitService = async () => {
    if (!formData.name.trim() || !formData.price.trim()) {
      Alert.alert('Error', 'Please fill in at least the service name and price');
      return;
    }

    try {
      const serviceData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        duration: formData.duration ? parseInt(formData.duration) : 60,
        category: formData.category || 'Other',
        serviceProviderId: user?.id,
      };

      if (editingService) {
        await ApiService.updateService(editingService.id, serviceData);
      } else {
        await ApiService.createService(serviceData);
      }

      setShowAddModal(false);
      await loadServices();
      Alert.alert('Success', `Service ${editingService ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Error saving service:', error);
      Alert.alert('Error', 'Failed to save service');
    }
  };

  const renderServiceCard = (service: Service) => (
    <View key={service.id} style={styles.serviceCard}>
      <View style={styles.serviceCardHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.serviceCategory}>{service.category}</Text>
        </View>
        <View style={styles.serviceActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditService(service)}
          >
            <Ionicons name="pencil" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteService(service)}
          >
            <Ionicons name="trash" size={20} color={COLORS.accent} />
          </TouchableOpacity>
        </View>
      </View>
      
      {service.description && (
        <Text style={styles.serviceDescription}>{service.description}</Text>
      )}
      
      <View style={styles.serviceDetails}>
        <View style={styles.serviceDetail}>
          <Ionicons name="cash" size={16} color={COLORS.success} />
          <Text style={styles.serviceDetailText}>${service.price}</Text>
        </View>
        {service.duration && (
          <View style={styles.serviceDetail}>
            <Ionicons name="time" size={16} color={COLORS.primary} />
            <Text style={styles.serviceDetailText}>{service.duration} min</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderAddServiceModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAddModal(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingService ? 'Edit Service' : 'Add Service'}
          </Text>
          <TouchableOpacity onPress={handleSubmitService}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Service Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter service name"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Describe your service"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Price ($) *</Text>
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                placeholder="0.00"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.label}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={formData.duration}
                onChangeText={(text) => setFormData(prev => ({ ...prev, duration: text }))}
                placeholder="60"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {serviceCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    formData.category === category && styles.categoryChipSelected
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, category }))}
                >
                  <Text style={[
                    styles.categoryChipText,
                    formData.category === category && styles.categoryChipTextSelected
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (!user?.isServiceProvider) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Access denied. This screen is for service providers only.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[COLORS.gradient1, COLORS.gradient2]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Services</Text>
          <TouchableOpacity onPress={handleAddService}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Loading services...</Text>
          </View>
        ) : services.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>
              {services.length} service{services.length !== 1 ? 's' : ''}
            </Text>
            {services.map(renderServiceCard)}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyStateTitle}>No Services Yet</Text>
            <Text style={styles.emptyStateText}>
              Add your first service to start accepting bookings from clients.
            </Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddService}>
              <Text style={styles.emptyStateButtonText}>Add Your First Service</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {renderAddServiceModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceDetailText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  emptyStateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.accent,
    textAlign: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: COLORS.text,
  },
  categoryChipTextSelected: {
    color: 'white',
  },
});

export default ServicesManagementScreen;
