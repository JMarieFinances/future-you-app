import { loadAppData } from "@/lib/appStore";
import { getPurchases } from "@/lib/purchaseStore";
import { Purchase } from "@/lib/types";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function TransactionsScreen() {
  const [search, setSearch] = useState("");
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      await loadAppData();
      forceUpdate((prev) => prev + 1);
    };

    loadData();
  }, []);

  const transactions = getPurchases();

  const filteredTransactions = transactions.filter((transaction) =>
    transaction.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <View style={headerRow}>
        <View>
          <Text style={pageTitle}>Transactions</Text>
          <Text style={subtitle}>Track money coming in and going out.</Text>
        </View>

        <Pressable
          onPress={() => router.push("/transactions/new")}
          style={smallButton}
        >
          <Text style={buttonText}>Add</Text>
        </Pressable>
      </View>

      <TextInput
        placeholder="Search transactions"
        value={search}
        onChangeText={setSearch}
        style={inputStyle}
      />

      <View style={cardStyle}>
        <Text style={cardTitle}>Recent Transactions</Text>

        {filteredTransactions.length === 0 ? (
          <Text style={mutedText}>No transactions yet.</Text>
        ) : (
          [...filteredTransactions].reverse().map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

function TransactionRow({ transaction }: { transaction: Purchase }) {
  const isIncome = transaction.type === "income";

  return (
    <View style={transactionRow}>
      <View>
        <Text style={transactionName}>{transaction.name}</Text>
        <Text style={mutedText}>
          {transaction.budgetType} · {transaction.subcategory || transaction.category}
        </Text>
      </View>

      <Text style={isIncome ? incomeText : expenseText}>
        {isIncome ? "+" : "-"}${transaction.amount.toFixed(2)}
      </Text>
    </View>
  );
}

const pageTitle = { fontSize: 32, fontWeight: "bold" as const };
const subtitle = { fontSize: 15, opacity: 0.7 };
const cardStyle = { borderWidth: 1, borderRadius: 16, padding: 18 };
const cardTitle = { fontSize: 22, fontWeight: "bold" as const, marginBottom: 12 };
const inputStyle = { borderWidth: 1, borderRadius: 12, padding: 12 };
const mutedText = { opacity: 0.65 };
const headerRow = {
  flexDirection: "row" as const,
  justifyContent: "space-between" as const,
  alignItems: "center" as const,
  gap: 12,
};
const smallButton = {
  backgroundColor: "black",
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 12,
};
const buttonText = {
  color: "white",
  fontWeight: "600" as const,
};
const transactionRow = {
  flexDirection: "row" as const,
  justifyContent: "space-between" as const,
  alignItems: "center" as const,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: "#ddd",
};
const transactionName = { fontWeight: "700" as const };
const incomeText = { fontWeight: "700" as const };
const expenseText = { fontWeight: "700" as const };