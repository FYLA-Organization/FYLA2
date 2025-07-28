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
      const providers = await ApiService.getFeaturedProviders();
      setFeaturedProviders(providers.slice(0, 6)); // Limit to 6 providers
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
    { name: 'Nails', icon: 'hand-right-outline', color: '#4ECDC4' },
    { name: 'Makeup', icon: 'brush-outline', color: '#FFE66D' },
    { name: 'Massage', icon: 'body-outline', color: '#A8E6CF' },
    { name: 'Skin Care', icon: 'flower-outline', color: '#DDA0DD' },
    { name: 'Fitness', icon: 'barbell-outline', color: '#FFA07A' },
  ];

  const handleCategoryPress = (category: { name: string; icon: string; color: string }) => {
    // For now, navigate to search - could be enhanced later to pass category filter
    navigation.navigate('Search');
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Hello, {user?.firstName}!</Text>
              <Text style={styles.subGreeting}>Discover amazing services</Text>
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          
          {/* Categories Section */}
          <BlurView intensity={80} style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {categories.map((category, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.categoryItem}
                  onPress={() => handleCategoryPress(category)}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                    <Ionicons name={category.icon as any} size={28} color="white" />
                  </View>
                  <Text style={styles.categoryText}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </BlurView>

          {/* Featured Providers Section */}
          <BlurView intensity={80} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Providers</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {isLoading ? (
              <View style={styles.loadingView}>
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {featuredProviders.map((provider) => (
                  <TouchableOpacity 
                    key={provider.id} 
                    style={styles.providerCard}
                    onPress={() => handleProviderPress(provider)}
                  >
                    <Image
                      source={{ uri: provider.profilePictureUrl || 'https://via.placeholder.com/150' }}
                      style={styles.providerImage}
                    />
                    <View style={styles.providerInfo}>
                      <Text style={styles.providerName} numberOfLines={1}>
                        {provider.businessName}
                      </Text>
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text style={styles.rating}>{provider.averageRating.toFixed(1)}</Text>
                        <Text style={styles.reviewCount}>({provider.totalReviews})</Text>
                      </View>
                      <Text style={styles.specialty} numberOfLines={1}>
                        {provider.specialties?.join(', ') || 'Beauty Services'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </BlurView>

          {/* Quick Actions Section */}
          <BlurView intensity={80} style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => navigation.navigate('Search')}
              >
                <Ionicons name="search-outline" size={32} color="white" />
                <Text style={styles.actionText}>Find{'\n'}Services</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => navigation.navigate('Bookings')}
              >
                <Ionicons name="calendar-outline" size={32} color="white" />
                <Text style={styles.actionText}>My{'\n'}Bookings</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => navigation.navigate('Analytics')}
              >
                <Ionicons name="analytics-outline" size={32} color="white" />
                <Text style={styles.actionText}>Analytics</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => navigation.navigate('Profile')}
              >
                <Ionicons name="person-outline" size={32} color="white" />
                <Text style={styles.actionText}>Profile</Text>
              </TouchableOpacity>
            </View>
          </BlurView>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  // Base Layout
  container: {
    flex: 1,
  },
  
  // Header Section
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 6,
    fontWeight: '500',
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  
  // Main Content
  content: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 100,
  },
  
  // Section Containers
  section: {
    marginHorizontal: 0,
    marginBottom: 32,
    borderRadius: 0,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  
  // Categories Section
  horizontalScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 24,
    width: 80,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  
  // Provider Cards
  providerCard: {
    marginRight: 20,
    width: width * 0.48,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  providerImage: {
    width: '100%',
    height: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  providerInfo: {
    padding: 18,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    marginLeft: 6,
  },
  reviewCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 6,
    fontWeight: '500',
  },
  specialty: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    lineHeight: 18,
  },
  
  // Quick Actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  actionCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    marginTop: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 18,
  },
  
  // Loading State
  loadingView: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 17,
    fontWeight: '600',
  },
  
  // Bottom Spacing
  bottomPadding: {
    height: 40,
  },
});

export default HomeScreen;
