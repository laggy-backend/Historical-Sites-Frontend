/**
 * Input component styles with variants
 * Theme-aware input styles for forms
 */

import { TextStyle, ViewStyle } from 'react-native';
import { Theme } from '../theme/variants';
import { createInputBase, createTypography } from '../utils/mixins';
import { InputStyleType } from '../../types/api';

export type InputVariant = 'default' | 'filled' | 'outline';
export type InputSize = 'sm' | 'md' | 'lg';

/**
 * Creates input container styles based on variant and state
 * Returns a style that works with TextInput (compatible with both ViewStyle and TextStyle)
 */
export const createInputStyle = (
  theme: Theme,
  variant: InputVariant = 'default',
  size: InputSize = 'md',
  hasError: boolean = false,
  isFocused: boolean = false,
  disabled: boolean = false
): InputStyleType => {
  const baseStyle = createInputBase(theme);

  // Size variations
  const sizeStyles: Record<InputSize, ViewStyle> = {
    sm: {
      minHeight: 40,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    md: {
      minHeight: 48,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    lg: {
      minHeight: 56,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
  };

  // Variant styles
  const variantStyles: Record<InputVariant, ViewStyle> = {
    default: {
      backgroundColor: theme.colors.backgroundSecondary,
      borderColor: theme.colors.border,
    },
    filled: {
      backgroundColor: theme.colors.backgroundTertiary,
      borderColor: 'transparent',
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.border,
    },
  };

  // State styles
  let stateStyles: ViewStyle = {};

  if (hasError) {
    stateStyles = {
      borderColor: theme.colors.error,
      backgroundColor: theme.colors.errorBackground,
    };
  } else if (isFocused) {
    stateStyles = {
      borderColor: theme.colors.borderFocus,
      borderWidth: 2,
    };
  }

  if (disabled) {
    stateStyles = {
      ...stateStyles,
      backgroundColor: theme.colors.backgroundTertiary,
      opacity: 0.6,
    };
  }

  return {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...stateStyles,
  };
};

/**
 * Creates input text styles
 */
export const createInputTextStyle = (
  theme: Theme,
  size: InputSize = 'md',
  disabled: boolean = false
): TextStyle => {
  const sizeStyles: Record<InputSize, TextStyle> = {
    sm: {
      fontSize: theme.fontSize.sm,
      lineHeight: theme.lineHeight.tight,
    },
    md: {
      fontSize: theme.fontSize.md,
      lineHeight: theme.lineHeight.normal,
    },
    lg: {
      fontSize: theme.fontSize.lg,
      lineHeight: theme.lineHeight.relaxed,
    },
  };

  return {
    ...sizeStyles[size],
    color: disabled ? theme.colors.textTertiary : theme.colors.textPrimary,
    fontWeight: theme.fontWeight.normal,
  };
};

/**
 * Creates input label styles
 */
export const createInputLabelStyle = (
  theme: Theme,
  hasError: boolean = false,
  disabled: boolean = false
): TextStyle => {
  let color: string = theme.colors.textSecondary;

  if (hasError) {
    color = theme.colors.error;
  } else if (disabled) {
    color = theme.colors.textTertiary;
  }

  return {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color,
    marginBottom: theme.spacing.sm,
  };
};

/**
 * Creates input error text styles
 */
export const createInputErrorStyle = (theme: Theme): TextStyle => ({
  fontSize: theme.fontSize.sm,
  color: theme.colors.error,
  marginTop: theme.spacing.xs,
});

/**
 * Creates input placeholder color
 */
export const getPlaceholderColor = (theme: Theme): string => {
  return theme.colors.textTertiary;
};