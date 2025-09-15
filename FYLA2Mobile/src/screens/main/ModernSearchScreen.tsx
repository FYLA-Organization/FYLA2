import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ServiceProvider, RootStackParamList } from '../../types';
import ApiService from '../../services/api';
import { MODERN_COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../../constants/modernDesign';

const { width } = Dimensions.get('window');

type SearchScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface SearchCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string[];
}

const SEARCH_CATEGORIES: SearchCategory[] = [
  {
    id: 'hair',
    name: 'Hair',
    icon: 'cut-outline',
    color: MODERN_COLORS.primary,
    gradient: [MODERN_COLORS.primary, MODERN_COLORS.primaryLight],
  },
  {
    id: 'nails',
    name: 'Nails',
    icon: 'hand-left-outline',
    color: MODERN_COLORS.accent,
    gradient: [MODERN_COLORS.accent, MODERN_COLORS.accentLight],
  },
  {
    id: 'makeup',
    name: 'Makeup',
    icon: 'color-palette-outline',
    color: MODERN_COLORS.error,
    gradient: ['#EF4444', '#F87171'],
  },
  {
    id: 'skincare',
    name: 'Skincare',
    icon: 'water-outline',
    color: MODERN_COLORS.success,
    gradient: [MODERN_COLORS.success, '#34D399'],
  },
  {
    id: 'massage',
    name: 'Massage',
    icon: 'body-outline',
    color: MODERN_COLORS.info,
    gradient: [MODERN_COLORS.info, '#60A5FA'],
  },
  {
    id: 'lashes',
    name: 'Lashes',
    icon: 'eye-outline',
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#A78BFA'],
  },
];

const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([
    'Hair salon near me',
    'Bridal makeup',
    'Nail art',
    'Facial treatment',
  ]);
  
  const navigation = useNavigation<SearchScreenNavigationProp>();

  useEffect(() => {
    loadFeaturedProviders();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.length > 2) {
        performSearch();
      } else if (searchQuery.length === 0) {
        loadFeaturedProviders();
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const loadFeaturedProviders = async () => {
    setIsLoading(true);
    try {
      // Mock data for demo
      const mockProviders: ServiceProvider[] = [
        {
          id: '1',
          businessName: 'Glamour Studio',
          firstName: 'Sarah',
          lastName: 'Johnson',
          profilePictureUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=300',
          averageRating: 4.8,
          totalReviews: 127,
          location: 'Downtown, 0.5 mi',
          services: ['Hair Styling', 'Color', 'Highlights'],
          price: '$$',
          isVerified: true,
          specialties: ['Balayage', 'Wedding Hair'],
        },
        {
          id: '2',
          businessName: 'Beauty Bliss',
          firstName: 'Maria',
          lastName: 'Rodriguez',
          profilePictureUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=300',
          averageRating: 4.9,
          totalReviews: 89,
          location: 'Midtown, 1.2 mi',
          services: ['Makeup', 'Facials', 'Eyebrows'],
          price: '$$$',
          isVerified: true,
          specialties: ['Bridal Makeup', 'Special Events'],
        },
        {
          id: '3',
          businessName: 'Nail Artistry',
          firstName: 'Jessica',
          lastName: 'Chen',
          profilePictureUrl: 'https://images.unsplash.com/photo-1604902396830-aca29212d9dc?w=300',
          averageRating: 4.7,
          totalReviews: 203,
          location: 'Uptown, 2.1 mi',
          services: ['Manicure', 'Pedicure', 'Nail Art'],
          price: '$$',
          isVerified: false,
          specialties: ['Gel Nails', 'Custom Designs'],
        },
      ];
      setProviders(mockProviders);
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async () => {
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      // Mock search results
      const filteredProviders = providers.filter(provider =>
        provider.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.services?.some(service => 
          service.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setProviders(filteredProviders);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    const category = SEARCH_CATEGORIES.find(c => c.id === categoryId);
    if (category) {
      setSearchQuery(category.name);
    }
  };

  const handleHistoryItemPress = (historyItem: string) => {
    setSearchQuery(historyItem);
    setIsSearchFocused(false);
  };

  const renderProvider = ({ item: provider }: { item: ServiceProvider }) => (
    <TouchableOpacity 
      style={styles.providerCard}
      onPress={() => navigation.navigate('EnhancedProviderProfile', { providerId: provider.id })}
    >
      <Image source={{ uri: provider.profilePictureUrl }} style={styles.providerImage} />
      
      <View style={styles.providerInfo}>
        <View style={styles.providerHeader}>
          <View style={styles.providerNameRow}>
            <Text style={styles.providerName}>{provider.businessName}</Text>
            {provider.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color={MODERN_COLORS.primary} />
            )}
          </View>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={MODERN_COLORS.accent} />
            <Text style={styles.rating}>{provider.averageRating}</Text>
            <Text style={styles.reviewCount}>({provider.totalReviews})</Text>
          </View>
        </View>
        
        <Text style={styles.location}>{provider.location}</Text>
        
        <View style={styles.servicesContainer}>
          {provider.services?.slice(0, 3).map((service, index) => (
            <View key={index} style={styles.serviceTag}>
              <Text style={styles.serviceText}>{service}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.providerFooter}>
          <Text style={styles.price}>{provider.price}</Text>
          <TouchableOpacity style={styles.bookButton}>
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = ({ item: category }: { item: SearchCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        selectedCategory === category.id && styles.selectedCategoryCard
      ]}
      onPress={() => handleCategoryPress(category.id)}
    >
      <LinearGradient
        colors={category.gradient}
        style={styles.categoryGradient}
      >
        <Ionicons name={category.icon as any} size={24} color={MODERN_COLORS.white} />
      </LinearGradient>
      <Text style={[
        styles.categoryName,
        selectedCategory === category.id && styles.selectedCategoryName
      ]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={MODERN_COLORS.gray500} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services, providers..."
            placeholderTextColor={MODERN_COLORS.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={MODERN_COLORS.gray400} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color={MODERN_COLORS.gray700} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search History (when focused) */}
        {isSearchFocused && searchQuery.length === 0 && (
          <View style={styles.searchHistoryContainer}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            {searchHistory.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.historyItem}
                onPress={() => handleHistoryItemPress(item)}
              >
                <Ionicons name="time-outline" size={20} color={MODERN_COLORS.gray400} />
                <Text style={styles.historyText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Categories */}
        {!isSearchFocused && (
          <>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Browse Categories</Text>
              <FlatList
                data={SEARCH_CATEGORIES}
                renderItem={renderCategory}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesContainer}
              />
            </View>

            {/* Featured Providers */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                {hasSearched ? 'Search Results' : 'Featured Providers'}
              </Text>
              
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={MODERN_COLORS.primary} />
                  <Text style={styles.loadingText}>Finding providers...</Text>
                </View>
              ) : providers.length === 0 && hasSearched ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={64} color={MODERN_COLORS.gray400} />
                  <Text style={styles.emptyTitle}>No providers found</Text>
                  <Text style={styles.emptyText}>
                    Try adjusting your search terms or browse categories
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={providers}
                  renderItem={renderProvider}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  contentContainerStyle={styles.providersContainer}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  
  // Search Header
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: MODERN_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
    ...SHADOWS.sm,
    gap: SPACING.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MODERN_COLORS.gray50,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textPrimary,
  },
  filterButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: MODERN_COLORS.gray50,
  },

  // Content
  content: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },

  // Search History
  searchHistoryContainer: {
    backgroundColor: MODERN_COLORS.surface,
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  historyText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
  },

  // Categories
  categoriesContainer: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  categoryCard: {
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: MODERN_COLORS.surface,
    ...SHADOWS.sm,
    minWidth: 80,
  },
  selectedCategoryCard: {
    backgroundColor: MODERN_COLORS.primary + '10',
    borderWidth: 2,
    borderColor: MODERN_COLORS.primary,
  },
  categoryGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.textSecondary,
    textAlign: 'center',
  },
  selectedCategoryName: {
    color: MODERN_COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },

  // Providers
  providersContainer: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  providerCard: {
    flexDirection: 'row',
    backgroundColor: MODERN_COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  providerImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.md,
  },
  providerInfo: {
    flex: 1,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  providerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
  },
  providerName: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rating: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.textPrimary,
  },
  reviewCount: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
  },
  location: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  serviceTag: {
    backgroundColor: MODERN_COLORS.gray100,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  serviceText: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  providerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.success,
  },
  bookButton: {
    backgroundColor: MODERN_COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  bookButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.white,
  },

  // Loading & Empty States
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
});

export default SearchScreen;
