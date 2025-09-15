import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MODERN_COLORS, SPACING } from '../constants/modernDesign';
import FeatureGatingService from '../services/featureGatingService';

const { width, height } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  action?: string;
  screenName?: string;
}

interface FeatureOnboardingProps {
  visible: boolean;
  onClose: () => void;
  navigation?: any;
}

const FeatureOnboardingTour: React.FC<FeatureOnboardingProps> = ({
  visible,
  onClose,
  navigation,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [subscription, setSubscription] = useState<any>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);

  useEffect(() => {
    if (visible) {
      loadSubscriptionAndSteps();
    }
  }, [visible]);

  const loadSubscriptionAndSteps = async () => {
    try {
      const sub = await FeatureGatingService.getSubscriptionInfo();
      setSubscription(sub);
      
      const tierBasedSteps = generateStepsForTier(sub.tier);
      setSteps(tierBasedSteps);
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const generateStepsForTier = (tier: number): OnboardingStep[] => {
    const baseSteps: OnboardingStep[] = [
      {
        id: 'welcome',
        title: 'Welcome to Advanced Features!',
        description: 'Discover powerful tools to grow your business with our subscription features.',
        icon: 'rocket',
        color: MODERN_COLORS.primary,
      },
    ];

    if (tier >= 1) {
      baseSteps.push(
        {
          id: 'analytics',
          title: 'Advanced Analytics',
          description: 'Get detailed insights into your business performance, revenue trends, and client behavior.',
          icon: 'analytics',
          color: MODERN_COLORS.info,
          action: 'Try Analytics',
          screenName: 'Analytics',
        },
        {
          id: 'support',
          title: 'Priority Support',
          description: 'Get 24-hour response time and dedicated assistance from our support team.',
          icon: 'headset',
          color: MODERN_COLORS.success,
          action: 'Contact Support',
          screenName: 'PrioritySupport',
        }
      );
    }

    if (tier >= 2) {
      baseSteps.push(
        {
          id: 'branding',
          title: 'Custom Branding',
          description: 'Customize your brand identity with logos, colors, and business cards.',
          icon: 'brush',
          color: '#8B5CF6',
          action: 'Customize Brand',
          screenName: 'CustomBranding',
        },
        {
          id: 'marketing',
          title: 'Automated Marketing',
          description: 'Create email campaigns, schedule social media posts, and segment customers.',
          icon: 'megaphone',
          color: MODERN_COLORS.warning,
          action: 'Start Marketing',
          screenName: 'AutomatedMarketing',
        },
        {
          id: 'locations',
          title: 'Multi-Location Management',
          description: 'Manage multiple business locations with centralized scheduling and analytics.',
          icon: 'business',
          color: MODERN_COLORS.info,
          action: 'Add Location',
          screenName: 'MultiLocation',
        },
        {
          id: 'crm',
          title: 'Revenue Tracking & CRM',
          description: 'Advanced customer relationship management and detailed revenue analytics.',
          icon: 'trending-up',
          color: MODERN_COLORS.error,
          action: 'View CRM',
          screenName: 'RevenueCRM',
        }
      );
    }

    if (tier < 2) {
      baseSteps.push({
        id: 'upgrade',
        title: `Unlock ${tier < 1 ? 'Professional' : 'Business'} Features`,
        description: `Upgrade to ${tier < 1 ? 'Professional' : 'Business'} plan to access advanced features and grow your business faster.`,
        icon: 'diamond',
        color: MODERN_COLORS.accent,
        action: 'Upgrade Now',
        screenName: 'SubscriptionPlans',
      });
    }

    return baseSteps;
  };

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
      await AsyncStorage.setItem('featureOnboardingCompleted', 'true');
      onClose();
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
      onClose();
    }
  };

  const handleActionPress = () => {
    const step = steps[currentStep];
    if (step.screenName && navigation) {
      handleComplete();
      setTimeout(() => {
        navigation.navigate(step.screenName);
      }, 300);
    }
  };

  if (!visible || steps.length === 0) return null;

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
            <LinearGradient
              colors={[currentStepData.color, MODERN_COLORS.primaryDark]}
              style={styles.header}
            >
              <View style={styles.headerContent}>
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name={currentStepData.icon as any} 
                    size={32} 
                    color="white" 
                  />
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleSkip}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <ScrollView 
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.title}>{currentStepData.title}</Text>
              <Text style={styles.description}>{currentStepData.description}</Text>

              {currentStepData.action && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: currentStepData.color }]}
                  onPress={handleActionPress}
                >
                  <Text style={styles.actionButtonText}>{currentStepData.action}</Text>
                  <Ionicons name="arrow-forward" size={16} color="white" />
                </TouchableOpacity>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <View style={styles.pagination}>
                {steps.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      {
                        backgroundColor: index === currentStep 
                          ? currentStepData.color 
                          : 'rgba(255, 255, 255, 0.3)'
                      }
                    ]}
                  />
                ))}
              </View>

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
                    {isLastStep ? 'Get Started' : 'Next'}
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

// Hook to check if onboarding should be shown
export const useFeatureOnboarding = () => {
  const [shouldShow, setShouldShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem('featureOnboardingCompleted');
      const lastShown = await AsyncStorage.getItem('featureOnboardingLastShown');
      const today = new Date().toDateString();
      
      // Show onboarding if never completed or if it's been more than 7 days since last shown
      if (!completed || (lastShown && lastShown !== today)) {
        setShouldShow(true);
        await AsyncStorage.setItem('featureOnboardingLastShown', today);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('featureOnboardingCompleted');
      await AsyncStorage.removeItem('featureOnboardingLastShown');
      setShouldShow(true);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  return {
    shouldShow,
    setShouldShow,
    loading,
    resetOnboarding,
  };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
  },
  header: {
    padding: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: MODERN_COLORS.gray900,
    marginBottom: SPACING.md,
    lineHeight: 30,
  },
  description: {
    fontSize: 16,
    color: MODERN_COLORS.gray600,
    lineHeight: 24,
    marginBottom: SPACING.xl,
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
    width: 8,
    height: 8,
    borderRadius: 4,
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
    // backgroundColor set dynamically
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: SPACING.xs,
  },
});

export default FeatureOnboardingTour;
