import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard", tabBarIcon: () => <Text>🏠</Text> }} />
      <Tabs.Screen name="goals" options={{ title: "Goals", tabBarIcon: () => <Text>🎯</Text> }} />
      <Tabs.Screen name="plan" options={{ title: "Plan", tabBarIcon: () => <Text>📋</Text> }} />
      <Tabs.Screen name="afford" options={{ title: "Afford", tabBarIcon: () => <Text>🛒</Text> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: () => <Text>👤</Text> }} />
    </Tabs>
  );
}