import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ActivityIndicator, Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { API_ENDPOINTS } from '../../config';
import apiClient, { apiHelpers } from '../../services/api';
import { logger } from '../../utils/logger';
import { AxiosError } from 'axios';
import {
  createButtonStyle,
  createButtonTextStyle,
  createStyles,
  createTypographyStyle,
  flexFull,
  rowCenter,
  useTheme
} from '../../styles';

interface UserProfile {
  id: number;
  email: string;
  role: 'visitor' | 'contributor' | 'moderator' | 'admin';
  created_at: string;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, themeMode, isSystemTheme, toggleTheme, setSystemTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // REMOVED: refreshing state - not needed without pull-to-refresh
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [connectionError, setConnectionError] = useState(false);
  const requestInProgressRef = useRef(false);

  const styles = createStyles((theme) => ({
    container: {
      ...flexFull,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      ...flexFull,
    },
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.xl,
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.xxl,
    },
    titleText: {
      ...createTypographyStyle(theme, 'h1'),
      marginBottom: theme.spacing.sm,
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    avatarText: {
      ...createTypographyStyle(theme, 'h2'),
      color: theme.colors.textInverse,
      fontWeight: theme.fontWeight.bold,
    },
    userInfoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    infoRow: {
      ...rowCenter,
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    lastInfoRow: {
      ...rowCenter,
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
    },
    infoLabel: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.textSecondary,
      fontWeight: theme.fontWeight.medium,
    },
    infoValue: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.textPrimary,
      fontWeight: theme.fontWeight.semibold,
    },
    roleValue: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.primary,
      fontWeight: theme.fontWeight.semibold,
      textTransform: 'capitalize',
    },
    actionsContainer: {
      gap: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    refreshButton: {
      ...rowCenter,
      justifyContent: 'center',
      backgroundColor: theme.colors.backgroundSecondary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.sm,
    },
    refreshButtonText: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.primary,
      fontWeight: theme.fontWeight.medium,
    },
    loadingContainer: {
      ...flexFull,
      justifyContent: 'center',
      alignItems: 'center',
    },
    themeCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cardTitle: {
      ...createTypographyStyle(theme, 'h4'),
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.md,
    },
    themeRow: {
      ...rowCenter,
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      alignItems: 'flex-start',
    },
    themeLabel: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.textSecondary,
      fontWeight: theme.fontWeight.medium,
    },
    themeTextContainer: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
    switchContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    themeModeText: {
      ...createTypographyStyle(theme, 'bodySmall'),
      color: theme.colors.textTertiary,
      marginTop: theme.spacing.xs,
    },
    cooldownContainer: {
      backgroundColor: theme.colors.warning,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.warningBorder || theme.colors.warning,
    },
    cooldownText: {
      ...createTypographyStyle(theme, 'bodySmall'),
      color: theme.colors.textInverse,
      textAlign: 'center',
      fontWeight: theme.fontWeight.semibold,
    },
    refreshButtonDisabled: {
      ...rowCenter,
      justifyContent: 'center',
      backgroundColor: theme.colors.backgroundTertiary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.sm,
      opacity: 0.6,
    },
    refreshButtonTextDisabled: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.textSecondary,
      fontWeight: theme.fontWeight.medium,
    },
    connectionErrorContainer: {
      backgroundColor: '#FEF3E2', // Light orange background
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      borderWidth: 1,
      borderColor: '#F59E0B', // Orange border
      ...rowCenter,
      gap: theme.spacing.sm,
    },
    connectionErrorText: {
      ...createTypographyStyle(theme, 'bodySmall'),
      color: '#92400E', // Dark orange text
      flex: 1,
    },
  }))(theme);

  const fetchUserProfile = useCallback(async (isManualRefresh = false) => {
    // Prevent multiple concurrent requests
    if (requestInProgressRef.current) {
      return;
    }

    try {
      requestInProgressRef.current = true;
      setIsLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.USERS.ME);
      const userData = response.data;

      if (userData.success) {
        setProfile(userData.data);
        setConnectionError(false); // Clear connection error on success
      }

      // Start cooldown after successful manual refresh
      if (isManualRefresh) {
        setCooldownActive(true);
        setCooldownSeconds(30);
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = apiHelpers.getUserFriendlyMessage(axiosError);

      logger.warn('api', 'Failed to fetch user profile', {
        error: axiosError.message,
        isNetworkError: apiHelpers.isNetworkError(axiosError)
      });

      // Set connection error state for UI feedback
      const isNetworkError = apiHelpers.isNetworkError(axiosError);
      setConnectionError(isNetworkError);

      // Only show alert for manual refreshes or non-network errors
      // For network errors on auto-refresh, silently handle them
      const shouldShowAlert = isManualRefresh || !isNetworkError;

      if (shouldShowAlert) {
        Alert.alert(
          isNetworkError ? 'Connection Error' : 'Error',
          errorMessage
        );
      }
    } finally {
      setIsLoading(false);
      requestInProgressRef.current = false;
    }
  }, []); // Remove isLoading dependency to break the loop

  // SIMPLE APPROACH: Only load profile once when user changes
  useEffect(() => {
    if (user) {
      setProfile(user); // Use cached user data immediately
      // NO automatic API call here - users can manually refresh if they want fresh data
    }
  }, [user]); // Only depend on user changes

  // REMOVED: Auto-refresh on focus - this was causing the infinite loop
  // Users can manually refresh if they need updated data

  // Cooldown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldownActive && cooldownSeconds > 0) {
      interval = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            setCooldownActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000) as any;
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [cooldownActive, cooldownSeconds]);

  // REMOVED: onRefresh handler - no longer using pull-to-refresh to avoid loops

  const handleManualRefresh = async () => {
    if (cooldownActive || isLoading || requestInProgressRef.current) return;
    await fetchUserProfile(true);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return email.charAt(0).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {getInitials(profile.email)}
            </Text>
          </View>
          <Text style={styles.titleText}>Profile</Text>
        </View>

        {cooldownActive && (
          <View style={styles.cooldownContainer}>
            <Text style={styles.cooldownText}>
              Please wait {cooldownSeconds} seconds before refreshing again
            </Text>
          </View>
        )}

        {connectionError && (
          <View style={styles.connectionErrorContainer}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={styles.connectionErrorText}>
              Unable to connect to server. Profile data may not be up to date.
            </Text>
          </View>
        )}

        <View style={styles.userInfoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profile.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.roleValue}>{profile.role}</Text>
          </View>

          <View style={styles.lastInfoRow}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>{formatDate(profile.created_at)}</Text>
          </View>
        </View>

        <View style={styles.themeCard}>
          <Text style={styles.cardTitle}>Appearance</Text>

          <View style={styles.themeRow}>
            <View style={styles.themeTextContainer}>
              <Text style={styles.themeLabel}>Follow System Theme</Text>
              <Text style={styles.themeModeText}>
                Automatically switch between light and dark modes
              </Text>
            </View>
            <View style={styles.switchContainer}>
              <Switch
                value={isSystemTheme}
                onValueChange={setSystemTheme}
                trackColor={{
                  false: theme.colors.backgroundTertiary,
                  true: theme.colors.primary,
                }}
                thumbColor={theme.colors.surface}
                ios_backgroundColor={theme.colors.backgroundTertiary}
              />
            </View>
          </View>

          {!isSystemTheme && (
            <View style={styles.themeRow}>
              <View style={styles.themeTextContainer}>
                <Text style={styles.themeLabel}>Dark Mode</Text>
                <Text style={styles.themeModeText}>
                  Current theme: {themeMode === 'dark' ? 'Dark' : 'Light'}
                </Text>
              </View>
              <View style={styles.switchContainer}>
                <Switch
                  value={themeMode === 'dark'}
                  onValueChange={toggleTheme}
                  trackColor={{
                    false: theme.colors.backgroundTertiary,
                    true: theme.colors.primary,
                  }}
                  thumbColor={theme.colors.surface}
                  ios_backgroundColor={theme.colors.backgroundTertiary}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={cooldownActive || isLoading ? styles.refreshButtonDisabled : styles.refreshButton}
            onPress={handleManualRefresh}
            disabled={isLoading || cooldownActive}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Ionicons
                name="refresh"
                size={20}
                color={cooldownActive ? theme.colors.textSecondary : theme.colors.primary}
              />
            )}
            <Text style={cooldownActive ? styles.refreshButtonTextDisabled : styles.refreshButtonText}>
              {isLoading
                ? 'Refreshing...'
                : cooldownActive
                ? `Wait ${cooldownSeconds}s`
                : 'Refresh Profile Data'
              }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={createButtonStyle(theme, 'danger', 'md')}
            onPress={handleLogout}
          >
            <Text style={createButtonTextStyle(theme, 'danger', 'md')}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}