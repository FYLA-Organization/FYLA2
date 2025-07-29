import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Review, RootStackParamList } from '../../types';
import ApiService from '../../services/api';
import { useAuth } from '../../context/AuthContext';

type ReviewsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ReviewsScreen: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const navigation = useNavigation<ReviewsScreenNavigationProp>();
  const { user } = useAuth();

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    if (!user?.id) return;
    
    try {
      const providerReviews = await ApiService.getReviews(user.id);
      setReviews(providerReviews);
      setTotalReviews(providerReviews.length);
      
      if (providerReviews.length > 0) {
        const avgRating = providerReviews.reduce((sum, review) => sum + review.rating, 0) / providerReviews.length;
        setAverageRating(avgRating);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={size}
          color={i <= rating ? '#FFD700' : 'rgba(255, 255, 255, 0.3)'}
          style={{ marginRight: 2 }}
        />
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const renderReviewCard = (review: Review) => (
    <BlurView key={review.id} intensity={80} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.clientInfo}>
          <Image
            source={{
              uri: review.reviewer?.profilePictureUrl || 'https://via.placeholder.com/40',
            }}
            style={styles.clientImage}
          />
          <View style={styles.clientDetails}>
            <Text style={styles.clientName}>
              {review.reviewer?.firstName} {review.reviewer?.lastName}
            </Text>
            <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.ratingContainer}>
          {renderStars(review.rating)}
          <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
        </View>
      </View>
      
      {review.comment && (
        <View style={styles.commentContainer}>
          <Text style={styles.commentText}>{review.comment}</Text>
        </View>
      )}

      {/* Questionnaire Details for Provider */}
      {review.questionnaire && (
        <View style={styles.questionnaireDetails}>
          <Text style={styles.questionnaireDetailsTitle}>Detailed Ratings</Text>
          <View style={styles.questionnaireGrid}>
            <View style={styles.questionnaireDetailRow}>
              <Text style={styles.questionnaireDetailLabel}>Punctuality</Text>
              <View style={styles.questionnaireDetailValue}>
                {renderStars(review.questionnaire.punctuality)}
              </View>
            </View>
            <View style={styles.questionnaireDetailRow}>
              <Text style={styles.questionnaireDetailLabel}>Professionalism</Text>
              <View style={styles.questionnaireDetailValue}>
                {renderStars(review.questionnaire.professionalism)}
              </View>
            </View>
            <View style={styles.questionnaireDetailRow}>
              <Text style={styles.questionnaireDetailLabel}>Value</Text>
              <View style={styles.questionnaireDetailValue}>
                {renderStars(review.questionnaire.valueForMoney)}
              </View>
            </View>
            <View style={styles.questionnaireDetailRow}>
              <Text style={styles.questionnaireDetailLabel}>Communication</Text>
              <View style={styles.questionnaireDetailValue}>
                {renderStars(review.questionnaire.communicationRating)}
              </View>
            </View>
            {review.questionnaire.cleanlinessRating > 0 && (
              <View style={styles.questionnaireDetailRow}>
                <Text style={styles.questionnaireDetailLabel}>Cleanliness</Text>
                <View style={styles.questionnaireDetailValue}>
                  {renderStars(review.questionnaire.cleanlinessRating)}
                </View>
              </View>
            )}
            <View style={styles.questionnaireDetailRow}>
              <Text style={styles.questionnaireDetailLabel}>Would Recommend</Text>
              <Text style={[styles.yesNoAnswer, review.questionnaire.wouldRecommend && styles.yesAnswer]}>
                {review.questionnaire.wouldRecommend ? 'Yes' : 'No'}
              </Text>
            </View>
            <View style={styles.questionnaireDetailRow}>
              <Text style={styles.questionnaireDetailLabel}>Would Use Again</Text>
              <Text style={[styles.yesNoAnswer, review.questionnaire.wouldUseAgain && styles.yesAnswer]}>
                {review.questionnaire.wouldUseAgain ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
        </View>
      )}
    </BlurView>
  );

  const renderRatingBreakdown = () => {
    const ratingCounts = [0, 0, 0, 0, 0];
    reviews.forEach(review => {
      ratingCounts[review.rating - 1]++;
    });

    return (
      <BlurView intensity={80} style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Rating Breakdown</Text>
        {[5, 4, 3, 2, 1].map(rating => {
          const count = ratingCounts[rating - 1];
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
          
          return (
            <View key={rating} style={styles.breakdownRow}>
              <Text style={styles.breakdownRating}>{rating}</Text>
              <Ionicons name="star" size={16} color="#FFD700" />
              <View style={styles.breakdownBar}>
                <View 
                  style={[styles.breakdownFill, { width: `${percentage}%` }]} 
                />
              </View>
              <Text style={styles.breakdownCount}>({count})</Text>
            </View>
          );
        })}
      </BlurView>
    );
  };

  const renderQuestionnaireMetrics = () => {
    const reviewsWithQuestionnaire = reviews.filter(review => review.questionnaire);
    
    if (reviewsWithQuestionnaire.length === 0) {
      return null;
    }

    const metrics = {
      punctuality: 0,
      professionalism: 0,
      valueForMoney: 0,
      communication: 0,
      cleanliness: 0,
      wouldRecommend: 0,
      wouldUseAgain: 0,
    };

    reviewsWithQuestionnaire.forEach(review => {
      const q = review.questionnaire!;
      metrics.punctuality += q.punctuality;
      metrics.professionalism += q.professionalism;
      metrics.valueForMoney += q.valueForMoney;
      metrics.communication += q.communicationRating;
      metrics.cleanliness += q.cleanlinessRating;
      metrics.wouldRecommend += q.wouldRecommend ? 1 : 0;
      metrics.wouldUseAgain += q.wouldUseAgain ? 1 : 0;
    });

    const count = reviewsWithQuestionnaire.length;
    const averages = {
      punctuality: metrics.punctuality / count,
      professionalism: metrics.professionalism / count,
      valueForMoney: metrics.valueForMoney / count,
      communication: metrics.communication / count,
      cleanliness: metrics.cleanliness / count,
      wouldRecommend: (metrics.wouldRecommend / count) * 100,
      wouldUseAgain: (metrics.wouldUseAgain / count) * 100,
    };

    const renderMetricRow = (label: string, value: number, isPercentage = false) => (
      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>{label}</Text>
        <View style={styles.metricValue}>
          {isPercentage ? (
            <Text style={styles.metricText}>{value.toFixed(0)}%</Text>
          ) : (
            <>
              {renderStars(Math.round(value))}
              <Text style={styles.metricText}>{value.toFixed(1)}</Text>
            </>
          )}
        </View>
      </View>
    );

    return (
      <BlurView intensity={80} style={styles.metricsCard}>
        <Text style={styles.metricsTitle}>Detailed Service Metrics</Text>
        <Text style={styles.metricsSubtitle}>Based on {count} detailed reviews</Text>
        
        {renderMetricRow('Punctuality', averages.punctuality)}
        {renderMetricRow('Professionalism', averages.professionalism)}
        {renderMetricRow('Value for Money', averages.valueForMoney)}
        {renderMetricRow('Communication', averages.communication)}
        {averages.cleanliness > 0 && renderMetricRow('Cleanliness', averages.cleanliness)}
        {renderMetricRow('Would Recommend', averages.wouldRecommend, true)}
        {renderMetricRow('Would Use Again', averages.wouldUseAgain, true)}
      </BlurView>
    );
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <BlurView intensity={80} style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Reviews</Text>
          <View style={styles.placeholder} />
        </BlurView>
        
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      {/* Header */}
      <BlurView intensity={80} style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reviews</Text>
        <View style={styles.placeholder} />
      </BlurView>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Rating Card */}
        <BlurView intensity={80} style={styles.overallCard}>
          <View style={styles.overallRating}>
            <Text style={styles.averageRatingText}>{averageRating.toFixed(1)}</Text>
            {renderStars(Math.round(averageRating), 24)}
            <Text style={styles.totalReviewsText}>
              {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </Text>
          </View>
        </BlurView>

        {/* Rating Breakdown */}
        {totalReviews > 0 && renderRatingBreakdown()}

        {/* Questionnaire Metrics */}
        {totalReviews > 0 && renderQuestionnaireMetrics()}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <BlurView intensity={80} style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={64} color="rgba(255, 255, 255, 0.5)" />
            <Text style={styles.emptyText}>No reviews yet</Text>
            <Text style={styles.emptySubtext}>
              Reviews from clients will appear here after completed services
            </Text>
          </BlurView>
        ) : (
          <View style={styles.reviewsList}>
            <Text style={styles.reviewsListTitle}>
              Recent Reviews ({reviews.length})
            </Text>
            {reviews.map(renderReviewCard)}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 48,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  overallCard: {
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    padding: 32,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  overallRating: {
    alignItems: 'center',
  },
  averageRatingText: {
    fontSize: 48,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    letterSpacing: -1,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalReviewsText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  breakdownCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    padding: 20,
    marginBottom: 20,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownRating: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    width: 20,
  },
  breakdownBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  breakdownCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    width: 30,
    textAlign: 'right',
  },
  reviewsList: {
    marginBottom: 20,
  },
  reviewsListTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  reviewCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    padding: 20,
    marginBottom: 16,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
    marginLeft: 8,
  },
  commentContainer: {
    marginTop: 8,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  commentText: {
    fontSize: 15,
    color: 'white',
    lineHeight: 22,
    fontWeight: '500',
  },
  emptyContainer: {
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    padding: 60,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginTop: 20,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptySubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  // Metrics Styles
  metricsCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    padding: 20,
    marginBottom: 20,
  },
  metricsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  metricsSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 20,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  metricLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    flex: 1,
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
    marginLeft: 8,
  },
  // Questionnaire Details in Review Cards
  questionnaireDetails: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  questionnaireDetailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  questionnaireGrid: {
    gap: 8,
  },
  questionnaireDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  questionnaireDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
  },
  questionnaireDetailValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yesNoAnswer: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  yesAnswer: {
    color: '#4CAF50',
  },
});

export default ReviewsScreen;
