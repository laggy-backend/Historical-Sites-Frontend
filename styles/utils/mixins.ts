/**
 * Common style mixins and utilities
 * Reusable style patterns used across components
 */

import { ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../theme/variants';

/**
 * Center content both horizontally and vertically
 */
export const centerContent: ViewStyle = {
  justifyContent: 'center',
  alignItems: 'center',
};

/**
 * Center content horizontally only
 */
export const centerHorizontal: ViewStyle = {
  alignItems: 'center',
};

/**
 * Center content vertically only
 */
export const centerVertical: ViewStyle = {
  justifyContent: 'center',
};

/**
 * Flex container that takes full available space
 */
export const flexFull: ViewStyle = {
  flex: 1,
};

/**
 * Row layout with center alignment
 */
export const rowCenter: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
};

/**
 * Row layout with space between items
 */
export const rowBetween: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
};

/**
 * Creates shadow styles based on theme
 */
export const createShadow = (theme: Theme, elevation: 'sm' | 'md' | 'lg' = 'sm'): ViewStyle => {
  const shadows = {
    sm: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 3,
    },
    md: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    lg: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
  };

  return {
    ...shadows[elevation],
    shadowColor: theme.colors.shadow,
  };
};

/**
 * Creates border radius styles
 */
export const createBorderRadius = (theme: Theme, size: keyof Theme['borderRadius'] = 'md'): ViewStyle => ({
  borderRadius: theme.borderRadius[size],
});

/**
 * Creates padding styles with theme spacing
 */
export const createPadding = (
  theme: Theme,
  vertical?: keyof Theme['spacing'],
  horizontal?: keyof Theme['spacing']
): ViewStyle => {
  const styles: ViewStyle = {};

  if (vertical !== undefined) {
    styles.paddingVertical = theme.spacing[vertical];
  }

  if (horizontal !== undefined) {
    styles.paddingHorizontal = theme.spacing[horizontal];
  }

  return styles;
};

/**
 * Creates margin styles with theme spacing
 */
export const createMargin = (
  theme: Theme,
  vertical?: keyof Theme['spacing'],
  horizontal?: keyof Theme['spacing']
): ViewStyle => {
  const styles: ViewStyle = {};

  if (vertical !== undefined) {
    styles.marginVertical = theme.spacing[vertical];
  }

  if (horizontal !== undefined) {
    styles.marginHorizontal = theme.spacing[horizontal];
  }

  return styles;
};

/**
 * Creates typography styles
 */
export const createTypography = (
  theme: Theme,
  size: keyof Theme['fontSize'] = 'md',
  weight: keyof Theme['fontWeight'] = 'normal',
  color: keyof Theme['colors'] = 'textPrimary'
): TextStyle => ({
  fontSize: theme.fontSize[size],
  fontWeight: theme.fontWeight[weight],
  color: theme.colors[color],
});

/**
 * Creates button base styles
 */
export const createButtonBase = (theme: Theme): ViewStyle => ({
  ...centerContent,
  ...createBorderRadius(theme),
  ...createPadding(theme, 'md', 'lg'),
  minHeight: 48,
});

/**
 * Creates input base styles
 */
export const createInputBase = (theme: Theme): ViewStyle => ({
  ...createBorderRadius(theme),
  ...createPadding(theme, 'md', 'md'),
  borderWidth: 1,
  borderColor: theme.colors.border,
  backgroundColor: theme.colors.backgroundSecondary,
  minHeight: 48,
});