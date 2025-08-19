import { loginUser } from "@/services/authService";
import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    setMessage("");
    try {
      await loginUser(email, password);
      setMessage("Login Successful");
    } catch (error) {
      console.error(error);
      setMessage("Login Failed. Check your credentials");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Email:</Text>
      <TextInput
        placeholder="Enter your email"
        placeholderTextColor="grey"
        onChangeText={text => setEmail(text.toLowerCase())}
        value={email}
        style={{ borderWidth: 1, marginBottom: 10, padding: 5 }}
      />

      <Text>Password:</Text>
      <TextInput
        placeholder="Enter your password"
        placeholderTextColor="grey"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
        style={{ borderWidth: 1, marginBottom: 10, padding: 5 }}
      />

      <Button
        title="Submit"
        color="#331584ff"
        onPress={handleLogin}
      />

      {message ? (
        <Text style={{ marginTop: 10, color: message.includes('Failed') ? 'red' : 'green' }}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}
