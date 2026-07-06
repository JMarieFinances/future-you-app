import AppButton from "@/components/ui/AppButton";
import AppPage from "@/components/ui/AppPage";
import AppText from "@/components/ui/AppText";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Alert, View } from "react-native";

export default function DevScreen() {
  async function resetApp() {
    await AsyncStorage.clear();

    Alert.alert(
      "App Reset",
      "All local data has been cleared."
    );

    router.replace("/onboarding");
  }

  async function runOnboarding() {
    router.replace("/onboarding");
  }

  return (
    <AppPage>
      <AppText variant="title">
        Developer Tools
      </AppText>

      <View style={{ marginTop: 20, gap: 16 }}>
        <AppButton
          title="🔄 Reset App"
          onPress={resetApp}
        />

        <AppButton
          title="🚀 Run Onboarding"
          variant="outline"
          onPress={runOnboarding}
        />
      </View>
    </AppPage>
  );
}