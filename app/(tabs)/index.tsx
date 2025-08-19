import { Redirect } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  const user = false; 

  if (!user) {
    return <Redirect href="/(auth)/forgetpassword" />;
  }

  return (
    <View>
      <Text>Home Page!</Text>
    </View>
  );
}
