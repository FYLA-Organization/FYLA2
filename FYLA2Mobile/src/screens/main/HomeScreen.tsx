import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import { ServiceProvider, RootStackParamList } from '../../types';
import ApiService from '../../services/api';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const [featuredProviders, setFeaturedProviders] = useState<ServiceProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  useEffect(() => {
    loadFeaturedProviders();
  }, []);

  const loadFeaturedProviders = async () => {
    try {
      const providers = await ApiService.getFeaturedProviders(6);
      setFeaturedProviders(providers);
    } catch (error) {
      console.error('Error loading featured providers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeaturedProviders();
    setRefreshing(false);
  };

  const handleProviderPress = (provider: ServiceProvider) => {
    navigation.navigate('ProviderProfile', { providerId: provider.id });
  };

  const categories = [
    { name: 'Hair', icon: 'cut-outline', color: '#FF6B6B' },
    { name: 'Nails', icon: 'finger-print-outline', color: '#4ECDC4' },
    { name: 'Makeup', icon: 'color-palette-outline', color: '#FFE66D' },
    { name: 'Massage', icon: 'hand-left-outline', color: '#A8E6CF' },
    { name: 'Skin Care', icon: 'water-outline', color: '#DDA0DD' },
    { name: 'Fitness', icon: 'fitness-outline', color: '#FFA07A' },
  ];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient colors={['#FF6B6B', '#4ECDC4']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.firstName}!</Text>
            <Text style={styles.subGreeting}>Find your perfect look today</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map((category, index) => (
            <TouchableOpacity key={index} style={styles.categoryCard}>
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                <Ionicons name={category.icon as any} size={24} color="white" />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Featured Providers */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Providers</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading...</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featuredProviders.map((provider) => (
              <TouchableOpacity 
                key={provider.id} 
                style={styles.providerCard}
                onPress={() => handleProviderPress(provider)}
              >
                <Image
                  source={{
                    uri: provider.profilePictureUrl || 'https://via.placeholder.com/150',
                  }}
                  style={styles.providerImage}
                />
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName} numberOfLines={1}>
                    {provider.businessName}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.rating}>{provider.averageRating.toFixed(1)}</Text>
                    <Text style={styles.reviewCount}>({provider.totalReviews})</Text>
                  </View>
                  <Text style={styles.providerSpecialty} numberOfLines={1}>
                    {provider.specialties?.join(', ') || 'Beauty Services'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="calendar-outline" size={32} color="#FF6B6B" />
            <Text style={styles.actionText}>Book Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="time-outline" size={32} color="#4ECDC4" />
            <Text style={styles.actionText}>My Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="heart-outline" size={32} color="#FFE66D" />
            <Text style={styles.actionText}>Favorites</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subGreeting: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginTop: 5,
  },
  notificationButton: {
    padding: 8,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  categoriesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 20,
    width: 70,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  providerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginRight: 15,
    width: width * 0.4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  providerImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  providerInfo: {
    padding: 12,
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  providerSpecialty: {
    fontSize: 12,
    color: '#666',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
});

export default HomeScreen;
