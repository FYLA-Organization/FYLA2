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
import { BlurView } from 'expo-blur';
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
      navigation.navigate('Chat', { 
        userId: provider.userId, 
        userName: `${provider.businessName}`,
        userImage: provider.profilePictureUrl
      });
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
            <Ionicons name="time-outline" size={16} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.detailText}>{service.duration} min</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="pricetag-outline" size={16} color="#FFD700" />
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
    <BlurView key={review.id} intensity={80} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: review.reviewer?.profilePictureUrl || 'https://via.placeholder.com/40' }}
          style={styles.reviewerImage}
        />
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>
            {review.reviewer?.firstName} {review.reviewer?.lastName}
          </Text>
          <View style={styles.reviewRatingContainer}>
            <View style={styles.reviewRating}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= review.rating ? "star" : "star-outline"}
                  size={16}
                  color="#FFD700"
                />
              ))}
            </View>
            <Text style={styles.reviewRatingText}>{review.rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.reviewDate}>
          {new Date(review.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      {review.comment && (
        <View style={styles.reviewCommentContainer}>
          <Text style={styles.reviewComment}>{review.comment}</Text>
        </View>
      )}
      
      {/* Show aggregated questionnaire insights to clients (but not detailed data) */}
      {review.questionnaire && (
        <View style={styles.publicInsights}>
          <View style={styles.insightRow}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.insightText}>
              Detailed service assessment completed
            </Text>
          </View>
          {review.questionnaire.wouldRecommend && (
            <View style={styles.insightRow}>
              <Ionicons name="thumbs-up" size={16} color="#4CAF50" />
              <Text style={styles.insightText}>
                Would recommend this service
              </Text>
            </View>
          )}
          {review.questionnaire.wouldUseAgain && (
            <View style={styles.insightRow}>
              <Ionicons name="repeat" size={16} color="#4CAF50" />
              <Text style={styles.insightText}>
                Would use this service again
              </Text>
            </View>
          )}
        </View>
      )}
    </BlurView>
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
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading provider details...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!provider) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="white" />
          <Text style={styles.errorText}>Provider not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProviderData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {/* Header with provider info */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
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
          <Ionicons name="chatbubble-outline" size={20} color="white" />
          <Text style={styles.quickActionText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="call-outline" size={20} color="white" />
          <Text style={styles.quickActionText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="location-outline" size={20} color="white" />
          <Text style={styles.quickActionText}>Directions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="heart-outline" size={20} color="white" />
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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  // Base Layout
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  
  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    color: 'white',
    marginTop: 16,
    marginBottom: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Header Section
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
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
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  providerInfo: {
    flex: 1,
    marginLeft: 20,
  },
  providerName: {
    fontSize: 26,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  providerBio: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 6,
  },
  statText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '600',
  },
  
  // Quick Actions
  quickActionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  quickActionButton: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionText: {
    fontSize: 14,
    color: 'white',
    marginTop: 6,
    fontWeight: '600',
  },
  // Sections
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
    marginBottom: 20,
    letterSpacing: -0.4,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specialtyTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 12,
  },
  specialtyText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.2,
  },
  // Tabs
  tabContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 18,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FFD700',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
    fontWeight: '800',
  },
  tabContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 24,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  // Enhanced Service Cards
  enhancedServiceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  serviceInfo: {
    padding: 20,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    flex: 1,
    letterSpacing: -0.3,
  },
  priceContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: -0.2,
  },
  serviceDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  serviceDetails: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  detailText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
    fontWeight: '600',
  },
  bookButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    shadowColor: 'rgba(255, 107, 107, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: -0.2,
  },
  // Legacy Service Card (keeping for compatibility)
  serviceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Reviews
  reviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewRatingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
  },
  reviewDate: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  reviewCommentContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  reviewComment: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    fontWeight: '500',
  },
  publicInsights: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  insightText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  // Gallery
  galleryRow: {
    justifyContent: 'space-between',
  },
  galleryImageContainer: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 25,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalImage: {
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: 12,
  },
  
  // Other
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  contactCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 32,
  },
});

export default ProviderProfileScreen;
