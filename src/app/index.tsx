import { loadAppData } from "@/lib/appStore";
import { getPlanData } from "@/lib/planStore";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function HomeScreen() {
  useEffect(() => {
    const initialize = async () => {
      await loadAppData();

      const plan = getPlanData();

      if (plan.income > 0) {
        router.replace("/(tabs)/dashboard");
      } else {
        router.replace("/setup");
      }
    };

    initialize();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" />
    </View>
  );
}