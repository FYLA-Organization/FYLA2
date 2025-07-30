import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';

const COLORS = {
  primary: '#3797F0',
  secondary: '#4ECDC4',
  accent: '#FFD93D',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#262626',
  textSecondary: '#8E8E8E',
  border: '#EFEFEF',
  instagram: '#E1306C',
  star: '#FFD700',
  heart: '#FF3040',
};

interface Review {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string;
  };
  serviceId: string;
  serviceName: string;
  overallRating: number;
  qualityRating: number;
  timelinessRating: number;
  communicationRating: number;
  cleanlinessRating: number;
  valueRating: number;
  comment: string;
  wouldRecommend: boolean;
  helpfulCount: number;
  isHelpful: boolean;
  createdAt: string;
  images?: string[];
}

interface RouteParams {
  providerId: string;
  providerName: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  recommendationPercentage: number;
}

const ReviewsListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { providerId, providerName } = route.params as RouteParams;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  useEffect(() => {
    loadReviews();
  }, [providerId, sortBy, filterRating]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      
      // Mock API calls - replace with actual API
      const [reviewsData, statsData] = await Promise.all([
        getMockReviews(providerId, sortBy, filterRating),
        getMockReviewStats(providerId),
      ]);

      setReviews(reviewsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  };

  const handleHelpfulToggle = async (reviewId: string) => {
    try {
      setReviews(prev => prev.map(review => 
        review.id === reviewId
          ? {
              ...review,
              isHelpful: !review.isHelpful,
              helpfulCount: review.isHelpful 
                ? review.helpfulCount - 1 
                : review.helpfulCount + 1
            }
          : review
      ));

      // API call would go here
      console.log('Toggle helpful for review:', reviewId);
    } catch (error) {
      console.error('Error toggling helpful:', error);
    }
  };

  const renderStarRating = (rating: number, size: number = 16) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : star - 0.5 <= rating ? 'star-half' : 'star-outline'}
            size={size}
            color={COLORS.star}
          />
        ))}
      </View>
    );
  };

  const renderRatingBreakdown = () => {
    if (!stats) return null;

    return (
      <View style={styles.ratingBreakdown}>
        <Text style={styles.sectionTitle}>Rating Breakdown</Text>
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = stats.ratingBreakdown[rating as keyof typeof stats.ratingBreakdown];
          const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
          
          return (
            <TouchableOpacity
              key={rating}
              style={styles.ratingRow}
              onPress={() => setFilterRating(filterRating === rating ? null : rating)}
            >
              <Text style={styles.ratingNumber}>{rating}</Text>
              <Ionicons name="star" size={16} color={COLORS.star} />
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${percentage}%` }
                    ]} 
                  />
                </View>
              </View>
              <Text style={styles.ratingCount}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderStatsHeader = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsHeader}>
        <View style={styles.statsRow}>
          <View style={styles.averageRating}>
            <Text style={styles.averageRatingNumber}>
              {stats.averageRating.toFixed(1)}
            </Text>
            {renderStarRating(stats.averageRating, 20)}
            <Text style={styles.totalReviews}>
              {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
            </Text>
          </View>
          
          <View style={styles.recommendation}>
            <Text style={styles.recommendationPercentage}>
              {stats.recommendationPercentage}%
            </Text>
            <Text style={styles.recommendationText}>would recommend</Text>
          </View>
        </View>
        
        {renderRatingBreakdown()}
      </View>
    );
  };

  const renderSortFilter = () => (
    <View style={styles.sortFilter}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterButtons}
      >
        <TouchableOpacity
          style={[styles.filterButton, sortBy === 'newest' && styles.activeFilterButton]}
          onPress={() => setSortBy('newest')}
        >
          <Text style={[styles.filterButtonText, sortBy === 'newest' && styles.activeFilterButtonText]}>
            Newest
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, sortBy === 'oldest' && styles.activeFilterButton]}
          onPress={() => setSortBy('oldest')}
        >
          <Text style={[styles.filterButtonText, sortBy === 'oldest' && styles.activeFilterButtonText]}>
            Oldest
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, sortBy === 'highest' && styles.activeFilterButton]}
          onPress={() => setSortBy('highest')}
        >
          <Text style={[styles.filterButtonText, sortBy === 'highest' && styles.activeFilterButtonText]}>
            Highest Rated
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, sortBy === 'lowest' && styles.activeFilterButton]}
          onPress={() => setSortBy('lowest')}
        >
          <Text style={[styles.filterButtonText, sortBy === 'lowest' && styles.activeFilterButtonText]}>
            Lowest Rated
          </Text>
        </TouchableOpacity>
        
        {filterRating && (
          <TouchableOpacity
            style={[styles.filterButton, styles.activeFilterButton]}
            onPress={() => setFilterRating(null)}
          >
            <Text style={[styles.filterButtonText, styles.activeFilterButtonText]}>
              {filterRating} ⭐ ✕
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );

  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: item.user.profilePictureUrl }}
          style={styles.userAvatar}
        />
        <View style={styles.reviewHeaderInfo}>
          <Text style={styles.userName}>
            {item.user.firstName} {item.user.lastName}
          </Text>
          <View style={styles.ratingRow}>
            {renderStarRating(item.overallRating)}
            <Text style={styles.ratingText}>• {item.serviceName}</Text>
          </View>
          <Text style={styles.reviewDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <Text style={styles.reviewComment}>{item.comment}</Text>
      
      {item.images && item.images.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.reviewImages}
        >
          {item.images.map((image, index) => (
            <TouchableOpacity key={index} style={styles.reviewImageContainer}>
              <Image source={{ uri: image }} style={styles.reviewImage} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      
      <View style={styles.reviewRatings}>
        <Text style={styles.ratingsTitle}>Detailed Ratings:</Text>
        <View style={styles.ratingDetails}>
          <View style={styles.ratingDetail}>
            <Text style={styles.ratingLabel}>Quality</Text>
            {renderStarRating(item.qualityRating, 14)}
          </View>
          <View style={styles.ratingDetail}>
            <Text style={styles.ratingLabel}>Timeliness</Text>
            {renderStarRating(item.timelinessRating, 14)}
          </View>
          <View style={styles.ratingDetail}>
            <Text style={styles.ratingLabel}>Communication</Text>
            {renderStarRating(item.communicationRating, 14)}
          </View>
          <View style={styles.ratingDetail}>
            <Text style={styles.ratingLabel}>Cleanliness</Text>
            {renderStarRating(item.cleanlinessRating, 14)}
          </View>
          <View style={styles.ratingDetail}>
            <Text style={styles.ratingLabel}>Value</Text>
            {renderStarRating(item.valueRating, 14)}
          </View>
        </View>
      </View>
      
      {item.wouldRecommend && (
        <View style={styles.recommendationBadge}>
          <Ionicons name="thumbs-up" size={16} color={COLORS.primary} />
          <Text style={styles.recommendationText}>Recommends this service</Text>
        </View>
      )}
      
      <View style={styles.reviewActions}>
        <TouchableOpacity
          style={styles.helpfulButton}
          onPress={() => handleHelpfulToggle(item.id)}
        >
          <Ionicons
            name={item.isHelpful ? 'thumbs-up' : 'thumbs-up-outline'}
            size={16}
            color={item.isHelpful ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.helpfulText, item.isHelpful && styles.helpfulTextActive]}>
            Helpful ({item.helpfulCount})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateReview', { providerId })}
        >
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View>
            {renderStatsHeader()}
            {renderSortFilter()}
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

// Mock data functions
const getMockReviews = async (
  providerId: string, 
  sortBy: string, 
  filterRating: number | null
): Promise<Review[]> => {
  const mockReviews: Review[] = [
    {
      id: '1',
      userId: 'user1',
      user: {
        id: 'user1',
        firstName: 'Sarah',
        lastName: 'Johnson',
        profilePictureUrl: 'https://via.placeholder.com/40',
      },
      serviceId: 'service1',
      serviceName: 'Bridal Makeup',
      overallRating: 5,
      qualityRating: 5,
      timelinessRating: 5,
      communicationRating: 4,
      cleanlinessRating: 5,
      valueRating: 4,
      comment: 'Absolutely amazing experience! The makeup artist was professional, skilled, and made me feel like a princess on my wedding day. Every detail was perfect and the makeup lasted all day. Highly recommend!',
      wouldRecommend: true,
      helpfulCount: 12,
      isHelpful: false,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      images: ['https://via.placeholder.com/200', 'https://via.placeholder.com/200'],
    },
    {
      id: '2',
      userId: 'user2',
      user: {
        id: 'user2',
        firstName: 'Emma',
        lastName: 'Davis',
        profilePictureUrl: 'https://via.placeholder.com/40',
      },
      serviceId: 'service2',
      serviceName: 'Event Makeup',
      overallRating: 4,
      qualityRating: 4,
      timelinessRating: 5,
      communicationRating: 4,
      cleanlinessRating: 4,
      valueRating: 4,
      comment: 'Great service for my corporate event. Professional and punctual. The makeup looked natural and sophisticated, exactly what I asked for.',
      wouldRecommend: true,
      helpfulCount: 8,
      isHelpful: true,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Apply filtering and sorting
  let filteredReviews = mockReviews;
  
  if (filterRating) {
    filteredReviews = filteredReviews.filter(review => review.overallRating === filterRating);
  }

  switch (sortBy) {
    case 'newest':
      filteredReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'oldest':
      filteredReviews.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      break;
    case 'highest':
      filteredReviews.sort((a, b) => b.overallRating - a.overallRating);
      break;
    case 'lowest':
      filteredReviews.sort((a, b) => a.overallRating - b.overallRating);
      break;
  }

  return filteredReviews;
};

const getMockReviewStats = async (providerId: string): Promise<ReviewStats> => {
  return {
    averageRating: 4.6,
    totalReviews: 127,
    ratingBreakdown: {
      5: 89,
      4: 28,
      3: 7,
      2: 2,
      1: 1,
    },
    recommendationPercentage: 94,
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  listContent: {
    paddingBottom: 20,
  },
  statsHeader: {
    backgroundColor: COLORS.surface,
    padding: 20,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  averageRating: {
    alignItems: 'center',
  },
  averageRatingNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  starContainer: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  totalReviews: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  recommendation: {
    alignItems: 'center',
  },
  recommendationPercentage: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  recommendationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  ratingBreakdown: {
    marginTop: 20,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  ratingNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    width: 12,
  },
  progressBarContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.star,
  },
  ratingCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    width: 30,
    textAlign: 'right',
  },
  sortFilter: {
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterButtons: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  activeFilterButtonText: {
    color: COLORS.surface,
  },
  reviewItem: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  reviewHeaderInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewImages: {
    marginBottom: 12,
  },
  reviewImageContainer: {
    marginRight: 8,
  },
  reviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  reviewRatings: {
    marginBottom: 12,
  },
  ratingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  ratingDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  ratingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: '45%',
  },
  ratingLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    minWidth: 70,
  },
  recommendationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  helpfulText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  helpfulTextActive: {
    color: COLORS.primary,
    fontWeight: '500',
  },
});

export default ReviewsListScreen;
