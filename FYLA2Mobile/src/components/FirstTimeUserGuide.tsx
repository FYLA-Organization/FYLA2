import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MODERN_COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/modernDesign';

const { width, height } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  illustration?: string;
  color: string;
  actionText?: string;
  tips?: string[];
}

interface FirstTimeUserGuideProps {
  visible: boolean;
  onClose: () => void;
  userType: 'client' | 'provider';
  navigation?: any;
}

const FirstTimeUserGuide: React.FC<FirstTimeUserGuideProps> = ({
  visible,
  onClose,
  userType,
  navigation,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const clientSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to FYLA2!',
      subtitle: 'Your Beauty & Wellness Journey Starts Here',
      description: 'Discover amazing beauty professionals, book services instantly, and enjoy exclusive rewards. Let\'s get you started with the basics!',
      icon: 'sparkles',
      color: MODERN_COLORS.primary,
      actionText: 'Get Started',
      tips: ['Book your favorite services', 'Discover nearby professionals', 'Earn loyalty rewards']
    },
    {
      id: 'search',
      title: 'Find Your Perfect Service',
      subtitle: 'Search Made Simple',
      description: 'Use our powerful search to find hair, nails, makeup, massage, and more. Filter by location, price, and ratings to find exactly what you need.',
      icon: 'search',
      color: '#FF6B6B',
      actionText: 'Try Search Now',
      tips: ['Search by service type', 'Filter by distance', 'Sort by ratings & price', 'Save favorite providers']
    },
    {
      id: 'booking',
      title: 'Book in Seconds',
      subtitle: 'Instant Appointments',
      description: 'See real-time availability, choose your preferred time, and book instantly. Get confirmation right away with all the details you need.',
      icon: 'calendar',
      color: '#4ECDC4',
      actionText: 'See How',
      tips: ['Real-time availability', 'Instant confirmation', 'Easy rescheduling', 'Secure payments']
    },
    {
      id: 'rewards',
      title: 'Earn While You Book',
      subtitle: 'Loyalty Rewards Program',
      description: 'Earn points with every booking, unlock exclusive deals, and get special perks from your favorite providers. The more you book, the more you save!',
      icon: 'gift',
      color: '#FFE66D',
      actionText: 'Learn More',
      tips: ['Earn points per booking', 'Unlock exclusive deals', 'Get VIP treatment', 'Redeem for discounts']
    },
    {
      id: 'social',
      title: 'Share & Discover',
      subtitle: 'Beauty Community',
      description: 'Follow your favorite providers, see their latest work, get inspired by the community, and share your own transformation stories.',
      icon: 'people',
      color: '#A8E6CF',
      actionText: 'Explore Feed',
      tips: ['Follow favorite providers', 'See latest transformations', 'Get style inspiration', 'Share your looks']
    }
  ];

  const providerSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to FYLA2 Business!',
      subtitle: 'Grow Your Beauty Business',
      description: 'Manage appointments, showcase your work, attract new clients, and grow your revenue. Let\'s set up your professional presence!',
      icon: 'business',
      color: MODERN_COLORS.primary,
      actionText: 'Get Started',
      tips: ['Manage appointments', 'Showcase your portfolio', 'Attract new clients', 'Increase revenue']
    },
    {
      id: 'profile',
      title: 'Create Your Professional Profile',
      subtitle: 'Make a Great First Impression',
      description: 'Add your services, set your prices, upload portfolio photos, and tell your story. A complete profile gets 3x more bookings!',
      icon: 'person-circle',
      color: '#8B5CF6',
      actionText: 'Setup Profile',
      tips: ['Complete profile setup', 'Add high-quality photos', 'Set competitive pricing', 'Write compelling descriptions']
    },
    {
      id: 'schedule',
      title: 'Manage Your Schedule',
      subtitle: 'Stay Organized & Available',
      description: 'Set your working hours, manage availability, block time for breaks, and let clients book when it works for both of you.',
      icon: 'time',
      color: '#FF6B6B',
      actionText: 'Setup Schedule',
      tips: ['Set working hours', 'Block break times', 'Manage availability', 'Accept instant bookings']
    },
    {
      id: 'services',
      title: 'Showcase Your Services',
      subtitle: 'Highlight What You Do Best',
      description: 'Add all your services with detailed descriptions, accurate pricing, and estimated durations. Help clients know exactly what to expect.',
      icon: 'cut',
      color: '#4ECDC4',
      actionText: 'Add Services',
      tips: ['List all services', 'Set accurate pricing', 'Include service duration', 'Add detailed descriptions']
    },
    {
      id: 'grow',
      title: 'Grow Your Business',
      subtitle: 'Advanced Features Available',
      description: 'Upgrade to unlock loyalty programs, custom branding, marketing tools, and analytics to take your business to the next level!',
      icon: 'trending-up',
      color: '#FFD700',
      actionText: 'See Plans',
      tips: ['Loyalty programs', 'Custom branding', 'Marketing automation', 'Business analytics']
    }
  ];

  const steps = userType === 'client' ? clientSteps : providerSteps;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      // Reset animations for step change
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 30,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('firstTimeUserGuideCompleted', 'true');
      await AsyncStorage.setItem(`firstTimeGuide_${userType}`, 'completed');
      onClose();
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
      onClose();
    }
  };

  const handleActionPress = () => {
    const step = steps[currentStep];
    
    if (navigation) {
      switch (step.id) {
        case 'search':
          handleComplete();
          setTimeout(() => navigation.navigate('Search'), 300);
          break;
        case 'booking':
          // Could show a demo booking flow or navigate to booking tutorial
          break;
        case 'social':
          handleComplete();
          setTimeout(() => navigation.navigate('Home'), 300);
          break;
        case 'profile':
          handleComplete();
          setTimeout(() => navigation.navigate('EnhancedProfile'), 300);
          break;
        case 'schedule':
          handleComplete();
          setTimeout(() => navigation.navigate('ProviderAvailability'), 300);
          break;
        case 'services':
          handleComplete();
          setTimeout(() => navigation.navigate('EnhancedServiceManagement'), 300);
          break;
        case 'grow':
          handleComplete();
          setTimeout(() => navigation.navigate('SubscriptionPlans'), 300);
          break;
        default:
          handleNext();
      }
    } else {
      handleNext();
    }
  };

  if (!visible) return null;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={styles.blurContainer}>
          <View style={styles.container}>
            {/* Header */}
            <LinearGradient
              colors={[currentStepData.color, `${currentStepData.color}DD`]}
              style={styles.header}
            >
              <View style={styles.headerContent}>
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name={currentStepData.icon as any} 
                    size={40} 
                    color="white" 
                  />
                </View>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleSkip}
                >
                  <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
              </View>
              
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${((currentStep + 1) / steps.length) * 100}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {currentStep + 1} of {steps.length}
                </Text>
              </View>
            </LinearGradient>

            {/* Content */}
            <Animated.View 
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <ScrollView 
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollContentContainer}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.title}>{currentStepData.title}</Text>
                <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>
                <Text style={styles.description}>{currentStepData.description}</Text>

                {/* Tips Section */}
                {currentStepData.tips && (
                  <View style={styles.tipsContainer}>
                    <Text style={styles.tipsTitle}>What You Can Do:</Text>
                    {currentStepData.tips.map((tip, index) => (
                      <View key={index} style={styles.tipItem}>
                        <View style={[styles.tipBullet, { backgroundColor: currentStepData.color }]} />
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Action Button */}
                {currentStepData.actionText && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: currentStepData.color }]}
                    onPress={handleActionPress}
                  >
                    <Text style={styles.actionButtonText}>{currentStepData.actionText}</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </TouchableOpacity>
                )}
              </ScrollView>
            </Animated.View>

            {/* Footer Navigation */}
            <View style={styles.footer}>
              {/* Pagination Dots */}
              <View style={styles.pagination}>
                {steps.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      {
                        backgroundColor: index === currentStep 
                          ? currentStepData.color 
                          : 'rgba(0, 0, 0, 0.2)'
                      }
                    ]}
                  />
                ))}
              </View>

              {/* Navigation Buttons */}
              <View style={styles.navigationButtons}>
                <TouchableOpacity
                  style={[
                    styles.navButton, 
                    styles.previousButton,
                    { opacity: isFirstStep ? 0.5 : 1 }
                  ]}
                  onPress={handlePrevious}
                  disabled={isFirstStep}
                >
                  <Ionicons name="arrow-back" size={20} color={MODERN_COLORS.gray700} />
                  <Text style={styles.navButtonText}>Previous</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.navButton, styles.nextButton, { backgroundColor: currentStepData.color }]}
                  onPress={handleNext}
                >
                  <Text style={[styles.navButtonText, { color: 'white' }]}>
                    {isLastStep ? 'Get Started!' : 'Next'}
                  </Text>
                  <Ionicons 
                    name={isLastStep ? "checkmark" : "arrow-forward"} 
                    size={20} 
                    color="white" 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
};

// Hook to manage first-time user guide state
export const useFirstTimeUserGuide = (userType: 'client' | 'provider') => {
  const [shouldShow, setShouldShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFirstTimeStatus();
  }, [userType]);

  const checkFirstTimeStatus = async () => {
    try {
      const generalCompleted = await AsyncStorage.getItem('firstTimeUserGuideCompleted');
      const userTypeCompleted = await AsyncStorage.getItem(`firstTimeGuide_${userType}`);
      
      // Show guide if it hasn't been completed for this user type
      if (!generalCompleted || !userTypeCompleted) {
        setShouldShow(true);
      }
    } catch (error) {
      console.error('Error checking first-time status:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetGuide = async () => {
    try {
      await AsyncStorage.removeItem('firstTimeUserGuideCompleted');
      await AsyncStorage.removeItem(`firstTimeGuide_${userType}`);
      setShouldShow(true);
    } catch (error) {
      console.error('Error resetting guide:', error);
    }
  };

  return {
    shouldShow,
    setShouldShow,
    loading,
    resetGuide,
  };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    width: width * 0.95,
    maxHeight: height * 0.85,
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    padding: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBackground: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginRight: SPACING.md,
  },
  progressFill: {
    height: 6,
    backgroundColor: 'white',
    borderRadius: 3,
  },
  progressText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: MODERN_COLORS.gray900,
    marginBottom: SPACING.sm,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: MODERN_COLORS.primary,
    marginBottom: SPACING.md,
    lineHeight: 24,
  },
  description: {
    fontSize: 16,
    color: MODERN_COLORS.gray600,
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  tipsContainer: {
    marginBottom: SPACING.xl,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: MODERN_COLORS.gray900,
    marginBottom: SPACING.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tipBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.md,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    color: MODERN_COLORS.gray700,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.lg,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: SPACING.sm,
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: MODERN_COLORS.gray50,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    minWidth: 100,
    justifyContent: 'center',
  },
  previousButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: MODERN_COLORS.gray300,
  },
  nextButton: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: SPACING.xs,
  },
});

export default FirstTimeUserGuide;
