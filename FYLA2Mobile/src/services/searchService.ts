import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchFilters, SavedSearch, RecentSearch } from '../types';

const RECENT_SEARCHES_KEY = 'recentSearches';
const SAVED_SEARCHES_KEY = 'savedSearches';
const SEARCH_PREFERENCES_KEY = 'searchPreferences';
const MAX_RECENT_SEARCHES = 10;

export class SearchService {
  // Recent Searches Management
  static async getRecentSearches(): Promise<RecentSearch[]> {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const searches = JSON.parse(stored);
        return searches.map((search: any) => ({
          ...search,
          timestamp: new Date(search.timestamp)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting recent searches:', error);
      return [];
    }
  }

  static async addRecentSearch(query: string, filters: SearchFilters): Promise<void> {
    try {
      // Don't save empty searches
      if (!query.trim() && Object.keys(filters).length === 0) return;

      const recent = await this.getRecentSearches();
      
      // Remove duplicate if exists
      const filtered = recent.filter(
        search => !(search.query === query && JSON.stringify(search.filters) === JSON.stringify(filters))
      );
      
      // Add new search at the beginning
      const newSearch: RecentSearch = {
        query,
        filters,
        timestamp: new Date()
      };
      
      const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error adding recent search:', error);
    }
  }

  static async clearRecentSearches(): Promise<void> {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  }

  // Saved Searches Management
  static async getSavedSearches(): Promise<SavedSearch[]> {
    try {
      const stored = await AsyncStorage.getItem(SAVED_SEARCHES_KEY);
      if (stored) {
        const searches = JSON.parse(stored);
        return searches.map((search: any) => ({
          ...search,
          createdAt: new Date(search.createdAt)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting saved searches:', error);
      return [];
    }
  }

  static async saveSearch(name: string, query: string, filters: SearchFilters): Promise<SavedSearch> {
    try {
      const saved = await this.getSavedSearches();
      
      const newSaved: SavedSearch = {
        id: Date.now().toString(),
        name,
        query,
        filters,
        createdAt: new Date()
      };
      
      const updated = [newSaved, ...saved];
      await AsyncStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
      
      return newSaved;
    } catch (error) {
      console.error('Error saving search:', error);
      throw error;
    }
  }

  static async deleteSavedSearch(id: string): Promise<void> {
    try {
      const saved = await this.getSavedSearches();
      const updated = saved.filter(search => search.id !== id);
      await AsyncStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting saved search:', error);
    }
  }

  // Search Preferences
  static async getSearchPreferences(): Promise<SearchFilters> {
    try {
      const stored = await AsyncStorage.getItem(SEARCH_PREFERENCES_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error getting search preferences:', error);
      return {};
    }
  }

  static async saveSearchPreferences(preferences: SearchFilters): Promise<void> {
    try {
      await AsyncStorage.setItem(SEARCH_PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving search preferences:', error);
    }
  }

  // Filter Utilities
  static getFilterDisplayText(filters: SearchFilters): string[] {
    const displayTexts: string[] = [];
    
    if (filters.category && filters.category !== 'All') {
      displayTexts.push(filters.category);
    }
    
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      if (filters.priceMin && filters.priceMax) {
        displayTexts.push(`$${filters.priceMin}-$${filters.priceMax}`);
      } else if (filters.priceMin) {
        displayTexts.push(`$${filters.priceMin}+`);
      } else if (filters.priceMax) {
        displayTexts.push(`Up to $${filters.priceMax}`);
      }
    }
    
    if (filters.rating) {
      displayTexts.push(`${filters.rating}+ stars`);
    }
    
    if (filters.distance) {
      displayTexts.push(`Within ${filters.distance}`);
    }
    
    if (filters.availableToday) {
      displayTexts.push('Available today');
    }
    
    if (filters.availableThisWeek) {
      displayTexts.push('Available this week');
    }
    
    if (filters.sortBy) {
      const sortLabels = {
        price: 'Sort by price',
        rating: 'Sort by rating',
        distance: 'Sort by distance',
        availability: 'Sort by availability',
        name: 'Sort by name'
      };
      displayTexts.push(sortLabels[filters.sortBy]);
    }
    
    return displayTexts;
  }

  static hasActiveFilters(filters: SearchFilters): boolean {
    return Object.keys(filters).some(key => {
      const value = filters[key as keyof SearchFilters];
      return value !== undefined && value !== null && value !== '' && value !== 'All';
    });
  }
}

export default SearchService;
