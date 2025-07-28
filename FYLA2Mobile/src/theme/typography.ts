import { Platform } from 'react-native';
import { Colors } from './colors';

// Modern Typography System for FYLA2
// Emphasizes elegance, readability, and luxury

const fontFamily = {
  // Primary font stack - clean and modern
  regular: Platform.select({
    ios: 'SF Pro Text',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'SF Pro Text',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'SF Pro Text',
    android: 'Roboto-Bold',
    default: 'System',
  }),
  // Display font for headlines
  display: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto',
    default: 'System',
  }),
};

export const Typography = {
  // Display Typography (for headers, hero sections)
  display: {
    large: {
      fontFamily: fontFamily.display,
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
      color: Colors.text.primary,
    },
    medium: {
      fontFamily: fontFamily.display,
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '700' as const,
      letterSpacing: -0.3,
      color: Colors.text.primary,
    },
    small: {
      fontFamily: fontFamily.display,
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600' as const,
      letterSpacing: -0.2,
      color: Colors.text.primary,
    },
  },
  
  // Heading Typography
  heading: {
    h1: {
      fontFamily: fontFamily.bold,
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '600' as const,
      letterSpacing: -0.2,
      color: Colors.text.primary,
    },
    h2: {
      fontFamily: fontFamily.bold,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '600' as const,
      letterSpacing: -0.1,
      color: Colors.text.primary,
    },
    h3: {
      fontFamily: fontFamily.medium,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '500' as const,
      letterSpacing: 0,
      color: Colors.text.primary,
    },
    h4: {
      fontFamily: fontFamily.medium,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '500' as const,
      letterSpacing: 0,
      color: Colors.text.primary,
    },
  },
  
  // Body Typography
  body: {
    large: {
      fontFamily: fontFamily.regular,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
      letterSpacing: 0,
      color: Colors.text.primary,
    },
    medium: {
      fontFamily: fontFamily.regular,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
      letterSpacing: 0,
      color: Colors.text.primary,
    },
    small: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: '400' as const,
      letterSpacing: 0.1,
      color: Colors.text.secondary,
    },
  },
  
  // Label Typography (for forms, buttons, etc.)
  label: {
    large: {
      fontFamily: fontFamily.medium,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const,
      letterSpacing: 0.1,
      color: Colors.text.primary,
    },
    medium: {
      fontFamily: fontFamily.medium,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500' as const,
      letterSpacing: 0.2,
      color: Colors.text.secondary,
    },
    small: {
      fontFamily: fontFamily.medium,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '500' as const,
      letterSpacing: 0.3,
      color: Colors.text.tertiary,
    },
  },
  
  // Button Typography
  button: {
    large: {
      fontFamily: fontFamily.medium,
      fontSize: 16,
      lineHeight: 20,
      fontWeight: '600' as const,
      letterSpacing: 0.1,
      color: Colors.text.inverse,
    },
    medium: {
      fontFamily: fontFamily.medium,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '600' as const,
      letterSpacing: 0.2,
      color: Colors.text.inverse,
    },
    small: {
      fontFamily: fontFamily.medium,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500' as const,
      letterSpacing: 0.3,
      color: Colors.text.inverse,
    },
  },
  
  // Caption Typography
  caption: {
    large: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
      letterSpacing: 0.2,
      color: Colors.text.tertiary,
    },
    small: {
      fontFamily: fontFamily.regular,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '400' as const,
      letterSpacing: 0.3,
      color: Colors.text.tertiary,
    },
  },
  
  // Utility styles
  brand: {
    logo: {
      fontFamily: fontFamily.display,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
      color: Colors.primary.main,
    },
    tagline: {
      fontFamily: fontFamily.regular,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
      letterSpacing: 0.1,
      color: Colors.text.secondary,
    },
  },
  
  // Special styles
  price: {
    large: {
      fontFamily: fontFamily.bold,
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '700' as const,
      letterSpacing: -0.2,
      color: Colors.primary.main,
    },
    medium: {
      fontFamily: fontFamily.bold,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600' as const,
      letterSpacing: -0.1,
      color: Colors.primary.main,
    },
    small: {
      fontFamily: fontFamily.medium,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '500' as const,
      letterSpacing: 0,
      color: Colors.primary.main,
    },
  },
  
  // Status styles
  status: {
    success: {
      fontFamily: fontFamily.medium,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500' as const,
      letterSpacing: 0.2,
      color: Colors.success.main,
    },
    warning: {
      fontFamily: fontFamily.medium,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500' as const,
      letterSpacing: 0.2,
      color: Colors.warning.main,
    },
    error: {
      fontFamily: fontFamily.medium,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500' as const,
      letterSpacing: 0.2,
      color: Colors.error.main,
    },
  },
};

// Typography utility functions
export const getTypographyStyle = (category: keyof typeof Typography, variant: string) => {
  return Typography[category]?.[variant as keyof typeof Typography[typeof category]] || Typography.body.medium;
};

export const createTextStyle = (
  size: number,
  weight: string = '400',
  color: string = Colors.text.primary,
  lineHeight?: number
) => ({
  fontFamily: fontFamily.regular,
  fontSize: size,
  fontWeight: weight as any,
  color,
  lineHeight: lineHeight || size * 1.4,
});

export default Typography;
