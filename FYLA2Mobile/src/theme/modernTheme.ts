export const modernTheme = {
  colors: {
    // Primary gradient - sleek and modern
    primary: {
      main: '#667eea',
      light: '#764ba2',
      dark: '#4c63d2',
      gradient: ['#667eea', '#764ba2'],
    },
    
    // Secondary gradient - elegant purple-pink
    secondary: {
      main: '#f093fb',
      light: '#f5576c',
      dark: '#c471ed',
      gradient: ['#f093fb', '#f5576c'],
    },
    
    // Neutral colors - modern and clean
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    
    // Semantic colors
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
      gradient: ['#10b981', '#34d399'],
    },
    
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      gradient: ['#f59e0b', '#fbbf24'],
    },
    
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
      gradient: ['#ef4444', '#f87171'],
    },
    
    // Background colors
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      dark: '#0f172a',
      glass: 'rgba(255, 255, 255, 0.1)',
    },
    
    // Text colors
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      tertiary: '#94a3b8',
      inverse: '#ffffff',
      accent: '#667eea',
    },
    
    // Surface colors
    surface: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      elevated: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    
    // Border colors
    border: {
      primary: '#e2e8f0',
      secondary: '#cbd5e1',
      focus: '#667eea',
    },
  },
  
  typography: {
    fontFamily: {
      regular: 'Inter_400Regular',
      medium: 'Inter_500Medium',
      semiBold: 'Inter_600SemiBold',
      bold: 'Inter_700Bold',
    },
    
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 60,
    },
    
    lineHeight: {
      xs: 16,
      sm: 20,
      base: 24,
      lg: 28,
      xl: 32,
      '2xl': 36,
      '3xl': 40,
      '4xl': 44,
      '5xl': 56,
      '6xl': 72,
    },
    
    letterSpacing: {
      tight: -0.025,
      normal: 0,
      wide: 0.025,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
    '4xl': 80,
    '5xl': 96,
  },
  
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    full: 999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 12,
    },
  },
  
  animation: {
    duration: {
      fast: 150,
      normal: 250,
      slow: 350,
    },
    
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    },
  },
  
  glassmorphism: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  
  subscription: {
    free: {
      color: '#64748b',
      background: '#f1f5f9',
      border: '#cbd5e1',
    },
    basic: {
      color: '#0ea5e9',
      background: '#e0f2fe',
      border: '#0ea5e9',
      gradient: ['#0ea5e9', '#38bdf8'],
    },
    premium: {
      color: '#a855f7',
      background: '#faf5ff',
      border: '#a855f7',
      gradient: ['#a855f7', '#c084fc'],
    },
    enterprise: {
      color: '#eab308',
      background: '#fefce8',
      border: '#eab308',
      gradient: ['#eab308', '#facc15'],
    },
  },
};

export type ModernTheme = typeof modernTheme;
