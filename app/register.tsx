import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useAuthContext } from '../contexts/AuthContext';
import { layout, components, colors } from '../styles';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuthContext();

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await register(email.trim().toLowerCase(), password);
      Alert.alert(
        'Success',
        'Account created successfully! You can now sign in.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    } catch (error) {
      Alert.alert('Registration Failed', 'Unable to create account. Please try again.');
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
            <Text style={components.heading1}>Create Account</Text>
            <Text style={[components.bodyTextSecondary, { textAlign: 'center', marginBottom: 32 }]}>
              Join us to explore historical sites
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
                  autoComplete="new-password"
                />
              </View>

              <View style={components.formGroup}>
                <Text style={components.label}>Confirm Password</Text>
                <TextInput
                  style={components.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  secureTextEntry
                  autoComplete="new-password"
                />
              </View>

              <Pressable
                style={[
                  components.button,
                  components.buttonPrimary,
                  isLoading && { opacity: 0.7 },
                ]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                <Text style={components.buttonText}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </Pressable>

              <View style={[layout.flexRowCenter, { marginTop: 16 }]}>
                <Text style={components.bodyTextSecondary}>Already have an account? </Text>
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