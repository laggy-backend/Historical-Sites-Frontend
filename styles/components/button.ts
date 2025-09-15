/**
 * Button component styles with variants
 * Theme-aware button styles for consistent UI
 */

import { TextStyle, ViewStyle } from 'react-native';
import { Theme } from '../theme/variants';
import { createButtonBase, centerContent } from '../utils/mixins';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Creates button container styles based on variant and size
 */
export const createButtonStyle = (
  theme: Theme,
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  disabled: boolean = false
): ViewStyle => {
  const baseStyle = createButtonBase(theme);

  // Size variations
  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    sm: {
      minHeight: 36,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    md: {
      minHeight: 48,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    lg: {
      minHeight: 56,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.lg,
    },
  };

  // Variant styles
  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: disabled ? theme.colors.textTertiary : theme.colors.primary,
    },
    secondary: {
      backgroundColor: disabled ? theme.colors.backgroundTertiary : theme.colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: disabled ? theme.colors.textTertiary : theme.colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: disabled ? theme.colors.textTertiary : theme.colors.error,
    },
  };

  return {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
    opacity: disabled ? 0.6 : 1,
  };
};

/**
 * Creates button text styles based on variant and size
 */
export const createButtonTextStyle = (
  theme: Theme,
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  disabled: boolean = false
): TextStyle => {
  // Size variations
  const sizeStyles: Record<ButtonSize, TextStyle> = {
    sm: {
      fontSize: theme.fontSize.sm,
    },
    md: {
      fontSize: theme.fontSize.md,
    },
    lg: {
      fontSize: theme.fontSize.lg,
    },
  };

  // Variant text colors
  const variantStyles: Record<ButtonVariant, TextStyle> = {
    primary: {
      color: theme.colors.textInverse,
      fontWeight: theme.fontWeight.semibold,
    },
    secondary: {
      color: theme.colors.textPrimary,
      fontWeight: theme.fontWeight.medium,
    },
    outline: {
      color: disabled ? theme.colors.textTertiary : theme.colors.primary,
      fontWeight: theme.fontWeight.medium,
    },
    ghost: {
      color: disabled ? theme.colors.textTertiary : theme.colors.primary,
      fontWeight: theme.fontWeight.medium,
    },
    danger: {
      color: theme.colors.textInverse,
      fontWeight: theme.fontWeight.semibold,
    },
  };

  return {
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
};