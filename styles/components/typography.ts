/**
 * Typography component styles
 * Theme-aware text styles for consistent typography
 */

import { TextStyle } from 'react-native';
import { Theme } from '../theme/variants';

export type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodySmall' | 'caption' | 'link';

/**
 * Creates typography styles based on variant
 */
export const createTypographyStyle = (
  theme: Theme,
  variant: TypographyVariant = 'body'
): TextStyle => {
  const variantStyles: Record<TypographyVariant, TextStyle> = {
    h1: {
      fontSize: theme.fontSize.xxl,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.textPrimary,
      lineHeight: theme.lineHeight.loose,
    },
    h2: {
      fontSize: theme.fontSize.xl,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.textPrimary,
      lineHeight: theme.lineHeight.normal,
    },
    h3: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.textPrimary,
      lineHeight: theme.lineHeight.normal,
    },
    h4: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.textPrimary,
      lineHeight: theme.lineHeight.normal,
    },
    body: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.normal,
      color: theme.colors.textPrimary,
      lineHeight: theme.lineHeight.normal,
    },
    bodySmall: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.normal,
      color: theme.colors.textSecondary,
      lineHeight: theme.lineHeight.tight,
    },
    caption: {
      fontSize: theme.fontSize.xs,
      fontWeight: theme.fontWeight.normal,
      color: theme.colors.textTertiary,
      lineHeight: theme.lineHeight.tight,
    },
    link: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.link,
      lineHeight: theme.lineHeight.normal,
    },
  };

  return variantStyles[variant];
};