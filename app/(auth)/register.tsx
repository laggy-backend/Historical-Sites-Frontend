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
import { useAuth } from '../../contexts/AuthContext';
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

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { register } = useAuth();
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
  }))(theme);

  const validateForm = () => {
    const newErrors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation (more comprehensive for registration)
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and numbers';
    }

    // Confirm password validation
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    const result = await register(email.toLowerCase().trim(), password);
    setIsLoading(false);

    if (result.success) {
      router.replace('/(protected)');
    } else {
      Alert.alert('Registration Failed', result.error || 'An error occurred');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={createTypographyStyle(theme, 'h1')}>Create Account</Text>
            <Text style={createTypographyStyle(theme, 'body')}>Join the historical sites community</Text>
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

            <View style={styles.inputContainer}>
              <Text style={createInputLabelStyle(theme, !!errors.password, isLoading)}>Password</Text>
              <TextInput
                style={[
                  createInputStyle(
                    theme,
                    'default',
                    'md',
                    !!errors.password,
                    focusedField === 'password',
                    isLoading
                  ),
                  createInputTextStyle(theme, 'md', isLoading)
                ]}
                placeholder="Create a secure password"
                placeholderTextColor={getPlaceholderColor(theme)}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors(prev => ({ ...prev, password: undefined }));
                  }
                  // Also clear confirm password error if passwords now match
                  if (errors.confirmPassword && text === confirmPassword) {
                    setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                secureTextEntry
                autoComplete="new-password"
                editable={!isLoading}
              />
              {errors.password && (
                <Text style={createInputErrorStyle(theme)}>{errors.password}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={createInputLabelStyle(theme, !!errors.confirmPassword, isLoading)}>Confirm Password</Text>
              <TextInput
                style={[
                  createInputStyle(
                    theme,
                    'default',
                    'md',
                    !!errors.confirmPassword,
                    focusedField === 'confirmPassword',
                    isLoading
                  ),
                  createInputTextStyle(theme, 'md', isLoading)
                ]}
                placeholder="Confirm your password"
                placeholderTextColor={getPlaceholderColor(theme)}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) {
                    setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
                secureTextEntry
                autoComplete="new-password"
                editable={!isLoading}
              />
              {errors.confirmPassword && (
                <Text style={createInputErrorStyle(theme)}>{errors.confirmPassword}</Text>
              )}
            </View>

            <TouchableOpacity
              style={createButtonStyle(theme, 'primary', 'md', isLoading)}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.textInverse} />
              ) : (
                <Text style={createButtonTextStyle(theme, 'primary', 'md', isLoading)}>
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={createTypographyStyle(theme, 'body')}>Already have an account? </Text>
            <TouchableOpacity onPress={() => {
              router.push('/(auth)/login');
            }}>
              <Text style={createTypographyStyle(theme, 'link')}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}