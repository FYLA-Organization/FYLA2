import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MODERN_COLORS, SPACING, SHADOWS } from '../constants/modernDesign';

const { width, height } = Dimensions.get('window');

interface FloatingHelpButtonProps {
  onPress: () => void;
  visible?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const FloatingHelpButton: React.FC<FloatingHelpButtonProps> = ({
  onPress,
  visible = true,
  position = 'bottom-right',
}) => {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePress = () => {
    // Scale animation for feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  const getPositionStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      zIndex: 1000,
    };

    switch (position) {
      case 'bottom-right':
        return { ...baseStyle, bottom: 100, right: 20 };
      case 'bottom-left':
        return { ...baseStyle, bottom: 100, left: 20 };
      case 'top-right':
        return { ...baseStyle, top: 100, right: 20 };
      case 'top-left':
        return { ...baseStyle, top: 100, left: 20 };
      default:
        return { ...baseStyle, bottom: 100, right: 20 };
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.floatingButton,
        getPositionStyle(),
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <View style={styles.iconContainer}>
          <Ionicons name="help" size={24} color="white" />
        </View>
        <View style={styles.pulse} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Enhanced floating help with pulsing animation
export const PulsingHelpButton: React.FC<FloatingHelpButtonProps> = (props) => {
  const [pulseAnim] = useState(new Animated.Value(1));

  React.useEffect(() => {
    // Create pulsing animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, []);

  return (
    <View style={[styles.floatingButton, props.visible ? {} : { display: 'none' }]}>
      <Animated.View
        style={[
          styles.pulseContainer,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <FloatingHelpButton {...props} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    zIndex: 1000,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: MODERN_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    ...SHADOWS.lg,
  },
  iconContainer: {
    zIndex: 2,
  },
  pulse: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: MODERN_COLORS.primary,
    opacity: 0.3,
  },
  pulseContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FloatingHelpButton;
