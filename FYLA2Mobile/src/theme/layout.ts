import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Modern Spacing & Layout System for FYLA2
// Based on 8pt grid system for consistency and luxury feel

export const Spacing = {
  // Base spacing unit (8pt grid)
  unit: 8,
  
  // Spacing scale
  xs: 4,    // 0.5 units
  sm: 8,    // 1 unit
  md: 16,   // 2 units
  lg: 24,   // 3 units
  xl: 32,   // 4 units
  xxl: 40,  // 5 units
  xxxl: 48, // 6 units
  
  // Component-specific spacing
  component: {
    cardPadding: 20,
    cardMargin: 16,
    sectionPadding: 24,
    screenPadding: 20,
    buttonPadding: {
      horizontal: 24,
      vertical: 16,
    },
    inputPadding: {
      horizontal: 16,
      vertical: 14,
    },
  },
  
  // Layout spacing
  layout: {
    headerHeight: 60,
    tabBarHeight: 80,
    bottomSafeArea: 34, // iPhone safe area
    statusBarHeight: 44,
  },
};

export const BorderRadius = {
  // Border radius scale for modern, soft feel
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999, // For circular elements
  
  // Component-specific radius
  button: 12,
  card: 16,
  input: 12,
  modal: 20,
  avatar: 999,
  chip: 20,
};

export const Shadows = {
  // Elevation system for cards and floating elements
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  
  // Colored shadows for premium feel
  colored: {
    shadowColor: '#5A4FCF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  
  // Button shadows
  button: {
    shadowColor: '#5A4FCF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Card shadows
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
};

export const Layout = {
  // Screen dimensions
  screen: {
    width: screenWidth,
    height: screenHeight,
  },
  
  // Common layout values
  maxWidth: {
    content: 400,
    modal: 350,
    card: screenWidth - (Spacing.md * 2),
  },
  
  // Component sizes
  button: {
    height: {
      small: 36,
      medium: 44,
      large: 52,
    },
    minWidth: {
      small: 80,
      medium: 100,
      large: 120,
    },
  },
  
  input: {
    height: 48,
    minHeight: 44,
  },
  
  avatar: {
    small: 32,
    medium: 48,
    large: 64,
    xlarge: 80,
  },
  
  icon: {
    small: 16,
    medium: 20,
    large: 24,
    xlarge: 32,
  },
  
  // Grid system
  grid: {
    columns: 12,
    gutter: Spacing.md,
  },
  
  // Breakpoints (for responsive design)
  breakpoints: {
    small: 320,
    medium: 768,
    large: 1024,
  },
};

export const Animation = {
  // Animation durations
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  
  // Easing curves
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'spring',
  },
  
  // Common animation configs
  spring: {
    tension: 300,
    friction: 20,
  },
  
  timing: {
    duration: 300,
    useNativeDriver: true,
  },
};

// Utility functions
export const createSpacing = (multiplier: number): number => {
  return Spacing.unit * multiplier;
};

export const getResponsiveSpacing = (small: number, large: number): number => {
  return screenWidth > Layout.breakpoints.medium ? large : small;
};

export const createShadow = (elevation: number, color: string = '#000000'): object => {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: Math.floor(elevation / 2) },
    shadowOpacity: 0.1 + (elevation * 0.02),
    shadowRadius: elevation,
    elevation,
  };
};

// Export layout utility object
export const LayoutUtils = {
  // Flexbox utilities
  flex: {
    center: {
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    centerHorizontal: {
      alignItems: 'center' as const,
    },
    centerVertical: {
      justifyContent: 'center' as const,
    },
    spaceBetween: {
      justifyContent: 'space-between' as const,
    },
    spaceAround: {
      justifyContent: 'space-around' as const,
    },
    row: {
      flexDirection: 'row' as const,
    },
    column: {
      flexDirection: 'column' as const,
    },
  },
  
  // Position utilities
  position: {
    absolute: {
      position: 'absolute' as const,
    },
    relative: {
      position: 'relative' as const,
    },
    absoluteFill: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
  },
  
  // Size utilities
  size: {
    full: {
      width: '100%',
      height: '100%',
    },
    fullWidth: {
      width: '100%',
    },
    fullHeight: {
      height: '100%',
    },
  },
};

export default {
  Spacing,
  BorderRadius,
  Shadows,
  Layout,
  Animation,
  LayoutUtils,
};
