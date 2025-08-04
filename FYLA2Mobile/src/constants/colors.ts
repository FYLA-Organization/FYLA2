// Instagram-style Color Palette - Consistent across all screens
export const COLORS = {
  // Base Colors
  background: '#FAFAFA',          // Light gray background
  surface: '#FFFFFF',             // White surfaces/cards
  text: '#262626',                // Dark gray text
  textSecondary: '#8E8E8E',       // Medium gray secondary text
  textLight: '#C7C7CC',           // Light gray for subtle text
  
  // Border Colors
  border: '#DBDBDB',              // Standard borders
  borderLight: '#EFEFEF',         // Light borders
  borderDark: '#C8C8C8',          // Slightly darker borders
  
  // Brand Colors
  primary: '#3797F0',             // Instagram blue
  primaryDark: '#2B7CE6',         // Darker blue for pressed states
  accent: '#FF3040',              // Vibrant red for important actions
  accentDark: '#E6283A',          // Darker red for pressed states
  
  // Status Colors
  success: '#28A745',             // Green for success states
  successLight: '#D4EDDA',        // Light green backgrounds
  warning: '#FFC107',             // Yellow for warnings
  warningLight: '#FFF3CD',        // Light yellow backgrounds
  error: '#DC3545',               // Red for errors
  errorLight: '#F8D7DA',          // Light red backgrounds
  info: '#17A2B8',                // Blue for info
  infoLight: '#D1ECF1',           // Light blue backgrounds
  
  // Verification & Badges
  verified: '#3797F0',            // Blue checkmark for verified accounts
  premium: '#FFD700',             // Gold for premium features
  
  // Instagram Specific
  instagram: '#E1306C',           // Instagram's signature pink
  instagramGradient: ['#E1306C', '#FD1D1D', '#FCAF45'], // Instagram gradient
  
  // Business/Provider Specific
  business: '#4A90E2',            // Professional blue for business features
  businessLight: '#E8F4FD',      // Light blue background
  revenue: '#28A745',             // Green for revenue/money
  analytics: '#6C63FF',           // Purple for analytics
  
  // Gradients
  gradient: ['#667eea', '#764ba2'] as const,           // Default gradient
  gradientSecondary: ['#f093fb', '#f5576c'] as const, // Secondary gradient
  gradientSuccess: ['#11998e', '#38ef7d'] as const,   // Success gradient
  gradientWarning: ['#f093fb', '#f5576c'] as const,   // Warning gradient
  gradientPrimary: ['#3797F0', '#2B7CE6'] as const,   // Primary blue gradient
  gradientAccent: ['#FF3040', '#E6283A'] as const,    // Accent red gradient
  
  // Shadows and Overlays
  shadow: 'rgba(0, 0, 0, 0.1)',              // Standard shadow
  shadowDark: 'rgba(0, 0, 0, 0.3)',          // Darker shadow
  overlay: 'rgba(0, 0, 0, 0.5)',             // Modal overlay
  overlayLight: 'rgba(0, 0, 0, 0.3)',        // Light overlay
  
  // Transparency variations
  primaryAlpha: 'rgba(55, 151, 240, 0.1)',   // 10% primary
  accentAlpha: 'rgba(255, 48, 64, 0.1)',     // 10% accent
  successAlpha: 'rgba(40, 167, 69, 0.1)',    // 10% success
  warningAlpha: 'rgba(255, 193, 7, 0.1)',    // 10% warning
  errorAlpha: 'rgba(220, 53, 69, 0.1)',      // 10% error
};

// Dark theme colors (for future implementation)
export const DARK_COLORS = {
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#38383A',
  borderLight: '#2C2C2E',
  primary: '#0A84FF',
  accent: '#FF3B30',
  // ... additional dark theme colors
};

// Typography constants
export const TYPOGRAPHY = {
  // Font Sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  
  // Font Weights
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  
  // Line Heights
  tight: 1.2,
  normalLine: 1.4,
  relaxed: 1.6,
  
  // Predefined Text Styles
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 1.2,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 1.3,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 1.3,
  },
  h5: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 1.4,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 1.5,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 1.4,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 1.3,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 1.2,
  },
  
  // Line Height values for custom use
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

// Spacing constants
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border Radius constants
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// Common styling utilities
export const COMMON_STYLES = {
  shadow: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  shadowLarge: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.base,
    backgroundColor: COLORS.surface,
  },
};
