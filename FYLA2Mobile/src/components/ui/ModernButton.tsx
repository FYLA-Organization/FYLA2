import React from 'react';
import {
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import LinearGradient from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius, shadows, gradients } from '../../theme/design-system';

export interface ModernButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  hapticFeedback?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  hapticFeedback = true,
  style,
  textStyle,
}) => {
  const handlePress = () => {
    if (hapticFeedback && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing[size === 'sm' ? 3 : size === 'md' ? 4 : size === 'lg' ? 6 : 8],
      height: size === 'sm' ? 32 : size === 'md' ? 44 : size === 'lg' ? 52 : 60,
      opacity: disabled ? 0.6 : 1,
      ...shadows.sm,
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: colors.primary[500],
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors.secondary[100],
          borderWidth: 1,
          borderColor: colors.secondary[200],
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.primary[500],
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          ...shadows.sm,
        };
      case 'gradient':
        return baseStyle;
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontSize: typography.fontSize[size === 'sm' ? 'sm' : size === 'md' ? 'base' : 'lg'],
      fontWeight: typography.fontWeight.semibold as any,
      textAlign: 'center',
    };

    switch (variant) {
      case 'primary':
      case 'gradient':
        return {
          ...baseTextStyle,
          color: colors.text.inverse,
        };
      case 'secondary':
        return {
          ...baseTextStyle,
          color: colors.text.primary,
        };
      case 'outline':
        return {
          ...baseTextStyle,
          color: colors.primary[500],
        };
      case 'ghost':
        return {
          ...baseTextStyle,
          color: colors.text.secondary,
        };
      default:
        return baseTextStyle;
    }
  };

  const renderContent = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
      {icon && iconPosition === 'left' && icon}
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'gradient' ? colors.text.inverse : colors.primary[500]}
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
      {icon && iconPosition === 'right' && icon}
    </View>
  );

  if (variant === 'gradient') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={style}
      >
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={getButtonStyle()}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[getButtonStyle(), style]}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};
