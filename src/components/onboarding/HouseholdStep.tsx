import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppText from "@/components/ui/AppText";
import { Pressable, View } from "react-native";
import OnboardingHeader from "./OnboardingHeader";

export default function HouseholdStep({
  hasHousehold,
  setHasHousehold,
  householdName,
  setHouseholdName,
  householdContribution,
  setHouseholdContribution,
  householdIncluded,
  setHouseholdIncluded,
  onBack,
  onNext,
}: {
  hasHousehold: boolean;
  setHasHousehold: (value: boolean) => void;
  householdName: string;
  setHouseholdName: (value: string) => void;
  householdContribution: string;
  setHouseholdContribution: (value: string) => void;
  householdIncluded: boolean;
  setHouseholdIncluded: (value: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <OnboardingHeader
        title="Do you share finances?"
        subtitle="We'll keep household money from being counted twice."
        step={6}
        total={9}
      />

      <View style={{ gap: 10 }}>
        <Choice
          label="No, just personal budgeting"
          active={!hasHousehold}
          onPress={() => setHasHousehold(false)}
        />

        <Choice
          label="Yes, I share bills or household money"
          active={hasHousehold}
          onPress={() => setHasHousehold(true)}
        />
      </View>

      {hasHousehold ? (
        <AppCard>
          <View style={{ gap: 12 }}>
            <AppInput
              placeholder="Household name"
              value={householdName}
              onChangeText={setHouseholdName}
            />

            <AppInput
              placeholder="Monthly household contribution"
              value={householdContribution}
              onChangeText={setHouseholdContribution}
              keyboardType="numeric"
            />

            <Choice
              label="This is already included in my bills"
              active={householdIncluded}
              onPress={() => setHouseholdIncluded(true)}
            />

            <Choice
              label="Subtract this separately from my personal plan"
              active={!householdIncluded}
              onPress={() => setHouseholdIncluded(false)}
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