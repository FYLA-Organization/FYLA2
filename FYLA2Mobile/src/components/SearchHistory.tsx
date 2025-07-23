import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchFilters, RecentSearch, SavedSearch } from '../types';
import SearchService from '../services/searchService';

interface SearchHistoryProps {
  onSearchSelect: (query: string, filters: SearchFilters) => void;
  visible: boolean;
}

const SearchHistory: React.FC<SearchHistoryProps> = ({
  onSearchSelect,
  visible,
}) => {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    if (visible) {
      loadSearchHistory();
    }
  }, [visible]);

  const loadSearchHistory = async () => {
    try {
      const [recent, saved] = await Promise.all([
        SearchService.getRecentSearches(),
        SearchService.getSavedSearches(),
      ]);
      setRecentSearches(recent);
      setSavedSearches(saved);
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const handleDeleteSaved = async (id: string) => {
    Alert.alert(
      'Delete Saved Search',
      'Are you sure you want to delete this saved search?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await SearchService.deleteSavedSearch(id);
              setSavedSearches(prev => prev.filter(search => search.id !== id));
            } catch (error) {
              console.error('Error deleting saved search:', error);
              Alert.alert('Error', 'Failed to delete saved search');
            }
          }
        }
      ]
    );
  };

  const handleClearRecent = () => {
    Alert.alert(
      'Clear Recent Searches',
      'Are you sure you want to clear all recent searches?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await SearchService.clearRecentSearches();
              setRecentSearches([]);
            } catch (error) {
              console.error('Error clearing recent searches:', error);
              Alert.alert('Error', 'Failed to clear recent searches');
            }
          }
        }
      ]
    );
  };

  const formatSearchQuery = (search: RecentSearch | SavedSearch) => {
    const filterTexts = SearchService.getFilterDisplayText(search.filters);
    const queryText = search.query || 'All providers';
    
    if (filterTexts.length > 0) {
      return `${queryText} • ${filterTexts.slice(0, 2).join(', ')}`;
    }
    return queryText;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bookmark" size={16} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>Saved Searches</Text>
          </View>
          {savedSearches.map((search) => (
            <TouchableOpacity
              key={search.id}
              style={styles.searchItem}
              onPress={() => onSearchSelect(search.query, search.filters)}
            >
              <View style={styles.searchContent}>
                <Text style={styles.searchName}>{search.name}</Text>
                <Text style={styles.searchQuery}>{formatSearchQuery(search)}</Text>
                <Text style={styles.searchDate}>{formatTimeAgo(search.createdAt)}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteSaved(search.id)}
              >
                <Ionicons name="trash-outline" size={16} color="#999" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={handleClearRecent} style={styles.clearButton}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
          {recentSearches.map((search, index) => (
            <TouchableOpacity
              key={index}
              style={styles.searchItem}
              onPress={() => onSearchSelect(search.query, search.filters)}
            >
              <View style={styles.searchContent}>
                <Text style={styles.searchQuery}>{formatSearchQuery(search)}</Text>
                <Text style={styles.searchDate}>{formatTimeAgo(search.timestamp)}</Text>
              </View>
              <Ionicons name="arrow-up-outline" size={16} color="#999" style={styles.useIcon} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Empty State */}
      {recentSearches.length === 0 && savedSearches.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color="#ccc" />
          <Text style={styles.emptyTitle}>No Search History</Text>
          <Text style={styles.emptyText}>Your recent and saved searches will appear here</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    minHeight: 200,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  clearButton: {
    padding: 4,
  },
  clearText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchContent: {
    flex: 1,
  },
  searchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  searchQuery: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  searchDate: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
  useIcon: {
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SearchHistory;
