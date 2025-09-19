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

export type ThemeColors = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  surface: string;
  surfaceSecondary: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  border: string;
  borderLight: string;
  borderFocus: string;
  success: string;
  successBackground: string;
  warning: string;
  warningBackground: string;
  warningBorder?: string;
  error: string;
  errorBackground: string;
  info: string;
  infoBackground: string;
  link: string;
  linkHover: string;
  shadow: string;
  shadowDark: string;
};

export type Theme = {
  colors: ThemeColors;
  spacing: typeof SPACING;
  borderRadius: typeof BORDER_RADIUS;
  fontSize: typeof FONT_SIZE;
  fontWeight: typeof FONT_WEIGHT;
  lineHeight: typeof LINE_HEIGHT;
  isDark: boolean;
};

export const lightTheme: Theme = {
  colors: LIGHT_COLORS,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  fontSize: FONT_SIZE,
  fontWeight: FONT_WEIGHT,
  lineHeight: LINE_HEIGHT,
  isDark: false,
};

export const darkTheme: Theme = {
  colors: DARK_COLORS,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  fontSize: FONT_SIZE,
  fontWeight: FONT_WEIGHT,
  lineHeight: LINE_HEIGHT,
  isDark: true,
};

export type ThemeMode = 'light' | 'dark';