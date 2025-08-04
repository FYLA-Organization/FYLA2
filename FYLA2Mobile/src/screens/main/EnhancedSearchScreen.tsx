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
import { LinearGradient } from 'expo-linear-gradient';
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
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.8)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search providers, services..."
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
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
              !!filters.rating && styles.activeQuickFilterPill,
            ]}
            onPress={() => handleQuickFilter('rating', filters.rating ? undefined : 4)}
          >
            <Ionicons 
              name="star" 
              size={16} 
              color={!!filters.rating ? 'white' : '#FFD700'} 
              style={styles.quickFilterIcon}
            />
            <Text style={[
              styles.quickFilterText,
              !!filters.rating && styles.activeQuickFilterText,
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
    </LinearGradient>
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
});

export default EnhancedSearchScreen;
