import AppCard from "@/components/ui/AppCard";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import type { Purchase } from "@/lib/types";
import { useMemo } from "react";
import { View } from "react-native";

type InsightTone =
  | "primary"
  | "success"
  | "warning"
  | "danger";

type Insight = {
  id: string;
  title: string;
  value: string;
  description: string;
  tone: InsightTone;
};

type Props = {
  workspaceLabel: string;
  income: number;
  assigned: number;
  spent: number;
  available: number;
  transactions: Purchase[];
};

const formatMoney = (
  amount: number,
  includeCents = false
) =>
  `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: includeCents ? 2 : 0,
    maximumFractionDigits: includeCents ? 2 : 0,
  })}`;

export default function WorkspaceInsights({
  workspaceLabel,
  income,
  assigned,
  spent,
  available,
  transactions,
}: Props) {
  const insights = useMemo(
    () =>
      buildInsights({
        workspaceLabel,
        income,
        assigned,
        spent,
        available,
        transactions,
      }),
    [
      assigned,
      available,
      income,
      spent,
      transactions,
      workspaceLabel,
    ]
  );

  return (
    <AppCard>
      <AppText variant="section">
        Insights
      </AppText>

      <View style={{ marginTop: 4 }}>
        <AppText variant="muted">
          A quick look at how this workspace is performing.
        </AppText>
      </View>

      <View
        style={{
          marginTop: 16,
          gap: 12,
        }}
      >
        {insights.map((insight) => (
          <InsightRow
            key={insight.id}
            insight={insight}
          />
        ))}
      </View>
    </AppCard>
  );
}

function InsightRow({
  insight,
}: {
  insight: Insight;
}) {
  const toneColors: Record<
    InsightTone,
    string
  > = {
    primary: "#3b82f6",
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
  };

  return (
    <AppCard>
      <AppRow>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
            flex: 1,
          }}
        >
          <View
            style={{
              width: 10,
              height: 10,
              marginTop: 5,
              borderRadius: 999,
              backgroundColor:
                toneColors[insight.tone],
            }}
          />

          <View style={{ flex: 1 }}>
            <AppText variant="bold">
              {insight.title}
            </AppText>

            <View style={{ marginTop: 3 }}>
              <AppText variant="muted">
                {insight.description}
              </AppText>
            </View>
          </View>
        </View>

        <View
          style={{
            alignItems: "flex-end",
            marginLeft: 12,
          }}
        >
          <AppText variant="bold">
            {insight.value}
          </AppText>
        </View>
      </AppRow>
    </AppCard>
  );
}

function buildInsights({
  workspaceLabel,
  income,
  assigned,
  spent,
  available,
  transactions,
}: {
  workspaceLabel: string;
  income: number;
  assigned: number;
  spent: number;
  available: number;
  transactions: Purchase[];
}): Insight[] {
  const expenseTransactions =
    transactions.filter(
      (transaction) =>
        transaction.type === "expense"
    );

  const incomeTransactions =
    transactions.filter(
      (transaction) =>
        transaction.type === "income"
    );

  const loggedIncome =
    incomeTransactions.reduce(
      (sum, transaction) =>
        sum + transaction.amount,
      0
    );

  const largestExpense = [
    ...expenseTransactions,
  ].sort(
    (first, second) =>
      second.amount - first.amount
  )[0];

  const averageExpense =
    expenseTransactions.length > 0
      ? expenseTransactions.reduce(
          (sum, transaction) =>
            sum + transaction.amount,
          0
        ) / expenseTransactions.length
      : 0;

  const assignedRate =
    income > 0
      ? (assigned / income) * 100
      : 0;

  const spentRate =
    income > 0
      ? (spent / income) * 100
      : 0;

  const remainingRate =
    income > 0
      ? (available / income) * 100
      : 0;

  const projectedMonthEnd =
    calculateProjectedMonthEnd({
      income,
      spent,
    });

  const results: Insight[] = [];

  results.push({
    id: "remaining",
    title: "Available Funds",
    value: formatMoney(available),
    description:
      available < 0
        ? `${workspaceLabel} spending is currently above monthly funds.`
        : `${remainingRate.toFixed(
            0
          )}% of monthly funds remain available.`,
    tone:
      available < 0
        ? "danger"
        : remainingRate < 10
          ? "warning"
          : "success",
  });

  results.push({
    id: "assigned",
    title: "Budget Assigned",
    value: `${assignedRate.toFixed(0)}%`,
    description:
      assignedRate > 100
        ? `The ${workspaceLabel.toLowerCase()} plan assigns more money than it receives.`
        : `${formatMoney(
            assigned
          )} has been assigned across the monthly plan.`,
    tone:
      assignedRate > 100
        ? "danger"
        : assignedRate > 90
          ? "warning"
          : "primary",
  });

  results.push({
    id: "spent",
    title: "Income Used",
    value: `${spentRate.toFixed(0)}%`,
    description:
      spentRate > 100
        ? "Logged expenses have exceeded monthly income."
        : `${formatMoney(
            spent
          )} has been spent so far.`,
    tone:
      spentRate > 100
        ? "danger"
        : spentRate > 80
          ? "warning"
          : "primary",
  });

  if (largestExpense) {
    results.push({
      id: "largest-expense",
      title: "Largest Expense",
      value: formatMoney(
        largestExpense.amount,
        true
      ),
      description: `${
        largestExpense.name
      } is the largest logged expense in this workspace.`,
      tone: "warning",
    });
  } else {
    results.push({
      id: "largest-expense",
      title: "Largest Expense",
      value: "$0",
      description:
        "No expenses have been logged yet.",
      tone: "primary",
    });
  }

  results.push({
    id: "average-expense",
    title: "Average Expense",
    value: formatMoney(
      averageExpense,
      true
    ),
    description:
      expenseTransactions.length > 0
        ? `Based on ${expenseTransactions.length} logged expense${
            expenseTransactions.length === 1
              ? ""
              : "s"
          }.`
        : "Add transactions to calculate an average expense.",
    tone: "primary",
  });

  results.push({
    id: "projection",
    title: "Projected Month-End Cash",
    value: formatMoney(
      projectedMonthEnd
    ),
    description:
      projectedMonthEnd < 0
        ? "Current spending pace may end the month below zero."
        : "Estimated cash remaining if the current spending pace continues.",
    tone:
      projectedMonthEnd < 0
        ? "danger"
        : projectedMonthEnd <
            income * 0.1
          ? "warning"
          : "success",
  });

  if (loggedIncome > 0) {
    results.push({
      id: "logged-income",
      title: "Logged Income",
      value: formatMoney(
        loggedIncome,
        true
      ),
      description:
        "Income transactions recorded during the current month.",
      tone: "success",
    });
  }

  return results.slice(0, 6);
}

function calculateProjectedMonthEnd({
  income,
  spent,
}: {
  income: number;
  spent: number;
}) {
  const now = new Date();

  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();

  const elapsedDays = Math.max(
    now.getDate(),
    1
  );

  const dailySpend = spent / elapsedDays;

  const projectedSpending =
    dailySpend * daysInMonth;

  return income - projectedSpending;
}