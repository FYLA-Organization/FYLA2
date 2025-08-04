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
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import { ServiceProvider, RootStackParamList } from '../../types';
import ApiService from '../../services/api';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [featuredProviders, setFeaturedProviders] = useState<ServiceProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Quick categories data
  const categories = [
    { name: 'Hair', icon: 'cut', color: '#FF6B6B' },
    { name: 'Nails', icon: 'hand-left', color: '#4ECDC4' },
    { name: 'Makeup', icon: 'color-palette', color: '#FFE66D' },
    { name: 'Massage', icon: 'body', color: '#A8E6CF' },
    { name: 'Skincare', icon: 'water', color: '#DDA0DD' },
  ];

  const loadFeaturedProviders = async () => {
    try {
      setIsLoading(true);
      const providers = await ApiService.getFeaturedProviders();
      setFeaturedProviders(providers || []);
    } catch (error) {
      console.error('Error loading featured providers:', error);
      setFeaturedProviders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeaturedProviders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeaturedProviders();
    setRefreshing(false);
  };

  const handleProviderPress = (provider: ServiceProvider) => {
    navigation.navigate('ProviderProfile', { providerId: provider.id });
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Hello, {user?.firstName || 'there'}!</Text>
              <Text style={styles.subGreeting}>Ready to look amazing?</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="white"
            />
          }
        >
          {/* Search Bar */}
          <TouchableOpacity style={styles.searchContainer}>
            <BlurView intensity={80} style={styles.searchBar}>
              <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.searchPlaceholder}>Search services...</Text>
            </BlurView>
          </TouchableOpacity>

          {/* Categories */}
          <View style={styles.sectionContainer}>
            <BlurView intensity={80} style={styles.section}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.categoriesGrid}>
                {categories.map((category, index) => (
                  <TouchableOpacity key={index} style={styles.categoryItem}>
                    <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                      <Ionicons name={category.icon as any} size={24} color="white" />
                    </View>
                    <Text style={styles.categoryText}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </BlurView>
          </View>

          {/* Featured Providers */}
          <View style={styles.sectionContainer}>
            <BlurView intensity={80} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Featured Providers</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading providers...</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {featuredProviders.map((provider) => (
                    <TouchableOpacity
                      key={provider.id}
                      style={styles.providerCard}
                      onPress={() => handleProviderPress(provider)}
                    >
                      <BlurView intensity={60} style={styles.providerCardContent}>
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
                            <Text style={styles.rating}>{provider.averageRating?.toFixed(1) || '5.0'}</Text>
                            <Text style={styles.reviewCount}>({provider.totalReviews || 0})</Text>
                          </View>
                          <Text style={styles.providerSpecialty} numberOfLines={1}>
                            {provider.specialties?.join(', ') || 'Beauty Services'}
                          </Text>
                        </View>
                      </BlurView>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </BlurView>
          </View>

          {/* Quick Actions */}
          <View style={styles.sectionContainer}>
            <BlurView intensity={80} style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity style={styles.actionCard}>
                  <BlurView intensity={60} style={styles.actionContent}>
                    <Ionicons name="calendar" size={28} color="white" />
                    <Text style={styles.actionText}>Book Now</Text>
                  </BlurView>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionCard}>
                  <BlurView intensity={60} style={styles.actionContent}>
                    <Ionicons name="time" size={28} color="white" />
                    <Text style={styles.actionText}>My Bookings</Text>
                  </BlurView>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionCard}>
                  <BlurView intensity={60} style={styles.actionContent}>
                    <Ionicons name="heart" size={28} color="white" />
                    <Text style={styles.actionText}>Favorites</Text>
                  </BlurView>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 10,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  section: {
    padding: 20,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  seeAllText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  // Categories
  categoriesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryItem: {
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  // Providers
  providerCard: {
    marginRight: 15,
    width: width * 0.45,
  },
  providerCardContent: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  providerImage: {
    width: '100%',
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  providerInfo: {
    padding: 15,
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  providerSpecialty: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Actions
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    marginHorizontal: 5,
  },
  actionContent: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginTop: 8,
    textAlign: 'center',
  },
  // Loading
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  bottomSpacing: {
    height: 30,
  },
});

export default HomeScreen;
