import {
  getBudgetTotal,
  getSpentTotal,
} from "@/components/budget/budgetUtils";
import HouseholdPlan from "@/components/household/HouseholdPlan";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import { getPurchases } from "@/lib/purchaseStore";
import { Household, Purchase } from "@/lib/types";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";

type HouseholdTab =
  | "today"
  | "plan"
  | "afford"
  | "calendar";

const formatMoney = (amount: number) =>
  `$${amount.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;

const cleanAmount = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");

  if (parts.length <= 1) {
    return cleaned;
  }

  return `${parts[0]}.${parts.slice(1).join("")}`;
};

export default function HouseholdDashboard({
  household,
  onBack,
  onEditBudget,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: {
  household: Household;
  onBack: () => void;
  onEditBudget: () => void;
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Purchase) => void;
  onDeleteTransaction: (transactionId: string) => void;
}) {
  const [activeTab, setActiveTab] =
    useState<HouseholdTab>("today");

  const [affordName, setAffordName] = useState("");
  const [affordAmount, setAffordAmount] = useState("");

  const transactions = getPurchases().filter(
    (purchase) =>
      purchase.budgetType === "household" &&
      purchase.budgetId === household.id
  );

  const billsBudget = getBudgetTotal(
    household.budget.bills
  );

  const spendingBudget = getBudgetTotal(
    household.budget.spending
  );

  const savingsBudget = getBudgetTotal(
    household.budget.savings
  );

  const totalAssigned =
    billsBudget + spendingBudget + savingsBudget;

  const billsSpent = getSpentTotal(
    household.budget.bills
  );

  const spendingSpent = getSpentTotal(
    household.budget.spending
  );

  const savingsSpent = getSpentTotal(
    household.budget.savings
  );

  const totalSpent =
    billsSpent + spendingSpent + savingsSpent;

  const available =
    household.budget.householdIncome - totalSpent;

  const plannedAvailable =
    household.budget.householdIncome - totalAssigned;

  const recentTransactions = [...transactions]
    .sort(
      (first, second) =>
        new Date(second.date).getTime() -
        new Date(first.date).getTime()
    )
    .slice(0, 5);

  const purchaseAmount = Number(affordAmount) || 0;

  const affordability = useMemo(() => {
    if (purchaseAmount <= 0) {
      return {
        title: "Enter an amount",
        message:
          "Add a purchase amount to check it against this household budget.",
        approved: false,
      };
    }

    if (purchaseAmount <= Math.max(available, 0)) {
      return {
        title: "This purchase fits",
        message: `${formatMoney(
          available - purchaseAmount
        )} would remain afterward.`,
        approved: true,
      };
    }

    return {
      title: "This purchase does not fit",
      message: `The household is short ${formatMoney(
        purchaseAmount - Math.max(available, 0)
      )}.`,
      approved: false,
    };
  }, [available, purchaseAmount]);

  const health = useMemo(() => {
    const income = household.budget.householdIncome;

    if (income <= 0 || available < 0) {
      return {
        label: "At Risk",
        message:
          "Household spending is higher than the available monthly income.",
      };
    }

    if (plannedAvailable < 0) {
      return {
        label: "Overplanned",
        message:
          "The household plan assigns more money than it receives.",
      };
    }

    if ((available / income) * 100 < 10) {
      return {
        label: "Needs Attention",
        message:
          "Very little household money remains after current spending.",
      };
    }

    return {
      label: "Healthy",
      message:
        "The household currently has positive funds available.",
    };
  }, [
    available,
    household.budget.householdIncome,
    plannedAvailable,
  ]);

  const tabs: {
    key: HouseholdTab;
    label: string;
  }[] = [
    { key: "today", label: "Today" },
    { key: "plan", label: "Plan" },
    { key: "afford", label: "Afford" },
    { key: "calendar", label: "Calendar" },
  ];

  const renderTabs = () => (
    <AppCard>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {tabs.map((tab) => {
          const selected = activeTab === tab.key;

          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={({ pressed }) => ({
                flex: 1,
                opacity: pressed ? 0.7 : 1,
                paddingVertical: 11,
                paddingHorizontal: 6,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: selected
                  ? "rgba(120, 120, 120, 0.18)"
                  : "transparent",
              })}
            >
              <AppText
                variant={selected ? "bold" : "muted"}
              >
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </AppCard>
  );

  const renderToday = () => (
    <>
      <AppCard>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="muted">
              Household available
            </AppText>

            <View style={{ marginTop: 4 }}>
              <AppText variant="title">
                {formatMoney(available)}
              </AppText>
            </View>

            <AppText variant="muted">
              After shared spending
            </AppText>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <AppText variant="bold">
              {health.label}
            </AppText>

            <AppText variant="muted">
              Budget health
            </AppText>
          </View>
        </AppRow>

        <View style={{ marginTop: 14 }}>
          <AppText variant="muted">
            {health.message}
          </AppText>
        </View>
      </AppCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Income"
            value={formatMoney(
              household.budget.householdIncome
            )}
            caption="Monthly"
            tone="primary"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Spent"
            value={formatMoney(totalSpent)}
            caption="Current activity"
            tone={
              totalSpent >
              household.budget.householdIncome
                ? "danger"
                : "warning"
            }
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Assigned"
            value={formatMoney(totalAssigned)}
            caption="Monthly plan"
            tone={
              plannedAvailable < 0
                ? "danger"
                : "primary"
            }
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Your Share"
            value={formatMoney(
              household.includedInPersonalPlan
                ? household.personalContribution ?? 0
                : 0
            )}
            caption={
              household.includedInPersonalPlan
                ? "Personal contribution"
                : "Kept separate"
            }
            tone="success"
          />
        </View>
      </View>

      <AppCard>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="section">
              Week at a Glance
            </AppText>

            <AppText variant="muted">
              Current shared activity
            </AppText>
          </View>

          <AppButton
            title="Add"
            onPress={onAddTransaction}
          />
        </AppRow>

        <View style={{ marginTop: 14, gap: 12 }}>
          <AppRow>
            <AppText variant="muted">
              Bills
            </AppText>

            <AppText variant="bold">
              {formatMoney(billsSpent)}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Household spending
            </AppText>

            <AppText variant="bold">
              {formatMoney(spendingSpent)}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Savings contributions
            </AppText>

            <AppText variant="bold">
              {formatMoney(savingsSpent)}
            </AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">
              Planned remaining
            </AppText>

            <AppText variant="bold">
              {formatMoney(plannedAvailable)}
            </AppText>
          </AppRow>
        </View>
      </AppCard>

      <AppCard>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="section">
              Recent Transactions
            </AppText>

            <AppText variant="muted">
              Latest household activity
            </AppText>
          </View>

          <AppButton
            title="New"
            onPress={onAddTransaction}
            variant="outline"
          />
        </AppRow>

        {recentTransactions.length === 0 ? (
          <View style={{ marginTop: 14 }}>
            <EmptyState message="No household transactions yet." />
          </View>
        ) : (
          <View style={{ marginTop: 14, gap: 10 }}>
            {recentTransactions.map((transaction) => (
              <Pressable
                key={transaction.id}
                onPress={() =>
                  onEditTransaction(transaction)
                }
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <AppCard>
                  <AppRow>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bold">
                        {transaction.name}
                      </AppText>

                      <AppText variant="muted">
                        {transaction.subcategory ??
                          transaction.category}
                      </AppText>
                    </View>

                    <AppText variant="bold">
                      {formatMoney(transaction.amount)}
                    </AppText>
                  </AppRow>
                </AppCard>
              </Pressable>
            ))}
          </View>
        )}
      </AppCard>
    </>
  );

  const renderAfford = () => (
    <>
      <AppCard>
        <AppText variant="section">
          Household Purchase
        </AppText>

        <View style={{ marginTop: 6 }}>
          <AppText variant="muted">
            Check a purchase against this household only.
          </AppText>
        </View>

        <View style={{ marginTop: 16, gap: 12 }}>
          <AppInput
            placeholder="What are you buying?"
            value={affordName}
            onChangeText={setAffordName}
          />

          <AppInput
            placeholder="$0"
            value={affordAmount}
            onChangeText={(text) =>
              setAffordAmount(cleanAmount(text))
            }
            keyboardType="decimal-pad"
          />
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="muted">
          {affordName.trim() || "Purchase"}
        </AppText>

        <View style={{ marginTop: 4 }}>
          <AppText variant="title">
            {formatMoney(purchaseAmount)}
          </AppText>
        </View>

        <View style={{ marginTop: 14 }}>
          <AppText variant="section">
            {affordability.title}
          </AppText>
        </View>

        <View style={{ marginTop: 6 }}>
          <AppText variant="muted">
            {affordability.message}
          </AppText>
        </View>
      </AppCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Available"
            value={formatMoney(Math.max(available, 0))}
            caption="Current funds"
            tone={available < 0 ? "danger" : "success"}
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="After Purchase"
            value={formatMoney(
              available - purchaseAmount
            )}
            caption="Estimated"
            tone={
              available - purchaseAmount < 0
                ? "danger"
                : "primary"
            }
          />
        </View>
      </View>

      {purchaseAmount > 0 &&
      affordability.approved ? (
        <AppButton
          title="Add as Transaction"
          onPress={onAddTransaction}
        />
      ) : null}
    </>
  );

  const renderCalendar = () => (
    <>
      <AppCard>
        <AppText variant="section">
          Household Calendar
        </AppText>

        <View style={{ marginTop: 6 }}>
          <AppText variant="muted">
            Shared bills, due dates, household events, and
            scheduled activity will appear here.
          </AppText>
        </View>
      </AppCard>

      <AppCard>
        <EmptyState message="No household calendar events yet." />
      </AppCard>
    </>
  );

 

  return (
    <AppPage>
      <AppButton
        title="Back to Households"
        onPress={onBack}
        variant="outline"
      />

      <PageHeader
        title={household.name}
        subtitle={`${household.members} contributor${
          household.members === 1 ? "" : "s"
        }${
          household.description
            ? ` · ${household.description}`
            : ""
        }`}
      />

      {renderTabs()}

      {activeTab === "today" && renderToday()}

{activeTab === "plan" && (
  <HouseholdPlan
    household={household}
    transactions={transactions}
    onEditBudget={onEditBudget}
    onAddTransaction={onAddTransaction}
    onEditTransaction={onEditTransaction}
    onDeleteTransaction={onDeleteTransaction}
  />
)}

{activeTab === "afford" && renderAfford()}

{activeTab === "calendar" && renderCalendar()}
    </AppPage>
  );
}