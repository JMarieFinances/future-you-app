import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { getBusinesses } from "@/lib/businessStore";
import { addPurchase, updatePurchase } from "@/lib/purchaseStore";
import { Business, Purchase } from "@/lib/types";
import { useTheme } from "@/lib/useTheme";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { BusinessSectionKey, businessSections } from "./businessData";

export default function NewBusinessTransaction({
  business,
  transaction,
  onBack,
  onSave,
}: {
  business: Business;
  transaction?: Purchase | null;
  onBack: () => void;
  onSave: (business: Business) => void;
}) {
  const { colors } = useTheme();

  const [section, setSection] = useState<BusinessSectionKey>(
    (transaction?.category as BusinessSectionKey) ?? "businessSpending"
  );
  const [itemName, setItemName] = useState(transaction?.subcategory ?? "");
  const [transactionName, setTransactionName] = useState(transaction?.name ?? "");
  const [amount, setAmount] = useState(
    transaction ? String(transaction.amount) : ""
  );
  const [notes, setNotes] = useState(transaction?.notes ?? "");

  const selectedSection = business.budget[section];
  const transactionType = section === "revenueSources" ? "income" : "expense";
  const selectedItem = selectedSection.find((item) => item.name === itemName);
  const amountNumber = Number(amount) || 0;

  const handleSave = async () => {
    if (!itemName || amountNumber <= 0) return;

    const savedTransaction: Purchase = {
      id: transaction?.id ?? Date.now().toString(),
      name: transactionName.trim() || itemName,
      amount: amountNumber,
      type: transactionType,
      budgetType: "business",
      budgetId: business.id,
      category: section,
      subcategory: itemName,
      date: transaction?.date ?? new Date().toISOString(),
      notes: notes.trim(),
    };

    if (transaction) {
      await updatePurchase(savedTransaction);
    } else {
      await addPurchase(savedTransaction);
    }

    const updated = getBusinesses().find((item) => item.id === business.id);

    if (updated) onSave(updated);
    else onBack();
  };

  return (
    <AppPage>
      <AppButton title="Back to Dashboard" onPress={onBack} variant="outline" />

      <PageHeader
        title={transaction ? "Edit Business Transaction" : "Add Business Transaction"}
        subtitle="Log or update revenue, expenses, spending, or savings activity."
      />

      <AppCard>
        <AppText variant="muted">Transaction Type</AppText>

        <View style={{ marginTop: 4 }}>
          <AppText variant="title">
            {transactionType === "income" ? "Income" : "Expense"}
          </AppText>
        </View>

        <AppText variant="muted">
          Choose a category and item so Future You can update your business dashboard automatically.
        </AppText>
      </AppCard>

      <AppCard>
        <AppText variant="section">Category</AppText>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {businessSections.map((option) => (
            <Chip
              key={option.key}
              label={option.title}
              active={section === option.key}
              onPress={() => {
                setSection(option.key);
                setItemName("");
                setTransactionName("");
              }}
            />
          ))}
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="section">Budget Item</AppText>

        <View style={{ marginTop: 12 }}>
          {selectedSection.length === 0 ? (
            <EmptyState message="No budget items in this category yet. Edit the business budget first." />
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {selectedSection.map((item) => (
                <Chip
                  key={item.id}
                  label={item.name}
                  active={itemName === item.name}
                  onPress={() => {
                    setItemName(item.name);
                    setTransactionName(item.name);
                  }}
                />
              ))}
            </View>
          )}
        </View>
      </AppCard>

      {selectedItem ? (
        <AppCard>
          <AppText variant="section">{selectedItem.name}</AppText>

          <View style={{ marginTop: 10, gap: 8 }}>
            <AppRow>
              <AppText variant="muted">Budget</AppText>
              <AppText variant="bold">${selectedItem.budget.toFixed(2)}</AppText>
            </AppRow>

            <AppRow>
              <AppText variant="muted">Already Spent</AppText>
              <AppText variant="bold">${selectedItem.spent.toFixed(2)}</AppText>
            </AppRow>

            <AppRow>
              <AppText variant="muted">After This</AppText>
              <AppText variant="bold">
                $
                {(transactionType === "expense"
                  ? selectedItem.spent + amountNumber - (transaction?.amount ?? 0)
                  : selectedItem.spent
                ).toFixed(2)}
              </AppText>
            </AppRow>
          </View>
        </AppCard>
      ) : null}

      <AppCard>
        <AppText variant="section">Transaction Details</AppText>

        <View style={{ marginTop: 12, gap: 12 }}>
          <AppInput
            placeholder="Transaction Name"
            value={transactionName}
            onChangeText={setTransactionName}
          />

          <AppInput
            placeholder="Amount"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <AppInput
            placeholder="Notes"
            value={notes}
            onChangeText={setNotes}
          />

          {!itemName ? (
            <AppText variant="muted">Select a budget item before saving.</AppText>
          ) : amountNumber <= 0 ? (
            <AppText variant="muted">Enter an amount greater than $0.</AppText>
          ) : (
            <AppText variant="muted">
              {transaction
                ? "This will update the saved business transaction."
                : "This transaction will update the business dashboard."}
            </AppText>
          )}

          <Pressable
            onPress={handleSave}
            disabled={!itemName || amountNumber <= 0}
            style={{
              backgroundColor:
                !itemName || amountNumber <= 0 ? colors.border : colors.primary,
              padding: 14,
              borderRadius: 12,
            }}
          >
            <AppText variant="bold">
              {transaction ? "Save Changes" : "Save Transaction"}
            </AppText>
          </Pressable>
        </View>
      </AppCard>
    </AppPage>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
        backgroundColor: active ? colors.primary : "transparent",
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 14,
      }}
    >
      <AppText variant="bold">{label}</AppText>
    </Pressable>
  );
}