import { router } from "expo-router";
import { Formik } from "formik";
import { Button, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as Yup from "yup";

// Validation schema
const ForgetPasswordSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
});

export default function ForgetPassword() {
  const handleForgetPassword = async (values: { email: string }) => {
    try {
      //await sendPasswordResetEmail(values.email); // 
      alert("Password reset link sent to your email!");
    } catch (error) {
      alert("Failed to send reset link. Try again.");
    }
  };

  return (
    <Formik
      initialValues={{ email: "" }}
      validationSchema={ForgetPasswordSchema}
      onSubmit={handleForgetPassword}
    >
      {({ handleChange, handleSubmit, values, errors, touched, handleBlur }) => (
        <View style={{ padding: 20 }}>
          <Text>Email:</Text>
          <TextInput
            placeholder="Enter your email"
            placeholderTextColor="grey"
            onChangeText={handleChange("email")}
            onBlur={handleBlur("email")}
            value={values.email}
            autoCapitalize="none"
            style={{ borderWidth: 1, marginBottom: 5, padding: 5 }}
          />
          {touched.email && errors.email && <Text style={{ color: "red" }}>{errors.email}</Text>}

          <Button title="Send Reset Link" color="#331584ff" onPress={handleSubmit as any} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 15 }}>

          <TouchableOpacity onPress={() => router.push("/login")}>
                        <Text style={{ color: "blue" }}>Go back to login?</Text>
                      </TouchableOpacity>
        </View>
        </View>

      )}
    </Formik>
  );
}
