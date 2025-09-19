import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_ENDPOINTS } from '../../config';
import apiClient, { apiHelpers } from '../../services/api';
import { logger } from '../../utils/logger';
import {
  useTheme,
  createStyles,
  createButtonStyle,
  createButtonTextStyle,
  createInputStyle,
  createInputTextStyle,
  createInputLabelStyle,
  createInputErrorStyle,
  getPlaceholderColor,
  createTypographyStyle,
  flexFull,
  rowCenter
} from '../../styles';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { theme } = useTheme();
  const styles = createStyles((theme) => ({
    container: {
      ...flexFull,
      backgroundColor: theme.colors.background,
    },
    keyboardContainer: {
      ...flexFull,
    },
    content: {
      ...flexFull,
      paddingHorizontal: theme.spacing.lg,
      justifyContent: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.xxl,
    },
    form: {
      gap: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    inputContainer: {
      gap: theme.spacing.sm,
    },
    footer: {
      ...rowCenter,
      justifyContent: 'center',
    },
    successContainer: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    successText: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.success,
      textAlign: 'center',
      lineHeight: theme.lineHeight.relaxed,
    },
    instructionText: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: theme.lineHeight.relaxed,
      marginBottom: theme.spacing.lg,
    },
  }))(theme);

  const validateForm = () => {
    const newErrors: { email?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.PASSWORD_RESET, {
        email: email.toLowerCase().trim(),
      });

      const data = response.data;

      if (data.success) {
        setIsSuccess(true);
      } else {
        Alert.alert('Reset Failed', data.error?.message || 'Failed to send reset email');
      }
    } catch (error) {
      const apiError = error as Error;
      logger.authFailure('Password reset', apiHelpers.getErrorMessage(apiError), email);
      Alert.alert('Reset Failed', apiHelpers.getUserFriendlyMessage(apiError));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/(auth)/login');
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={createTypographyStyle(theme, 'h1')}>Check Your Email</Text>
          </View>

          <View style={styles.successContainer}>
            <Text style={styles.successText}>
              Password reset instructions have been sent to your email address.
            </Text>
            <Text style={styles.instructionText}>
              Please check your inbox and follow the instructions in the email to reset your password.
              Don&apos;t forget to check your spam folder if you don&apos;t see it.
            </Text>

            <TouchableOpacity
              style={createButtonStyle(theme, 'primary', 'md')}
              onPress={handleBackToLogin}
            >
              <Text style={createButtonTextStyle(theme, 'primary', 'md')}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={createTypographyStyle(theme, 'body')}>Didn&apos;t receive an email? </Text>
            <TouchableOpacity onPress={() => {
              setIsSuccess(false);
              setEmail('');
            }}>
              <Text style={createTypographyStyle(theme, 'link')}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={createTypographyStyle(theme, 'h1')}>Reset Password</Text>
            <Text style={createTypographyStyle(theme, 'body')}>Enter your email to receive reset instructions</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={createInputLabelStyle(theme, !!errors.email, isLoading)}>Email</Text>
              <TextInput
                style={[
                  createInputStyle(
                    theme,
                    'default',
                    'md',
                    !!errors.email,
                    focusedField === 'email',
                    isLoading
                  ),
                  createInputTextStyle(theme, 'md', isLoading)
                ]}
                placeholder="Enter your email"
                placeholderTextColor={getPlaceholderColor(theme)}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors(prev => ({ ...prev, email: undefined }));
                  }
                }}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
              />
              {errors.email && (
                <Text style={createInputErrorStyle(theme)}>{errors.email}</Text>
              )}
            </View>

            <TouchableOpacity
              style={createButtonStyle(theme, 'primary', 'md', isLoading)}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.textInverse} />
              ) : (
                <Text style={createButtonTextStyle(theme, 'primary', 'md', isLoading)}>
                  Send Reset Instructions
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={createTypographyStyle(theme, 'body')}>Remember your password? </Text>
            <TouchableOpacity onPress={handleBackToLogin}>
              <Text style={createTypographyStyle(theme, 'link')}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}