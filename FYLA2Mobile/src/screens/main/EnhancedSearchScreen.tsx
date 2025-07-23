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

const EnhancedSearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
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
                  onPress={() => setFilters({})}
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
    paddingTop: 50,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeFilterButton: {
    backgroundColor: '#fff5f5',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
  },
  activeFiltersContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activeFiltersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    gap: 6,
  },
  activeFilterText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  removeFilterButton: {
    padding: 2,
  },
  clearAllFiltersButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearAllFiltersText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  quickFiltersContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quickFiltersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 6,
  },
  activeQuickFilterPill: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  quickFilterIcon: {
    // No additional styles needed
  },
  quickFilterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  activeQuickFilterText: {
    color: 'white',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
  },
  providerList: {
    padding: 16,
    gap: 16,
  },
  providerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
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
    borderRadius: 40,
    marginRight: 16,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  providerTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  specialtyTag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  specialtyText: {
    fontSize: 10,
    color: '#666',
  },
  moreSpecialties: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  adjustFiltersButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  adjustFiltersText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default EnhancedSearchScreen;
