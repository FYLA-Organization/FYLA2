import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { modernTheme } from '../../theme/modernTheme';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
}

const onboardingData: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Find Your Perfect Service',
    subtitle: 'Connect Instantly',
    description: 'Discover trusted service providers in your area with our advanced matching algorithm.',
    icon: 'search-outline',
    gradient: modernTheme.colors.primary.gradient,
  },
  {
    id: '2',
    title: 'Book with Confidence',
    subtitle: 'Secure Payments',
    description: 'Book services with secure payments and comprehensive insurance protection.',
    icon: 'shield-checkmark-outline',
    gradient: modernTheme.colors.secondary.gradient,
  },
  {
    id: '3',
    title: 'Premium Experience',
    subtitle: 'Exclusive Features',
    description: 'Unlock premium features with our subscription plans for enhanced service management.',
    icon: 'diamond-outline',
    gradient: modernTheme.colors.accent.gradient,
  },
];

interface ModernOnboardingScreenProps {
  onComplete: () => void;
}

export const ModernOnboardingScreen: React.FC<ModernOnboardingScreenProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete();
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    
    const animatedStyle = useAnimatedStyle(() => {
      const scale = interpolate(scrollX.value, inputRange, [0.8, 1, 0.8]);
      const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3]);
      
      return {
        transform: [{ scale }],
        opacity,
      };
    });

    return (
      <View style={styles.slide}>
        <LinearGradient
          colors={item.gradient}
          style={styles.slideGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View style={[styles.slideContent, animatedStyle]}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.iconBackground}
              >
                <Ionicons name={item.icon} size={64} color="white" />
              </LinearGradient>
            </View>
            
            <Text style={styles.subtitle}>{item.subtitle}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {onboardingData.map((_, index) => {
          const animatedStyle = useAnimatedStyle(() => {
            const isActive = index === currentIndex;
            return {
              width: withSpring(isActive ? 24 : 8),
              opacity: withTiming(isActive ? 1 : 0.5),
            };
          });

          return (
            <Animated.View
              key={index}
              style={[styles.paginationDot, animatedStyle]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="transparent" translucent />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          scrollX.value = nativeEvent.contentOffset.x;
          const index = Math.round(nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />

      <View style={styles.footer}>
        {renderPagination()}
        
        <TouchableOpacity
          onPress={handleNext}
          style={styles.nextButton}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={modernTheme.colors.primary.gradient}
            style={styles.nextButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons 
              name={currentIndex === onboardingData.length - 1 ? 'checkmark' : 'arrow-forward'} 
              size={20} 
              color="white" 
              style={styles.nextButtonIcon}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: modernTheme.colors.background,
  },
  header: {
    paddingHorizontal: modernTheme.spacing.lg,
    paddingTop: modernTheme.spacing.md,
    alignItems: 'flex-end',
  },
  skipButton: {
    padding: modernTheme.spacing.sm,
  },
  skipText: {
    fontFamily: modernTheme.typography.fontFamily.medium,
    fontSize: modernTheme.typography.fontSize.md,
    color: modernTheme.colors.text.secondary,
  },
  slide: {
    width,
    flex: 1,
  },
  slideGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: modernTheme.spacing.xl,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    marginBottom: modernTheme.spacing.xl,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...modernTheme.shadows.large,
  },
  subtitle: {
    fontFamily: modernTheme.typography.fontFamily.medium,
    fontSize: modernTheme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: modernTheme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  title: {
    fontFamily: modernTheme.typography.fontFamily.bold,
    fontSize: modernTheme.typography.fontSize.xl,
    color: 'white',
    textAlign: 'center',
    marginBottom: modernTheme.spacing.lg,
    lineHeight: modernTheme.typography.fontSize.xl * 1.2,
  },
  description: {
    fontFamily: modernTheme.typography.fontFamily.regular,
    fontSize: modernTheme.typography.fontSize.md,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: modernTheme.typography.fontSize.md * 1.5,
  },
  footer: {
    paddingHorizontal: modernTheme.spacing.lg,
    paddingBottom: modernTheme.spacing.xl,
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    marginBottom: modernTheme.spacing.xl,
  },
  paginationDot: {
    height: 8,
    backgroundColor: modernTheme.colors.primary.main,
    marginHorizontal: 4,
    borderRadius: 4,
  },
  nextButton: {
    borderRadius: modernTheme.borderRadius.full,
    overflow: 'hidden',
    ...modernTheme.shadows.medium,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: modernTheme.spacing.md,
    paddingHorizontal: modernTheme.spacing.xl,
    minWidth: 160,
  },
  nextButtonText: {
    fontFamily: modernTheme.typography.fontFamily.semibold,
    fontSize: modernTheme.typography.fontSize.md,
    color: 'white',
  },
  nextButtonIcon: {
    marginLeft: modernTheme.spacing.sm,
  },
});
