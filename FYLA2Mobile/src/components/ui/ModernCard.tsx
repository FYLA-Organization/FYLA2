import React from 'react';
import {
  View,
  ViewStyle,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { modernTheme } from '../../theme/modernTheme';
import * as Haptics from 'expo-haptics';

interface ModernCardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'glass' | 'gradient' | 'flat';
  onPress?: () => void;
  style?: ViewStyle;
  glassMorphism?: boolean;
  hapticFeedback?: boolean;
  disabled?: boolean;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  variant = 'elevated',
  onPress,
  style,
  glassMorphism = false,
  hapticFeedback = true,
  disabled = false,
}) => {
  const handlePress = () => {
    if (onPress && !disabled) {
      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress();
    }
  };

  const getCardStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      borderRadius: modernTheme.borderRadius.lg,
      padding: modernTheme.spacing.lg,
      backgroundColor: modernTheme.colors.surface.primary,
      opacity: disabled ? 0.6 : 1,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyles,
          ...modernTheme.shadows.lg,
        };
      
      case 'glass':
        return {
          ...baseStyles,
          backgroundColor: modernTheme.glassmorphism.background,
          borderWidth: 1,
          borderColor: modernTheme.glassmorphism.borderColor,
        };
      
      case 'gradient':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
        };
      
      case 'flat':
        return {
          ...baseStyles,
          backgroundColor: modernTheme.colors.surface.secondary,
          borderWidth: 1,
          borderColor: modernTheme.colors.border.primary,
        };
      
      default:
        return baseStyles;
    }
  };

  const renderCard = () => {
    if (variant === 'gradient') {
      return (
        <LinearGradient
          colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[getCardStyles(), style]}
        >
          {children}
        </LinearGradient>
      );
    }

    if (glassMorphism || variant === 'glass') {
      return (
        <View
          style={[
            getCardStyles(),
            {
              backgroundColor: modernTheme.glassmorphism.background,
              borderWidth: 1,
              borderColor: modernTheme.glassmorphism.borderColor,
            },
            style,
          ]}
        >
          {children}
        </View>
      );
    }

    return (
      <View style={[getCardStyles(), style]}>
        {children}
      </View>
    );
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.95}
        style={styles.touchable}
      >
        {renderCard()}
      </TouchableOpacity>
    );
  }

  return renderCard();
};

const styles = StyleSheet.create({
  touchable: {
    borderRadius: modernTheme.borderRadius.lg,
  },
});

export default ModernCard;
