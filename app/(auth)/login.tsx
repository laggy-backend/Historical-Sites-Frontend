import { loginUser } from "@/services/authService";
import { Formik } from "formik";
import { Button, Text, TextInput, View } from "react-native";
import * as Yup from "yup";

const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export default function Login() {
  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      await loginUser(values.email, values.password);
      alert("Login Successful");
    } catch (error) {
      alert("Login Failed. Check your credentials");
    }
  };

  return (
    <Formik
      initialValues={{ email: "", password: "" }}
      validationSchema={LoginSchema}
      onSubmit={handleLogin}
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

          <Text>Password:</Text>
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor="grey"
            secureTextEntry
            onChangeText={handleChange("password")}
            onBlur={handleBlur("password")}
            value={values.password}
            style={{ borderWidth: 1, marginBottom: 5, padding: 5 }}
          />
          {touched.password && errors.password && <Text style={{ color: "red" }}>{errors.password}</Text>}

          <Button title="Login" color="#331584ff" onPress={handleSubmit as any} />
        </View>
      )}
    </Formik>
  );
}
