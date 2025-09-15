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
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MapView, { Marker, Region } from 'react-native-maps';
import { ServiceProvider, SearchFilters, RootStackParamList, ClientLoyaltyStatus } from '../../types';
import ApiService from '../../services/api';
import SearchService from '../../services/searchService';
import AdvancedFilterModal from '../../components/AdvancedFilterModal';
import SearchHistory from '../../components/SearchHistory';
import FirstTimeUserGuide, { useFirstTimeUserGuide } from '../../components/FirstTimeUserGuide';
import InteractiveTutorial, { TutorialConfigs } from '../../components/InteractiveTutorial';
import SmartTooltip, { useSmartTooltips, HelpfulTooltips } from '../../components/SmartTooltip';
import QuickStartGuide, { useQuickStartGuide } from '../../components/QuickStartGuide';
import { useAuth } from '../../context/AuthContext';
import { MODERN_COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../../constants/modernDesign';

type SearchScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

const EnhancedSearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loyaltyStatuses, setLoyaltyStatuses] = useState<{[providerId: string]: ClientLoyaltyStatus}>({});
  const [providerPromotions, setProviderPromotions] = useState<{[providerId: string]: any[]}>({});
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // First-time user experience hooks
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const { user } = useAuth();
  
  // Initialize first-time user experience
  const userType = user?.isServiceProvider ? 'provider' : 'client';
  const firstTimeGuide = useFirstTimeUserGuide(userType);
  const quickStartGuide = useQuickStartGuide(userType);
  const smartTooltips = useSmartTooltips('Search', userType);

  useEffect(() => {
    loadSearchPreferences();
    
    // Show first-time user experience if needed
    if (!firstTimeGuide.loading && firstTimeGuide.shouldShow) {
      setTimeout(() => setShowFirstTimeGuide(true), 1000);
    } else if (!quickStartGuide.loading && quickStartGuide.shouldShow) {
      setTimeout(() => setShowQuickStart(true), 1500);
    }
  }, [firstTimeGuide.loading, firstTimeGuide.shouldShow, quickStartGuide.loading, quickStartGuide.shouldShow]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.length > 2 || SearchService.hasActiveFilters(filters)) {
        performSearch();
      } else if (searchQuery.length === 0 && !SearchService.hasActiveFilters(filters)) {
        loadFeaturedProviders();
      }
    }, 300); // Debounce search

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, filters]);

  const loadSearchPreferences = async () => {
    try {
      const preferences = await SearchService.getSearchPreferences();
      if (Object.keys(preferences).length > 0) {
        setFilters(preferences);
      }
    } catch (error) {
      console.error('Error loading search preferences:', error);
    }
  };

  const loadFeaturedProviders = async () => {
    setIsLoading(true);
    try {
      const response = await ApiService.getServiceProviders(1, 20, {});
      setProviders(response.data);
      
      // Load loyalty statuses for each provider if user is logged in
      if (user && !user.isServiceProvider) {
        loadLoyaltyStatuses(response.data);
      }
      
      // Load promotions for all providers
      loadProviderPromotions(response.data);
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLoyaltyStatuses = async (providerList: ServiceProvider[]) => {
    if (!user || user.isServiceProvider) return;
    
    try {
      const statusPromises = providerList.map(async (provider) => {
        try {
          // Use the correct endpoint that returns ClientLoyaltyStatusDto
          const status = await ApiService.getClientLoyaltyStatusWithProvider(provider.id);
          return { providerId: provider.id, status };
        } catch (error) {
          // If no loyalty program exists or error occurs, return null
          return { providerId: provider.id, status: null };
        }
      });

      const results = await Promise.all(statusPromises);
      const statusMap: {[providerId: string]: ClientLoyaltyStatus} = {};
      
      results.forEach(({ providerId, status }) => {
        if (status && status.pointsWithProvider > 0) {
          statusMap[providerId] = status;
        }
      });
      
      setLoyaltyStatuses(statusMap);
    } catch (error) {
      console.error('Error loading loyalty statuses:', error);
    }
  };

  const loadProviderPromotions = async (providerList: ServiceProvider[]) => {
    try {
      const promotionPromises = providerList.map(async (provider) => {
        try {
          const promotions = await ApiService.getPublicPromotions(provider.id);
          return { providerId: provider.id, promotions: promotions || [] };
        } catch (error) {
          return { providerId: provider.id, promotions: [] };
        }
      });

      const results = await Promise.all(promotionPromises);
      const promotions: {[providerId: string]: any[]} = {};
      results.forEach(result => {
        if (result.promotions && result.promotions.length > 0) {
          promotions[result.providerId] = result.promotions;
        }
      });
      
      setProviderPromotions(promotions);
    } catch (error) {
      console.error('Error loading promotions:', error);
    }
  };

  const performSearch = async () => {
    setIsLoading(true);
    setHasSearched(true);
    setShowSearchHistory(false);
    
    try {
      console.log('=== ENHANCED SEARCH DEBUG ===');
      console.log('Search query:', searchQuery);
      console.log('Current filters:', filters);
      
      // Save to recent searches
      if (searchQuery.trim() || SearchService.hasActiveFilters(filters)) {
        await SearchService.addRecentSearch(searchQuery, filters);
      }
      
      // Create search parameters that match backend expectations
      const searchParams: any = {
        page: 1,
        pageSize: 20,
      };
      
      // Add query if present
      if (searchQuery.trim()) {
        searchParams.query = searchQuery.trim();
      }
      
      // Add category filter if present and not "All"
      if (filters.category && filters.category !== 'All') {
        searchParams.category = filters.category;
      }
      
      // Add rating filter if present
      if (filters.rating) {
        searchParams.minRating = filters.rating;
      }
      
      // Add price filters if present
      if (filters.priceMin) {
        searchParams.priceMin = filters.priceMin;
      }
      
      if (filters.priceMax) {
        searchParams.priceMax = filters.priceMax;
      }
      
      // Add location/distance filter if present
      if (filters.distance) {
        // Extract number from distance string (e.g., "5 mi" -> 5)
        const distanceValue = parseFloat(filters.distance.replace(/[^\d.]/g, ''));
        searchParams.distance = distanceValue;
      }
      
      console.log('Final search params:', searchParams);
      
      const response = await ApiService.getServiceProviders(
        searchParams.page, 
        searchParams.pageSize, 
        {
          category: searchParams.category,
          rating: searchParams.minRating,
          priceMin: searchParams.priceMin,
          priceMax: searchParams.priceMax,
          distance: searchParams.distance ? `${searchParams.distance} mi` : undefined,
        },
        searchParams.query
      );
      
      console.log('Search response:', response);
      console.log('Providers found:', response.data.length);
      
      let sortedProviders = response.data;
      
      // Client-side sorting for better UX
      if (filters.sortBy && sortedProviders.length > 0) {
        sortedProviders = [...sortedProviders].sort((a, b) => {
          const order = filters.sortOrder === 'asc' ? 1 : -1;
          
          switch (filters.sortBy) {
            case 'rating':
              return ((b.averageRating || 0) - (a.averageRating || 0)) * order;
            case 'name':
              return a.businessName.localeCompare(b.businessName) * order;
            default:
              return 0;
          }
        });
      }
      
      setProviders(sortedProviders);
      
      // Load loyalty statuses for search results if user is logged in
      if (user && !user.isServiceProvider) {
        loadLoyaltyStatuses(sortedProviders);
      }
      
      // Load promotions for search results
      loadProviderPromotions(sortedProviders);
    } catch (error) {
      console.error('Error searching:', error);
      Alert.alert('Search Error', 'Failed to search providers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSelect = (query: string, selectedFilters: SearchFilters) => {
    setSearchQuery(query);
    setFilters(selectedFilters);
    setShowSearchHistory(false);
    setIsSearchFocused(false);
  };

  const handleApplyFilters = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handleSaveFilters = async (filtersToSave: SearchFilters) => {
    try {
      await SearchService.saveSearchPreferences(filtersToSave);
      Alert.alert('Success', 'Filter preferences saved!');
    } catch (error) {
      console.error('Error saving filter preferences:', error);
      Alert.alert('Error', 'Failed to save filter preferences');
    }
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  const handleQuickFilter = (filterKey: keyof SearchFilters, filterValue: any) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: prev[filterKey] === filterValue ? undefined : filterValue
    }));
  };

  const categories = [
    { name: 'All', icon: 'grid-outline', color: '#666' },
    { name: 'Hair', icon: 'cut-outline', color: '#FF6B6B' },
    { name: 'Nails', icon: 'finger-print-outline', color: '#4ECDC4' },
    { name: 'Makeup', icon: 'color-palette-outline', color: '#FFE66D' },
    { name: 'Massage', icon: 'hand-left-outline', color: '#A8E6CF' },
    { name: 'Skin Care', icon: 'water-outline', color: '#DDA0DD' },
    { name: 'Fitness', icon: 'fitness-outline', color: '#FFA07A' },
  ];

  const renderProviderCard = ({ item }: { item: ServiceProvider }) => {
    const loyaltyStatus = loyaltyStatuses[item.id];
    const promotions = providerPromotions[item.id] || [];
    const activePromotion = promotions.find(p => p.isActive && new Date(p.endDate) > new Date());
    
    return (
      <TouchableOpacity
        style={styles.modernProviderCard}
        onPress={() => navigation.navigate('EnhancedProviderProfile', { providerId: item.id })}
        activeOpacity={0.9}
      >
        <View style={styles.modernCardContent}>
          <View style={styles.modernCardHeader}>
            <Image
              source={{ uri: item.profilePictureUrl || 'https://via.placeholder.com/60' }}
              style={styles.modernProviderImage}
            />
            <View style={styles.modernProviderInfo}>
              <Text style={styles.modernProviderName}>{item.businessName}</Text>
              <Text style={styles.modernProviderCategory}>{item.businessDescription || 'Professional Services'}</Text>
              <View style={styles.modernRatingContainer}>
                <Ionicons name="star" size={14} color={MODERN_COLORS.warning} />
                <Text style={styles.modernRatingText}>{item.averageRating?.toFixed(1) || 'New'}</Text>
                <Text style={styles.modernRatingCount}>({item.totalReviews || 0})</Text>
              </View>
            </View>
            <View style={styles.modernPriceContainer}>
              <Text style={styles.modernPriceText}>from</Text>
              <Text style={styles.modernPrice}>{item.priceRange || '$$'}</Text>
            </View>
          </View>
          
          {/* Active Promotion Banner */}
          {activePromotion && (
            <View style={styles.modernPromoBanner}>
              <View style={styles.modernPromoContent}>
                <Ionicons name="flash" size={16} color={MODERN_COLORS.accent} />
                <Text style={styles.modernPromoText}>
                  {activePromotion.discountType === 'percentage' 
                    ? `${activePromotion.discountValue}% OFF` 
                    : `$${activePromotion.discountValue} OFF`} - {activePromotion.name}
                </Text>
              </View>
            </View>
          )}
          
          {/* Specialties */}
          {item.specialties && item.specialties.length > 0 && (
            <View style={styles.modernTagsContainer}>
              {item.specialties.slice(0, 3).map((specialty, index) => (
                <View key={index} style={styles.modernTag}>
                  <Text style={styles.modernTagText}>{specialty}</Text>
                </View>
              ))}
              {item.specialties.length > 3 && (
                <Text style={styles.modernMoreTags}>+{item.specialties.length - 3}</Text>
              )}
            </View>
          )}
          
          <View style={styles.modernCardFooter}>
            {loyaltyStatus && loyaltyStatus.pointsWithProvider > 0 && (
              <View style={styles.modernLoyaltyPoints}>
                <Ionicons name="star-outline" size={14} color={MODERN_COLORS.warning} />
                <Text style={styles.modernLoyaltyText}>{loyaltyStatus.pointsWithProvider} pts</Text>
              </View>
            )}
            
            <View style={styles.modernAvailabilityContainer}>
              <Ionicons 
                name="time-outline" 
                size={14} 
                color={MODERN_COLORS.gray600} 
              />
              <Text style={styles.modernAvailabilityText}>Book now</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.modernContainer}>
      {/* Modern Header */}
      <LinearGradient 
        colors={[MODERN_COLORS.primary, MODERN_COLORS.primaryDark]} 
        style={styles.modernHeader}
      >
        <SafeAreaView>
          <View style={styles.modernHeaderContent}>
            <View style={styles.modernSearchSection}>
              <Text style={styles.modernHeaderTitle}>Discover Services</Text>
              <View style={styles.modernSearchContainer}>
                <View style={styles.modernSearchInputWrapper}>
                  <Ionicons name="search" size={20} color={MODERN_COLORS.gray600} style={styles.modernSearchIcon} />
                  <TextInput
                    style={styles.modernSearchInput}
                    placeholder="Search services, providers..."
                    placeholderTextColor={MODERN_COLORS.gray600}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onFocus={() => {
                      setIsSearchFocused(true);
                      setShowSearchHistory(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => setIsSearchFocused(false), 150);
                    }}
                    onSubmitEditing={performSearch}
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity 
                      style={styles.modernClearButton}
                      onPress={() => {
                        setSearchQuery('');
                        setShowSearchHistory(false);
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color={MODERN_COLORS.gray600} />
                    </TouchableOpacity>
                  )}
                </View>
                
                <TouchableOpacity 
                  style={[
                    styles.modernFilterButton,
                    SearchService.hasActiveFilters(filters) && styles.modernFilterButtonActive
                  ]} 
                  onPress={() => setShowAdvancedFilters(true)}
                >
                  <Ionicons 
                    name="options" 
                    size={20} 
                    color={SearchService.hasActiveFilters(filters) ? MODERN_COLORS.accent : MODERN_COLORS.surface} 
                  />
                  {SearchService.hasActiveFilters(filters) && <View style={styles.modernFilterBadge} />}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

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
          <View style={styles.modernResultsCount}>
            <Text style={styles.modernResultsText}>
              {isLoading ? 'Searching...' : `${providers.length} found`}
            </Text>
          </View>
        )}
      </View>

      {/* Active Filters */}
      {SearchService.hasActiveFilters(filters) && (
        <View style={styles.modernActiveFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modernFiltersContent}>
            {SearchService.getFilterDisplayText(filters).map((filterText, index) => (
              <View key={index} style={styles.modernFilterChip}>
                <Text style={styles.modernFilterChipText}>{filterText}</Text>
                <TouchableOpacity 
                  style={styles.modernFilterRemove}
                  onPress={() => setFilters({})}
                >
                  <Ionicons name="close" size={12} color={MODERN_COLORS.accent} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity 
              style={styles.modernClearAllButton}
              onPress={() => setFilters({})}
            >
              <Text style={styles.modernClearAllText}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Search History */}
      {showSearchHistory && isSearchFocused && (
        <SearchHistory
          visible={showSearchHistory}
          onSearchSelect={handleSearchSelect}
        />
      )}

      {/* Content Area */}
      {!showSearchHistory && (
        <View style={styles.modernContentArea}>
          {viewMode === 'list' ? (
            <FlatList
              data={providers}
              renderItem={renderProviderCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modernProviderList}
              showsVerticalScrollIndicator={false}
              refreshing={isLoading}
              onRefresh={() => {
                if (searchQuery.length > 2 || SearchService.hasActiveFilters(filters)) {
                  performSearch();
                } else {
                  loadFeaturedProviders();
                }
              }}
              ListEmptyComponent={() => (
                <View style={styles.modernEmptyState}>
                  {isLoading ? (
                    <>
                      <ActivityIndicator size="large" color={MODERN_COLORS.primary} />
                      <Text style={styles.modernLoadingText}>Finding the best providers for you...</Text>
                    </>
                  ) : hasSearched ? (
                    <>
                      <Ionicons name="search-outline" size={64} color={MODERN_COLORS.gray600} />
                      <Text style={styles.modernEmptyTitle}>No providers found</Text>
                      <Text style={styles.modernEmptyDescription}>
                        Try adjusting your search terms or filters
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="sparkles-outline" size={64} color={MODERN_COLORS.primary} />
                      <Text style={styles.modernEmptyTitle}>Featured Providers</Text>
                      <Text style={styles.modernEmptyDescription}>
                        Discover top-rated service providers in your area
                      </Text>
                    </>
                  )}
                </View>
              )}
            />
          ) : (
            <View style={styles.modernMapContainer}>
              <MapView
                style={styles.modernMap}
                region={mapRegion}
                onRegionChangeComplete={setMapRegion}
                showsUserLocation={true}
                showsMyLocationButton={true}
              >
                {providers.map((provider) => (
                  <Marker
                    key={provider.id}
                    coordinate={{
                      latitude: 37.7749,
                      longitude: -122.4194,
                    }}
                    title={provider.businessName}
                    description={provider.businessDescription}
                    onPress={() => setSelectedProvider(provider)}
                  >
                    <View style={styles.modernMarker}>
                      <Ionicons name="location" size={24} color={MODERN_COLORS.surface} />
                    </View>
                  </Marker>
                ))}
              </MapView>
              
              {/* Selected Provider Card */}
              {selectedProvider && (
                <View style={styles.modernMapProviderCard}>
                  <TouchableOpacity
                    style={styles.modernMapCard}
                    onPress={() => navigation.navigate('ProviderProfile', { providerId: selectedProvider.id })}
                  >
                    <Image
                      source={{ uri: selectedProvider.profilePictureUrl || 'https://via.placeholder.com/60' }}
                      style={styles.modernMapCardImage}
                    />
                    <View style={styles.modernMapCardContent}>
                      <Text style={styles.modernMapCardTitle}>{selectedProvider.businessName}</Text>
                      <Text style={styles.modernMapCardDescription} numberOfLines={2}>
                        {selectedProvider.businessDescription}
                      </Text>
                      <View style={styles.modernMapCardRating}>
                        <Ionicons name="star" size={14} color={MODERN_COLORS.warning} />
                        <Text style={styles.modernMapCardRatingText}>
                          {selectedProvider.averageRating || 'N/A'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.modernMapCardClose}
                      onPress={() => setSelectedProvider(null)}
                    >
                      <Ionicons name="close" size={20} color={MODERN_COLORS.gray600} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Advanced Filter Modal */}
      <AdvancedFilterModal
        visible={showAdvancedFilters}
        filters={filters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          setShowAdvancedFilters(false);
          performSearch();
        }}
        onSaveFilters={(newFilters) => {
          setFilters(newFilters);
          setShowAdvancedFilters(false);
          performSearch();
        }}
        onResetFilters={() => {
          setFilters({});
          setShowAdvancedFilters(false);
          performSearch();
        }}
        onClose={() => setShowAdvancedFilters(false)}
      />

      {/* First-Time User Components */}
      <FirstTimeUserGuide
        visible={showFirstTimeGuide}
        onClose={() => {
          setShowFirstTimeGuide(false);
          firstTimeGuide.setShouldShow(false);
        }}
        userType={userType}
        navigation={navigation}
      />

      <QuickStartGuide
        visible={showQuickStart}
        onClose={() => {
          setShowQuickStart(false);
          quickStartGuide.setShouldShow(false);
        }}
        userType={userType}
        navigation={navigation}
      />

      <InteractiveTutorial
        visible={showTutorial}
        onClose={() => setShowTutorial(false)}
        steps={TutorialConfigs.searchScreen}
        tutorialType="search"
      />

      {/* Smart Tooltips */}
      {smartTooltips.map((tooltip) => (
        <SmartTooltip
          key={tooltip.id}
          {...tooltip}
          onAction={() => {
            if (tooltip.actionText === 'Try Search Now') {
              setShowTutorial(true);
            } else if (tooltip.actionText === 'Try filters') {
              setShowAdvancedFilters(true);
            }
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  // Base Layout
  container: {
    flex: 1,
    backgroundColor: '#667eea',
    paddingBottom: 100,
  },
  
  // Search Header
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    gap: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 28,
    paddingHorizontal: 20,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  searchIcon: {
    marginRight: 12,
    opacity: 0.8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: 'white',
    fontWeight: '500',
  },
  clearButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  activeFilterButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: 'white',
  },
  
  // Active Filters
  activeFiltersContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  activeFiltersContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    gap: 8,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  activeFilterText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  removeFilterButton: {
    padding: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  clearAllFiltersButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  clearAllFiltersText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    opacity: 0.9,
  },
  
  // Quick Filters
  quickFiltersContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  quickFiltersContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  quickFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    gap: 8,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  activeQuickFilterPill: {
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    borderColor: 'rgba(255, 107, 107, 1)',
    shadowColor: 'rgba(255, 107, 107, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  quickFilterIcon: {
    opacity: 0.9,
  },
  quickFilterText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '700',
    letterSpacing: 0.2,
    opacity: 0.9,
  },
  activeQuickFilterText: {
    color: 'white',
    opacity: 1,
  },
  
  // Results Section
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  resultsCount: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.2,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    gap: 6,
  },
  sortButtonText: {
    fontSize: 15,
    color: 'white',
    fontWeight: '600',
    opacity: 0.9,
  },
  
  // Provider Cards
  providerList: {
    padding: 20,
    gap: 20,
    backgroundColor: 'transparent',
  },
  providerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  providerImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginRight: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  providerInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  providerName: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  providerTitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 12,
    fontWeight: '500',
    lineHeight: 20,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  specialtyTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  specialtyText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  moreSpecialties: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    fontStyle: 'italic',
    alignSelf: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 15,
    color: 'white',
    fontWeight: '600',
    opacity: 0.9,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 0.2,
  },
  
  // Loyalty Points Styles
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  loyaltyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  loyaltyPoints: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B6B',
    letterSpacing: 0.2,
  },
  promoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  promoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 0.2,
  },
  promoBanner: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    borderRadius: 8,
    marginBottom: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  promoBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  promoBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B6B',
    lineHeight: 16,
  },
  promoCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    letterSpacing: 0.5,
  },
  loyaltyBanner: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  loyaltyBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  loyaltyBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    lineHeight: 16,
  },
  
  // Empty States
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    fontWeight: '500',
  },
  adjustFiltersButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 28,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  adjustFiltersText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  promotionsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 6,
    gap: 6,
  },
  promotionsLinkText: {
    flex: 1,
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },

  // Modern Styles
  modernContainer: {
    flex: 1,
    backgroundColor: MODERN_COLORS.background,
  },
  modernHeader: {
    paddingBottom: SPACING.sm,
  },
  modernHeaderContent: {
    paddingHorizontal: 0,
    paddingBottom: SPACING.sm,
  },
  modernSearchSection: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  modernHeaderTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.surface,
    marginBottom: SPACING.xs,
  },
  modernSearchContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  modernSearchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.sm,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modernSearchIcon: {
    marginRight: SPACING.xs,
  },
  modernSearchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.base,
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
  modernFilterButtonActive: {
    backgroundColor: MODERN_COLORS.surface,
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
    backgroundColor: MODERN_COLORS.backgroundSecondary,
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
    backgroundColor: MODERN_COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  modernResultsText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  modernActiveFilters: {
    backgroundColor: MODERN_COLORS.surface,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: MODERN_COLORS.border,
  },
  modernFiltersContent: {
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
  },
  modernFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MODERN_COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  modernFilterChipText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  modernFilterRemove: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernClearAllButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  modernClearAllText: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.accent,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  modernContentArea: {
    flex: 1,
  },
  modernProviderList: {
    padding: 0,
    gap: SPACING.md,
  },
  modernEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  modernLoadingText: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.gray600,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  modernEmptyTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.gray900,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  modernEmptyDescription: {
    fontSize: TYPOGRAPHY.base,
    color: MODERN_COLORS.gray600,
    textAlign: 'center',
    lineHeight: 22,
  },
  modernProviderCard: {
    backgroundColor: MODERN_COLORS.surface,
    borderRadius: 0,
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
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.lg,
    marginRight: SPACING.sm,
  },
  modernProviderInfo: {
    flex: 1,
  },
  modernProviderName: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.gray900,
    marginBottom: 2,
  },
  modernProviderCategory: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  modernRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modernRatingText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.gray900,
  },
  modernRatingCount: {
    fontSize: TYPOGRAPHY.sm,
    color: MODERN_COLORS.gray600,
  },
  modernPriceContainer: {
    alignItems: 'flex-end',
  },
  modernPriceText: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.gray600,
  },
  modernPrice: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: MODERN_COLORS.primary,
  },
  modernPromoBanner: {
    backgroundColor: MODERN_COLORS.accentLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  modernPromoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  modernPromoText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.accent,
    flex: 1,
  },
  modernTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  modernTag: {
    backgroundColor: MODERN_COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
  },
  modernTagText: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.gray600,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  modernMoreTags: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.gray600,
    alignSelf: 'center',
  },
  modernCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modernLoyaltyPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modernLoyaltyText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: MODERN_COLORS.warning,
  },
  modernAvailabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modernAvailabilityText: {
    fontSize: TYPOGRAPHY.xs,
    color: MODERN_COLORS.gray600,
  },
  modernAvailableText: {
    color: MODERN_COLORS.success,
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

  // Help and Tutorial Styles
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helpButtonText: {
    fontSize: 16,
    color: MODERN_COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  helpIconButton: {
    padding: SPACING.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  modernCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  emptyStateActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  
  helpButtonSecondary: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: MODERN_COLORS.accent,
  },
});

export default EnhancedSearchScreen;
