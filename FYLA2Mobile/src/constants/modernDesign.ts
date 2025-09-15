// Modern Design System for FYLA2
export const MODERN_COLORS = {
  // Primary brand colors
  primary: '#6366F1', // Indigo-500
  primaryLight: '#8B5CF6', // Violet-500
  primaryDark: '#4F46E5', // Indigo-600
  
  // Accent colors
  accent: '#F59E0B', // Amber-500
  accentLight: '#FCD34D', // Amber-300
  
  // Neutral colors (Modern gray scale)
  black: '#0F172A', // Slate-900
  white: '#FFFFFF',
  gray900: '#0F172A', // Slate-900
  gray800: '#1E293B', // Slate-800
  gray700: '#334155', // Slate-700
  gray600: '#475569', // Slate-600
  gray500: '#64748B', // Slate-500
  gray400: '#94A3B8', // Slate-400
  gray300: '#CBD5E1', // Slate-300
  gray200: '#E2E8F0', // Slate-200
  gray100: '#F1F5F9', // Slate-100
  gray50: '#F8FAFC',  // Slate-50
  
  // Semantic colors
  success: '#10B981', // Emerald-500
  warning: '#F59E0B', // Amber-500
  error: '#EF4444',   // Red-500
  info: '#3B82F6',    // Blue-500
  
  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F8FAFC',
  backgroundTertiary: '#F1F5F9',
  
  // Surface colors
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  
  // Border colors
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderDark: '#CBD5E1',
  
  // Text colors
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  
  // Overlay colors
  overlay: 'rgba(15, 23, 42, 0.6)',
  overlayLight: 'rgba(15, 23, 42, 0.3)',
  
  // Social colors
  like: '#EF4444',
  bookmark: '#F59E0B',
  share: '#6366F1',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  // Tab bar safe area
  tabBarHeight: 85,
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const TYPOGRAPHY = {
  // Font sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  
  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Font weights (React Native compatible)
  weight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};

export const SHADOWS = {
  sm: {
    shadowColor: MODERN_COLORS.gray900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: MODERN_COLORS.gray900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: MODERN_COLORS.gray900,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  xl: {
    shadowColor: MODERN_COLORS.gray900,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 12,
  },
};

export const LAYOUT = {
  headerHeight: 60,
  tabBarHeight: 80,
  cardPadding: SPACING.md,
  screenPadding: SPACING.md,
  sectionSpacing: SPACING.lg,
};
