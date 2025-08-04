import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { modernTheme } from '../../theme/modernTheme';
import * as Haptics from 'expo-haptics';

interface ModernInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  disabled?: boolean;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  variant?: 'outline' | 'filled' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  hapticFeedback?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'username' | 'name' | 'tel' | 'off';
}

export const ModernInput: React.FC<ModernInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  disabled = false,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'outline',
  size = 'md',
  hapticFeedback = true,
  style,
  inputStyle,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [labelAnimation] = useState(new Animated.Value(value ? 1 : 0));

  const handleFocus = () => {
    setIsFocused(true);
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (label) {
      Animated.timing(labelAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    if (label && !value) {
      Animated.timing(labelAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleRightIconPress = () => {
    if (onRightIconPress) {
      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onRightIconPress();
    }
  };

  const getContainerStyles = (): ViewStyle => {
    const sizeStyles: Record<string, ViewStyle> = {
      sm: { minHeight: 40 },
      md: { minHeight: 48 },
      lg: { minHeight: 56 },
    };

    const variantStyles: Record<string, ViewStyle> = {
      outline: {
        borderWidth: 1.5,
        borderColor: error
          ? modernTheme.colors.error.main
          : isFocused
          ? modernTheme.colors.border.focus
          : modernTheme.colors.border.primary,
        borderRadius: modernTheme.borderRadius.md,
        backgroundColor: modernTheme.colors.surface.primary,
      },
      filled: {
        backgroundColor: isFocused
          ? modernTheme.colors.surface.primary
          : modernTheme.colors.surface.secondary,
        borderRadius: modernTheme.borderRadius.md,
        borderWidth: 1,
        borderColor: error
          ? modernTheme.colors.error.main
          : isFocused
          ? modernTheme.colors.border.focus
          : 'transparent',
      },
      underline: {
        borderBottomWidth: 2,
        borderBottomColor: error
          ? modernTheme.colors.error.main
          : isFocused
          ? modernTheme.colors.border.focus
          : modernTheme.colors.border.primary,
        backgroundColor: 'transparent',
      },
    };

    return {
      ...sizeStyles[size],
      ...variantStyles[variant],
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: variant === 'underline' ? 0 : modernTheme.spacing.md,
      opacity: disabled ? 0.6 : 1,
    };
  };

  const getInputStyles = (): TextStyle => {
    const sizeStyles: Record<string, TextStyle> = {
      sm: {
        fontSize: modernTheme.typography.fontSize.sm,
        lineHeight: modernTheme.typography.lineHeight.sm,
      },
      md: {
        fontSize: modernTheme.typography.fontSize.base,
        lineHeight: modernTheme.typography.lineHeight.base,
      },
      lg: {
        fontSize: modernTheme.typography.fontSize.lg,
        lineHeight: modernTheme.typography.lineHeight.lg,
      },
    };

    return {
      flex: 1,
      color: modernTheme.colors.text.primary,
      fontFamily: modernTheme.typography.fontFamily.regular,
      ...sizeStyles[size],
      textAlignVertical: multiline ? 'top' : 'center',
    };
  };

  const getLabelStyles = () => {
    if (!label) return {};

    const isFloating = variant !== 'underline';
    
    if (isFloating) {
      return {
        position: 'absolute' as const,
        left: leftIcon ? 40 : modernTheme.spacing.md,
        backgroundColor: modernTheme.colors.surface.primary,
        paddingHorizontal: modernTheme.spacing.xs,
        fontSize: labelAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [modernTheme.typography.fontSize.base, modernTheme.typography.fontSize.sm],
        }),
        top: labelAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [24, -8],
        }),
        color: error
          ? modernTheme.colors.error.main
          : isFocused
          ? modernTheme.colors.border.focus
          : modernTheme.colors.text.secondary,
        fontFamily: modernTheme.typography.fontFamily.medium,
      };
    }

    return {
      fontSize: modernTheme.typography.fontSize.sm,
      color: error
        ? modernTheme.colors.error.main
        : modernTheme.colors.text.secondary,
      fontFamily: modernTheme.typography.fontFamily.medium,
      marginBottom: modernTheme.spacing.xs,
    };
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label && variant === 'underline' && (
        <Text style={getLabelStyles() as any}>{label}</Text>
      )}
      
      <View style={getContainerStyles()}>
        {label && variant !== 'underline' && (
          <Animated.Text style={getLabelStyles() as any}>
            {label}
          </Animated.Text>
        )}
        
        {leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[getInputStyles(), inputStyle]}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={!label || (label && variant === 'underline') ? placeholder : undefined}
          placeholderTextColor={modernTheme.colors.text.tertiary}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
        />
        
        {rightIcon && (
          <TouchableOpacity
            onPress={handleRightIconPress}
            style={styles.rightIcon}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: modernTheme.spacing.md,
  },
  leftIcon: {
    marginRight: modernTheme.spacing.sm,
  },
  rightIcon: {
    marginLeft: modernTheme.spacing.sm,
    padding: modernTheme.spacing.xs,
  },
  errorText: {
    fontSize: modernTheme.typography.fontSize.sm,
    color: modernTheme.colors.error.main,
    fontFamily: modernTheme.typography.fontFamily.medium,
    marginTop: modernTheme.spacing.xs,
    marginLeft: modernTheme.spacing.md,
  },
});

export default ModernInput;
