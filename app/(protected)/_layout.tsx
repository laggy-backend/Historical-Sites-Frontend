import { Redirect, Slot } from 'expo-router';
import { useAuthContext } from '../../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { layout, colors } from '../../styles';

export default function ProtectedLayout() {
  const { user, isLoading } = useAuthContext();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <View style={[layout.flexCenter, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Redirect href="/login" />;
  }

  // Render protected content if authenticated
  return <Slot />;
}