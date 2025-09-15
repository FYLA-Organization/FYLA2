import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { MODERN_COLORS, SPACING, TYPOGRAPHY } from '../constants/modernDesign';

const { width, height } = Dimensions.get('window');

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string;
  position: 'top' | 'bottom' | 'center';
  highlightArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface InteractiveTutorialProps {
  visible: boolean;
  onClose: () => void;
  steps: TutorialStep[];
  tutorialType: string;
}

const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  visible,
  onClose,
  steps,
  tutorialType,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  if (!visible || steps.length === 0) return null;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const getTooltipPosition = () => {
    const highlightArea = currentStepData.highlightArea;
    if (!highlightArea) return { top: height / 2 - 100 };

    switch (currentStepData.position) {
      case 'top':
        return { top: highlightArea.y - 120 };
      case 'bottom':
        return { top: highlightArea.y + highlightArea.height + 20 };
      default:
        return { top: height / 2 - 100 };
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <BlurView intensity={15} style={styles.blurContainer}>
          {/* Highlight Area */}
          {currentStepData.highlightArea && (
            <View
              style={[
                styles.highlightArea,
                {
                  left: currentStepData.highlightArea.x,
                  top: currentStepData.highlightArea.y,
                  width: currentStepData.highlightArea.width,
                  height: currentStepData.highlightArea.height,
                }
              ]}
            />
          )}

          {/* Tutorial Tooltip */}
          <Animated.View
            style={[
              styles.tooltip,
              getTooltipPosition(),
              {
                opacity: animatedValue,
                transform: [
                  {
                    scale: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.tooltipHeader}>
              <View style={styles.stepIndicator}>
                <Text style={styles.stepText}>
                  {currentStep + 1} of {steps.length}
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={MODERN_COLORS.gray600} />
              </TouchableOpacity>
            </View>

            <Text style={styles.tooltipTitle}>{currentStepData.title}</Text>
            <Text style={styles.tooltipDescription}>{currentStepData.description}</Text>

            <View style={styles.tooltipFooter}>
              <View style={styles.paginationDots}>
                {steps.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      {
                        backgroundColor: index === currentStep
                          ? MODERN_COLORS.primary
                          : MODERN_COLORS.gray300,
                      },
                    ]}
                  />
                ))}
              </View>

              <View style={styles.navigationButtons}>
                {!isFirstStep && (
                  <TouchableOpacity
                    style={styles.previousButton}
                    onPress={handlePrevious}
                  >
                    <Ionicons name="arrow-back" size={16} color={MODERN_COLORS.gray600} />
                    <Text style={styles.previousButtonText}>Back</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.nextButton,
                    isFirstStep && styles.nextButtonFullWidth,
                  ]}
                  onPress={handleNext}
                >
                  <Text style={styles.nextButtonText}>
                    {isLastStep ? 'Got it!' : 'Next'}
                  </Text>
                  {!isLastStep && (
                    <Ionicons name="arrow-forward" size={16} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </BlurView>
      </View>
    </Modal>
  );
};

// Predefined tutorial configurations
export const TutorialConfigs = {
  searchScreen: [
    {
      id: 'search-bar',
      title: 'Search for Services',
      description: 'Type what you\'re looking for - hair, nails, massage, or any beauty service!',
      position: 'bottom' as const,
      highlightArea: { x: 20, y: 160, width: width - 120, height: 80 },
    },
    {
      id: 'filters',
      title: 'Filter Your Results',
      description: 'Use filters to find exactly what you need by location, price, and ratings.',
      position: 'bottom' as const,
      highlightArea: { x: width - 80, y: 160, width: 60, height: 80 },
    },
    {
      id: 'categories',
      title: 'Browse by Category',
      description: 'Quick access to popular service categories. Tap any category to see providers.',
      position: 'bottom' as const,
      highlightArea: { x: 20, y: 280, width: width - 40, height: 120 },
    },
  ],
  
  providerProfile: [
    {
      id: 'services',
      title: 'View Available Services',
      description: 'See all services offered by this provider with prices and durations.',
      position: 'top' as const,
      highlightArea: { x: 20, y: 300, width: width - 40, height: 200 },
    },
    {
      id: 'book-button',
      title: 'Book Instantly',
      description: 'Tap here to see real-time availability and book your appointment.',
      position: 'top' as const,
      highlightArea: { x: 20, y: height - 150, width: width - 40, height: 60 },
    },
  ],

  bookingFlow: [
    {
      id: 'service-selection',
      title: 'Choose Your Service',
      description: 'Select the service you want. You can add multiple services to your booking.',
      position: 'bottom' as const,
      highlightArea: { x: 20, y: 200, width: width - 40, height: 200 },
    },
    {
      id: 'time-selection',
      title: 'Pick Your Time',
      description: 'Choose from available time slots. Green slots are available, gray are booked.',
      position: 'top' as const,
      highlightArea: { x: 20, y: 300, width: width - 40, height: 200 },
    },
  ],

  loyaltyRewards: [
    {
      id: 'points-display',
      title: 'Your Loyalty Points',
      description: 'See how many points you\'ve earned with this provider. Points = savings!',
      position: 'bottom' as const,
      highlightArea: { x: 20, y: 100, width: width - 40, height: 80 },
    },
    {
      id: 'rewards-available',
      title: 'Available Rewards',
      description: 'Redeem your points for discounts and special perks. The more you visit, the more you save!',
      position: 'top' as const,
      highlightArea: { x: 20, y: 200, width: width - 40, height: 150 },
    },
  ],
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  blurContainer: {
    flex: 1,
    position: 'relative',
  },
  highlightArea: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: MODERN_COLORS.primary,
    borderRadius: 12,
    shadowColor: MODERN_COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  tooltip: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  stepIndicator: {
    backgroundColor: MODERN_COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
  },
  stepText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: MODERN_COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: MODERN_COLORS.gray900,
    marginBottom: SPACING.sm,
    lineHeight: 26,
  },
  tooltipDescription: {
    fontSize: 16,
    color: MODERN_COLORS.gray600,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  tooltipFooter: {
    borderTopWidth: 1,
    borderTopColor: MODERN_COLORS.gray200,
    paddingTop: SPACING.md,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.md,
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
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    backgroundColor: MODERN_COLORS.gray100,
  },
  previousButtonText: {
    fontSize: 14,
    color: MODERN_COLORS.gray600,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    backgroundColor: MODERN_COLORS.primary,
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'center',
  },
  nextButtonFullWidth: {
    marginLeft: 0,
  },
  nextButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginRight: SPACING.xs,
  },
});

export default InteractiveTutorial;
