// app/(tabs)/index.tsx
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "expo-router";
import { ActivityIndicator, Button, Text, View } from "react-native";

export default function Index() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#331584ff" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 60 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Welcome to Historical Sites!
      </Text>
      
      {user && (
        <View style={{ marginBottom: 30 }}>
          <Text style={{ fontSize: 16, marginBottom: 5 }}>
            Logged in as: {user.email}
          </Text>
          <Text style={{ fontSize: 14, color: "gray" }}>
            Member since: {new Date(user.created_at).toLocaleDateString()}
          </Text>
        </View>
      )}

      <View style={{ marginTop: "auto", marginBottom: 20 }}>
        <Button title="Logout" color="#FF3B30" onPress={logout} />
      </View>
    </View>
  );
}