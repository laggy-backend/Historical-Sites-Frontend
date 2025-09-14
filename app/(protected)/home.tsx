import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthContext } from '../../contexts/AuthContext';
import { layout, components, colors } from '../../styles';

export default function HomeScreen() {
  const { user, logout } = useAuthContext();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <SafeAreaView style={layout.container}>
      <ScrollView style={layout.scrollContainer}>
        <View style={layout.padding}>
          <Text style={components.heading1}>Welcome to Historical Sites</Text>

          <View style={components.card}>
            <Text style={components.heading3}>User Profile</Text>
            <Text style={components.bodyText}>Email: {user?.email}</Text>
            <Text style={components.bodyText}>Role: {user?.role}</Text>
          </View>

          <View style={components.card}>
            <Text style={components.heading3}>Quick Actions</Text>
            <Text style={components.bodyTextSecondary}>
              Explore historical sites, manage your content, and discover new locations.
            </Text>
          </View>

          <Pressable
            style={[components.button, components.buttonSecondary, { marginTop: 24 }]}
            onPress={handleLogout}
          >
            <Text style={components.buttonText}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}