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
  createButtonStyle,
  createButtonTextStyle,
  createInputErrorStyle,
  createInputLabelStyle,
  createInputStyle,
  createInputTextStyle,
  createStyles,
  createTypographyStyle,
  flexFull,
  getPlaceholderColor,
  rowCenter,
  useTheme
} from '../../styles';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { login } = useAuth();
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
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    const result = await login(email.toLowerCase().trim(), password);
    setIsLoading(false);

    if (result.success) {
      router.replace('/(protected)');
    } else {
      Alert.alert('Login Failed', result.error || 'An error occurred');
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
            <Text style={createTypographyStyle(theme, 'h1')}>Welcome Back</Text>
            <Text style={createTypographyStyle(theme, 'body')}>Sign in to access historical sites</Text>
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
                placeholder="Enter your password"
                placeholderTextColor={getPlaceholderColor(theme)}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors(prev => ({ ...prev, password: undefined }));
                  }
                }}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                autoComplete="password"
                textContentType="password"
                keyboardType="default"
                importantForAutofill="no"
                editable={!isLoading}
              />
              {errors.password && (
                <Text style={createInputErrorStyle(theme)}>{errors.password}</Text>
              )}
            </View>

            <View style={{ alignItems: 'flex-end', marginBottom: theme.spacing.md }}>
              <TouchableOpacity onPress={() => {
                router.push('/(auth)/reset-password');
              }}>
                <Text style={createTypographyStyle(theme, 'link')}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={createButtonStyle(theme, 'primary', 'md', isLoading)}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.textInverse} />
              ) : (
                <Text style={createButtonTextStyle(theme, 'primary', 'md', isLoading)}>
                  Sign In
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={createTypographyStyle(theme, 'body')}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => {
              router.push('/(auth)/register');
            }}>
              <Text style={createTypographyStyle(theme, 'link')}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

