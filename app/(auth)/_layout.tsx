import { Stack } from 'expo-router'

export default function AuthRoutesLayout() {


  return (
  <Stack>
    <Stack.Screen name = "login" options={{headerShown: false}}></Stack.Screen>
    <Stack.Screen name = "register" options={{headerShown: false}}></Stack.Screen>
    <Stack.Screen name = "forgetpassword" options={{headerShown: false}}></Stack.Screen>
  </Stack>
 )

}