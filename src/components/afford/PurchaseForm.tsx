import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppText from "@/components/ui/AppText";
import { Pressable, View } from "react-native";
import { PurchaseType } from "./affordUtils";

const categories = [
  "Shopping",
  "Food",
  "Dining Out",
  "Entertainment",
  "Travel",
  "Personal Care",
  "Household",
  "Other",
];

export default function PurchaseForm({
  name,
  setName,
  amount,
  setAmount,
  category,
  setCategory,
  purchaseType,
  setPurchaseType,
  onSave,
}: {
  name: string;
  setName: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  purchaseType: PurchaseType;
  setPurchaseType: (value: PurchaseType) => void;
  onSave: () => void;
}) {
  return (
    <AppCard>
      <AppText variant="section">Purchase</AppText>

      <View style={{ marginTop: 12, gap: 12 }}>
        <AppInput placeholder="What are you buying?" value={name} onChangeText={setName} />

        <AppInput
          placeholder="Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <AppText variant="bold">Category</AppText>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {categories.map((item) => (
            <Choice
              key={item}
              label={item}
              active={category === item}
              onPress={() => setCategory(item)}
            />
          ))}
        </View>

        <AppText variant="bold">Type</AppText>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Choice
              label="One Time"
              active={purchaseType === "one-time"}
              onPress={() => setPurchaseType("one-time")}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Choice
              label="Monthly"
              active={purchaseType === "monthly"}
              onPress={() => setPurchaseType("monthly")}
            />
          </View>
        </View>

        <AppButton title="Save Purchase" onPress={onSave} />
      </View>
    </AppCard>
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