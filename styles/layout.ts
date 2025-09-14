import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const layout = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContainer: {
    flexGrow: 1,
    backgroundColor: colors.background,
  },

  // Flex layouts
  flexCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  flexRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  flexRowCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  flexColumn: {
    flexDirection: 'column',
  },

  // Spacing
  padding: {
    padding: 16,
  },

  paddingHorizontal: {
    paddingHorizontal: 16,
  },

  paddingVertical: {
    paddingVertical: 16,
  },

  margin: {
    margin: 16,
  },

  marginHorizontal: {
    marginHorizontal: 16,
  },

  marginVertical: {
    marginVertical: 16,
  },

  // Common spacing values
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Border radius
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  // Shadows
  shadow: {
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  shadowLarge: {
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
});