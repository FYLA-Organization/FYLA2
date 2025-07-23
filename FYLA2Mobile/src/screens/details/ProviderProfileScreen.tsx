import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ServiceProvider, Service, RootStackParamList, Review } from '../../types';
import ApiService from '../../services/api';

const { width } = Dimensions.get('window');

type ProviderProfileScreenRouteProp = {
  key: string;
  name: 'ProviderProfile';
  params: { providerId: string };
};

type ProviderProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ProviderProfileScreen: React.FC = () => {
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'services' | 'reviews' | 'gallery'>('services');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const route = useRoute<ProviderProfileScreenRouteProp>();
  const navigation = useNavigation<ProviderProfileScreenNavigationProp>();
  const { providerId } = route.params;

  useEffect(() => {
    loadProviderData();
  }, [providerId]);

  const handleStartChat = () => {
    if (provider) {
      navigation.navigate('ChatScreen' as never, { 
        userId: provider.userId, 
        user: {
          id: provider.userId,
          firstName: provider.firstName,
          lastName: provider.lastName,
          profilePictureUrl: provider.profileImageUrl
        }
      } as never);
    }
  };

  const loadProviderData = async () => {
    try {
      setIsLoading(true);
      
      // Load provider details, services, and reviews
      const [providerData, servicesData, reviewsData] = await Promise.all([
        ApiService.getServiceProvider(providerId),
        ApiService.getServicesByProvider(providerId), // Fixed: use correct method for provider-specific services
        ApiService.getReviews(providerId)
      ]);
      
      setProvider(providerData);
      setServices(servicesData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading provider data:', error);
      Alert.alert('Error', 'Failed to load provider information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookService = (service: Service) => {
    if (!provider) return;
    
    // Navigate to enhanced booking flow with service and provider details
    navigation.navigate('BookingFlow', {
      service: service,
      provider: provider
    });
  };

  const renderServiceCard = (service: Service) => (
    <View key={service.id} style={styles.enhancedServiceCard}>
      {service.imageUrl && (
        <Image source={{ uri: service.imageUrl }} style={styles.serviceImage} />
      )}
      <View style={styles.serviceInfo}>
        <View style={styles.serviceHeader}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.servicePrice}>${service.price}</Text>
          </View>
        </View>
        <Text style={styles.serviceDescription}>{service.description}</Text>
        <View style={styles.serviceDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{service.duration} min</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="pricetag-outline" size={16} color="#4ECDC4" />
            <Text style={styles.detailText}>{service.category}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => handleBookService(service)}
        >
          <Ionicons name="calendar-outline" size={16} color="#fff" />
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReviewCard = (review: Review) => (
    <View key={review.id} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: review.reviewer?.profilePictureUrl || 'https://via.placeholder.com/40' }}
          style={styles.reviewerImage}
        />
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>
            {review.reviewer?.firstName} {review.reviewer?.lastName}
          </Text>
          <View style={styles.reviewRating}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= review.rating ? "star" : "star-outline"}
                size={14}
                color="#FFD700"
              />
            ))}
          </View>
        </View>
        <Text style={styles.reviewDate}>
          {new Date(review.createdAt).toLocaleDateString()}
        </Text>
      </View>
      {review.comment && (
        <Text style={styles.reviewComment}>{review.comment}</Text>
      )}
    </View>
  );

  const renderGalleryImage = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      style={styles.galleryImageContainer}
      onPress={() => {
        setSelectedImageIndex(index);
        setShowImageModal(true);
      }}
    >
      <Image source={{ uri: item }} style={styles.galleryImage} />
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'services':
        return (
          <View style={styles.tabContent}>
            {services.length > 0 ? (
              services.map(renderServiceCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No services available</Text>
              </View>
            )}
          </View>
        );
      case 'reviews':
        return (
          <View style={styles.tabContent}>
            {reviews.length > 0 ? (
              reviews.slice(0, 5).map(renderReviewCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No reviews yet</Text>
              </View>
            )}
          </View>
        );
      case 'gallery':
        return (
          <View style={styles.tabContent}>
            {provider?.portfolioImages && provider.portfolioImages.length > 0 ? (
              <FlatList
                data={provider.portfolioImages}
                renderItem={renderGalleryImage}
                numColumns={2}
                columnWrapperStyle={styles.galleryRow}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="images-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No photos available</Text>
              </View>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading provider details...</Text>
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
        <Text style={styles.errorText}>Provider not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProviderData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with provider info */}
      <LinearGradient
        colors={['#FF6B6B', '#FFE66D']}
        style={styles.header}
      >
        <View style={styles.providerHeader}>
          <Image
            source={{
              uri: provider.profilePictureUrl || 'https://via.placeholder.com/120',
            }}
            style={styles.providerImage}
          />
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{provider.businessName}</Text>
            <Text style={styles.providerBio}>{provider.businessDescription}</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.statText}>{provider.averageRating || 'New'}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={16} color="#fff" />
                <Text style={styles.statText}>{provider.totalReviews} reviews</Text>
              </View>
              {provider.isVerified && (
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#4ECDC4" />
                  <Text style={styles.statText}>Verified</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Actions Bar */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity style={styles.quickActionButton} onPress={handleStartChat}>
          <Ionicons name="chatbubble-outline" size={20} color="#FF6B6B" />
          <Text style={styles.quickActionText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="call-outline" size={20} color="#4ECDC4" />
          <Text style={styles.quickActionText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="location-outline" size={20} color="#FFE66D" />
          <Text style={styles.quickActionText}>Directions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="heart-outline" size={20} color="#FF69B4" />
          <Text style={styles.quickActionText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Specialties */}
      {provider.specialties && provider.specialties.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.specialtiesContainer}>
            {provider.specialties.map((specialty, index) => (
              <View key={index} style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'services' && styles.activeTab]}
          onPress={() => setSelectedTab('services')}
        >
          <Text style={[styles.tabText, selectedTab === 'services' && styles.activeTabText]}>
            Services ({services.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'reviews' && styles.activeTab]}
          onPress={() => setSelectedTab('reviews')}
        >
          <Text style={[styles.tabText, selectedTab === 'reviews' && styles.activeTabText]}>
            Reviews ({reviews.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'gallery' && styles.activeTab]}
          onPress={() => setSelectedTab('gallery')}
        >
          <Text style={[styles.tabText, selectedTab === 'gallery' && styles.activeTabText]}>
            Gallery
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Image Modal for Gallery */}
      <Modal visible={showImageModal} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowImageModal(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {provider?.portfolioImages && (
            <Image
              source={{ uri: provider.portfolioImages[selectedImageIndex] }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  providerImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  providerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  providerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  providerBio: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 16,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  statText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  // Quick Actions
  quickActionsContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quickActionButton: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  // Sections
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specialtyTag: {
    backgroundColor: '#FFE66D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  // Tabs
  tabContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  tabContent: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  // Enhanced Service Cards
  enhancedServiceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f8f9fa',
  },
  serviceInfo: {
    padding: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  priceContainer: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceDetails: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 25,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Legacy Service Card (keeping for compatibility)
  serviceCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Reviews
  reviewCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Gallery
  galleryRow: {
    justifyContent: 'space-between',
  },
  galleryImageContainer: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  modalImage: {
    width: width * 0.9,
    height: width * 0.9,
  },
  // Other
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  contactCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  contactButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 24,
  },
});

export default ProviderProfileScreen;
