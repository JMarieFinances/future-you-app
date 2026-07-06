import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import { View } from "react-native";
import OnboardingHeader from "./OnboardingHeader";

export type OnboardingBill = {
  id: string;
  name: string;
  amount: string;
  dueDay: string;
};

export default function BillsStep({
  bills,
  setBills,
  onBack,
  onNext,
}: {
  bills: OnboardingBill[];
  setBills: (value: OnboardingBill[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const addBill = () => {
    setBills([
      ...bills,
      {
        id: Date.now().toString(),
        name: "",
        amount: "",
        dueDay: "",
      },
    ]);
  };

  const updateBill = (
    id: string,
    key: keyof OnboardingBill,
    value: string
  ) => {
    setBills(
      bills.map((bill) =>
        bill.id === id ? { ...bill, [key]: value } : bill
      )
    );
  };

  const removeBill = (id: string) => {
    setBills(bills.filter((bill) => bill.id !== id));
  };

  return (
    <>
      <OnboardingHeader
        title="Now let's cover the essentials."
        subtitle="Bills are removed before Future You calculates what is safe to spend."
        step={4}
        total={9}
      />

      <View style={{ gap: 12 }}>
        {bills.map((bill, index) => (
          <AppCard key={bill.id}>
            <AppRow>
              <AppText variant="section">Bill {index + 1}</AppText>
              <AppButton
                title="Remove"
                onPress={() => removeBill(bill.id)}
                variant="outline"
              />
            </AppRow>

            <View style={{ marginTop: 12, gap: 12 }}>
              <AppInput
                placeholder="Bill name"
                value={bill.name}
                onChangeText={(text) => updateBill(bill.id, "name", text)}
              />

              <AppInput
                placeholder="Amount"
                value={bill.amount}
                onChangeText={(text) => updateBill(bill.id, "amount", text)}
                keyboardType="numeric"
              />

              <AppInput
                placeholder="Due day of month"
                value={bill.dueDay}
                onChangeText={(text) => updateBill(bill.id, "dueDay", text)}
                keyboardType="numeric"
              />
            </View>
          </AppCard>
        ))}
      </View>

      <AppButton title="Add Bill" onPress={addBill} variant="outline" />

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