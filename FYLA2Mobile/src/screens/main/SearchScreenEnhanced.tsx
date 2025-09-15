import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Region } from 'react-native-maps';
import { Colors, Spacing, Typography, Shadows, BorderRadius } from '../../theme';

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
    color: Colors.primary.main,
    gradient: [Colors.primary.main, Colors.primary.light],
  },
  {
    id: 'nails',
    name: 'Nails',
    icon: 'hand-left-outline',
    color: Colors.accent.main,
    gradient: [Colors.accent.main, Colors.accent.light],
  },
  {
    id: 'makeup',
    name: 'Makeup',
    icon: 'color-palette-outline',
    color: Colors.error.main,
    gradient: ['#EF4444', '#F87171'],
  },
  {
    id: 'skincare',
    name: 'Skincare',
    icon: 'water-outline',
    color: Colors.success.main,
    gradient: [Colors.success.main, '#34D399'],
  },
  {
    id: 'massage',
    name: 'Massage',
    icon: 'body-outline',
    color: Colors.info.main,
    gradient: [Colors.info.main, '#60A5FA'],
  },
  {
    id: 'lashes',
    name: 'Lashes',
    icon: 'eye-outline',
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#A78BFA'],
  },
];

// Mock providers data for filtering
const mockProviders = [
  {
    id: '1',
    name: 'Sofia\'s Hair Studio',
    category: 'hair',
    rating: 4.9,
    reviews: 234,
    price: '$50-80',
    location: 'Downtown',
    services: ['Hair Cut', 'Hair Color', 'Styling'],
    availability: 'Available Now',
    image: 'https://via.placeholder.com/100x100',
    latitude: 37.7849,
    longitude: -122.4194,
  },
  {
    id: '2',
    name: 'Glamour Nails Spa',
    category: 'nails',
    rating: 4.8,
    reviews: 156,
    price: '$30-60',
    location: 'Midtown',
    services: ['Manicure', 'Pedicure', 'Nail Art'],
    availability: 'Book Today',
    image: 'https://via.placeholder.com/100x100',
    latitude: 37.7749,
    longitude: -122.4094,
  },
  {
    id: '3',
    name: 'Elite Makeup Artistry',
    category: 'makeup',
    rating: 5.0,
    reviews: 89,
    price: '$80-150',
    location: 'Uptown',
    services: ['Bridal Makeup', 'Event Makeup', 'Lessons'],
    availability: 'Next Week',
    image: 'https://via.placeholder.com/100x100',
    latitude: 37.7649,
    longitude: -122.3994,
  },
  {
    id: '4',
    name: 'Pure Skincare Clinic',
    category: 'skincare',
    rating: 4.7,
    reviews: 312,
    price: '$60-120',
    location: 'East Side',
    services: ['Facial', 'Chemical Peel', 'Microdermabrasion'],
    availability: 'Available Now',
    image: 'https://via.placeholder.com/100x100',
    latitude: 37.7549,
    longitude: -122.3894,
  },
  {
    id: '5',
    name: 'Zen Massage Therapy',
    category: 'massage',
    rating: 4.9,
    reviews: 198,
    price: '$70-100',
    location: 'West End',
    services: ['Deep Tissue', 'Swedish', 'Hot Stone'],
    availability: 'Book Today',
    image: 'https://via.placeholder.com/100x100',
    latitude: 37.7449,
    longitude: -122.3794,
  },
  {
    id: '6',
    name: 'Lash Extensions Pro',
    category: 'lashes',
    rating: 4.8,
    reviews: 127,
    price: '$40-90',
    location: 'Central',
    services: ['Lash Extensions', 'Lash Lift', 'Tinting'],
    availability: 'Available Now',
    image: 'https://via.placeholder.com/100x100',
    latitude: 37.7349,
    longitude: -122.3694,
  },
];

const SearchScreenEnhanced: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [providers, setProviders] = useState<any[]>(mockProviders);
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
  
  // Map-related state
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isLoading) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isLoading]);

  const handleCategoryPress = (categoryId: string) => {
    const newCategory = selectedCategory === categoryId ? null : categoryId;
    setSelectedCategory(newCategory);
    setHasSearched(true);
    setIsLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      if (newCategory) {
        const category = SEARCH_CATEGORIES.find(c => c.id === newCategory);
        if (category) {
          setSearchQuery(category.name);
          // Filter providers by category
          const categoryProviders = mockProviders.filter(provider => 
            provider.category?.toLowerCase() === newCategory.toLowerCase() ||
            provider.services?.some((service: string) => 
              service.toLowerCase().includes(newCategory.toLowerCase())
            )
          );
          setProviders(categoryProviders);
        }
      } else {
        setSearchQuery('');
        setProviders(mockProviders);
      }
      setIsLoading(false);
    }, 800);
  };

  const handleHistoryItemPress = (historyItem: string) => {
    setSearchQuery(historyItem);
    setIsSearchFocused(false);
    setHasSearched(true);
  };

  const performSearch = (query: string = searchQuery) => {
    if (query.trim().length === 0) return;
    
    setIsLoading(true);
    setHasSearched(true);
    
    // Add to search history if not already present
    if (!searchHistory.includes(query)) {
      setSearchHistory(prev => [query, ...prev.slice(0, 4)]);
    }
    
    // Simulate API call
    setTimeout(() => {
      const filteredProviders = mockProviders.filter(provider =>
        provider.name.toLowerCase().includes(query.toLowerCase()) ||
        provider.services.some((service: string) => 
          service.toLowerCase().includes(query.toLowerCase())
        ) ||
        provider.category.toLowerCase().includes(query.toLowerCase())
      );
      setProviders(filteredProviders);
      setIsLoading(false);
    }, 800);
  };

  const renderCategory = ({ item: category }: { item: SearchCategory }) => (
    <TouchableOpacity
      style={[
        styles.modernCategoryCard,
        selectedCategory === category.id && styles.modernCategoryCardActive
      ]}
      onPress={() => handleCategoryPress(category.id)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={selectedCategory === category.id ? 
          [MODERN_COLORS.primary, MODERN_COLORS.primaryDark] : 
          category.gradient as any
        }
        style={[
          styles.modernCategoryGradient,
          selectedCategory === category.id && styles.modernCategoryGradientActive
        ]}
      >
        <Ionicons 
          name={category.icon as any} 
          size={selectedCategory === category.id ? 32 : 28} 
          color={MODERN_COLORS.white}
        />
      </LinearGradient>
      <Text style={[
        styles.modernCategoryName,
        selectedCategory === category.id && styles.modernCategoryNameActive
      ]}>
        {category.name}
      </Text>
      {selectedCategory === category.id && (
        <View style={styles.modernCategoryBadge}>
          <Text style={styles.modernCategoryBadgeText}>●</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderProvider = (provider: any) => (
    <TouchableOpacity
      key={provider.id}
      style={styles.modernProviderCard}
      activeOpacity={0.95}
    >
      <View style={styles.modernCardHeader}>
        <View style={styles.modernProviderImageContainer}>
          <Image source={{ uri: provider.image }} style={styles.modernProviderImage} />
          <View style={styles.modernAvailabilityBadge}>
            <Text style={styles.modernAvailabilityText}>{provider.availability}</Text>
          </View>
        </View>
        
        <View style={styles.modernProviderInfo}>
          <Text style={styles.modernProviderName}>{provider.name}</Text>
          <View style={styles.modernRatingContainer}>
            <Ionicons name="star" size={16} color={MODERN_COLORS.warning} />
            <Text style={styles.modernRatingText}>{provider.rating}</Text>
            <Text style={styles.modernReviewsText}>({provider.reviews} reviews)</Text>
          </View>
          <Text style={styles.modernLocationText}>{provider.location}</Text>
        </View>
        
        <View style={styles.modernPriceContainer}>
          <Text style={styles.modernPriceText}>{provider.price}</Text>
        </View>
      </View>
      
      <View style={styles.servicesContainer}>
        {provider.services.slice(0, 3).map((service: string, index: number) => (
          <View key={index} style={styles.serviceTag}>
            <Text style={styles.serviceText}>{service}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.providerFooter}>
        <Text style={styles.price}>{provider.price}</Text>
        <TouchableOpacity style={styles.bookButton} activeOpacity={0.8}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={[MODERN_COLORS.primary, MODERN_COLORS.primaryDark]}
        style={styles.modernHeader}
      >
        <SafeAreaView style={styles.modernHeaderContent}>
          <View style={styles.modernSearchContainer}>
            <View style={styles.modernSearchInputContainer}>
              <Ionicons name="search-outline" size={20} color={MODERN_COLORS.gray400} />
              <TextInput
                style={styles.modernSearchInput}
                placeholder="Search services, providers..."
                placeholderTextColor={MODERN_COLORS.gray400}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onSubmitEditing={() => performSearch()}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={MODERN_COLORS.gray400} />
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity style={styles.modernFilterButton}>
              <Ionicons name="options-outline" size={20} color={MODERN_COLORS.white} />
            </TouchableOpacity>
          </View>
          
          {/* Modern View Toggle */}
          <View style={styles.modernViewToggle}>
            <TouchableOpacity
              style={[
                styles.modernToggleButton,
                viewMode === 'list' && styles.modernToggleButtonActive
              ]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.8}
            >
              <Ionicons 
                name="list-outline" 
                size={18} 
                color={viewMode === 'list' ? MODERN_COLORS.white : MODERN_COLORS.gray600} 
              />
              <Text style={[
                styles.modernToggleText,
                viewMode === 'list' && styles.modernToggleTextActive
              ]}>
                List
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.modernToggleButton,
                viewMode === 'map' && styles.modernToggleButtonActive
              ]}
              onPress={() => setViewMode('map')}
              activeOpacity={0.8}
            >
              <Ionicons 
                name="map-outline" 
                size={18} 
                color={viewMode === 'map' ? MODERN_COLORS.white : MODERN_COLORS.gray600} 
              />
              <Text style={[
                styles.modernToggleText,
                viewMode === 'map' && styles.modernToggleTextActive
              ]}>
                Map
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Main Content Area */}
      {viewMode === 'list' ? (
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Modern Quick Filters */}
          {!isSearchFocused && searchQuery.length > 0 && (
            <View style={styles.modernQuickFiltersContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.modernQuickFiltersContent}
              >
                <TouchableOpacity style={styles.modernQuickFilter} activeOpacity={0.7}>
                  <Ionicons name="location-outline" size={16} color={MODERN_COLORS.primary} />
                  <Text style={styles.modernQuickFilterText}>Near me</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modernQuickFilter} activeOpacity={0.7}>
                  <Ionicons name="star-outline" size={16} color={MODERN_COLORS.primary} />
                  <Text style={styles.modernQuickFilterText}>Top rated</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modernQuickFilter} activeOpacity={0.7}>
                  <Ionicons name="flash-outline" size={16} color={MODERN_COLORS.primary} />
                  <Text style={styles.modernQuickFilterText}>Available now</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modernQuickFilter} activeOpacity={0.7}>
                  <Ionicons name="cash-outline" size={16} color={MODERN_COLORS.primary} />
                  <Text style={styles.modernQuickFilterText}>Price: Low to High</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* Modern Search History */}
          {isSearchFocused && searchQuery.length === 0 && (
            <View style={styles.modernSearchHistoryContainer}>
              <View style={styles.modernSectionHeader}>
                <Text style={styles.modernSectionTitle}>Recent Searches</Text>
                <TouchableOpacity style={styles.modernClearHistoryButton}>
                  <Text style={styles.modernClearHistoryText}>Clear</Text>
                </TouchableOpacity>
              </View>
              {searchHistory.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modernHistoryItem}
                  onPress={() => handleHistoryItemPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.modernHistoryIconContainer}>
                    <Ionicons name="time-outline" size={18} color={MODERN_COLORS.gray500} />
                  </View>
                  <Text style={styles.modernHistoryText}>{item}</Text>
                  <Ionicons name="arrow-up-outline" size={16} color={MODERN_COLORS.gray400} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Enhanced Categories Section */}
          {!isSearchFocused && (
            <View style={styles.modernCategoriesSection}>
              <View style={styles.modernCategoriesHeader}>
                <Text style={styles.modernCategoriesTitle}>Browse by Category</Text>
                {selectedCategory && (
                  <TouchableOpacity
                    style={styles.modernShowAllButton}
                    onPress={() => handleCategoryPress(selectedCategory)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modernShowAllText}>Show All</Text>
                    <Ionicons name="close-circle-outline" size={16} color={MODERN_COLORS.gray500} />
                  </TouchableOpacity>
                )}
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.modernCategoriesContainer}
              >
                {SEARCH_CATEGORIES.map((category, index) => (
                  <View key={category.id}>
                    {renderCategory({ item: category })}
                  </View>
                ))}
              </ScrollView>
              {selectedCategory && (
                <View style={styles.modernCategoryResultsInfo}>
                  <Text style={styles.modernResultsText}>
                    {providers.length} providers found in {SEARCH_CATEGORIES.find(c => c.id === selectedCategory)?.name}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Loading and Results */}
          {!isSearchFocused && (
            <>
              {isLoading ? (
                <View style={styles.modernLoadingContainer}>
                  <Animated.View style={[
                    styles.modernLoadingCard,
                    { transform: [{ scale: pulseAnim }] }
                  ]}>
                    <ActivityIndicator size="large" color={MODERN_COLORS.primary} />
                    <Text style={styles.modernLoadingText}>Finding the best providers for you...</Text>
                  </Animated.View>
                </View>
              ) : providers.length === 0 && hasSearched ? (
                <View style={styles.modernEmptyContainer}>
                  <LinearGradient
                    colors={[MODERN_COLORS.gray50, MODERN_COLORS.white]}
                    style={styles.modernEmptyCard}
                  >
                    <Ionicons name="search-outline" size={64} color={MODERN_COLORS.gray300} />
                    <Text style={styles.modernEmptyTitle}>No providers found</Text>
                    <Text style={styles.modernEmptySubtitle}>
                      Try adjusting your search or browse our categories
                    </Text>
                    <TouchableOpacity
                      style={styles.modernRetryButton}
                      onPress={() => setSearchQuery('')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.modernRetryText}>Clear Search</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              ) : (
                providers.map((provider) => renderProvider(provider))
              )}
            </>
          )}
        </ScrollView>
      ) : (
        <View style={styles.modernMapContainer}>
          <MapView
            style={styles.modernMap}
            initialRegion={mapRegion}
            onRegionChangeComplete={setMapRegion}
          >
            {providers.map((provider) => (
              <Marker
                key={provider.id}
                coordinate={{
                  latitude: provider.latitude || 40.7128,
                  longitude: provider.longitude || -74.0060,
                }}
                onPress={() => setSelectedProvider(provider)}
              >
                <View style={styles.modernMarker}>
                  <Text style={styles.modernMarkerText}>$</Text>
                </View>
              </Marker>
            ))}
          </MapView>
        </View>
      )}

      {/* Modern Floating Action Button */}
      <TouchableOpacity
        style={styles.modernFloatingButton}
        onPress={() => {/* Handle advanced search */}}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[MODERN_COLORS.primary, MODERN_COLORS.primaryDark]}
          style={styles.modernFloatingGradient}
        >
          <Ionicons name="options-outline" size={20} color={MODERN_COLORS.white} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MODERN_COLORS.gray50,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  
  // Modern header styles
  modernHeader: {
    paddingTop: 0,
    ...SHADOWS.lg,
  },
  modernHeaderContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  modernSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  modernSearchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MODERN_COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  modernSearchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.gray900,
  },
  modernFilterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    ...SHADOWS.sm,
  },
  modernViewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs,
  },
  modernToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  modernToggleButtonActive: {
    backgroundColor: MODERN_COLORS.white,
    ...SHADOWS.sm,
  },
  modernToggleText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.gray600,
  },
  modernToggleTextActive: {
    color: MODERN_COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },

  content: {
    flex: 1,
  },

  // Modern quick filters
  modernQuickFiltersContainer: {
    backgroundColor: MODERN_COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.gray100,
  },
  modernQuickFiltersContent: {
    paddingHorizontal: SPACING.xs,
    gap: SPACING.sm,
  },
  modernQuickFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MODERN_COLORS.gray50,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: MODERN_COLORS.gray200,
  },
  modernQuickFilterText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.medium,
    marginLeft: SPACING.xs,
  },

  // Modern search history styles
  modernSearchHistoryContainer: {
    backgroundColor: MODERN_COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    margin: SPACING.sm,
    ...SHADOWS.sm,
  },
  modernSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.gray100,
  },
  modernSectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    color: MODERN_COLORS.gray900,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
  modernClearHistoryButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: MODERN_COLORS.gray50,
  },
  modernClearHistoryText: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.gray600,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  modernHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
  },
  modernHistoryIconContainer: {
    marginRight: SPACING.sm,
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: MODERN_COLORS.gray50,
  },
  modernHistoryText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.gray700,
    flex: 1,
  },

  // Enhanced category section styles
  modernCategoriesSection: {
    backgroundColor: MODERN_COLORS.white,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  modernCategoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modernCategoriesTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.gray900,
  },
  modernShowAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MODERN_COLORS.gray50,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: MODERN_COLORS.gray200,
  },
  modernShowAllText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    fontWeight: TYPOGRAPHY.weight.medium,
    marginRight: SPACING.xs,
  },
  modernCategoriesContainer: {
    paddingHorizontal: SPACING.xs,
  },
  modernCategoryResultsInfo: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: MODERN_COLORS.gray100,
  },
  modernResultsText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Modern Category Card Styles
  modernCategoryCard: {
    alignItems: 'center',
    marginRight: SPACING.md,
    width: 85,
    position: 'relative',
  },
  modernCategoryCardActive: {
    transform: [{ scale: 1.05 }],
  },
  modernCategoryGradient: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
    ...SHADOWS.sm,
  },
  modernCategoryGradientActive: {
    ...SHADOWS.lg,
    elevation: 8,
  },
  modernCategoryName: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.gray700,
    textAlign: 'center',
    lineHeight: 16,
  },
  modernCategoryNameActive: {
    color: MODERN_COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  modernCategoryBadge: {
    position: 'absolute',
    top: -5,
    right: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: MODERN_COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: MODERN_COLORS.white,
  },
  modernCategoryBadgeText: {
    fontSize: 8,
    color: MODERN_COLORS.white,
    fontWeight: TYPOGRAPHY.weight.bold,
  },

  // Modern provider card styles
  modernProviderCard: {
    backgroundColor: MODERN_COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  modernCardHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  modernProviderImageContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  modernProviderImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.lg,
  },
  modernAvailabilityBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: MODERN_COLORS.success,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: MODERN_COLORS.white,
  },
  modernAvailabilityText: {
    fontSize: 8,
    color: MODERN_COLORS.white,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  modernProviderInfo: {
    flex: 1,
  },
  modernProviderName: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.gray900,
    marginBottom: SPACING.xs,
  },
  modernRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  modernRatingText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.gray700,
    marginLeft: SPACING.xs,
  },
  modernReviewsText: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.gray500,
    marginLeft: SPACING.xs,
  },
  modernLocationText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
  },
  modernPriceContainer: {
    alignItems: 'flex-end',
  },
  modernPriceText: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.primary,
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
    color: MODERN_COLORS.white,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },

  // Modern loading and empty states
  modernLoadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  modernLoadingCard: {
    backgroundColor: MODERN_COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.sm,
    width: '80%',
  },
  modernLoadingText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.gray600,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  modernEmptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  modernEmptyCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '90%',
    ...SHADOWS.sm,
  },
  modernEmptyTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.gray800,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  modernEmptySubtitle: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.gray600,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  modernRetryButton: {
    backgroundColor: MODERN_COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  modernRetryText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.white,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },

  // Modern floating action button
  modernFloatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    ...SHADOWS.lg,
    elevation: 8,
  },
  modernFloatingGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Map related styles
  modernMapContainer: {
    flex: 1,
    backgroundColor: MODERN_COLORS.gray50,
  },
  modernMap: {
    flex: 1,
  },
  modernMarker: {
    backgroundColor: MODERN_COLORS.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: MODERN_COLORS.white,
  },
  modernMarkerText: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.white,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
});

export default SearchScreenEnhanced;
