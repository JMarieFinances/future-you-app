import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import { View } from "react-native";
import { OnboardingLineItem } from "./FixedExpensesStep";
import OnboardingHeader from "./OnboardingHeader";

const presets = ["Netflix", "Spotify", "Hulu", "Disney+", "Amazon Prime", "ChatGPT", "Gym Membership", "iCloud"];

export default function SubscriptionsStep({
  items,
  setItems,
  onBack,
  onNext,
}: {
  items: OnboardingLineItem[];
  setItems: (items: OnboardingLineItem[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const addItem = (name = "") => {
    setItems([...items, { id: Date.now().toString(), name, amount: "", dueDay: "" }]);
  };

  const updateItem = (id: string, key: keyof OnboardingLineItem, value: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <>
      <OnboardingHeader
        title="Subscriptions"
        subtitle="Recurring memberships can quietly eat into your safe-to-spend."
        step={5}
        total={12}
      />

      <AppCard>
        <AppText variant="section">Quick Add</AppText>
        <View style={{ marginTop: 12, gap: 8 }}>
          {presets.map((preset) => (
            <AppButton key={preset} title={`+ ${preset}`} onPress={() => addItem(preset)} variant="outline" />
          ))}
        </View>
      </AppCard>

      <View style={{ gap: 12 }}>
        {items.map((item, index) => (
          <AppCard key={item.id}>
            <AppRow>
              <AppText variant="section">Subscription {index + 1}</AppText>
              <AppButton title="Remove" onPress={() => removeItem(item.id)} variant="outline" />
            </AppRow>

            <View style={{ marginTop: 12, gap: 12 }}>
              <AppInput placeholder="Name" value={item.name} onChangeText={(text) => updateItem(item.id, "name", text)} />
              <AppInput placeholder="Monthly amount" value={item.amount} onChangeText={(text) => updateItem(item.id, "amount", text)} keyboardType="numeric" />
              <AppInput placeholder="Due day of month" value={item.dueDay ?? ""} onChangeText={(text) => updateItem(item.id, "dueDay", text)} keyboardType="numeric" />
            </View>
          </AppCard>
        ))}
      </View>

      <AppButton title="Add Custom Subscription" onPress={() => addItem()} variant="outline" />

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