import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  centerContent,
  createStyles,
  createTypographyStyle,
  flexFull,
  useTheme
} from '../../styles';

export default function Explore() {
  const { theme } = useTheme();

  const styles = createStyles((theme) => ({
    container: {
      ...flexFull,
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.lg,
    },
    content: {
      ...flexFull,
      ...centerContent,
    },
    titleText: {
      ...createTypographyStyle(theme, 'h1'),
      marginBottom: theme.spacing.md,
    },
    subtitleText: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  }))(theme);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <View style={styles.content}>
        <Text style={styles.titleText}>Explore</Text>
        <Text style={styles.subtitleText}>
          Discover historical sites near you
        </Text>
      </View>
    </SafeAreaView>
  );
}