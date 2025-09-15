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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Region } from 'react-native-maps';
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
  const [providers, setProviders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
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
      console.log('🔄 Loading featured providers from API...');
      const providersResponse = await ApiService.getServiceProviders(1, 10);
      
      if (providersResponse && providersResponse.data && providersResponse.data.length > 0) {
        console.log('✅ Successfully loaded providers from API:', providersResponse.data.length);
        
        // Convert API providers to expected format
        const realProviders = providersResponse.data.map((provider: any) => ({
          id: provider.id,
          businessName: provider.businessName || 'Beauty Studio',
          firstName: provider.firstName || '',
          lastName: provider.lastName || '',
          profilePictureUrl: provider.profilePictureUrl || `https://images.unsplash.com/photo-1562322140-8baeececf3df?w=300`,
          averageRating: provider.averageRating || 4.5,
          totalReviews: provider.totalReviews || 0,
          location: provider.businessAddress || 'Location available in-store',
          services: provider.specialties || ['Beauty Services'],
          price: provider.priceRange || '$$',
          isVerified: provider.verified || false,
          specialties: provider.specialties || ['Professional Services'],
        }));
        
        setProviders(realProviders);
        console.log('🎯 Providers set in state:', realProviders.length, 'providers');
        console.log('🎯 First provider sample:', realProviders[0]);
      } else {
        console.log('📡 No providers returned from API');
        setProviders([]);
      }
    } catch (error) {
      console.error('❌ Error loading providers from API:', error);
      setProviders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChip = (filter: string) => {
    setActiveFilters(prev => {
      if (prev.includes(filter)) {
        return prev.filter(f => f !== filter);
      } else {
        return [...prev, filter];
      }
    });
    // Here you would typically trigger a search with the new filters
    performSearch();
  };

  const performSearch = async () => {
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      console.log('🔍 Performing search via API for:', searchQuery);
      const searchResponse = await ApiService.getServiceProviders(1, 20, { 
        category: selectedCategory?.toLowerCase(),
        sortBy: 'rating',
        sortOrder: 'desc'
      });
      
      if (searchResponse && searchResponse.data) {
        console.log('✅ Search API returned:', searchResponse.data.length, 'results');
        
          // Convert API search results to expected format
          const realResults = searchResponse.data.map((provider: any) => ({
            id: provider.id,
            businessName: provider.businessName || 'Beauty Studio',
            firstName: provider.firstName || '',
            lastName: provider.lastName || '',
            profilePictureUrl: provider.profilePictureUrl || `https://images.unsplash.com/photo-1562322140-8baeececf3df?w=300`,
            averageRating: provider.averageRating || 4.5,
            totalReviews: provider.totalReviews || 0,
            location: provider.businessAddress || 'Location available in-store',
            services: provider.specialties || ['Beauty Services'],
            price: provider.priceRange || '$$',
            isVerified: provider.verified || false,
            specialties: provider.specialties || ['Professional Services'],
          }));        setProviders(realResults);
      } else {
        console.log('📡 No search results from API');
        setProviders([]);
      }
    } catch (error) {
      console.error('❌ Error performing search:', error);
      setProviders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    const newCategory = selectedCategory === categoryId ? null : categoryId;
    setSelectedCategory(newCategory);
    setHasSearched(true);
    setIsLoading(true);
    
    // Perform API search with category filter
    setTimeout(async () => {
      try {
        if (newCategory) {
          const category = SEARCH_CATEGORIES.find(c => c.id === newCategory);
          if (category) {
            setSearchQuery(category.name);
            // Search for providers in this category via API
            const categoryResponse = await ApiService.getServiceProviders(1, 20, { 
              category: newCategory.toLowerCase(),
              sortBy: 'rating',
              sortOrder: 'desc'
            });
            
            if (categoryResponse && categoryResponse.data) {
              const categoryProviders = categoryResponse.data.map((provider: any) => ({
                id: provider.id,
                businessName: provider.businessName || 'Beauty Studio',
                firstName: provider.firstName || '',
                lastName: provider.lastName || '',
                profilePictureUrl: provider.profilePictureUrl || `https://images.unsplash.com/photo-1562322140-8baeececf3df?w=300`,
                averageRating: provider.averageRating || 4.5,
                totalReviews: provider.totalReviews || 0,
                location: provider.businessAddress || 'Location available in-store',
                services: provider.specialties || ['Beauty Services'],
                price: provider.priceRange || '$$',
                isVerified: provider.verified || false,
                specialties: provider.specialties || ['Professional Services'],
              }));
              setProviders(categoryProviders);
            } else {
              setProviders([]);
            }
          }
        } else {
          setSearchQuery('');
          loadFeaturedProviders();
        }
      } catch (error) {
        console.error('❌ Error filtering by category:', error);
        setProviders([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleHistoryItemPress = (historyItem: string) => {
    setSearchQuery(historyItem);
    setIsSearchFocused(false);
  };

  const renderProvider = ({ item: provider }: { item: any }) => (
    <TouchableOpacity 
      style={styles.modernProviderCard}
      onPress={() => navigation.navigate('EnhancedProviderProfile', { providerId: provider.id })}
      activeOpacity={0.9}
    >
      <View style={styles.modernCardContent}>
        <View style={styles.modernCardHeader}>
          <Image 
            source={{ uri: provider.profilePictureUrl }} 
            style={styles.modernProviderImage} 
          />
          <View style={styles.modernProviderInfo}>
            <View style={styles.modernProviderNameRow}>
              <Text style={styles.modernProviderName}>{provider.businessName}</Text>
              {provider.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color={MODERN_COLORS.success} />
              )}
            </View>
            <Text style={styles.modernProviderLocation}>{provider.location}</Text>
            <View style={styles.modernRatingContainer}>
              <Ionicons name="star" size={14} color={MODERN_COLORS.warning} />
              <Text style={styles.modernRating}>{provider.averageRating}</Text>
              <Text style={styles.modernReviewCount}>({provider.totalReviews})</Text>
            </View>
          </View>
          <View style={styles.modernPriceContainer}>
            <Text style={styles.modernPriceLabel}>from</Text>
            <Text style={styles.modernPrice}>{provider.price}</Text>
          </View>
        </View>
        
        {/* Services Tags */}
        <View style={styles.modernServicesContainer}>
          {provider.services?.slice(0, 3).map((service: any, index: number) => (
            <View key={index} style={styles.modernServiceTag}>
              <Text style={styles.modernServiceText}>{service}</Text>
            </View>
          ))}
          {provider.services?.length > 3 && (
            <Text style={styles.modernMoreServices}>+{provider.services.length - 3} more</Text>
          )}
        </View>
        
        {/* Card Footer */}
        <View style={styles.modernCardFooter}>
          <View style={styles.modernAvailabilityBadge}>
            <Ionicons name="time-outline" size={14} color={MODERN_COLORS.success} />
            <Text style={styles.modernAvailabilityText}>Available today</Text>
          </View>
          <TouchableOpacity style={styles.modernBookButton}>
            <Text style={styles.modernBookButtonText}>Book Now</Text>
            <Ionicons name="arrow-forward" size={14} color={MODERN_COLORS.surface} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

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

  return (
    <View style={styles.modernContainer}>
      {/* Modern Gradient Header */}
      <LinearGradient 
        colors={[MODERN_COLORS.primary, MODERN_COLORS.primaryDark]} 
        style={styles.modernHeader}
      >
        <SafeAreaView>
          <View style={styles.modernHeaderContent}>
            <View style={styles.modernHeaderTop}>
              <View style={styles.modernHeaderTextSection}>
                <Text style={styles.modernHeaderTitle}>Find Your Perfect</Text>
                <Text style={styles.modernHeaderSubtitle}>Service Provider</Text>
              </View>
              <TouchableOpacity style={styles.modernProfileButton}>
                <Ionicons name="person-circle" size={32} color="rgba(255, 255, 255, 0.9)" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modernSearchContainer}>
              <View style={styles.modernSearchInputWrapper}>
                <Ionicons name="search" size={28} color="rgba(255, 255, 255, 0.8)" style={styles.modernSearchIcon} />
                <TextInput
                  style={styles.modernSearchInput}
                  placeholder="Search services, providers..."
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity 
                    style={styles.modernClearButton}
                    onPress={() => setSearchQuery('')}
                  >
                    <Ionicons name="close-circle" size={28} color="rgba(255, 255, 255, 0.8)" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Modern Filter Chips */}
      <View style={styles.modernFilterChipsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modernFilterChipsContent}
        >
          <TouchableOpacity 
            style={[
              styles.modernFilterChip,
              activeFilters.includes('near-me') && styles.modernFilterChipActive
            ]}
            onPress={() => handleFilterChip('near-me')}
          >
            <Ionicons 
              name="location-outline" 
              size={16} 
              color={activeFilters.includes('near-me') ? MODERN_COLORS.surface : MODERN_COLORS.primary} 
            />
            <Text style={[
              styles.modernFilterChipText,
              activeFilters.includes('near-me') && styles.modernFilterChipTextActive
            ]}>
              Near Me
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.modernFilterChip,
              activeFilters.includes('top-rated') && styles.modernFilterChipActive
            ]}
            onPress={() => handleFilterChip('top-rated')}
          >
            <Ionicons 
              name="star" 
              size={16} 
              color={activeFilters.includes('top-rated') ? MODERN_COLORS.surface : MODERN_COLORS.warning} 
            />
            <Text style={[
              styles.modernFilterChipText,
              activeFilters.includes('top-rated') && styles.modernFilterChipTextActive
            ]}>
              Top Rated
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.modernFilterChip,
              activeFilters.includes('available-now') && styles.modernFilterChipActive
            ]}
            onPress={() => handleFilterChip('available-now')}
          >
            <Ionicons 
              name="flash" 
              size={16} 
              color={activeFilters.includes('available-now') ? MODERN_COLORS.surface : MODERN_COLORS.success} 
            />
            <Text style={[
              styles.modernFilterChipText,
              activeFilters.includes('available-now') && styles.modernFilterChipTextActive
            ]}>
              Available Now
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.modernFilterChip,
              activeFilters.includes('best-price') && styles.modernFilterChipActive
            ]}
            onPress={() => handleFilterChip('best-price')}
          >
            <Ionicons 
              name="pricetag" 
              size={16} 
              color={activeFilters.includes('best-price') ? MODERN_COLORS.surface : MODERN_COLORS.accent} 
            />
            <Text style={[
              styles.modernFilterChipText,
              activeFilters.includes('best-price') && styles.modernFilterChipTextActive
            ]}>
              Best Price
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.modernFilterChip,
              activeFilters.includes('open-late') && styles.modernFilterChipActive
            ]}
            onPress={() => handleFilterChip('open-late')}
          >
            <Ionicons 
              name="time" 
              size={16} 
              color={activeFilters.includes('open-late') ? MODERN_COLORS.surface : MODERN_COLORS.info} 
            />
            <Text style={[
              styles.modernFilterChipText,
              activeFilters.includes('open-late') && styles.modernFilterChipTextActive
            ]}>
              Open Late
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Modern View Toggle */}
      <View style={styles.modernViewToggle}>
        <View style={styles.modernToggleContainer}>
          <TouchableOpacity
            style={[
              styles.modernToggleButton,
              viewMode === 'list' && styles.modernToggleButtonActive
            ]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons 
              name="list" 
              size={18} 
              color={viewMode === 'list' ? MODERN_COLORS.surface : MODERN_COLORS.gray600} 
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
          >
            <Ionicons 
              name="map" 
              size={18} 
              color={viewMode === 'map' ? MODERN_COLORS.surface : MODERN_COLORS.gray600} 
            />
            <Text style={[
              styles.modernToggleText,
              viewMode === 'map' && styles.modernToggleTextActive
            ]}>
              Map
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Results count */}
        {hasSearched && (
            <Text style={styles.modernResultsCount}>
              {isLoading ? 'Searching...' : `${providers.length} found`}
            </Text>
        )}
      </View>

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

          {/* Categories and Results */}
          {!isSearchFocused && (
            <>
              {/* Enhanced Categories Section */}
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

              {/* Providers List Section */}
              {(() => {
                console.log('🔍 Render condition check:', {
                  hasSearched,
                  providersLength: providers.length,
                  shouldShow: hasSearched || providers.length > 0
                });
                return (hasSearched || providers.length > 0);
              })() && (
                <View style={styles.modernProvidersSection}>
                  {isLoading ? (
                    <View style={styles.modernLoadingContainer}>
                      <Animated.View style={[styles.modernLoadingContent, { transform: [{ scale: pulseAnim }] }]}>
                        <ActivityIndicator size="large" color={MODERN_COLORS.primary} />
                        <Text style={styles.modernLoadingText}>Finding the best providers for you...</Text>
                      </Animated.View>
                    </View>
                  ) : providers.length > 0 ? (
                    <>
                      <View style={styles.modernResultsHeader}>
                        <Text style={styles.modernResultsTitle}>
                          {searchQuery ? `Results for "${searchQuery}"` : 'Featured Providers'}
                        </Text>
                        <Text style={styles.modernResultsCount}>
                          {providers.length} {providers.length === 1 ? 'provider' : 'providers'}
                        </Text>
                      </View>
                      {providers.map((provider, index) => (
                        <View key={provider.id || index}>
                          {renderProvider({ item: provider })}
                        </View>
                      ))}
                    </>
                  ) : hasSearched && (
                    <View style={styles.modernEmptyState}>
                      <Ionicons name="search-outline" size={64} color={MODERN_COLORS.gray300} />
                      <Text style={styles.modernEmptyTitle}>No providers found</Text>
                      <Text style={styles.modernEmptySubtitle}>
                        Try adjusting your search or explore different categories
                      </Text>
                      <TouchableOpacity
                        style={styles.modernEmptyButton}
                        onPress={() => {
                          setSearchQuery('');
                          setSelectedCategory(null);
                          setHasSearched(false);
                          loadFeaturedProviders();
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.modernEmptyButtonText}>Browse All Categories</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
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
                  <Text style={styles.modernMarker}>$</Text>
                </View>
              </Marker>
            ))}
          </MapView>
        </View>
      )}

      {/* Modern Floating Action Button for Advanced Search */}
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
    backgroundColor: MODERN_COLORS.background,
  },
  
  scrollContent: {
    paddingBottom: SPACING.tabBarHeight + SPACING.md,
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

  // Modern Styles
  modernContainer: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  modernHeader: {
    paddingBottom: SPACING.md,
  },
  modernHeaderContent: {
    paddingHorizontal: 0,
    paddingBottom: SPACING.sm,
  },
  modernHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  modernHeaderTextSection: {
    flex: 1,
  },
  modernHeaderTitle: {
    fontSize: TYPOGRAPHY['3xl'],
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.surface,
    lineHeight: TYPOGRAPHY['3xl'] * 1.1,
  },
  modernHeaderSubtitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: -2,
  },
  modernProfileButton: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modernSearchContainer: {
    paddingHorizontal: SPACING.md,
  },
  modernSearchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    height: 80,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modernSearchIcon: {
    marginRight: SPACING.xs,
  },
  modernSearchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.xl,
    color: MODERN_COLORS.surface,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  modernClearButton: {
    padding: SPACING.xs,
  },
  modernFilterButton: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modernFilterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MODERN_COLORS.accent,
  },
  
  // Modern Filter Chips
  modernFilterChipsContainer: {
    backgroundColor: MODERN_COLORS.surface,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
  },
  modernFilterChipsContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  modernFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MODERN_COLORS.gray50,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: MODERN_COLORS.gray200,
    gap: SPACING.xs,
  },
  modernFilterChipActive: {
    backgroundColor: MODERN_COLORS.primary,
    borderColor: MODERN_COLORS.primary,
  },
  modernFilterChipText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.gray700,
  },
  modernFilterChipTextActive: {
    color: MODERN_COLORS.surface,
  },
  modernViewToggle: {
    backgroundColor: MODERN_COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
  },
  modernToggleContainer: {
    flexDirection: 'row',
    backgroundColor: MODERN_COLORS.gray100,
    borderRadius: BORDER_RADIUS.lg,
    padding: 2,
  },
  modernToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  modernToggleButtonActive: {
    backgroundColor: MODERN_COLORS.primary,
    ...SHADOWS.sm,
  },
  modernToggleText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.gray600,
  },
  modernToggleTextActive: {
    color: MODERN_COLORS.surface,
  },
  modernResultsCount: {
    backgroundColor: MODERN_COLORS.gray100,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  modernResultsText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  modernMapContainer: {
    flex: 1,
  },
  modernMap: {
    flex: 1,
  },
  modernMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: MODERN_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  modernMapProviderCard: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
  },
  modernMapCard: {
    backgroundColor: MODERN_COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernMapCardImage: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.sm,
  },
  modernMapCardContent: {
    flex: 1,
  },
  modernMapCardTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.gray900,
    marginBottom: 2,
  },
  modernMapCardDescription: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  modernMapCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modernMapCardRatingText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.gray900,
  },
  modernMapCardClose: {
    padding: SPACING.xs,
  },

  // Modern Provider Card Styles
  modernProviderCard: {
    backgroundColor: MODERN_COLORS.surface,
    borderRadius: 0,
    marginHorizontal: 0,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
    overflow: 'hidden',
  },
  modernCardContent: {
    padding: SPACING.md,
  },
  modernCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  modernProviderImage: {
    width: 70,
    height: 70,
    borderRadius: BORDER_RADIUS.lg,
    marginRight: SPACING.sm,
    backgroundColor: MODERN_COLORS.gray100,
  },
  modernProviderInfo: {
    flex: 1,
  },
  modernProviderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 2,
  },
  modernProviderName: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.gray900,
    flex: 1,
  },
  modernProviderLocation: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  modernRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modernRating: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.gray900,
  },
  modernReviewCount: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
  },
  modernPriceContainer: {
    alignItems: 'flex-end',
  },
  modernPriceLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.gray600,
    marginBottom: 2,
  },
  modernPrice: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.primary,
  },
  modernServicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  modernServiceTag: {
    backgroundColor: MODERN_COLORS.gray100,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
  },
  modernServiceText: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.gray700,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  modernMoreServices: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.gray600,
    alignSelf: 'center',
    fontStyle: 'italic',
  },
  modernCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modernAvailabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: MODERN_COLORS.gray100,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
  },
  modernAvailabilityText: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.success,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  modernBookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MODERN_COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
    ...SHADOWS.sm,
  },
  modernBookButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.surface,
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

  // Modern quick filters
  modernQuickFiltersContainer: {
    backgroundColor: MODERN_COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.gray100,
  },
  modernQuickFiltersContent: {
    paddingHorizontal: SPACING.sm,
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

  // Enhanced category section styles
  modernCategoriesSection: {
    backgroundColor: MODERN_COLORS.white,
    paddingVertical: SPACING.lg,
    paddingHorizontal: 0,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  modernCategoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
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
    paddingHorizontal: SPACING.sm,
  },
  modernCategoryResultsInfo: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: MODERN_COLORS.gray100,
  },

  // Providers section
  modernProvidersSection: {
    flex: 1,
    backgroundColor: MODERN_COLORS.gray50,
    paddingHorizontal: 0,
  },
  modernLoadingContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modernResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: MODERN_COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  modernResultsTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.gray900,
  },
  modernEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    backgroundColor: MODERN_COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.lg,
    ...SHADOWS.sm,
  },
  modernEmptyButton: {
    backgroundColor: MODERN_COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  modernEmptyButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: MODERN_COLORS.white,
  },
});

export default SearchScreen;
