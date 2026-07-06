import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import { BudgetItem, Purchase } from "@/lib/types";
import { useTheme } from "@/lib/useTheme";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import BudgetDashboardSection from "./BudgetDashboardSection";
import {
  getBudgetHealth,
  getBudgetTotal,
  getInsights,
  getSpentTotal,
} from "./budgetUtils";

export type DashboardSection = {
  id: string;
  title: string;
  items: BudgetItem[];
};

type TransactionFilter = "all" | "income" | "expense";
type TransactionSort = "newest" | "oldest" | "highest" | "lowest";

export default function BudgetDashboard({
  title,
  subtitle,
  incomeLabel,
  incomeSubtext,
  income,
  sections,
  transactions,
  insightLabel,
  backLabel,
  emptyTransactionsText,
  healthTitle,
  onBack,
  onEditBudget,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: {
  title: string;
  subtitle: string;
  incomeLabel: string;
  incomeSubtext: string;
  income: number;
  sections: DashboardSection[];
  transactions: Purchase[];
  insightLabel: string;
  backLabel: string;
  emptyTransactionsText: string;
  healthTitle: string;
  onBack: () => void;
  onEditBudget: () => void;
  onAddTransaction: () => void;
  onEditTransaction?: (transaction: Purchase) => void;
  onDeleteTransaction?: (transactionId: string) => void;
}) {
  const { colors } = useTheme();

  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TransactionFilter>("all");
  const [sort, setSort] = useState<TransactionSort>("newest");

  const assigned = sections.reduce(
    (sum, section) => sum + getBudgetTotal(section.items),
    0
  );

  const spent = sections.reduce(
    (sum, section) => sum + getSpentTotal(section.items),
    0
  );

  const remaining = income - spent;
  const unassigned = Math.max(0, income - assigned);
  const health = getBudgetHealth(spent, assigned);
  const insights = getInsights(
    sections.map((section) => section.items),
    insightLabel
  );

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      if (sort === "newest") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }

      if (sort === "oldest") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }

      if (sort === "highest") {
        return b.amount - a.amount;
      }

      return a.amount - b.amount;
    });
  }, [transactions, sort]);

  const filteredTransactions = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return sortedTransactions.filter((transaction) => {
      const matchesFilter = filter === "all" || transaction.type === filter;

      const matchesSearch =
        !searchText ||
        transaction.name.toLowerCase().includes(searchText) ||
        transaction.category.toLowerCase().includes(searchText) ||
        transaction.subcategory?.toLowerCase().includes(searchText) ||
        transaction.notes?.toLowerCase().includes(searchText);

      return matchesFilter && matchesSearch;
    });
  }, [sortedTransactions, search, filter]);

  const recentTransactions = sortedTransactions.slice(0, 5);

  if (showAllTransactions) {
    return (
      <AppPage>
        <AppButton
          title="Back to Dashboard"
          onPress={() => setShowAllTransactions(false)}
          variant="outline"
        />

        <PageHeader
          title="All Transactions"
          subtitle={`Search, filter, edit, or delete ${insightLabel} activity.`}
        />

        <AppCard>
          <AppText variant="section">Search</AppText>

          <View style={{ marginTop: 12 }}>
            <AppInput
              placeholder="Search transactions..."
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </AppCard>

        <AppCard>
          <AppText variant="section">Filters</AppText>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            <FilterChip label="All" active={filter === "all"} onPress={() => setFilter("all")} />
            <FilterChip label="Income" active={filter === "income"} onPress={() => setFilter("income")} />
            <FilterChip label="Expense" active={filter === "expense"} onPress={() => setFilter("expense")} />
          </View>

          <View style={{ marginTop: 18 }}>
            <AppText variant="section">Sort</AppText>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            <FilterChip label="Newest" active={sort === "newest"} onPress={() => setSort("newest")} />
            <FilterChip label="Oldest" active={sort === "oldest"} onPress={() => setSort("oldest")} />
            <FilterChip label="Highest" active={sort === "highest"} onPress={() => setSort("highest")} />
            <FilterChip label="Lowest" active={sort === "lowest"} onPress={() => setSort("lowest")} />
          </View>
        </AppCard>

        <AppCard>
          <AppRow>
            <AppText variant="section">Transactions</AppText>
            <AppText variant="muted">{filteredTransactions.length} shown</AppText>
          </AppRow>

          <View style={{ marginTop: 8 }}>
            {filteredTransactions.length === 0 ? (
              <AppText variant="muted">No transactions match this search.</AppText>
            ) : (
              filteredTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onEditTransaction={onEditTransaction}
                  onDeleteTransaction={onDeleteTransaction}
                />
              ))
            )}
          </View>
        </AppCard>
      </AppPage>
    );
  }

  return (
    <AppPage>
      <AppButton title={backLabel} onPress={onBack} variant="outline" />

      <PageHeader title={title} subtitle={subtitle} />

      <AppCard>
        <AppText variant="muted">{incomeLabel}</AppText>

        <View style={{ marginTop: 4 }}>
          <AppText variant="title">${income.toFixed(2)}</AppText>
        </View>

        <AppText variant="muted">{incomeSubtext}</AppText>
      </AppCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard title="Assigned" value={`$${assigned.toFixed(2)}`} caption="Planned" tone="primary" />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Spent"
            value={`$${spent.toFixed(2)}`}
            caption="Logged"
            tone={spent > assigned ? "danger" : "warning"}
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Remaining"
            value={`$${remaining.toFixed(2)}`}
            caption="After spending"
            tone={remaining < 0 ? "danger" : "success"}
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard title="Available" value={`$${unassigned.toFixed(2)}`} caption="Not assigned" tone="success" />
        </View>
      </View>

      <AppCard>
        <AppText variant="section">{healthTitle}</AppText>

        <View style={{ marginTop: 6 }}>
          <AppText variant="bold">{health.title}</AppText>
        </View>

        <View style={{ marginTop: 4 }}>
          <AppText variant="muted">{health.message}</AppText>
        </View>
      </AppCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <AppButton title="Add Transaction" onPress={onAddTransaction} />
        </View>

        <View style={{ flex: 1 }}>
          <AppButton title="Edit Budget" onPress={onEditBudget} variant="outline" />
        </View>
      </View>

      <AppCard>
        <AppRow>
          <AppText variant="section">Recent Activity</AppText>

          {transactions.length > 0 ? (
            <Pressable onPress={() => setShowAllTransactions(true)}>
              <AppText variant="bold">View All</AppText>
            </Pressable>
          ) : null}
        </AppRow>

        <View style={{ marginTop: 8 }}>
          {recentTransactions.length === 0 ? (
            <AppText variant="muted">{emptyTransactionsText}</AppText>
          ) : (
            recentTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onEditTransaction={onEditTransaction}
                onDeleteTransaction={onDeleteTransaction}
              />
            ))
          )}
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="section">Insights</AppText>

        <View style={{ marginTop: 10, gap: 8 }}>
          {insights.map((insight) => (
            <AppText key={insight} variant="muted">
              {insight}
            </AppText>
          ))}
        </View>
      </AppCard>

      {sections.map((section) => (
        <BudgetDashboardSection key={section.id} title={section.title} items={section.items} />
      ))}
    </AppPage>
  );
}

function TransactionCard({
  transaction,
  onEditTransaction,
  onDeleteTransaction,
}: {
  transaction: Purchase;
  onEditTransaction?: (transaction: Purchase) => void;
  onDeleteTransaction?: (transactionId: string) => void;
}) {
  const { colors } = useTheme();
  const isIncome = transaction.type === "income";

  return (
    <View
      style={{
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <AppRow>
        <Pressable onPress={() => onEditTransaction?.(transaction)} style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                backgroundColor: isIncome ? colors.success : colors.primary,
              }}
            />

            <View style={{ flex: 1 }}>
              <AppText variant="bold">{transaction.name}</AppText>
              <AppText variant="muted">
                {transaction.subcategory || transaction.category}
              </AppText>
            </View>
          </View>
        </Pressable>

        <View style={{ alignItems: "flex-end" }}>
          <AppText variant="bold">
            {isIncome ? "+" : "-"}${transaction.amount.toFixed(2)}
          </AppText>

          <AppText variant="muted">{formatDate(transaction.date)}</AppText>
        </View>
      </AppRow>

      {transaction.notes ? (
        <View style={{ marginTop: 8 }}>
          <AppText variant="muted">{transaction.notes}</AppText>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: 16, marginTop: 10 }}>
        <Pressable onPress={() => onEditTransaction?.(transaction)}>
          <AppText variant="muted">Edit</AppText>
        </Pressable>

        <Pressable onPress={() => onDeleteTransaction?.(transaction.id)}>
          <AppText variant="muted">Delete</AppText>
        </Pressable>
      </View>
    </View>
  );
}

function FilterChip({
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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}