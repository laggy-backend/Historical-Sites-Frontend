// app/(auth)/login.tsx
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import * as Yup from "yup";

const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      setIsSubmitting(true);
      await login(values.email, values.password);
      // Navigation is handled in AuthContext on success
    } catch (error: any) {
      // More detailed error handling
      let errorMessage = "Login failed. Please try again.";
      
      if (error.message?.includes('timeout')) {
        errorMessage = "Request timed out. Please check your connection and try again.";
      } else if (error.message?.includes('Network')) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.response?.status === 401) {
        errorMessage = "Invalid email or password.";
      } else if (error.response?.status === 429) {
        errorMessage = "Too many login attempts. Please try again later.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 30, textAlign: "center" }}>
          Login
        </Text>
        
        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={LoginSchema}
          onSubmit={handleLogin}
          validateOnMount={false}
        >
          {({ handleChange, handleSubmit, values, errors, touched, handleBlur, isValid }) => (
            <View>
              <Text>Email:</Text>
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor="grey"
                onChangeText={handleChange("email")}
                onBlur={handleBlur("email")}
                value={values.email}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                editable={!isSubmitting}
                style={{ 
                  borderWidth: 1, 
                  marginBottom: 5, 
                  padding: 10, 
                  borderRadius: 5,
                  borderColor: touched.email && errors.email ? "red" : "#ccc",
                  opacity: isSubmitting ? 0.5 : 1 
                }}
              />
              {touched.email && errors.email && (
                <Text style={{ color: "red", marginBottom: 10, fontSize: 12 }}>{errors.email}</Text>
              )}

              <Text style={{ marginTop: 10 }}>Password:</Text>
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor="grey"
                secureTextEntry
                onChangeText={handleChange("password")}
                onBlur={handleBlur("password")}
                value={values.password}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
                style={{ 
                  borderWidth: 1, 
                  marginBottom: 5, 
                  padding: 10, 
                  borderRadius: 5,
                  borderColor: touched.password && errors.password ? "red" : "#ccc",
                  opacity: isSubmitting ? 0.5 : 1 
                }}
              />
              {touched.password && errors.password && (
                <Text style={{ color: "red", marginBottom: 10, fontSize: 12 }}>{errors.password}</Text>
              )}

              <View style={{ marginTop: 20 }}>
                {isSubmitting ? (
                  <ActivityIndicator size="large" color="#331584ff" />
                ) : (
                  <Button 
                    title="Login" 
                    color="#331584ff" 
                    onPress={handleSubmit as any}
                    disabled={!isValid || !values.email || !values.password}
                  />
                )}
              </View>

              <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 20 }}>
                <Text>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/register")} disabled={isSubmitting}>
                  <Text style={{ 
                    color: isSubmitting ? "grey" : "blue", 
                    textDecorationLine: "underline" 
                  }}>
                    Register
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}