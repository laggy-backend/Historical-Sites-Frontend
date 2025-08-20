import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import { useState } from "react";
import { ActivityIndicator, Button, Text, TextInput, TouchableOpacity, View } from "react-native";
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
    } catch (error: any) {
      if (error.response?.status === 401) {
        alert("Invalid email or password");
      } else if (error.response?.status === 429) {
        alert("Too many login attempts. Please try again later.");
      } else {
        alert("Login failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 30, textAlign: "center" }}>
        Login
      </Text>
      
      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={LoginSchema}
        onSubmit={handleLogin}
      >
        {({ handleChange, handleSubmit, values, errors, touched, handleBlur }) => (
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
              editable={!isSubmitting}
              style={{ 
                borderWidth: 1, 
                marginBottom: 5, 
                padding: 10, 
                borderRadius: 5,
                opacity: isSubmitting ? 0.5 : 1 
              }}
            />
            {touched.email && errors.email && (
              <Text style={{ color: "red", marginBottom: 10 }}>{errors.email}</Text>
            )}

            <Text style={{ marginTop: 10 }}>Password:</Text>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="grey"
              secureTextEntry
              onChangeText={handleChange("password")}
              onBlur={handleBlur("password")}
              value={values.password}
              editable={!isSubmitting}
              style={{ 
                borderWidth: 1, 
                marginBottom: 5, 
                padding: 10, 
                borderRadius: 5,
                opacity: isSubmitting ? 0.5 : 1 
              }}
            />
            {touched.password && errors.password && (
              <Text style={{ color: "red", marginBottom: 10 }}>{errors.password}</Text>
            )}

            {isSubmitting ? (
              <ActivityIndicator size="large" color="#331584ff" style={{ marginTop: 20 }} />
            ) : (
              <Button title="Login" color="#331584ff" onPress={handleSubmit as any} />
            )}

            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 20 }}>
              <Text>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/register")} disabled={isSubmitting}>
                <Text style={{ color: "blue", textDecorationLine: "underline" }}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Formik>
    </View>
  );
}