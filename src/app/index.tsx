import { getAppData, loadAppData } from "@/lib/appStore";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function HomeScreen() {
  useEffect(() => {
    const initialize = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/auth");
        return;
      }

      await loadAppData();

      const app = getAppData();

      if (!app.settings.onboarded) {
        router.replace("/onboarding");
        return;
      }

      router.replace("/(tabs)/today");
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