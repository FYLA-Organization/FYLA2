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
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ServiceProvider, SearchFilters, RootStackParamList } from '../../types';
import ApiService from '../../services/api';
import SearchService from '../../services/searchService';
import AdvancedFilterModal from '../../components/AdvancedFilterModal';
import SearchHistory from '../../components/SearchHistory';

type SearchScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState({ latitude: 37.7749, longitude: -122.4194 }); // Default to SF
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const navigation = useNavigation<SearchScreenNavigationProp>();

  useEffect(() => {
    loadSearchPreferences();
  }, []);

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
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setIsLoading(false);
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
      
      // Add availability filters (these would need backend support)
      if (filters.availableToday) {
        searchParams.availableToday = true;
      }
      
      if (filters.availableThisWeek) {
        searchParams.availableThisWeek = true;
      }
      
      // Add sorting
      if (filters.sortBy) {
        searchParams.sortBy = filters.sortBy;
        searchParams.sortOrder = filters.sortOrder || 'desc';
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
          availableToday: searchParams.availableToday,
          availableThisWeek: searchParams.availableThisWeek,
          sortBy: searchParams.sortBy,
          sortOrder: searchParams.sortOrder,
        },
        searchParams.query  // Pass query as separate parameter
      );
      
      console.log('Search response:', response);
      console.log('Providers found:', response.data.length);
      
      let sortedProviders = response.data;
      
      // Client-side sorting for better UX (in case backend doesn't support all sort options)
      if (filters.sortBy && sortedProviders.length > 0) {
        sortedProviders = [...sortedProviders].sort((a, b) => {
          const order = filters.sortOrder === 'asc' ? 1 : -1;
          
          switch (filters.sortBy) {
            case 'rating':
              return ((b.averageRating || 0) - (a.averageRating || 0)) * order;
            case 'name':
              return a.businessName.localeCompare(b.businessName) * order;
            case 'price':
              // This would need price data in provider object
              return 0;
            default:
              return 0;
          }
        });
      }
      
      setProviders(sortedProviders);
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

  const loadFeaturedProviders = async () => {
    setIsLoading(true);
    try {
      const response = await ApiService.getServiceProviders(1, 20, {});
      setProviders(response.data);
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setIsLoading(false);
    }
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
  const priceRanges = ['$', '$$', '$$$', '$$$$'];

  const renderProviderCard = ({ item }: { item: ServiceProvider }) => (
    <TouchableOpacity
      style={styles.providerCard}
      onPress={() => navigation.navigate('ProviderProfile', { providerId: item.id })}
    >
      <Image
        source={{ uri: item.profilePictureUrl || 'https://via.placeholder.com/80' }}
        style={styles.providerImage}
      />
      <View style={styles.providerInfo}>
        <Text style={styles.providerName}>{item.businessName}</Text>
        <Text style={styles.providerTitle}>{item.businessDescription || 'Professional Services'}</Text>
        
        {/* Specialties */}
        {item.specialties && item.specialties.length > 0 && (
          <View style={styles.specialtiesContainer}>
            {item.specialties.slice(0, 3).map((specialty, index) => (
              <View key={index} style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
            {item.specialties.length > 3 && (
              <Text style={styles.moreSpecialties}>+{item.specialties.length - 3} more</Text>
            )}
          </View>
        )}
        
        <View style={styles.rating}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>
            {item.averageRating?.toFixed(1) || 'New'} ({item.totalReviews || 0})
          </Text>
        </View>
        
        <Text style={styles.price}>{item.priceRange || '$$'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search providers, services..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => {
              setIsSearchFocused(true);
              setShowSearchHistory(true);
            }}
            onBlur={() => {
              // Delay hiding search history to allow for selections
              setTimeout(() => setIsSearchFocused(false), 150);
            }}
            onSubmitEditing={performSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                setShowSearchHistory(false);
              }}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={[
            styles.filterButton,
            SearchService.hasActiveFilters(filters) && styles.activeFilterButton
          ]} 
          onPress={() => setShowAdvancedFilters(true)}
        >
          <Ionicons name="filter" size={20} color={SearchService.hasActiveFilters(filters) ? "#FF6B6B" : "#666"} />
          {SearchService.hasActiveFilters(filters) && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {SearchService.hasActiveFilters(filters) && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFiltersContent}>
            {SearchService.getFilterDisplayText(filters).map((filterText, index) => (
              <View key={index} style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>{filterText}</Text>
                <TouchableOpacity 
                  style={styles.removeFilterButton}
                  onPress={() => {
                    // Simple reset for now - could be more sophisticated
                    setFilters({});
                  }}
                >
                  <Ionicons name="close" size={14} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity 
              style={styles.clearAllFiltersButton}
              onPress={() => setFilters({})}
            >
              <Text style={styles.clearAllFiltersText}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Quick Filter Pills */}
      <View style={styles.quickFiltersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFiltersContent}>
          {/* Category Quick Filters */}
          {categories.slice(0, 5).map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.quickFilterPill,
                filters.category === category.name && styles.activeQuickFilterPill,
              ]}
              onPress={() => handleQuickFilter('category', category.name === 'All' ? undefined : category.name)}
            >
              <Ionicons 
                name={category.icon as any} 
                size={16} 
                color={filters.category === category.name ? 'white' : category.color} 
                style={styles.quickFilterIcon}
              />
              <Text style={[
                styles.quickFilterText,
                filters.category === category.name && styles.activeQuickFilterText,
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Quick Rating Filter */}
          <TouchableOpacity
            style={[
              styles.quickFilterPill,
              filters.rating && styles.activeQuickFilterPill,
            ]}
            onPress={() => handleQuickFilter('rating', filters.rating ? undefined : 4)}
          >
            <Ionicons 
              name="star" 
              size={16} 
              color={filters.rating ? 'white' : '#FFD700'} 
              style={styles.quickFilterIcon}
            />
            <Text style={[
              styles.quickFilterText,
              filters.rating && styles.activeQuickFilterText,
            ]}>
              4+ Stars
            </Text>
          </TouchableOpacity>

          {/* Quick Availability Filter */}
          <TouchableOpacity
            style={[
              styles.quickFilterPill,
              filters.availableToday && styles.activeQuickFilterPill,
            ]}
            onPress={() => handleQuickFilter('availableToday', !filters.availableToday)}
          >
            <Ionicons 
              name="time" 
              size={16} 
              color={filters.availableToday ? 'white' : '#4ECDC4'} 
              style={styles.quickFilterIcon}
            />
            <Text style={[
              styles.quickFilterText,
              filters.availableToday && styles.activeQuickFilterText,
            ]}>
              Today
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Search History */}
      {showSearchHistory && isSearchFocused && (
        <SearchHistory
          visible={showSearchHistory}
          onSearchSelect={handleSearchSelect}
        />
      )}

      {/* Results or Loading */}
      {!showSearchHistory && (
        <>
          {/* Results Header */}
          {hasSearched && (
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {isLoading ? 'Searching...' : `${providers.length} providers found`}
              </Text>
              {providers.length > 0 && (
                <TouchableOpacity 
                  style={styles.sortButton}
                  onPress={() => setShowAdvancedFilters(true)}
                >
                  <Ionicons name="swap-vertical" size={16} color="#666" />
                  <Text style={styles.sortButtonText}>Sort</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Provider List */}
          <FlatList
            data={providers}
            renderItem={renderProviderCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.providerList}
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
              <View style={styles.emptyState}>
                {isLoading ? (
                  <>
                    <ActivityIndicator size="large" color="#FF6B6B" />
                    <Text style={styles.loadingText}>Finding the best providers for you...</Text>
                  </>
                ) : hasSearched ? (
                  <>
                    <Ionicons name="search-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyTitle}>No providers found</Text>
                    <Text style={styles.emptyText}>
                      Try adjusting your search terms or filters
                    </Text>
                    <TouchableOpacity 
                      style={styles.adjustFiltersButton}
                      onPress={() => setShowAdvancedFilters(true)}
                    >
                      <Text style={styles.adjustFiltersText}>Adjust Filters</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Ionicons name="compass-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyTitle}>Discover Amazing Providers</Text>
                    <Text style={styles.emptyText}>
                      Search for services or browse by category
                    </Text>
                  </>
                )}
              </View>
            )}
          />
        </>
      )}

      {/* Advanced Filter Modal */}
      <AdvancedFilterModal
        visible={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onSaveFilters={handleSaveFilters}
        onResetFilters={handleResetFilters}
      />
    </View>
  );

            >
              <Text style={[
                styles.filterPillText,
                filters.category === category.name && styles.activeFilterPillText,
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
          
          {/* Price Range Filters */}
          {priceRanges.map((range, index) => (
            <TouchableOpacity
              key={`price-${index}`}
              style={[
                styles.filterPill,
                filters.priceMin === index + 1 && styles.activeFilterPill,
              ]}
              onPress={() => setFilters(prev => ({ 
                ...prev, 
                priceMin: prev.priceMin === index + 1 ? undefined : index + 1 
              }))}
            >
              <Text style={[
                styles.filterPillText,
                filters.priceMin === index + 1 && styles.activeFilterPillText,
              ]}>
                {range}
              </Text>
            </TouchableOpacity>
          ))}
          
          {/* Distance Filters */}
          {['1 mi', '5 mi', '10 mi', '25 mi'].map((distance, index) => (
            <TouchableOpacity
              key={`distance-${index}`}
              style={[
                styles.filterPill,
                filters.distance === distance && styles.activeFilterPill,
              ]}
              onPress={() => setFilters(prev => ({ 
                ...prev, 
                distance: prev.distance === distance ? undefined : distance 
              }))}
            >
              <Text style={[
                styles.filterPillText,
                filters.distance === distance && styles.activeFilterPillText,
              ]}>
                📍 {distance}
              </Text>
            </TouchableOpacity>
          ))}
          
          {/* Clear All Filter */}
          {(filters.category || filters.priceMin || filters.distance || filters.rating) && (
            <TouchableOpacity
              style={styles.clearAllPill}
              onPress={() => setFilters({})}
            >
              <Text style={styles.clearAllPillText}>
                ✕ Clear All
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Map Section */}
      <View style={styles.mapContainer}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Find Nearby Providers</Text>
          <TouchableOpacity 
            style={styles.mapToggle}
            onPress={() => setShowMap(!showMap)}
          >
            <Ionicons 
              name={showMap ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>
        
        {showMap && (
          <View style={styles.mapView}>
            {/* Placeholder Map - Replace with actual map component */}
            <View style={styles.mapPlaceholder}>
              <Ionicons name="location" size={40} color="#FF6B6B" />
              <Text style={styles.mapPlaceholderText}>Map View</Text>
              <Text style={styles.mapSubtext}>
                {filters.category ? `${filters.category} providers nearby` : 'All providers in your area'}
              </Text>
              
              {/* Mock provider pins */}
              <View style={styles.mockPins}>
                {providers.slice(0, 3).map((provider, index) => (
                  <TouchableOpacity 
                    key={provider.id}
                    style={[styles.mapPin, { 
                      left: 50 + (index * 60), 
                      top: 60 + (index * 20) 
                    }]}
                    onPress={() => navigation.navigate('ProviderProfile', { providerId: provider.id })}
                  >
                    <Ionicons name="location" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Distance Filter */}
            <View style={styles.distanceFilter}>
              <Text style={styles.distanceLabel}>Distance:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['1 mi', '5 mi', '10 mi', '25 mi'].map((distance, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.distanceChip,
                      filters.distance === distance && styles.activeDistanceChip,
                    ]}
                    onPress={() => setFilters(prev => ({ 
                      ...prev, 
                      distance: prev.distance === distance ? undefined : distance 
                    }))}
                  >
                    <Text style={[
                      styles.distanceChipText,
                      filters.distance === distance && styles.activeDistanceChipText,
                    ]}>
                      {distance}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <Text style={styles.filterTitle}>Price Range</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {priceRanges.map((range, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.priceChip,
                  filters.priceMin === index + 1 && styles.activePriceChip,
                ]}
                onPress={() => setFilters(prev => ({ 
                  ...prev, 
                  priceMin: prev.priceMin === index + 1 ? undefined : index + 1 
                }))}
              >
                <Text style={styles.priceChipText}>{range}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.filterActions}>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => setFilters({})}
            >
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyFiltersText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Enhanced Results */}
            {/* Results */}
      <View style={{ flex: 1 }}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B6B" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : (
          <FlatList
            data={providers}
            renderItem={renderProviderCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No providers found' : 'Start searching for providers'}
                </Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery 
                    ? 'Try adjusting your search or filters'
                    : 'Type in the search box or use filters to find providers'
                  }
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: 'white',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Filter Pills Styles
  filterPillsContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterPillsContent: {
    paddingHorizontal: 16,
  },
  filterPill: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeFilterPill: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeFilterPillText: {
    color: 'white',
  },
  clearAllPill: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  clearAllPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF6B6B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 20,
    paddingTop: 0,
  },
  filtersPanel: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  priceChip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  activePriceChip: {
    backgroundColor: '#4ECDC4',
  },
  priceChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  clearFiltersButton: {
    flex: 1,
    padding: 12,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  clearFiltersText: {
    color: '#666',
    fontWeight: '600',
  },
  applyFiltersButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    alignItems: 'center',
  },
  applyFiltersText: {
    color: 'white',
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  providerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 8,
    marginHorizontal: 16,
    marginTop: 0,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  providerImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 15,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  providerTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  specialtyTag: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  moreSpecialties: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  // Map Styles
  mapContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  mapToggle: {
    padding: 4,
  },
  mapView: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  mapPlaceholder: {
    height: 120,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  mapSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  mockPins: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  mapPin: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  distanceFilter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  distanceChip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
  },
  activeDistanceChip: {
    backgroundColor: '#FF6B6B',
  },
  distanceChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeDistanceChipText: {
    color: 'white',
  },
});

export default SearchScreen;
