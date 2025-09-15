import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import {
  centerContent,
  centerHorizontal,
  createStyles,
  createTypographyStyle,
  flexFull,
  useTheme
} from '../../styles';

export default function Index() {
  const { user } = useAuth();
  const { theme } = useTheme();

  const styles = createStyles((theme) => ({
    container: {
      ...flexFull,
      backgroundColor: theme.colors.background,
    },
    content: {
      ...flexFull,
      ...centerContent,
      paddingHorizontal: theme.spacing.lg,
    },
    centerCard: {
      alignItems: 'center',
      gap: theme.spacing.xl,
    },
    header: {
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    roleText: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.primary,
      fontWeight: theme.fontWeight.semibold,
      textTransform: 'capitalize',
    },
    contentText: {
      ...createTypographyStyle(theme, 'body'),
      textAlign: 'center',
      color: theme.colors.textSecondary,
      lineHeight: theme.lineHeight.relaxed,
      maxWidth: '80%',
    },
  }))(theme);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <View style={styles.content}>
        <View style={styles.centerCard}>
          <View style={styles.header}>
            <Text style={createTypographyStyle(theme, 'h1')}>Historical Sites</Text>
            <Text style={createTypographyStyle(theme, 'h3')}>Welcome back, {user?.email}</Text>
            <Text style={styles.roleText}>Role: {user?.role}</Text>
          </View>

          <Text style={styles.contentText}>
            This is your protected dashboard. You can now access all the historical sites features.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

