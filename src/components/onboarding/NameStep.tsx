import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppText from "@/components/ui/AppText";
import { View } from "react-native";
import OnboardingHeader from "./OnboardingHeader";

export default function NameStep({
  name,
  setName,
  onBack,
  onNext,
}: {
  name: string;
  setName: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <OnboardingHeader
        title="First..."
        subtitle="What should Future You call you?"
        step={2}
        total={9}
      />

      <AppCard>
        <AppInput
          placeholder="Your name"
          value={name}
          onChangeText={setName}
        />

        {name.trim() ? (
          <View style={{ marginTop: 12 }}>
            <AppText variant="muted">Nice to meet you, {name.trim()}.</AppText>
          </View>
        ) : null}
      </AppCard>

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