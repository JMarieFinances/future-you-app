import { loadAppData } from "@/lib/appStore";
import { getBusinesses } from "@/lib/businessStore";
import { getHouseholds } from "@/lib/householdStore";
import { addPurchase } from "@/lib/purchaseStore";
import { Business, Household, Purchase } from "@/lib/types";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

type TransactionType = "income" | "expense";
type BudgetType = "personal" | "household" | "business";

const householdSections = [
  { label: "Income Sources", value: "incomeSources" },
  { label: "Bills", value: "bills" },
  { label: "Household Spending", value: "spending" },
  { label: "Household Savings", value: "savings" },
];

const businessSections = [
  { label: "Revenue Sources", value: "revenueSources" },
  { label: "Operating Expenses", value: "operatingExpenses" },
  { label: "Business Spending", value: "businessSpending" },
  { label: "Business Savings", value: "businessSavings" },
];

const personalSections = [
  { label: "Income", value: "income" },
  { label: "Obligations", value: "obligations" },
  { label: "Debt", value: "debt" },
  { label: "Lifestyle", value: "lifestyle" },
  { label: "Goals", value: "goals" },
];

export default function NewTransactionScreen() {
  const [transactionType, setTransactionType] =
    useState<TransactionType>("expense");
  const [budgetType, setBudgetType] = useState<BudgetType>("personal");
  const [budgetId, setBudgetId] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      await loadAppData();
      forceUpdate((prev) => prev + 1);
    };

    loadData();
  }, []);

  const households = getHouseholds();
  const businesses = getBusinesses();

  const selectedHousehold = households.find((item) => item.id === budgetId);
  const selectedBusiness = businesses.find((item) => item.id === budgetId);

  const categoryOptions =
    budgetType === "household"
      ? householdSections
      : budgetType === "business"
      ? businessSections
      : personalSections;

  const subcategoryOptions = getSubcategoryOptions(
    budgetType,
    category,
    selectedHousehold,
    selectedBusiness
  );

  const handleSave = async () => {
    if (!name.trim() || !amount.trim()) return;

    const transaction: Purchase = {
      id: Date.now().toString(),
      name: name.trim(),
      amount: Number(amount) || 0,
      type: transactionType,
      budgetType,
      budgetId,
      category,
      subcategory,
      date: new Date().toISOString(),
      notes: notes.trim(),
    };

    await addPurchase(transaction);
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={backText}>Back to transactions</Text>
      </Pressable>

      <Text style={pageTitle}>New Transaction</Text>
      <Text style={subtitle}>Add income or spending to your budget.</Text>

      <View style={cardStyle}>
        <Text style={label}>Type</Text>
        <View style={chipRow}>
          <Chip
            label="Expense"
            active={transactionType === "expense"}
            onPress={() => setTransactionType("expense")}
          />
          <Chip
            label="Income"
            active={transactionType === "income"}
            onPress={() => setTransactionType("income")}
          />
        </View>

        <Text style={label}>Budget</Text>
        <View style={chipRow}>
          <Chip
            label="Personal"
            active={budgetType === "personal"}
            onPress={() => {
              setBudgetType("personal");
              setBudgetId("");
              setCategory("");
              setSubcategory("");
            }}
          />
          <Chip
            label="Household"
            active={budgetType === "household"}
            onPress={() => {
              setBudgetType("household");
              setBudgetId("");
              setCategory("");
              setSubcategory("");
            }}
          />
          <Chip
            label="Business"
            active={budgetType === "business"}
            onPress={() => {
              setBudgetType("business");
              setBudgetId("");
              setCategory("");
              setSubcategory("");
            }}
          />
        </View>

        {budgetType === "household" ? (
          <>
            <Text style={label}>Household</Text>
            <View style={chipRow}>
              {households.map((household) => (
                <Chip
                  key={household.id}
                  label={household.name}
                  active={budgetId === household.id}
                  onPress={() => {
                    setBudgetId(household.id);
                    setCategory("");
                    setSubcategory("");
                  }}
                />
              ))}
            </View>
          </>
        ) : null}

        {budgetType === "business" ? (
          <>
            <Text style={label}>Business</Text>
            <View style={chipRow}>
              {businesses.map((business) => (
                <Chip
                  key={business.id}
                  label={business.name}
                  active={budgetId === business.id}
                  onPress={() => {
                    setBudgetId(business.id);
                    setCategory("");
                    setSubcategory("");
                  }}
                />
              ))}
            </View>
          </>
        ) : null}

        <Text style={label}>Category</Text>
        <View style={chipRow}>
          {categoryOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              active={category === option.value}
              onPress={() => {
                setCategory(option.value);
                setSubcategory("");
              }}
            />
          ))}
        </View>

        {subcategoryOptions.length > 0 ? (
          <>
            <Text style={label}>Item</Text>
            <View style={chipRow}>
              {subcategoryOptions.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  active={subcategory === item}
                  onPress={() => {
                    setSubcategory(item);
                    setName(item);
                  }}
                />
              ))}
            </View>
          </>
        ) : null}

        <TextInput
          placeholder="Transaction name"
          value={name}
          onChangeText={setName}
          style={inputStyle}
        />

        <TextInput
          placeholder="Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={inputStyle}
        />

        <TextInput
          placeholder="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          style={inputStyle}
        />

        <Pressable onPress={handleSave} style={buttonStyle}>
          <Text style={buttonText}>Save Transaction</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function getSubcategoryOptions(
  budgetType: BudgetType,
  category: string,
  household?: Household,
  business?: Business
) {
  if (budgetType === "household" && household && category) {
    const section = household.budget[category as keyof typeof household.budget];

    if (Array.isArray(section)) {
      return section.map((item) => item.name);
    }
  }

  if (budgetType === "business" && business && category) {
    const section = business.budget[category as keyof typeof business.budget];

    if (Array.isArray(section)) {
      return section.map((item) => item.name);
    }
  }

  return [];
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
  return (
    <Pressable onPress={onPress} style={[chip, active ? activeChip : null]}>
      <Text style={[chipText, active ? activeChipText : null]}>{label}</Text>
    </Pressable>
  );
}

const pageTitle = { fontSize: 32, fontWeight: "bold" as const };
const subtitle = { fontSize: 15, opacity: 0.7 };
const cardStyle = { borderWidth: 1, borderRadius: 16, padding: 18 };
const label = { fontWeight: "700" as const, marginBottom: 8 };
const inputStyle = {
  borderWidth: 1,
  borderRadius: 12,
  padding: 12,
  marginBottom: 12,
};
const buttonStyle = {
  backgroundColor: "black",
  padding: 14,
  borderRadius: 12,
};
const buttonText = {
  color: "white",
  textAlign: "center" as const,
  fontWeight: "600" as const,
};
const backText = { fontWeight: "600" as const };
const chipRow = {
  flexDirection: "row" as const,
  flexWrap: "wrap" as const,
  gap: 8,
  marginBottom: 14,
};
const chip = {
  borderWidth: 1,
  borderRadius: 999,
  paddingVertical: 8,
  paddingHorizontal: 14,
};
const activeChip = { backgroundColor: "black" };
const chipText = { fontWeight: "600" as const };
const activeChipText = { color: "white" };