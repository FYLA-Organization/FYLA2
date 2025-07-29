import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Booking, Review } from '../types';
import ApiService from '../services/api';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  booking: Booking;
  onReviewSubmitted: (review: Review) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ 
  visible, 
  onClose, 
  booking, 
  onReviewSubmitted 
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Questionnaire responses
  const [questionnaire, setQuestionnaire] = useState({
    punctuality: 0, // 1-5 scale
    professionalism: 0, // 1-5 scale
    valueForMoney: 0, // 1-5 scale
    wouldRecommend: false, // yes/no
    wouldUseAgain: false, // yes/no
    communicationRating: 0, // 1-5 scale
    cleanlinessRating: 0, // 1-5 scale (if applicable)
  });

  const submitReview = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    // Check if required questionnaire fields are filled
    if (questionnaire.punctuality === 0 || questionnaire.professionalism === 0 || questionnaire.valueForMoney === 0) {
      Alert.alert('Complete Required Ratings', 'Please rate Punctuality, Professionalism, and Value for Money before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const review = await ApiService.createReview(booking.id, rating, comment, questionnaire);
      onReviewSubmitted(review);
      Alert.alert('Success', 'Thank you for your review!');
      onClose();
      // Reset form
      setRating(0);
      setComment('');
      setQuestionnaire({
        punctuality: 0,
        professionalism: 0,
        valueForMoney: 0,
        wouldRecommend: false,
        wouldUseAgain: false,
        communicationRating: 0,
        cleanlinessRating: 0,
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          style={styles.starButton}
        >
          <Ionicons
            name={i <= rating ? 'star' : 'star-outline'}
            size={32}
            color={i <= rating ? '#FFD700' : 'rgba(255, 255, 255, 0.5)'}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const getRatingText = () => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Tap to rate';
    }
  };

  const renderQuestionnaireStars = (value: number, onPress: (rating: number) => void) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => onPress(i)}
          style={styles.questionnaireStarButton}
        >
          <Ionicons
            name={i <= value ? 'star' : 'star-outline'}
            size={20}
            color={i <= value ? '#FFD700' : 'rgba(255, 255, 255, 0.5)'}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const renderYesNoButtons = (value: boolean, onPress: (value: boolean) => void) => {
    return (
      <View style={styles.yesNoContainer}>
        <TouchableOpacity
          style={[styles.yesNoButton, value && styles.yesNoButtonActive]}
          onPress={() => onPress(true)}
        >
          <Text style={[styles.yesNoText, value && styles.yesNoTextActive]}>Yes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.yesNoButton, !value && styles.yesNoButtonActive]}
          onPress={() => onPress(false)}
        >
          <Text style={[styles.yesNoText, !value && styles.yesNoTextActive]}>No</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} style={styles.modalBlur}>
          <View style={styles.modalContainer}>
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Rate Your Experience</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Service Details */}
                <BlurView intensity={80} style={styles.serviceCard}>
                  <View style={styles.serviceHeader}>
                    <Image
                      source={{
                        uri: booking.serviceProvider?.profilePictureUrl || 'https://via.placeholder.com/60',
                      }}
                      style={styles.providerImage}
                    />
                    <View style={styles.serviceInfo}>
                      <Text style={styles.providerName}>
                        {booking.serviceProvider?.businessName || 'Provider'}
                      </Text>
                      <Text style={styles.serviceName}>
                        {booking.service?.name || 'Service'}
                      </Text>
                      <Text style={styles.serviceDate}>
                        {new Date(booking.bookingDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.servicePrice}>${booking.totalAmount}</Text>
                  </View>
                </BlurView>

                {/* Rating Section */}
                <View style={styles.ratingSection}>
                  <Text style={styles.ratingTitle}>How would you rate this service?</Text>
                  <Text style={styles.ratingSubtitle}>{getRatingText()}</Text>
                  
                  <View style={styles.starsContainer}>
                    {renderStars()}
                  </View>
                </View>

                {/* Questionnaire Section */}
                <View style={styles.questionnaireSection}>
                  <Text style={styles.questionnaireTitle}>Help us improve by rating specific aspects</Text>
                  
                  <BlurView intensity={80} style={styles.serviceCard}>
                    <View style={styles.questionnaireItem}>
                      <Text style={styles.questionnaireLabel}>Punctuality</Text>
                      <View style={styles.questionnaireStarsContainer}>
                        {renderQuestionnaireStars(questionnaire.punctuality, (rating) => 
                          setQuestionnaire(prev => ({ ...prev, punctuality: rating }))
                        )}
                      </View>
                    </View>

                    <View style={styles.questionnaireItem}>
                      <Text style={styles.questionnaireLabel}>Professionalism</Text>
                      <View style={styles.questionnaireStarsContainer}>
                        {renderQuestionnaireStars(questionnaire.professionalism, (rating) => 
                          setQuestionnaire(prev => ({ ...prev, professionalism: rating }))
                        )}
                      </View>
                    </View>

                    <View style={styles.questionnaireItem}>
                      <Text style={styles.questionnaireLabel}>Value for Money</Text>
                      <View style={styles.questionnaireStarsContainer}>
                        {renderQuestionnaireStars(questionnaire.valueForMoney, (rating) => 
                          setQuestionnaire(prev => ({ ...prev, valueForMoney: rating }))
                        )}
                      </View>
                    </View>

                    <View style={styles.questionnaireItem}>
                      <Text style={styles.questionnaireLabel}>Communication</Text>
                      <View style={styles.questionnaireStarsContainer}>
                        {renderQuestionnaireStars(questionnaire.communicationRating, (rating) => 
                          setQuestionnaire(prev => ({ ...prev, communicationRating: rating }))
                        )}
                      </View>
                    </View>

                    <View style={styles.questionnaireItem}>
                      <Text style={styles.questionnaireLabel}>Cleanliness</Text>
                      <View style={styles.questionnaireStarsContainer}>
                        {renderQuestionnaireStars(questionnaire.cleanlinessRating, (rating) => 
                          setQuestionnaire(prev => ({ ...prev, cleanlinessRating: rating }))
                        )}
                      </View>
                    </View>

                    <View style={styles.questionnaireItem}>
                      <Text style={styles.questionnaireLabel}>Would you recommend this service?</Text>
                      {renderYesNoButtons(questionnaire.wouldRecommend, (value) => 
                        setQuestionnaire(prev => ({ ...prev, wouldRecommend: value }))
                      )}
                    </View>

                    <View style={styles.questionnaireItem}>
                      <Text style={styles.questionnaireLabel}>Would you use this service again?</Text>
                      {renderYesNoButtons(questionnaire.wouldUseAgain, (value) => 
                        setQuestionnaire(prev => ({ ...prev, wouldUseAgain: value }))
                      )}
                    </View>
                  </BlurView>
                </View>

                {/* Comment Section */}
                <View style={styles.commentSection}>
                  <Text style={styles.commentTitle}>Share your experience (optional)</Text>
                  <BlurView intensity={80} style={styles.commentInputContainer}>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Tell others about your experience..."
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={comment}
                      onChangeText={setComment}
                      multiline
                      maxLength={500}
                      textAlignVertical="top"
                    />
                  </BlurView>
                  <Text style={styles.characterCount}>{comment.length}/500</Text>
                </View>
              </ScrollView>

              {/* Footer */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
                  onPress={submitReview}
                  disabled={rating === 0 || isSubmitting}
                >
                  <Text style={[styles.submitButtonText, rating === 0 && styles.submitButtonTextDisabled]}>
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBlur: {
    flex: 1,
  },
  modalContainer: {
    height: '85%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    marginTop: 60,
  },
  modalContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  serviceCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginTop: 20,
    marginBottom: 32,
    overflow: 'hidden',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  providerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  serviceInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  serviceDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFD700',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  ratingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  ratingSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  commentSection: {
    marginBottom: 32,
  },
  commentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  commentInputContainer: {
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    padding: 16,
    minHeight: 120,
  },
  commentInput: {
    fontSize: 16,
    color: 'white',
    lineHeight: 22,
    textAlignVertical: 'top',
    minHeight: 88,
  },
  characterCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'right',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    borderWidth: 1,
    borderColor: '#FFD700',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: 'white',
  },
  submitButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  // Questionnaire Styles
  questionnaireSection: {
    marginVertical: 20,
  },
  questionnaireTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  questionnaireItem: {
    marginBottom: 20,
  },
  questionnaireLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  questionnaireStarButton: {
    padding: 4,
  },
  questionnaireStarsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  yesNoContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  yesNoButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  yesNoButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderColor: '#FFD700',
  },
  yesNoText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  yesNoTextActive: {
    color: 'white',
  },
});

export default ReviewModal;
