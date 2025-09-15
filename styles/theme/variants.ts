/**
 * Theme variants for light and dark modes
 * Defines the complete theme objects used throughout the app
 */

import {
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  LINE_HEIGHT,
  LIGHT_COLORS,
  DARK_COLORS,
} from './tokens';

export const lightTheme = {
  colors: LIGHT_COLORS,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  fontSize: FONT_SIZE,
  fontWeight: FONT_WEIGHT,
  lineHeight: LINE_HEIGHT,
  isDark: false,
} as const;

export const darkTheme = {
  colors: DARK_COLORS,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  fontSize: FONT_SIZE,
  fontWeight: FONT_WEIGHT,
  lineHeight: LINE_HEIGHT,
  isDark: true,
} as const;

export type Theme = typeof lightTheme;
export type ThemeMode = 'light' | 'dark';