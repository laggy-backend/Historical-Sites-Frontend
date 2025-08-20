// app/(tabs)/upload.tsx
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

export default function Upload() {
  const { isLoading, isAuthenticated } = useAuth();

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
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Upload Historical Sites
      </Text>
      <Text style={{ fontSize: 16, textAlign: "center", color: "gray" }}>
        Upload functionality coming soon...
      </Text>
    </View>
  );
}