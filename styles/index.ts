// Centralized style exports
export { colors } from './colors';
export { layout } from './layout';
export { components } from './components';

// Re-export commonly used combinations
export const commonStyles = {
  screenContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  centeredContent: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  formContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
};