import { StyleSheet } from 'react-native';
import { Colors } from './colors';
import { Typography } from './typography';
import { Spacing, BorderRadius, Shadows, Layout } from './layout';

// Modern Component Styles for FYLA2
// Comprehensive design system with luxury aesthetics

export const ComponentStyles = {
  // Button Styles
  buttons: StyleSheet.create({
    primary: {
      backgroundColor: Colors.primary.main,
      borderRadius: BorderRadius.button,
      paddingHorizontal: Spacing.component.buttonPadding.horizontal,
      paddingVertical: Spacing.component.buttonPadding.vertical,
      height: Layout.button.height.medium,
      ...Shadows.button,
      ...Typography.button.medium,
    },
    
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: Colors.primary.main,
      borderRadius: BorderRadius.button,
      paddingHorizontal: Spacing.component.buttonPadding.horizontal,
      paddingVertical: Spacing.component.buttonPadding.vertical,
      height: Layout.button.height.medium,
      ...Typography.buttons.secondary,
    },
    
    accent: {
      backgroundColor: Colors.accent.main,
      borderRadius: BorderRadius.button,
      paddingHorizontal: Spacing.component.buttonPadding.horizontal,
      paddingVertical: Spacing.component.buttonPadding.vertical,
      height: Layout.button.height.medium,
      ...Shadows.medium,
      ...Typography.buttons.primary,
    },
    
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: BorderRadius.button,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      height: Layout.button.height.medium,
      ...Typography.buttons.ghost,
    },
    
    small: {
      backgroundColor: Colors.primary.main,
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      height: Layout.button.height.small,
      ...Shadows.small,
      ...Typography.buttons.small,
    },
    
    large: {
      backgroundColor: Colors.primary.main,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
      height: Layout.button.height.large,
      ...Shadows.large,
      ...Typography.buttons.large,
    },
    
    danger: {
      backgroundColor: Colors.error.main,
      borderRadius: BorderRadius.button,
      paddingHorizontal: Spacing.component.buttonPadding.horizontal,
      paddingVertical: Spacing.component.buttonPadding.vertical,
      height: Layout.button.height.medium,
      ...Shadows.medium,
      ...Typography.buttons.primary,
    },
    
    success: {
      backgroundColor: Colors.success.main,
      borderRadius: BorderRadius.button,
      paddingHorizontal: Spacing.component.buttonPadding.horizontal,
      paddingVertical: Spacing.component.buttonPadding.vertical,
      height: Layout.button.height.medium,
      ...Shadows.medium,
      ...Typography.buttons.primary,
    },
  }),
  
  // Card Styles
  cards: StyleSheet.create({
    primary: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.card,
      padding: Spacing.component.cardPadding,
      margin: Spacing.component.cardMargin,
      ...Shadows.card,
    },
    
    elevated: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.card,
      padding: Spacing.component.cardPadding,
      margin: Spacing.component.cardMargin,
      ...Shadows.large,
    },
    
    outlined: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.card,
      borderWidth: 1,
      borderColor: Colors.border.light,
      padding: Spacing.component.cardPadding,
      margin: Spacing.component.cardMargin,
    },
    
    gradient: {
      borderRadius: BorderRadius.card,
      padding: Spacing.component.cardPadding,
      margin: Spacing.component.cardMargin,
      ...Shadows.colored,
    },
    
    compact: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      margin: Spacing.sm,
      ...Shadows.small,
    },
    
    flat: {
      backgroundColor: Colors.surfaceVariant,
      borderRadius: BorderRadius.card,
      padding: Spacing.component.cardPadding,
      margin: Spacing.component.cardMargin,
    },
  }),
  
  // Input Styles
  inputs: StyleSheet.create({
    primary: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.input,
      borderWidth: 1,
      borderColor: Colors.border.light,
      paddingHorizontal: Spacing.component.inputPadding.horizontal,
      paddingVertical: Spacing.component.inputPadding.vertical,
      height: Layout.input.height,
      ...Typography.body.medium,
      color: Colors.text.primary,
    },
    
    focused: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.input,
      borderWidth: 2,
      borderColor: Colors.primary.main,
      paddingHorizontal: Spacing.component.inputPadding.horizontal,
      paddingVertical: Spacing.component.inputPadding.vertical,
      height: Layout.input.height,
      ...Typography.body.medium,
      color: Colors.text.primary,
      ...Shadows.small,
    },
    
    error: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.input,
      borderWidth: 2,
      borderColor: Colors.error.main,
      paddingHorizontal: Spacing.component.inputPadding.horizontal,
      paddingVertical: Spacing.component.inputPadding.vertical,
      height: Layout.input.height,
      ...Typography.body.medium,
      color: Colors.text.primary,
    },
    
    search: {
      backgroundColor: Colors.surfaceVariant,
      borderRadius: BorderRadius.xl,
      borderWidth: 0,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      height: Layout.input.height,
      ...Typography.body.medium,
      color: Colors.text.primary,
    },
    
    multiline: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.input,
      borderWidth: 1,
      borderColor: Colors.border.light,
      paddingHorizontal: Spacing.component.inputPadding.horizontal,
      paddingVertical: Spacing.component.inputPadding.vertical,
      minHeight: 100,
      textAlignVertical: 'top',
      ...Typography.body.medium,
      color: Colors.text.primary,
    },
  }),
  
  // Header Styles
  headers: StyleSheet.create({
    main: {
      backgroundColor: Colors.surface,
      height: Layout.layout.headerHeight,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.component.screenPadding,
      ...Shadows.small,
    },
    
    transparent: {
      backgroundColor: 'transparent',
      height: Layout.layout.headerHeight,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.component.screenPadding,
    },
    
    elevated: {
      backgroundColor: Colors.surface,
      height: Layout.layout.headerHeight,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.component.screenPadding,
      ...Shadows.medium,
    },
    
    gradient: {
      height: Layout.layout.headerHeight,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.component.screenPadding,
    },
  }),
  
  // Modal Styles
  modals: StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.lg,
    },
    
    container: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.modal,
      padding: Spacing.xl,
      maxWidth: Layout.maxWidth.modal,
      width: '100%',
      ...Shadows.large,
    },
    
    fullScreen: {
      flex: 1,
      backgroundColor: Colors.background.primary,
      borderTopLeftRadius: BorderRadius.modal,
      borderTopRightRadius: BorderRadius.modal,
      paddingTop: Spacing.lg,
    },
    
    bottomSheet: {
      backgroundColor: Colors.surface,
      borderTopLeftRadius: BorderRadius.modal,
      borderTopRightRadius: BorderRadius.modal,
      paddingTop: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.xxxl,
      ...Shadows.large,
    },
  }),
  
  // List Styles
  lists: StyleSheet.create({
    container: {
      backgroundColor: Colors.background.primary,
      flex: 1,
    },
    
    item: {
      backgroundColor: Colors.surface,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border.light,
      flexDirection: 'row',
      alignItems: 'center',
    },
    
    itemElevated: {
      backgroundColor: Colors.surface,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      marginHorizontal: Spacing.md,
      marginVertical: Spacing.xs,
      borderRadius: BorderRadius.md,
      ...Shadows.small,
      flexDirection: 'row',
      alignItems: 'center',
    },
    
    separator: {
      height: 1,
      backgroundColor: Colors.border.light,
      marginLeft: Spacing.lg,
    },
    
    sectionHeader: {
      backgroundColor: Colors.surfaceVariant,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      ...Typography.labels.medium,
      color: Colors.text.secondary,
    },
  }),
  
  // Avatar Styles
  avatars: StyleSheet.create({
    small: {
      width: Layout.avatar.small,
      height: Layout.avatar.small,
      borderRadius: Layout.avatar.small / 2,
      backgroundColor: Colors.primary.main,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    medium: {
      width: Layout.avatar.medium,
      height: Layout.avatar.medium,
      borderRadius: Layout.avatar.medium / 2,
      backgroundColor: Colors.primary.main,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    large: {
      width: Layout.avatar.large,
      height: Layout.avatar.large,
      borderRadius: Layout.avatar.large / 2,
      backgroundColor: Colors.primary.main,
      justifyContent: 'center',
      alignItems: 'center',
      ...Shadows.medium,
    },
    
    xlarge: {
      width: Layout.avatar.xlarge,
      height: Layout.avatar.xlarge,
      borderRadius: Layout.avatar.xlarge / 2,
      backgroundColor: Colors.primary.main,
      justifyContent: 'center',
      alignItems: 'center',
      ...Shadows.large,
    },
    
    bordered: {
      width: Layout.avatar.medium,
      height: Layout.avatar.medium,
      borderRadius: Layout.avatar.medium / 2,
      backgroundColor: Colors.primary.main,
      borderWidth: 2,
      borderColor: Colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
  }),
  
  // Badge Styles
  badges: StyleSheet.create({
    primary: {
      backgroundColor: Colors.primary.main,
      borderRadius: BorderRadius.round,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    accent: {
      backgroundColor: Colors.accent.main,
      borderRadius: BorderRadius.round,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    success: {
      backgroundColor: Colors.success.main,
      borderRadius: BorderRadius.round,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    error: {
      backgroundColor: Colors.error.main,
      borderRadius: BorderRadius.round,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    warning: {
      backgroundColor: Colors.warning.main,
      borderRadius: BorderRadius.round,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
  }),
  
  // Chip Styles
  chips: StyleSheet.create({
    primary: {
      backgroundColor: Colors.primaryContainer,
      borderRadius: BorderRadius.chip,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },
    
    secondary: {
      backgroundColor: Colors.surfaceVariant,
      borderRadius: BorderRadius.chip,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },
    
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: Colors.border.light,
      borderRadius: BorderRadius.chip,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },
    
    selected: {
      backgroundColor: Colors.primary.main,
      borderRadius: BorderRadius.chip,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      ...Shadows.small,
    },
  }),
};

// Utility function to create custom button styles
export const createButtonStyle = (options: {
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  size?: 'small' | 'medium' | 'large';
}) => {
  const baseStyle = ComponentStyles.buttons.primary;
  const sizeStyle = options.size 
    ? ComponentStyles.buttons[options.size] 
    : ComponentStyles.buttons.primary;
  
  return {
    ...baseStyle,
    ...sizeStyle,
    backgroundColor: options.backgroundColor || baseStyle.backgroundColor,
    borderColor: options.borderColor,
    borderWidth: options.borderColor ? 1.5 : 0,
  };
};

// Utility function to create custom card styles
export const createCardStyle = (options: {
  backgroundColor?: string;
  shadow?: boolean;
  border?: boolean;
  borderColor?: string;
}) => {
  const baseStyle = ComponentStyles.cards.primary;
  
  return {
    ...baseStyle,
    backgroundColor: options.backgroundColor || baseStyle.backgroundColor,
    borderWidth: options.border ? 1 : 0,
    borderColor: options.borderColor || Colors.border.light,
    ...(options.shadow ? Shadows.card : Shadows.none),
  };
};

export default ComponentStyles;
