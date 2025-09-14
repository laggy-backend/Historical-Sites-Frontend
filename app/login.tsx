import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useAuthContext } from '../contexts/AuthContext';
import { layout, components, colors } from '../styles';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthContext();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(protected)/home');
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={layout.container}>
      <KeyboardAvoidingView
        style={layout.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[layout.container, layout.padding]}>
          <View style={layout.flexCenter}>
            <Text style={components.heading1}>Welcome Back</Text>
            <Text style={[components.bodyTextSecondary, { textAlign: 'center', marginBottom: 32 }]}>
              Sign in to explore historical sites
            </Text>

            <View style={{ width: '100%', maxWidth: 400 }}>
              <View style={components.formGroup}>
                <Text style={components.label}>Email</Text>
                <TextInput
                  style={components.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View style={components.formGroup}>
                <Text style={components.label}>Password</Text>
                <TextInput
                  style={components.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  autoComplete="password"
                />
              </View>

              <Pressable
                style={[
                  components.button,
                  components.buttonPrimary,
                  isLoading && { opacity: 0.7 },
                ]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={components.buttonText}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
              </Pressable>

              <View style={[layout.flexRowCenter, { marginTop: 16 }]}>
                <Link href="/forgot-password" asChild>
                  <Pressable>
                    <Text style={[components.bodyText, { color: colors.primary }]}>
                      Forgot Password?
                    </Text>
                  </Pressable>
                </Link>
              </View>

              <View style={[layout.flexRowCenter, { marginTop: 16 }]}>
                <Text style={components.bodyTextSecondary}>Don't have an account? </Text>
                <Link href="/register" asChild>
                  <Pressable>
                    <Text style={[components.bodyText, { color: colors.primary }]}>
                      Sign Up
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}