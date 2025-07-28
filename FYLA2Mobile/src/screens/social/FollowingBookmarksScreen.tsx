import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { ServiceProvider } from '../../types';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
  primary: '#5A4FCF',      // Royal Indigo
  accent: '#F5C451',        // Soft Gold
  background: '#FAFAFA',    // Light Background
  surface: '#FFFFFF',       // Card Backgrounds
  textPrimary: '#1A1A1A',   // Dark Text
  textSecondary: '#6B6B6B', // Secondary Text
  lavenderMist: '#AFAAFF',  // Lavender Mist
  success: '#4CAF50',       // Success color
  warning: '#FF9800',       // Warning color
  error: '#F44336',         // Error color
  border: '#E8E8E8',        // Subtle borders
  shadow: '#000000',        // Shadow color
  heart: '#FF3040',         // Heart red
  bookmark: '#8B5CF6',      // Bookmark purple
};

type TabType = 'following' | 'bookmarks';

const FollowingBookmarksScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [selectedTab, setSelectedTab] = useState<TabType>('following');
  const [followingProviders, setFollowingProviders] = useState<ServiceProvider[]>([]);
  const [bookmarkedProviders, setBookmarkedProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Mock API calls - replace with actual API
      const [following, bookmarks] = await Promise.all([
        getMockFollowingProviders(),
        getMockBookmarkedProviders(),
      ]);

      setFollowingProviders(following);
      setBookmarkedProviders(bookmarks);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUnfollow = async (providerId: string) => {
    Alert.alert(
      'Unfollow Provider',
      'Are you sure you want to unfollow this provider?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfollow',
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistic update
              setFollowingProviders(prev => prev.filter(p => p.id !== providerId));
              
              // API call would go here
              console.log('Unfollowing provider:', providerId);
            } catch (error) {
              console.error('Error unfollowing provider:', error);
              // Revert on error
              loadData();
            }
          }
        }
      ]
    );
  };

  const handleRemoveBookmark = async (providerId: string) => {
    try {
      // Optimistic update
      setBookmarkedProviders(prev => prev.filter(p => p.id !== providerId));
      
      // API call would go here
      console.log('Removing bookmark for provider:', providerId);
    } catch (error) {
      console.error('Error removing bookmark:', error);
      // Revert on error
      loadData();
    }
  };

  const handleBookProvider = (provider: ServiceProvider) => {
    navigation.navigate('BookingFlow', {
      providerId: provider.id,
      provider,
    });
  };

  const handleMessageProvider = (provider: ServiceProvider) => {
    navigation.navigate('Chat', {
      providerId: provider.id,
      providerName: provider.businessName,
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient colors={[COLORS.primary, COLORS.lavenderMist]} style={styles.headerGradient}>
        <SafeAreaView>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.surface} />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>My Connections</Text>
            
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );

  const renderTabSelector = () => (
    <View style={styles.tabSelector}>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'following' && styles.activeTab]}
        onPress={() => setSelectedTab('following')}
      >
        <Ionicons
          name="people-outline"
          size={20}
          color={selectedTab === 'following' ? COLORS.primary : COLORS.textSecondary}
        />
        <Text style={[
          styles.tabLabel,
          selectedTab === 'following' && styles.activeTabLabel
        ]}>
          Following ({followingProviders.length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, selectedTab === 'bookmarks' && styles.activeTab]}
        onPress={() => setSelectedTab('bookmarks')}
      >
        <Ionicons
          name="bookmark-outline"
          size={20}
          color={selectedTab === 'bookmarks' ? COLORS.primary : COLORS.textSecondary}
        />
        <Text style={[
          styles.tabLabel,
          selectedTab === 'bookmarks' && styles.activeTabLabel
        ]}>
          Saved ({bookmarkedProviders.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderProviderCard = ({ item }: { item: ServiceProvider }) => (
    <View style={styles.providerCard}>
      <LinearGradient
        colors={[COLORS.surface, COLORS.background]}
        style={styles.cardGradient}
      >
        <TouchableOpacity
          style={styles.providerInfo}
          onPress={() => navigation.navigate('EnhancedProviderProfile', { providerId: item.id })}
        >
          <Image
            source={{ uri: item.profilePictureUrl || 'https://via.placeholder.com/60' }}
            style={styles.providerAvatar}
          />
          
          <View style={styles.providerDetails}>
            <View style={styles.nameContainer}>
              <Text style={styles.providerName}>{item.businessName}</Text>
              {item.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
              )}
            </View>
            
            <Text style={styles.providerDescription} numberOfLines={2}>
              {item.businessDescription}
            </Text>
            
            <View style={styles.providerStats}>
              <View style={styles.statItem}>
                <Ionicons name="star" size={14} color={COLORS.accent} />
                <Text style={styles.statText}>{item.averageRating}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="people" size={14} color={COLORS.textSecondary} />
                <Text style={styles.statText}>{item.followersCount}</Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="grid" size={14} color={COLORS.textSecondary} />
                <Text style={styles.statText}>{item.postsCount}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.providerActions}>
          {selectedTab === 'following' ? (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleMessageProvider(item)}
              >
                <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleBookProvider(item)}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.lavenderMist]}
                  style={styles.bookButtonGradient}
                >
                  <Ionicons name="calendar-outline" size={16} color={COLORS.surface} />
                  <Text style={styles.bookButtonText}>Book</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleUnfollow(item.id)}
              >
                <Ionicons name="person-remove-outline" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleMessageProvider(item)}
              >
                <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleBookProvider(item)}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.lavenderMist]}
                  style={styles.bookButtonGradient}
                >
                  <Ionicons name="calendar-outline" size={16} color={COLORS.surface} />
                  <Text style={styles.bookButtonText}>Book</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleRemoveBookmark(item.id)}
              >
                <Ionicons name="bookmark" size={18} color={COLORS.bookmark} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name={selectedTab === 'following' ? 'people-outline' : 'bookmark-outline'}
        size={64}
        color={COLORS.textSecondary}
      />
      <Text style={styles.emptyTitle}>
        {selectedTab === 'following' ? 'No Following' : 'No Saved Providers'}
      </Text>
      <Text style={styles.emptyMessage}>
        {selectedTab === 'following'
          ? 'Follow providers to see their latest posts and updates'
          : 'Save your favorite providers for quick access'
        }
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => navigation.navigate('Search')}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.lavenderMist]}
          style={styles.exploreButtonGradient}
        >
          <Text style={styles.exploreButtonText}>Explore Providers</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const currentData = selectedTab === 'following' ? followingProviders : bookmarkedProviders;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderTabSelector()}
      
      {currentData.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={currentData}
          renderItem={renderProviderCard}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

// Mock data functions - replace with actual API calls
const getMockFollowingProviders = async (): Promise<ServiceProvider[]> => {
  return [
    {
      id: '1',
      userId: 'user1',
      businessName: 'Glamour Studio',
      businessDescription: 'Premium beauty services with 8+ years of experience',
      averageRating: 4.8,
      totalReviews: 127,
      isVerified: true,
      profilePictureUrl: 'https://via.placeholder.com/60',
      followersCount: 1520,
      followingCount: 89,
      postsCount: 156,
      isFollowedByCurrentUser: true,
      isBookmarkedByCurrentUser: false,
    },
    {
      id: '2',
      userId: 'user2',
      businessName: 'Elite Nails & Spa',
      businessDescription: 'Luxury nail care and spa treatments',
      averageRating: 4.6,
      totalReviews: 89,
      isVerified: false,
      profilePictureUrl: 'https://via.placeholder.com/60',
      followersCount: 890,
      followingCount: 45,
      postsCount: 78,
      isFollowedByCurrentUser: true,
      isBookmarkedByCurrentUser: true,
    },
  ];
};

const getMockBookmarkedProviders = async (): Promise<ServiceProvider[]> => {
  return [
    {
      id: '2',
      userId: 'user2',
      businessName: 'Elite Nails & Spa',
      businessDescription: 'Luxury nail care and spa treatments',
      averageRating: 4.6,
      totalReviews: 89,
      isVerified: false,
      profilePictureUrl: 'https://via.placeholder.com/60',
      followersCount: 890,
      followingCount: 45,
      postsCount: 78,
      isFollowedByCurrentUser: true,
      isBookmarkedByCurrentUser: true,
    },
    {
      id: '3',
      userId: 'user3',
      businessName: 'Perfect Brows Studio',
      businessDescription: 'Eyebrow shaping and permanent makeup specialist',
      averageRating: 4.9,
      totalReviews: 156,
      isVerified: true,
      profilePictureUrl: 'https://via.placeholder.com/60',
      followersCount: 2100,
      followingCount: 67,
      postsCount: 203,
      isFollowedByCurrentUser: false,
      isBookmarkedByCurrentUser: true,
    },
  ];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerGradient: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface + '20',
  },
  headerSpacer: {
    width: 40,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  activeTabLabel: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  providerCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardGradient: {
    padding: 16,
  },
  providerInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  providerDetails: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginRight: 6,
  },
  providerDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  providerStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  providerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  bookButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  bookButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.surface,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  exploreButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  exploreButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
});

export default FollowingBookmarksScreen;
