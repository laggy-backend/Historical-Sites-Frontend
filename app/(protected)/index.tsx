import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import {
  centerContent,
  centerHorizontal,
  createButtonStyle,
  createButtonTextStyle,
  createStyles,
  createTypographyStyle,
  flexFull,
  useTheme
} from '../../styles';

export default function Index() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  const styles = createStyles((theme) => ({
    container: {
      ...flexFull,
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.lg,
    },
    header: {
      ...centerHorizontal,
      marginBottom: theme.spacing.xxl,
    },
    content: {
      ...flexFull,
      ...centerContent,
      paddingHorizontal: theme.spacing.md,
    },
    footer: {
      paddingBottom: theme.spacing.xl,
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
    },
  }))(theme);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Text style={createTypographyStyle(theme, 'h1')}>Historical Sites</Text>
        <Text style={createTypographyStyle(theme, 'h3')}>Welcome back, {user?.email}</Text>
        <Text style={styles.roleText}>Role: {user?.role}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.contentText}>
          This is your protected dashboard. You can now access all the historical sites features.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={createButtonStyle(theme, 'danger', 'md')}
          onPress={handleLogout}
        >
          <Text style={createButtonTextStyle(theme, 'danger', 'md')}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

