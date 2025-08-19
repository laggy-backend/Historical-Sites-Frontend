import { Formik } from "formik";
import { Button, Text, TextInput, View } from "react-native";
import * as Yup from "yup";

// Validation schema
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
  const handleRegister = (values: any) => {
    // call your API here
    console.log("Register with:", values);
    alert("Registered successfully!");
  };

  return (
    <Formik
      initialValues={{ email: "", password: "", password2: "" }}
      validationSchema={RegisterSchema}
      onSubmit={handleRegister}
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

          <Text>Confirm Password:</Text>
          <TextInput
            placeholder="Re-enter your password"
            placeholderTextColor="grey"
            secureTextEntry
            onChangeText={handleChange("password2")}
            onBlur={handleBlur("password2")}
            value={values.password2}
            style={{ borderWidth: 1, marginBottom: 5, padding: 5 }}
          />
          {touched.password2 && errors.password2 && <Text style={{ color: "red" }}>{errors.password2}</Text>}

          <Button title="Register" color="#331584ff" onPress={handleSubmit as any} />
        </View>
      )}
    </Formik>
  );
}
