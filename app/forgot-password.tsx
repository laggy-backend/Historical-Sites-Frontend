import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useAuthContext } from '../contexts/AuthContext';
import { layout, components, colors } from '../styles';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { requestPasswordReset } = useAuthContext();

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setEmailSent(true);
    } catch (error) {
      // The API returns success even if email doesn't exist (security)
      // So we show success message regardless
      setEmailSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView style={layout.container}>
        <View style={[layout.container, layout.padding]}>
          <View style={layout.flexCenter}>
            <Text style={components.heading1}>Check Your Email</Text>
            <Text style={[components.bodyTextSecondary, { textAlign: 'center', marginBottom: 32 }]}>
              We've sent a password reset link to {email}
            </Text>

            <Text style={[components.bodyTextSecondary, { textAlign: 'center', marginBottom: 32 }]}>
              If you don't see the email in your inbox, please check your spam folder.
            </Text>

            <View style={{ width: '100%', maxWidth: 400 }}>
              <Pressable
                style={[components.button, components.buttonPrimary]}
                onPress={() => router.replace('/login')}
              >
                <Text style={components.buttonText}>Back to Login</Text>
              </Pressable>

              <Pressable
                style={[components.button, components.buttonOutline, { marginTop: 16 }]}
                onPress={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
              >
                <Text style={components.buttonTextOutline}>Send Another Email</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={layout.container}>
      <KeyboardAvoidingView
        style={layout.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[layout.container, layout.padding]}>
          <View style={layout.flexCenter}>
            <Text style={components.heading1}>Reset Password</Text>
            <Text style={[components.bodyTextSecondary, { textAlign: 'center', marginBottom: 32 }]}>
              Enter your email address and we'll send you a link to reset your password
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

              <Pressable
                style={[
                  components.button,
                  components.buttonPrimary,
                  isLoading && { opacity: 0.7 },
                ]}
                onPress={handlePasswordReset}
                disabled={isLoading}
              >
                <Text style={components.buttonText}>
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Text>
              </Pressable>

              <View style={[layout.flexRowCenter, { marginTop: 16 }]}>
                <Text style={components.bodyTextSecondary}>Remember your password? </Text>
                <Link href="/login" asChild>
                  <Pressable>
                    <Text style={[components.bodyText, { color: colors.primary }]}>
                      Sign In
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