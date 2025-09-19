/**
 * Design tokens for the Historical Sites app
 * Contains all design values (colors, spacing, typography) for light and dark themes
 */

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const FONT_WEIGHT = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const LINE_HEIGHT = {
  tight: 20,
  normal: 24,
  relaxed: 28,
  loose: 32,
} as const;

// Light theme colors
export const LIGHT_COLORS = {
  // Primary colors
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',

  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  backgroundTertiary: '#F3F4F6',

  // Surface colors
  surface: '#FFFFFF',
  surfaceSecondary: '#F8FAFC',

  // Text colors
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Border colors
  border: '#D1D5DB',
  borderLight: '#E5E7EB',
  borderFocus: '#3B82F6',

  // Status colors
  success: '#10B981',
  successBackground: '#D1FAE5',
  warning: '#F59E0B',
  warningBackground: '#FEF3C7',
  error: '#EF4444',
  errorBackground: '#FEF2F2',
  info: '#3B82F6',
  infoBackground: '#DBEAFE',

  // Interactive colors
  link: '#3B82F6',
  linkHover: '#2563EB',

  // Shadow colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.25)',
} as const;

// Dark theme colors
export const DARK_COLORS = {
  // Primary colors
  primary: '#60A5FA',
  primaryLight: '#93C5FD',
  primaryDark: '#3B82F6',

  // Background colors
  background: '#111827',
  backgroundSecondary: '#1F2937',
  backgroundTertiary: '#374151',

  // Surface colors
  surface: '#1F2937',
  surfaceSecondary: '#374151',

  // Text colors
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  textInverse: '#1F2937',

  // Border colors
  border: '#4B5563',
  borderLight: '#6B7280',
  borderFocus: '#60A5FA',

  // Status colors
  success: '#34D399',
  successBackground: '#064E3B',
  warning: '#FBBF24',
  warningBackground: '#92400E',
  error: '#F87171',
  errorBackground: '#7F1D1D',
  info: '#60A5FA',
  infoBackground: '#1E3A8A',

  // Interactive colors
  link: '#60A5FA',
  linkHover: '#93C5FD',

  // Shadow colors
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowDark: 'rgba(0, 0, 0, 0.5)',
} as const;

export type ColorKey = keyof typeof LIGHT_COLORS;
export type SpacingKey = keyof typeof SPACING;
export type FontSizeKey = keyof typeof FONT_SIZE;
export type FontWeightKey = keyof typeof FONT_WEIGHT;