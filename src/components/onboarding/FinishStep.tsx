import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppText from "@/components/ui/AppText";
import { View } from "react-native";
import OnboardingHeader from "./OnboardingHeader";

export default function FinishStep({
  billCount,
  hasHousehold,
  hasBusiness,
  onBack,
  onFinish,
}: {
  billCount: number;
  hasHousehold: boolean;
  hasBusiness: boolean;
  onBack: () => void;
  onFinish: () => void;
}) {
  return (
    <>
      <OnboardingHeader
        title="You're ready."
        subtitle="Here's what Future You built for you."
        step={9}
        total={9}
      />

      <AppCard>
        <View style={{ gap: 8 }}>
          <AppText variant="muted">✓ Personal budget</AppText>
          <AppText variant="muted">✓ {billCount} bill{billCount === 1 ? "" : "s"} scheduled</AppText>
          <AppText variant="muted">✓ Starter goal</AppText>
          <AppText variant="muted">✓ Calendar reminders</AppText>
          <AppText variant="muted">✓ Monthly review</AppText>
          {hasHousehold ? <AppText variant="muted">✓ Household budget</AppText> : null}
          {hasBusiness ? <AppText variant="muted">✓ Business budget</AppText> : null}
        </View>
      </AppCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <AppButton title="Back" onPress={onBack} variant="outline" />
        </View>

        <View style={{ flex: 1 }}>
          <AppButton title="Open Future You" onPress={onFinish} />
        </View>
      </View>
    </>
  );
}