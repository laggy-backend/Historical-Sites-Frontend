import { Redirect } from 'expo-router';
import { useAuthContext } from '../contexts/AuthContext';
import { Loading } from '../components';

export default function Index() {
  const { user, isLoading } = useAuthContext();

  if (isLoading) {
    return <Loading message="Checking authentication..." />;
  }

  // Redirect to appropriate screen based on auth state
  if (user) {
    return <Redirect href="/(protected)/home" />;
  }

  return <Redirect href="/login" />;
}
