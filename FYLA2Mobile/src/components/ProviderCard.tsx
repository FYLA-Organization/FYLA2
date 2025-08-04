import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Provider {
  id: string;
  businessName: string;
  rating: number;
  reviewCount: number;
  location: string;
  distance: number;
  profilePictureUrl: string;
  services: string[];
  priceRange: string;
  openNow: boolean;
  features: string[];
}

interface ProviderCardProps {
  provider: Provider;
  onPress: () => void;
}

const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: provider.profilePictureUrl }} style={styles.image} />
        {provider.openNow && (
          <View style={styles.openBadge}>
            <Text style={styles.openText}>Open</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.businessName}>{provider.businessName}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.rating}>{provider.rating}</Text>
            <Text style={styles.reviewCount}>({provider.reviewCount})</Text>
          </View>
        </View>
        
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.location}>{provider.location}</Text>
          <Text style={styles.distance}>• {provider.distance} mi</Text>
        </View>
        
        <View style={styles.servicesContainer}>
          {provider.services.slice(0, 3).map((service, index) => (
            <View key={index} style={styles.serviceTag}>
              <Text style={styles.serviceText}>{service}</Text>
            </View>
          ))}
          {provider.services.length > 3 && (
            <Text style={styles.moreServices}>+{provider.services.length - 3} more</Text>
          )}
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.priceRange}>{provider.priceRange}</Text>
          <View style={styles.featuresContainer}>
            {provider.features.slice(0, 2).map((feature, index) => (
              <View key={index} style={styles.featureIcon}>
                <Ionicons 
                  name={getFeatureIcon(feature)} 
                  size={12} 
                  color="#007AFF" 
                />
              </View>
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const getFeatureIcon = (feature: string): keyof typeof Ionicons.glyphMap => {
  switch (feature.toLowerCase()) {
    case 'parking available':
      return 'car-outline';
    case 'online booking':
      return 'calendar-outline';
    case 'credit cards accepted':
      return 'card-outline';
    case 'wheelchair accessible':
      return 'accessibility-outline';
    case 'private rooms':
      return 'lock-closed-outline';
    case 'luxury experience':
      return 'diamond-outline';
    default:
      return 'checkmark-circle-outline';
  }
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 120,
  },
  openBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 2,
    color: '#333',
  },
  reviewCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  distance: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 2,
  },
  serviceText: {
    fontSize: 10,
    color: '#666',
  },
  moreServices: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceRange: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  featuresContainer: {
    flexDirection: 'row',
  },
  featureIcon: {
    marginLeft: 6,
  },
});

export default ProviderCard;
