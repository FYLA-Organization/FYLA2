import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

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
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  serviceId: string;
  serviceName: string;
  rating: number;
  qualityRating: number;
  timelinessRating: number;
  communicationRating: number;
  cleanlinessRating: number;
  valueRating: number;
  comment: string;
  wouldRecommend: boolean;
  createdAt: string;
  helpfulCount: number;
  isHelpful: boolean;
}

interface RouteParams {
  providerId: string;
  serviceId?: string;
}

const CreateReviewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { providerId, serviceId } = route.params as RouteParams;
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [overallRating, setOverallRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [timelinessRating, setTimelinessRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = [
    {
      step: 1,
      title: "Overall Experience",
      subtitle: "How would you rate your overall experience?",
      rating: overallRating,
      setRating: setOverallRating,
    },
    {
      step: 2,
      title: "Service Quality",
      subtitle: "How was the quality of the service?",
      rating: qualityRating,
      setRating: setQualityRating,
    },
    {
      step: 3,
      title: "Timeliness",
      subtitle: "Did the provider start and finish on time?",
      rating: timelinessRating,
      setRating: setTimelinessRating,
    },
    {
      step: 4,
      title: "Communication",
      subtitle: "How was the provider's communication?",
      rating: communicationRating,
      setRating: setCommunicationRating,
    },
    {
      step: 5,
      title: "Cleanliness",
      subtitle: "How clean was the workspace and equipment?",
      rating: cleanlinessRating,
      setRating: setCleanlinessRating,
    },
    {
      step: 6,
      title: "Value for Money",
      subtitle: "Was the service worth the price?",
      rating: valueRating,
      setRating: setValueRating,
    },
  ];

  const currentQuestion = questions.find(q => q.step === currentStep);

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(7); // Comment step
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (wouldRecommend === null) {
      Alert.alert('Required', 'Please answer if you would recommend this provider.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const reviewData = {
        providerId,
        serviceId,
        overallRating,
        qualityRating,
        timelinessRating,
        communicationRating,
        cleanlinessRating,
        valueRating,
        comment: comment.trim(),
        wouldRecommend,
      };

      // API call would go here
      console.log('Submitting review:', reviewData);
      
      Alert.alert(
        'Review Submitted!',
        'Thank you for your feedback. Your review helps other users make informed decisions.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (rating: number, setRating: (rating: number) => void, size: number = 40) => (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => setRating(star)}
          style={styles.starButton}
        >
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? COLORS.accent : COLORS.textSecondary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentStep / 8) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>Step {currentStep} of 8</Text>
    </View>
  );

  const renderRatingStep = () => {
    if (!currentQuestion) return null;

    return (
      <View style={styles.stepContainer}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionTitle}>{currentQuestion.title}</Text>
          <Text style={styles.questionSubtitle}>{currentQuestion.subtitle}</Text>
          
          {renderStarRating(currentQuestion.rating, currentQuestion.setRating)}
          
          <View style={styles.ratingLabels}>
            <Text style={styles.ratingLabel}>Poor</Text>
            <Text style={styles.ratingLabel}>Excellent</Text>
          </View>
        </View>
        
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[styles.navButton, styles.backButton]}
            onPress={handleBack}
            disabled={currentStep === 1}
          >
            <Text style={[styles.navButtonText, currentStep === 1 && styles.disabledText]}>
              Back
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={handleNext}
            disabled={currentQuestion.rating === 0}
          >
            <LinearGradient
              colors={currentQuestion.rating > 0 ? [COLORS.primary, COLORS.secondary] : [COLORS.textSecondary, COLORS.textSecondary]}
              style={styles.gradientButton}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCommentStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.questionContainer}>
        <Text style={styles.questionTitle}>Additional Comments</Text>
        <Text style={styles.questionSubtitle}>
          Share more details about your experience (optional)
        </Text>
        
        <TextInput
          style={styles.commentInput}
          multiline
          numberOfLines={6}
          placeholder="Tell others about your experience..."
          placeholderTextColor={COLORS.textSecondary}
          value={comment}
          onChangeText={setComment}
          textAlignVertical="top"
        />
      </View>
      
      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={[styles.navButton, styles.backButton]}
          onPress={handleBack}
        >
          <Text style={styles.navButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={() => setCurrentStep(8)}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.gradientButton}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecommendationStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.questionContainer}>
        <Text style={styles.questionTitle}>Would you recommend?</Text>
        <Text style={styles.questionSubtitle}>
          Would you recommend this provider to others?
        </Text>
        
        <View style={styles.recommendationButtons}>
          <TouchableOpacity
            style={[
              styles.recommendButton,
              wouldRecommend === true && styles.selectedRecommendButton
            ]}
            onPress={() => setWouldRecommend(true)}
          >
            <Ionicons 
              name="thumbs-up" 
              size={24} 
              color={wouldRecommend === true ? COLORS.surface : COLORS.success} 
            />
            <Text style={[
              styles.recommendButtonText,
              wouldRecommend === true && styles.selectedRecommendButtonText
            ]}>
              Yes, I recommend
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.recommendButton,
              wouldRecommend === false && styles.selectedRecommendButton
            ]}
            onPress={() => setWouldRecommend(false)}
          >
            <Ionicons 
              name="thumbs-down" 
              size={24} 
              color={wouldRecommend === false ? COLORS.surface : COLORS.error} 
            />
            <Text style={[
              styles.recommendButtonText,
              wouldRecommend === false && styles.selectedRecommendButtonText
            ]}>
              No, I don't recommend
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={[styles.navButton, styles.backButton]}
          onPress={handleBack}
        >
          <Text style={styles.navButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navButton, styles.submitButton]}
          onPress={handleSubmit}
          disabled={wouldRecommend === null || isSubmitting}
        >
          <LinearGradient
            colors={wouldRecommend !== null ? [COLORS.success, '#66BB6A'] : [COLORS.textSecondary, COLORS.textSecondary]}
            style={styles.gradientButton}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => {
    if (currentStep <= 6) {
      return renderRatingStep();
    } else if (currentStep === 7) {
      return renderCommentStep();
    } else {
      return renderRecommendationStep();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write a Review</Text>
        <View style={styles.placeholder} />
      </View>
      
      {renderProgressBar()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
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
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  questionContainer: {
    alignItems: 'center',
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starButton: {
    padding: 8,
  },
  ratingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  ratingLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  commentInput: {
    width: '100%',
    minHeight: 120,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontFamily: 'System',
  },
  recommendationButtons: {
    width: '100%',
    gap: 16,
  },
  recommendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: 12,
  },
  selectedRecommendButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  recommendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedRecommendButtonText: {
    color: COLORS.surface,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  navButton: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  backButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  nextButton: {
    overflow: 'hidden',
  },
  submitButton: {
    overflow: 'hidden',
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  disabledText: {
    color: COLORS.textSecondary,
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
});

export default CreateReviewScreen;
