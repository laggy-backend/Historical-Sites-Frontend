import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { API_ENDPOINTS } from '../../config';
import apiClient, { apiHelpers } from '../../services/api';
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
  const [refreshing, setRefreshing] = useState(false);

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
  }))(theme);

  useEffect(() => {
    if (user) {
      setProfile(user);
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.USERS.ME);
      const userData = response.data;

      if (userData.success) {
        setProfile(userData.data);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Failed to fetch user profile:', error);
      }
      Alert.alert('Error', 'Failed to refresh profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
    setRefreshing(false);
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {getInitials(profile.email)}
            </Text>
          </View>
          <Text style={styles.titleText}>Profile</Text>
        </View>

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
            style={styles.refreshButton}
            onPress={fetchUserProfile}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Ionicons name="refresh" size={20} color={theme.colors.primary} />
            )}
            <Text style={styles.refreshButtonText}>
              {isLoading ? 'Refreshing...' : 'Refresh Profile'}
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