// app/(auth)/register.tsx
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import { Formik } from "formik";
import { useState } from "react";
import { ActivityIndicator, Button, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as Yup from "yup";

const RegisterSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  password2: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
});

export default function Register() {
  const { register } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (values: any) => {
    try {
      setIsSubmitting(true);
      await register(values.email, values.password, values.password2);
      // Navigation is handled in the AuthContext
    } catch (error: any) {
      console.error(error);

      if (error.response?.data) {
        const data = error.response.data;

        if (data.email) {
          alert(`Email error: ${data.email[0]}`);
        } else if (data.password) {
          alert(`Password error: ${data.password[0]}`);
        } else if (error.response.status === 429) {
          alert("Too many registration attempts. Please try again later.");
        } else {
          alert("Registration failed. Please try again.");
        }
      } else {
        alert("Registration failed. Please check your connection.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 30, textAlign: "center" }}>
        Register
      </Text>
      
      <Formik
        initialValues={{ email: "", password: "", password2: "" }}
        validationSchema={RegisterSchema}
        onSubmit={handleRegister}
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

            <Text style={{ marginTop: 10 }}>Confirm Password:</Text>
            <TextInput
              placeholder="Re-enter your password"
              placeholderTextColor="grey"
              secureTextEntry
              onChangeText={handleChange("password2")}
              onBlur={handleBlur("password2")}
              value={values.password2}
              editable={!isSubmitting}
              style={{ 
                borderWidth: 1, 
                marginBottom: 5, 
                padding: 10, 
                borderRadius: 5,
                opacity: isSubmitting ? 0.5 : 1 
              }}
            />
            {touched.password2 && errors.password2 && (
              <Text style={{ color: "red", marginBottom: 10 }}>{errors.password2}</Text>
            )}

            {isSubmitting ? (
              <ActivityIndicator size="large" color="#331584ff" style={{ marginTop: 20 }} />
            ) : (
              <Button title="Register" color="#331584ff" onPress={handleSubmit as any} />
            )}
            
            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 20 }}>
              <Text>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/login")} disabled={isSubmitting}>
                <Text style={{ color: "blue", textDecorationLine: "underline" }}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Formik>
    </View>
  );
}