// FYLA2 Modern Luxe Color Palette
// Based on luxury, clean, unisex, and modern design principles

console.log('Colors.ts loading...');

export const Colors = {
  // Primary Brand Colors
  primary: {
    main: '#5A4FCF',      // Royal Indigo - elegant, professional, unisex
    light: '#7B6FF2',     // Lighter variant for hover states
    dark: '#3D2A8F',      // Darker variant for pressed states
    gradient: ['#5A4FCF', '#7B6FF2'], // Primary gradient
  },
  
  // Accent Colors
  accent: {
    main: '#F5C451',      // Soft Gold - luxury hint without tackiness
    light: '#F7D373',     // Lighter gold for subtle highlights
    dark: '#E6B23F',      // Darker gold for emphasis
    gradient: ['#F5C451', '#F7D373'], // Accent gradient
  },
  
  // Background Colors (Light Mode)
  background: {
    primary: '#FAFAFA',   // Clean, slightly off-white
    secondary: '#F5F5F7', // Alternative background
    card: '#FFFFFF',      // Card backgrounds
    overlay: 'rgba(90, 79, 207, 0.1)', // Primary color overlay
  },

  // Surface Colors (for components)
  surface: '#FFFFFF',         // Main surface color (cards, modals, etc.)
  surfaceVariant: '#F5F5F7',  // Alternative surface color
  primaryContainer: '#EDE7FF', // Primary color container background
  
  // Text Colors
  text: {
    primary: '#1A1A1A',   // Crisp and readable
    secondary: '#6B6B6B', // Softer tone for subtitles
    tertiary: '#9B9B9B',  // Lightest text for hints
    inverse: '#FFFFFF',   // White text for dark backgrounds
    accent: '#5A4FCF',    // Primary color text
  },
  
  // Functional Colors
  success: {
    main: '#27AE60',
    light: '#58D68D',
    background: '#E8F5E8',
  },
  
  warning: {
    main: '#F39C12',
    light: '#F7DC6F',
    background: '#FDF2E9',
  },
  
  error: {
    main: '#E74C3C',
    light: '#EC7063',
    background: '#FADBD8',
  },
  
  info: {
    main: '#3498DB',
    light: '#5DADE2',
    background: '#EBF5FB',
  },
  
  // Neutral Colors
  neutral: {
    100: '#F8F9FA',
    200: '#E9ECEF',
    300: '#DEE2E6',
    400: '#CED4DA',
    500: '#ADB5BD',
    600: '#6C757D',
    700: '#495057',
    800: '#343A40',
    900: '#212529',
  },
  
  // Border Colors
  border: {
    light: '#E1E5E9',
    medium: '#CED4DA',
    dark: '#ADB5BD',
    focus: '#5A4FCF',
  },
  
  // Shadow Colors
  shadow: {
    light: 'rgba(0, 0, 0, 0.04)',
    medium: 'rgba(0, 0, 0, 0.08)',
    heavy: 'rgba(0, 0, 0, 0.12)',
    colored: 'rgba(90, 79, 207, 0.15)',
  },
  
  // Dark Mode Colors
  dark: {
    primary: '#AFAAFF',     // Lavender Mist - glows on dark backgrounds
    accent: '#FFD88D',      // Elegant Champagne - warm contrast
    background: {
      primary: '#121212',   // Modern and battery-friendly
      secondary: '#1C1C1E', // Alternative dark background
      card: '#1E1E1E',      // Card backgrounds in dark mode
      modal: '#2C2C2E',     // Modal backgrounds
    },
    text: {
      primary: '#F5F5F5',   // Primary text in dark mode
      secondary: '#AAAAAA', // Secondary text in dark mode
      tertiary: '#808080',  // Tertiary text in dark mode
    },
    border: {
      light: '#2C2C2E',
      medium: '#3A3A3C',
      dark: '#48484A',
    },
  },
  
  // Gradient Definitions
  gradients: {
    primary: ['#5A4FCF', '#7B6FF2'],
    accent: ['#F5C451', '#F7D373'],
    sunset: ['#F5C451', '#E6B23F', '#5A4FCF'],
    royal: ['#3D2A8F', '#5A4FCF', '#7B6FF2'],
    soft: ['#FAFAFA', '#F5F5F7'],
  },
};

// Color utility functions
export const getColorWithOpacity = (color: string, opacity: number): string => {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const createGradient = (colors: string[], direction = '45deg'): string => {
  return `linear-gradient(${direction}, ${colors.join(', ')})`;
};

console.log('Colors object created:', Colors?.primary?.main);
console.log('Colors object structure:', Object.keys(Colors));
