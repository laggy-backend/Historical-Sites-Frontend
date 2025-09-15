/**
 * Main styles export
 * Central export point for all styling utilities and components
 */

// Theme exports
export { ThemeProvider, useTheme } from './theme/context';
export { lightTheme, darkTheme } from './theme/variants';
export type { Theme, ThemeMode } from './theme/variants';

// Utility exports
export { createStyles, createDynamicStyles } from './utils/createStyles';
export * from './utils/mixins';

// Component style exports
export * from './components/button';
export * from './components/input';
export * from './components/typography';