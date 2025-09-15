/**
 * Style utilities for creating theme-aware styles
 * Industry standard approach for dynamic styling with React Native StyleSheet
 */

import { StyleSheet, ImageStyle, TextStyle, ViewStyle } from 'react-native';
import { Theme } from '../theme/variants';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Creates theme-aware styles using React Native's StyleSheet.create
 * @param styleFactory Function that takes theme and returns style object
 * @returns Function that takes theme and returns optimized styles
 */
export const createStyles = <T extends NamedStyles<T>>(
  styleFactory: (theme: Theme) => T
) => {
  let cachedTheme: Theme | null = null;
  let cachedStyles: StyleSheet.NamedStyles<T> | null = null;

  return (theme: Theme): StyleSheet.NamedStyles<T> => {
    // Cache optimization: only recreate styles if theme changed
    if (cachedTheme !== theme || !cachedStyles) {
      cachedTheme = theme;
      cachedStyles = StyleSheet.create(styleFactory(theme));
    }
    return cachedStyles;
  };
};

/**
 * Creates simple theme-aware styles without caching (for dynamic styles)
 * @param styleFactory Function that takes theme and returns style object
 * @returns Function that takes theme and returns styles
 */
export const createDynamicStyles = <T extends NamedStyles<T>>(
  styleFactory: (theme: Theme) => T
) => {
  return (theme: Theme): T => styleFactory(theme);
};