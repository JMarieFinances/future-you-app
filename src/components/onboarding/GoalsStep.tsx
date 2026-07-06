import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppText from "@/components/ui/AppText";
import { Pressable, View } from "react-native";
import OnboardingHeader from "./OnboardingHeader";

const templates = [
  { emoji: "🚨", name: "Emergency Fund", target: "1000", monthly: "100" },
  { emoji: "✈️", name: "Vacation", target: "1500", monthly: "150" },
  { emoji: "🏡", name: "House", target: "10000", monthly: "300" },
  { emoji: "🚗", name: "Car", target: "5000", monthly: "250" },
  { emoji: "💼", name: "Business", target: "2500", monthly: "200" },
];

export type OnboardingGoal = {
  emoji: string;
  name: string;
  target: string;
  monthly: string;
};

export default function GoalsStep({
  goal,
  setGoal,
  onBack,
  onNext,
}: {
  goal: OnboardingGoal;
  setGoal: (goal: OnboardingGoal) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <OnboardingHeader
        title="What are we working toward?"
        subtitle="Future You will turn this into your first goal."
        step={5}
        total={9}
      />

      <AppCard>
        <AppText variant="section">Choose a starter goal</AppText>

        <View style={{ marginTop: 12, gap: 8 }}>
          {templates.map((template) => (
            <Pressable
              key={template.name}
              onPress={() => setGoal(template)}
            >
              <AppCard>
                <AppText
                  variant={goal.name === template.name ? "bold" : "muted"}
                >
                  {goal.name === template.name ? "✓ " : ""}
                  {template.emoji} {template.name}
                </AppText>
              </AppCard>
            </Pressable>
          ))}
        </View>
      </AppCard>

      <AppCard>
        <View style={{ gap: 12 }}>
          <AppInput
            placeholder="Goal name"
            value={goal.name}
            onChangeText={(text) => setGoal({ ...goal, name: text })}
          />

          <AppInput
            placeholder="Target amount"
            value={goal.target}
            onChangeText={(text) => setGoal({ ...goal, target: text })}
            keyboardType="numeric"
          />

          <AppInput
            placeholder="Monthly contribution"
            value={goal.monthly}
            onChangeText={(text) => setGoal({ ...goal, monthly: text })}
            keyboardType="numeric"
          />
        </View>
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