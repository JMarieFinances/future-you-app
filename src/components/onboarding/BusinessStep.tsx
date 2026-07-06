import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppText from "@/components/ui/AppText";
import { Pressable, View } from "react-native";
import OnboardingHeader from "./OnboardingHeader";

type IncomeMode = "main" | "combined" | "separate";

export default function BusinessStep({
  hasBusiness,
  setHasBusiness,
  businessName,
  setBusinessName,
  businessIncome,
  setBusinessIncome,
  incomeMode,
  setIncomeMode,
  onBack,
  onNext,
}: {
  hasBusiness: boolean;
  setHasBusiness: (value: boolean) => void;
  businessName: string;
  setBusinessName: (value: string) => void;
  businessIncome: string;
  setBusinessIncome: (value: string) => void;
  incomeMode: IncomeMode;
  setIncomeMode: (value: IncomeMode) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <OnboardingHeader
        title="Do you own a business or side hustle?"
        subtitle="Future You can keep business money separate or combine it."
        step={7}
        total={9}
      />

      <View style={{ gap: 10 }}>
        <Choice
          label="No business right now"
          active={!hasBusiness}
          onPress={() => setHasBusiness(false)}
        />

        <Choice
          label="Yes, I have business income"
          active={hasBusiness}
          onPress={() => setHasBusiness(true)}
        />
      </View>

      {hasBusiness ? (
        <AppCard>
          <View style={{ gap: 12 }}>
            <AppInput
              placeholder="Business name"
              value={businessName}
              onChangeText={setBusinessName}
            />

            <AppInput
              placeholder="Monthly business income"
              value={businessIncome}
              onChangeText={setBusinessIncome}
              keyboardType="numeric"
            />

            <Choice
              label="This is my primary income"
              active={incomeMode === "main"}
              onPress={() => setIncomeMode("main")}
            />

            <Choice
              label="Combine it with my personal income"
              active={incomeMode === "combined"}
              onPress={() => setIncomeMode("combined")}
            />

            <Choice
              label="Keep it completely separate"
              active={incomeMode === "separate"}
              onPress={() => setIncomeMode("separate")}
            />
          </View>
        </AppCard>
      ) : null}

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

function Choice({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <AppCard>
        <AppText variant={active ? "bold" : "muted"}>
          {active ? "✓ " : ""}
          {label}
        </AppText>
      </AppCard>
    </Pressable>
  );
}