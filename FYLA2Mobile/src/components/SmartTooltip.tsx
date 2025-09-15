import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MODERN_COLORS, SPACING, BORDER_RADIUS } from '../constants/modernDesign';

const { width } = Dimensions.get('window');

interface SmartTooltipProps {
  id: string;
  title: string;
  message: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  targetRef?: React.RefObject<any>;
  delay?: number;
  maxShowCount?: number;
  showCondition?: () => boolean;
  onAction?: () => void;
  actionText?: string;
  icon?: string;
  color?: string;
}

const SmartTooltip: React.FC<SmartTooltipProps> = ({
  id,
  title,
  message,
  position = 'top',
  delay = 2000,
  maxShowCount = 3,
  showCondition,
  onAction,
  actionText,
  icon = 'bulb',
  color = MODERN_COLORS.primary,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    checkAndShowTooltip();
  }, []);

  const checkAndShowTooltip = async () => {
    try {
      const showCountKey = `tooltip_${id}_count`;
      const dismissedKey = `tooltip_${id}_dismissed`;
      
      const showCount = await AsyncStorage.getItem(showCountKey);
      const isDismissed = await AsyncStorage.getItem(dismissedKey);
      
      const currentCount = showCount ? parseInt(showCount) : 0;
      
      // Don't show if permanently dismissed or max count reached
      if (isDismissed === 'true' || currentCount >= maxShowCount) {
        return;
      }
      
      // Check custom condition if provided
      if (showCondition && !showCondition()) {
        return;
      }
      
      // Show tooltip after delay
      setTimeout(() => {
        showTooltip();
        // Increment show count
        AsyncStorage.setItem(showCountKey, (currentCount + 1).toString());
      }, delay);
      
    } catch (error) {
      console.error('Error checking tooltip status:', error);
    }
  };

  const showTooltip = () => {
    setIsVisible(true);
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const hideTooltip = (permanently = false) => {
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      if (permanently) {
        AsyncStorage.setItem(`tooltip_${id}_dismissed`, 'true');
      }
    });
  };

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    hideTooltip(true);
  };

  if (!isVisible) return null;

  const getTooltipStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      zIndex: 1000,
    };

    switch (position) {
      case 'top':
        return { ...baseStyle, bottom: 0, marginBottom: 10 };
      case 'bottom':
        return { ...baseStyle, top: 0, marginTop: 10 };
      case 'left':
        return { ...baseStyle, right: 0, marginRight: 10 };
      case 'right':
        return { ...baseStyle, left: 0, marginLeft: 10 };
      default:
        return { ...baseStyle, top: 0, marginTop: 10 };
    }
  };

  const getArrowStyle = () => {
    const arrowSize = 8;
    const baseArrowStyle = {
      position: 'absolute' as const,
      width: 0,
      height: 0,
      borderStyle: 'solid' as const,
    };

    switch (position) {
      case 'top':
        return {
          ...baseArrowStyle,
          top: -arrowSize,
          left: '50%' as const,
          marginLeft: -arrowSize,
          borderLeftWidth: arrowSize,
          borderRightWidth: arrowSize,
          borderTopWidth: arrowSize,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
        };
      case 'bottom':
        return {
          ...baseArrowStyle,
          bottom: -arrowSize,
          left: '50%' as const,
          marginLeft: -arrowSize,
          borderLeftWidth: arrowSize,
          borderRightWidth: arrowSize,
          borderBottomWidth: arrowSize,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        };
      case 'left':
        return {
          ...baseArrowStyle,
          left: -arrowSize,
          top: '50%' as const,
          marginTop: -arrowSize,
          borderTopWidth: arrowSize,
          borderBottomWidth: arrowSize,
          borderLeftWidth: arrowSize,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: color,
        };
      case 'right':
        return {
          ...baseArrowStyle,
          right: -arrowSize,
          top: '50%' as const,
          marginTop: -arrowSize,
          borderTopWidth: arrowSize,
          borderBottomWidth: arrowSize,
          borderRightWidth: arrowSize,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderRightColor: color,
        };
      default:
        return baseArrowStyle;
    }
  };

  return (
    <Animated.View
      style={[
        styles.tooltipContainer,
        getTooltipStyle(),
        {
          backgroundColor: color,
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
      <View style={getArrowStyle()} />
      
      <View style={styles.tooltipHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={20} color="white" />
        </View>
        <Text style={styles.tooltipTitle}>{title}</Text>
        <TouchableOpacity
          onPress={() => hideTooltip(true)}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={16} color="rgba(255, 255, 255, 0.8)" />
        </TouchableOpacity>
      </View>

      <Text style={styles.tooltipMessage}>{message}</Text>

      <View style={styles.tooltipActions}>
        {actionText && onAction && (
          <TouchableOpacity onPress={handleAction} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>{actionText}</Text>
            <Ionicons name="arrow-forward" size={14} color="white" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          onPress={() => hideTooltip(false)}
          style={styles.dismissButton}
        >
          <Text style={styles.dismissButtonText}>Got it</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Tooltip Manager Component
interface TooltipManagerProps {
  children: React.ReactNode;
  tooltips: SmartTooltipProps[];
}

export const TooltipManager: React.FC<TooltipManagerProps> = ({ children, tooltips }) => {
  return (
    <View style={{ flex: 1 }}>
      {children}
      {tooltips.map((tooltip) => (
        <SmartTooltip key={tooltip.id} {...tooltip} />
      ))}
    </View>
  );
};

// Predefined helpful tooltips for common scenarios
export const HelpfulTooltips = {
  firstSearch: {
    id: 'first_search',
    title: 'Try searching!',
    message: 'Type what you\'re looking for - like "haircut near me" or "nail salon"',
    position: 'bottom' as const,
    icon: 'search',
    actionText: 'Show me',
    delay: 3000,
    maxShowCount: 2,
  },

  emptyBookings: {
    id: 'empty_bookings',
    title: 'Book your first service',
    message: 'Browse services and book your first appointment to get started!',
    position: 'top' as const,
    icon: 'calendar',
    actionText: 'Find services',
    delay: 2000,
    maxShowCount: 3,
  },

  loyaltyProgram: {
    id: 'loyalty_program',
    title: 'Earn rewards!',
    message: 'You\'ll earn points with every booking that can be redeemed for discounts',
    position: 'bottom' as const,
    icon: 'gift',
    color: '#FFD700',
    delay: 1000,
    maxShowCount: 2,
  },

  profileCompletion: {
    id: 'profile_completion',
    title: 'Complete your profile',
    message: 'Add a photo and preferences to get personalized recommendations',
    position: 'top' as const,
    icon: 'person-circle',
    actionText: 'Complete now',
    color: '#8B5CF6',
    delay: 1500,
    maxShowCount: 3,
  },

  filterHelp: {
    id: 'filter_help',
    title: 'Use filters to find exactly what you need',
    message: 'Filter by price, distance, ratings, and availability to get perfect results',
    position: 'bottom' as const,
    icon: 'options',
    actionText: 'Try filters',
    delay: 5000,
    maxShowCount: 2,
  },

  socialFeed: {
    id: 'social_feed',
    title: 'Follow your favorite providers',
    message: 'See their latest work and get inspired by the beauty community',
    position: 'top' as const,
    icon: 'heart',
    color: '#FF6B6B',
    actionText: 'Explore',
    delay: 2000,
    maxShowCount: 2,
  },

  // Provider tooltips
  providerSchedule: {
    id: 'provider_schedule',
    title: 'Set your availability',
    message: 'Update your schedule so clients can book when you\'re available',
    position: 'bottom' as const,
    icon: 'time',
    actionText: 'Set schedule',
    color: '#4ECDC4',
    delay: 1000,
    maxShowCount: 3,
  },

  providerServices: {
    id: 'provider_services',
    title: 'Add your services',
    message: 'List all your services with prices to start getting bookings',
    position: 'top' as const,
    icon: 'cut',
    actionText: 'Add services',
    delay: 2000,
    maxShowCount: 3,
  },

  providerPortfolio: {
    id: 'provider_portfolio',
    title: 'Showcase your work',
    message: 'Upload photos of your best work to attract more clients',
    position: 'bottom' as const,
    icon: 'camera',
    actionText: 'Add photos',
    color: '#A8E6CF',
    delay: 1500,
    maxShowCount: 2,
  },
};

// Hook to conditionally show tooltips
export const useSmartTooltips = (screenName: string, userType: 'client' | 'provider') => {
  const [activeTooltips, setActiveTooltips] = useState<SmartTooltipProps[]>([]);

  useEffect(() => {
    const tooltipsForScreen = getTooltipsForScreen(screenName, userType);
    setActiveTooltips(tooltipsForScreen);
  }, [screenName, userType]);

  const getTooltipsForScreen = (screen: string, type: 'client' | 'provider'): SmartTooltipProps[] => {
    const tooltips: SmartTooltipProps[] = [];

    if (type === 'client') {
      switch (screen) {
        case 'Search':
          tooltips.push(HelpfulTooltips.firstSearch, HelpfulTooltips.filterHelp);
          break;
        case 'Bookings':
          tooltips.push(HelpfulTooltips.emptyBookings);
          break;
        case 'Home':
          tooltips.push(HelpfulTooltips.socialFeed, HelpfulTooltips.loyaltyProgram);
          break;
        case 'Profile':
          tooltips.push(HelpfulTooltips.profileCompletion);
          break;
      }
    } else if (type === 'provider') {
      switch (screen) {
        case 'ProviderDashboard':
          tooltips.push(HelpfulTooltips.providerSchedule, HelpfulTooltips.providerServices);
          break;
        case 'EnhancedServiceManagement':
          tooltips.push(HelpfulTooltips.providerServices);
          break;
        case 'ProviderAvailability':
          tooltips.push(HelpfulTooltips.providerSchedule);
          break;
        case 'EnhancedProfile':
          tooltips.push(HelpfulTooltips.providerPortfolio);
          break;
      }
    }

    return tooltips;
  };

  return activeTooltips;
};

const styles = StyleSheet.create({
  tooltipContainer: {
    maxWidth: width * 0.8,
    minWidth: 200,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  tooltipTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  tooltipActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.sm,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginRight: SPACING.xs,
  },
  dismissButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  dismissButtonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
});

export default SmartTooltip;
