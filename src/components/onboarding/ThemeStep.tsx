import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppText from "@/components/ui/AppText";
import { themes, ThemeType } from "@/lib/settingsStore";
import { Pressable, View } from "react-native";
import OnboardingHeader from "./OnboardingHeader";

export default function ThemeStep({
  selectedTheme,
  setSelectedTheme,
  onBack,
  onNext,
}: {
  selectedTheme: ThemeType;
  setSelectedTheme: (value: ThemeType) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <OnboardingHeader
        title="One last thing."
        subtitle="Let's make Future You feel like yours."
        step={8}
        total={9}
      />

      <View style={{ gap: 10 }}>
        {themes.map((theme) => (
          <Pressable
            key={theme.id}
            onPress={() => setSelectedTheme(theme.id)}
          >
            <AppCard>
              <AppText
                variant={selectedTheme === theme.id ? "bold" : "muted"}
              >
                {selectedTheme === theme.id ? "✓ " : ""}
                {theme.emoji} {theme.name}
              </AppText>

              <AppText variant="muted">{theme.description}</AppText>
            </AppCard>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <AppButton title="Back" onPress={onBack} variant="outline" />
        </View>

        <View style={{ flex: 1 }}>
          <AppButton title="Continue" onPress={onNext} />
        </View>
      </View>
    </>
  );
}