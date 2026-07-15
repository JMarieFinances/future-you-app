import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { getHouseholds } from "@/lib/householdStore";
import {
  addPurchase,
  updatePurchase,
} from "@/lib/purchaseStore";
import { Household, Purchase } from "@/lib/types";
import { useTheme } from "@/lib/useTheme";
import { useState } from "react";
import {
  Alert,
  Pressable,
  View,
} from "react-native";
import {
  HouseholdSectionKey,
  householdSections,
} from "./householdData";

const cleanAmount = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");

  if (parts.length <= 1) {
    return cleaned;
  }

  return `${parts[0]}.${parts.slice(1).join("")}`;
};

const formatMoney = (amount: number) =>
  `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function NewHouseholdTransaction({
  household,
  transaction,
  onBack,
  onSave,
}: {
  household: Household;
  transaction?: Purchase | null;
  onBack: () => void;
  onSave: (household: Household) => void;
}) {
  const { colors } = useTheme();

  const initialSection =
    transaction?.category &&
    householdSections.some(
      (section) => section.key === transaction.category
    )
      ? (transaction.category as HouseholdSectionKey)
      : "spending";

  const [section, setSection] =
    useState<HouseholdSectionKey>(initialSection);

  const [itemName, setItemName] = useState(
    transaction?.subcategory ?? ""
  );

  const [transactionName, setTransactionName] =
    useState(transaction?.name ?? "");

  const [amount, setAmount] = useState(
    transaction ? String(transaction.amount) : ""
  );

  const [notes, setNotes] = useState(
    transaction?.notes ?? ""
  );

  const [isSaving, setIsSaving] = useState(false);

  const selectedSection =
    household.budget[section] ?? [];

  const transactionType =
    section === "incomeSources"
      ? "income"
      : "expense";

  const selectedItem = selectedSection.find(
    (item) => item.name === itemName
  );

  const amountNumber = Number(amount) || 0;

  const originalAmount =
    transaction &&
    transaction.type === "expense" &&
    transaction.category === section &&
    transaction.subcategory === itemName
      ? transaction.amount
      : 0;

  const projectedSpent =
    transactionType === "expense" && selectedItem
      ? selectedItem.spent -
        originalAmount +
        amountNumber
      : selectedItem?.spent ?? 0;

  const projectedRemaining =
    selectedItem &&
    transactionType === "expense"
      ? selectedItem.budget - projectedSpent
      : selectedItem?.budget ?? 0;

  const canSave =
    Boolean(itemName) &&
    amountNumber > 0 &&
    !isSaving;

  const handleSectionChange = (
    nextSection: HouseholdSectionKey
  ) => {
    setSection(nextSection);
    setItemName("");
    setTransactionName("");
  };

  const handleItemChange = (name: string) => {
    setItemName(name);

    if (
      !transactionName.trim() ||
      transactionName === itemName
    ) {
      setTransactionName(name);
    }
  };

  const handleSave = async () => {
    if (!itemName) {
      Alert.alert(
        "Select a budget item",
        "Choose where this transaction belongs."
      );
      return;
    }

    if (amountNumber <= 0) {
      Alert.alert(
        "Enter an amount",
        "The transaction amount must be greater than zero."
      );
      return;
    }

    setIsSaving(true);

    try {
      const savedTransaction: Purchase = {
        id:
          transaction?.id ??
          `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
        name:
          transactionName.trim() || itemName,
        amount: amountNumber,
        category: section,
        subcategory: itemName,
        date:
          transaction?.date ??
          new Date().toISOString(),
        notes: notes.trim() || undefined,
        type: transactionType,
        budgetType: "household",
        budgetId: household.id,
      };

      if (transaction) {
        await updatePurchase(savedTransaction);
      } else {
        await addPurchase(savedTransaction);
      }

      const updatedHousehold = getHouseholds().find(
        (item) => item.id === household.id
      );

      if (!updatedHousehold) {
        Alert.alert(
          "Household not found",
          "The transaction was saved, but the household could not be refreshed."
        );

        onBack();
        return;
      }

      onSave(updatedHousehold);
    } catch (error) {
      console.error(
        "Failed to save household transaction:",
        error
      );

      Alert.alert(
        "Unable to save",
        "Something went wrong while saving the transaction."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppPage>
      <AppButton
        title="Back to Household"
        onPress={onBack}
        variant="outline"
      />

      <PageHeader
        title={
          transaction
            ? "Edit Transaction"
            : "Add Transaction"
        }
        subtitle={`Record activity for ${household.name}.`}
      />

      <AppCard>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="muted">
              Transaction type
            </AppText>

            <View style={{ marginTop: 4 }}>
              <AppText variant="title">
                {transactionType === "income"
                  ? "Income"
                  : "Expense"}
              </AppText>
            </View>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <AppText variant="bold">
              {formatMoney(amountNumber)}
            </AppText>

            <AppText variant="muted">
              Current amount
            </AppText>
          </View>
        </AppRow>
      </AppCard>

      <AppCard>
        <AppText variant="section">
          Category
        </AppText>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 12,
          }}
        >
          {householdSections.map((option) => (
            <Chip
              key={option.key}
              label={option.title}
              active={section === option.key}
              onPress={() =>
                handleSectionChange(option.key)
              }
            />
          ))}
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="section">
          Budget Item
        </AppText>

        <View style={{ marginTop: 12 }}>
          {selectedSection.length === 0 ? (
            <EmptyState message="There are no active budget items in this category. Add one from the household Plan tab first." />
          ) : (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {selectedSection.map((item) => (
                <Chip
                  key={item.id}
                  label={item.name}
                  active={itemName === item.name}
                  onPress={() =>
                    handleItemChange(item.name)
                  }
                />
              ))}
            </View>
          )}
        </View>
      </AppCard>

      {selectedItem ? (
        <AppCard>
          <AppRow>
            <View style={{ flex: 1 }}>
              <AppText variant="section">
                {selectedItem.name}
              </AppText>

              <AppText variant="muted">
                {transactionType === "income"
                  ? "Income source"
                  : "Budget impact"}
              </AppText>
            </View>

            <AppText variant="bold">
              {formatMoney(selectedItem.budget)}
            </AppText>
          </AppRow>

          <View
            style={{
              marginTop: 14,
              gap: 10,
            }}
          >
            <AppRow>
              <AppText variant="muted">
                Monthly budget
              </AppText>

              <AppText variant="bold">
                {formatMoney(selectedItem.budget)}
              </AppText>
            </AppRow>

            <AppRow>
              <AppText variant="muted">
                Current activity
              </AppText>

              <AppText variant="bold">
                {formatMoney(selectedItem.spent)}
              </AppText>
            </AppRow>

            {transactionType === "expense" ? (
              <>
                <AppRow>
                  <AppText variant="muted">
                    After transaction
                  </AppText>

                  <AppText variant="bold">
                    {formatMoney(projectedSpent)}
                  </AppText>
                </AppRow>

                <AppRow>
                  <AppText variant="muted">
                    Budget remaining
                  </AppText>

                  <AppText variant="bold">
                    {formatMoney(projectedRemaining)}
                  </AppText>
                </AppRow>
              </>
            ) : (
              <AppRow>
                <AppText variant="muted">
                  Income after transaction
                </AppText>

                <AppText variant="bold">
                  {formatMoney(
                    selectedItem.spent +
                      amountNumber -
                      (transaction?.amount ?? 0)
                  )}
                </AppText>
              </AppRow>
            )}
          </View>
        </AppCard>
      ) : null}

      <AppCard>
        <AppText variant="section">
          Transaction Details
        </AppText>

        <View
          style={{
            marginTop: 12,
            gap: 12,
          }}
        >
          <AppInput
            placeholder="Transaction name"
            value={transactionName}
            onChangeText={setTransactionName}
          />

          <AppInput
            placeholder="$0.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={(text) =>
              setAmount(cleanAmount(text))
            }
          />

          <AppInput
            placeholder="Notes"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={({ pressed }) => ({
              backgroundColor: canSave
                ? colors.primary
                : colors.border,
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 12,
              alignItems: "center",
              opacity:
                pressed && canSave ? 0.75 : 1,
            })}
          >
            <AppText variant="bold">
              {isSaving
                ? "Saving"
                : transaction
                  ? "Save Changes"
                  : "Save Transaction"}
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
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: active
          ? colors.primary
          : colors.border,
        backgroundColor: active
          ? colors.primary
          : "transparent",
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 14,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <AppText variant="bold">
        {label}
      </AppText>
    </Pressable>
  );
}