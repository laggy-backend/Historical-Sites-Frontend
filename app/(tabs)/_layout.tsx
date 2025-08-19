import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',headerShown: false
        }}
      />

      <Tabs.Screen
        name="upload"
        options={{
          title: 'upload',headerShown: false
        }}
      />

    </Tabs>
    
  );
}
