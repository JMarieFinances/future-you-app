import ProgressBar from "@/components/budget/ProgressBar";
import {
  getBudgetTotal,
  getSpentTotal,
} from "@/components/budget/budgetUtils";
import WorkspaceCalendar from "@/components/calendar/WorkspaceCalendar";
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
import { BudgetItem, Business, Purchase } from "@/lib/types";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

type BusinessTab =
  | "today"
  | "plan"
  | "afford"
  | "calendar";

type PlanSection =
  | "revenue"
  | "operating"
  | "spending"
  | "savings"
  | "transactions"
  | "summary";

const formatMoney = (
  amount: number,
  cents = false
) =>
  `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  })}`;

const cleanAmount = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");

  if (parts.length <= 1) {
    return cleaned;
  }

  return `${parts[0]}.${parts.slice(1).join("")}`;
};

export default function BusinessDashboard({
  business,
  onBack,
  onEditBudget,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: {
  business: Business;
  onBack: () => void;
  onEditBudget: () => void;
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Purchase) => void;
  onDeleteTransaction: (transactionId: string) => void;
}) {
  const [activeTab, setActiveTab] =
    useState<BusinessTab>("today");

  const [affordName, setAffordName] = useState("");
  const [affordAmount, setAffordAmount] = useState("");

  const [openSections, setOpenSections] = useState<
    Record<PlanSection, boolean>
  >({
    revenue: true,
    operating: true,
    spending: false,
    savings: false,
    transactions: false,
    summary: true,
  });

  const transactions = getPurchases()
    .filter(
      (purchase) =>
        purchase.budgetType === "business" &&
        purchase.budgetId === business.id
    )
    .sort(
      (first, second) =>
        new Date(second.date).getTime() -
        new Date(first.date).getTime()
    );

  const operatingBudget = getBudgetTotal(
    business.budget.operatingExpenses
  );

  const spendingBudget = getBudgetTotal(
    business.budget.businessSpending
  );

  const savingsBudget = getBudgetTotal(
    business.budget.businessSavings
  );

  const totalAssigned =
    operatingBudget + spendingBudget + savingsBudget;

  const operatingSpent = getSpentTotal(
    business.budget.operatingExpenses
  );

  const spendingSpent = getSpentTotal(
    business.budget.businessSpending
  );

  const savingsSpent = getSpentTotal(
    business.budget.businessSavings
  );

  const totalSpent =
    operatingSpent + spendingSpent + savingsSpent;

  const ownerPay =
    business.incomeMode === "separate"
      ? 0
      : business.ownerPay || 0;

  const available =
    business.budget.businessIncome -
    totalSpent -
    ownerPay;

  const plannedAvailable =
    business.budget.businessIncome -
    totalAssigned -
    ownerPay;

  const assignedPercent =
    business.budget.businessIncome > 0
      ? (totalAssigned /
          business.budget.businessIncome) *
        100
      : 0;

  const spentPercent =
    business.budget.businessIncome > 0
      ? (totalSpent /
          business.budget.businessIncome) *
        100
      : 0;

  const recentTransactions = transactions.slice(0, 5);

  const purchaseAmount = Number(affordAmount) || 0;

  const affordability = useMemo(() => {
    if (purchaseAmount <= 0) {
      return {
        approved: false,
        title: "Enter an amount",
        message:
          "Add a purchase amount to check it against this business.",
      };
    }

    if (purchaseAmount <= Math.max(available, 0)) {
      return {
        approved: true,
        title: "This purchase fits",
        message: `${formatMoney(
          available - purchaseAmount
        )} would remain afterward.`,
      };
    }

    return {
      approved: false,
      title: "This purchase does not fit",
      message: `The business is short ${formatMoney(
        purchaseAmount - Math.max(available, 0)
      )}.`,
    };
  }, [available, purchaseAmount]);

  const health = useMemo(() => {
    const income = business.budget.businessIncome;

    if (income <= 0 || available < 0) {
      return {
        label: "At Risk",
        message:
          "Current spending and owner pay exceed business income.",
      };
    }

    if (plannedAvailable < 0) {
      return {
        label: "Overplanned",
        message:
          "The monthly plan assigns more money than the business earns.",
      };
    }

    if ((available / income) * 100 < 10) {
      return {
        label: "Needs Attention",
        message:
          "Very little business cash remains after current activity.",
      };
    }

    return {
      label: "Healthy",
      message:
        "The business currently has positive cash available.",
    };
  }, [
    available,
    business.budget.businessIncome,
    plannedAvailable,
  ]);

  const toggleSection = (section: PlanSection) => {
    setOpenSections((previous) => ({
      ...previous,
      [section]: !previous[section],
    }));
  };

  const tabs: {
    key: BusinessTab;
    label: string;
  }[] = [
    { key: "today", label: "Today" },
    { key: "plan", label: "Plan" },
    { key: "afford", label: "Afford" },
    { key: "calendar", label: "Calendar" },
  ];

  return (
    <AppPage>
      <AppButton
        title="Back to Businesses"
        onPress={onBack}
        variant="outline"
      />

      <PageHeader
        title={business.name}
        subtitle={`${business.businessType}${
          business.description
            ? ` · ${business.description}`
            : ""
        }`}
      />

      <AppCard glass>
        <View
          style={{
            flexDirection: "row",
            gap: 8,
          }}
        >
          {tabs.map((tab) => {
            const selected = activeTab === tab.key;

            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 44,
                  paddingHorizontal: 6,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.72 : 1,
                  backgroundColor: selected
                    ? "rgba(255,255,255,0.12)"
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

      {activeTab === "today" ? (
        <>
          <AppCard glass>
            <AppRow>
              <View style={{ flex: 1 }}>
                <AppText variant="muted">
                  Business Available
                </AppText>

                <Text
                  style={{
                    fontSize: 44,
                    fontWeight: "800",
                    marginTop: 4,
                  }}
                >
                  {formatMoney(available)}
                </Text>

                <AppText variant="muted">
                  After spending and owner pay
                </AppText>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <AppText variant="bold">
                  {health.label}
                </AppText>

                <AppText variant="muted">
                  Business health
                </AppText>
              </View>
            </AppRow>

            <View style={{ marginTop: 14 }}>
              <AppText variant="muted">
                {health.message}
              </AppText>
            </View>
          </AppCard>

          <View
            style={{
              flexDirection: "row",
              gap: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <MetricCard
                title="Revenue"
                value={formatMoney(
                  business.budget.businessIncome
                )}
                caption="Monthly"
                tone="success"
              />
            </View>

            <View style={{ flex: 1 }}>
              <MetricCard
                title="Spent"
                value={formatMoney(totalSpent)}
                caption="Current activity"
                tone={
                  totalSpent >
                  business.budget.businessIncome
                    ? "danger"
                    : "warning"
                }
              />
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              gap: 10,
            }}
          >
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
                title="Owner Pay"
                value={formatMoney(ownerPay)}
                caption={
                  business.incomeMode === "separate"
                    ? "Kept separate"
                    : "Personal income"
                }
                tone="primary"
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
                  Current business activity
                </AppText>
              </View>

              <AppButton
                title="Add"
                onPress={onAddTransaction}
              />
            </AppRow>

            <View
              style={{
                marginTop: 14,
                gap: 12,
              }}
            >
              <AppRow>
                <AppText variant="muted">
                  Operating expenses
                </AppText>

                <AppText variant="bold">
                  {formatMoney(operatingSpent)}
                </AppText>
              </AppRow>

              <AppRow>
                <AppText variant="muted">
                  Business spending
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
                  Latest business activity
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
                <EmptyState message="No business transactions yet." />
              </View>
            ) : (
              <View
                style={{
                  marginTop: 14,
                  gap: 10,
                }}
              >
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
                        {transaction.type === "income"
                          ? "+"
                          : "-"}
                        {formatMoney(
                          transaction.amount,
                          true
                        )}
                      </AppText>
                    </AppRow>
                  </Pressable>
                ))}
              </View>
            )}
          </AppCard>
        </>
      ) : null}

      {activeTab === "plan" ? (
        <>
          <AppCard glass>
            <AppRow>
              <View style={{ flex: 1 }}>
                <AppText variant="muted">
                  Planned Cash Remaining
                </AppText>

                <Text
                  style={{
                    fontSize: 42,
                    fontWeight: "800",
                    marginTop: 4,
                  }}
                >
                  {formatMoney(plannedAvailable)}
                </Text>

                <AppText variant="muted">
                  Revenue after planned expenses, savings,
                  and owner pay
                </AppText>
              </View>

              <AppButton
                title="Edit Plan"
                onPress={onEditBudget}
              />
            </AppRow>
          </AppCard>

          <View
            style={{
              flexDirection: "row",
              gap: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <MetricCard
                title="Assigned"
                value={`${assignedPercent.toFixed(0)}%`}
                caption={formatMoney(totalAssigned)}
                tone={
                  assignedPercent > 100
                    ? "danger"
                    : "primary"
                }
              />
            </View>

            <View style={{ flex: 1 }}>
              <MetricCard
                title="Used"
                value={`${spentPercent.toFixed(0)}%`}
                caption={formatMoney(totalSpent)}
                tone={
                  spentPercent > 100
                    ? "danger"
                    : "warning"
                }
              />
            </View>
          </View>

          <PlanSectionCard
            title="Revenue"
            subtitle={`${formatMoney(
              business.budget.businessIncome
            )} monthly`}
            isOpen={openSections.revenue}
            onToggle={() => toggleSection("revenue")}
            items={business.budget.revenueSources}
            income={business.budget.businessIncome}
            emptyMessage="No revenue sources have been added."
          />

          <PlanSectionCard
            title="Operating Expenses"
            subtitle={`${formatMoney(
              operatingBudget
            )} planned`}
            isOpen={openSections.operating}
            onToggle={() => toggleSection("operating")}
            items={business.budget.operatingExpenses}
            income={business.budget.businessIncome}
            emptyMessage="No operating expenses have been added."
          />

          <PlanSectionCard
            title="Business Spending"
            subtitle={`${formatMoney(
              spendingBudget
            )} planned`}
            isOpen={openSections.spending}
            onToggle={() => toggleSection("spending")}
            items={business.budget.businessSpending}
            income={business.budget.businessIncome}
            emptyMessage="No business spending categories have been added."
          />

          <PlanSectionCard
            title="Savings and Reserves"
            subtitle={`${formatMoney(
              savingsBudget
            )} planned`}
            isOpen={openSections.savings}
            onToggle={() => toggleSection("savings")}
            items={business.budget.businessSavings}
            income={business.budget.businessIncome}
            emptyMessage="No savings or reserve categories have been added."
          />

          <CollapsibleCard
            title="Plan Summary"
            subtitle="Monthly business allocation"
            isOpen={openSections.summary}
            onToggle={() => toggleSection("summary")}
          >
            <View style={{ gap: 12 }}>
              <SummaryRow
                label="Monthly revenue"
                value={business.budget.businessIncome}
              />

              <SummaryRow
                label="Operating expenses"
                value={operatingBudget}
              />

              <SummaryRow
                label="Business spending"
                value={spendingBudget}
              />

              <SummaryRow
                label="Savings and reserves"
                value={savingsBudget}
              />

              <SummaryRow
                label="Owner pay"
                value={ownerPay}
              />

              <View
                style={{
                  height: 1,
                  backgroundColor:
                    "rgba(255,255,255,0.1)",
                }}
              />

              <SummaryRow
                label="Planned remaining"
                value={plannedAvailable}
                strong
              />
            </View>
          </CollapsibleCard>

          <CollapsibleCard
            title="Transactions"
            subtitle={`${transactions.length} saved`}
            isOpen={openSections.transactions}
            onToggle={() =>
              toggleSection("transactions")
            }
          >
            <View style={{ gap: 12 }}>
              <AppButton
                title="Add Transaction"
                onPress={onAddTransaction}
              />

              {transactions.length === 0 ? (
                <EmptyState message="No business transactions yet." />
              ) : (
                transactions.map((transaction) => (
                  <AppCard key={transaction.id}>
                    <AppRow>
                      <Pressable
                        onPress={() =>
                          onEditTransaction(transaction)
                        }
                        style={{ flex: 1 }}
                      >
                        <AppText variant="bold">
                          {transaction.name}
                        </AppText>

                        <AppText variant="muted">
                          {transaction.subcategory ??
                            transaction.category}
                        </AppText>
                      </Pressable>

                      <View
                        style={{
                          alignItems: "flex-end",
                        }}
                      >
                        <AppText variant="bold">
                          {transaction.type === "income"
                            ? "+"
                            : "-"}
                          {formatMoney(
                            transaction.amount,
                            true
                          )}
                        </AppText>

                        <Pressable
                          onPress={() =>
                            onDeleteTransaction(
                              transaction.id
                            )
                          }
                        >
                          <AppText variant="muted">
                            Delete
                          </AppText>
                        </Pressable>
                      </View>
                    </AppRow>
                  </AppCard>
                ))
              )}
            </View>
          </CollapsibleCard>
        </>
      ) : null}

      {activeTab === "afford" ? (
        <>
          <AppCard>
            <AppText variant="section">
              Business Purchase
            </AppText>

            <View style={{ marginTop: 6 }}>
              <AppText variant="muted">
                Check a purchase against this business only.
              </AppText>
            </View>

            <View
              style={{
                marginTop: 16,
                gap: 12,
              }}
            >
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

          <AppCard glass>
            <AppText variant="muted">
              {affordName.trim() || "Purchase"}
            </AppText>

            <Text
              style={{
                fontSize: 42,
                fontWeight: "800",
                marginTop: 4,
              }}
            >
              {formatMoney(purchaseAmount)}
            </Text>

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

          <View
            style={{
              flexDirection: "row",
              gap: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <MetricCard
                title="Available"
                value={formatMoney(
                  Math.max(available, 0)
                )}
                caption="Current funds"
                tone={
                  available < 0
                    ? "danger"
                    : "success"
                }
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
      ) : null}

      {activeTab === "calendar" ? (
        <WorkspaceCalendar
          sourceType="business"
          sourceId={business.id}
          title="Business Calendar"
          subtitle="Track invoices, payroll, taxes, renewals, bills, and deadlines."
          defaultEventType="business"
        />
      ) : null}
    </AppPage>
  );
}

function PlanSectionCard({
  title,
  subtitle,
  isOpen,
  onToggle,
  items,
  income,
  emptyMessage,
}: {
  title: string;
  subtitle: string;
  isOpen: boolean;
  onToggle: () => void;
  items: BudgetItem[];
  income: number;
  emptyMessage: string;
}) {
  const total = getBudgetTotal(items);
  const percent =
    income > 0 ? (total / income) * 100 : 0;

  return (
    <AppCard>
      <Pressable onPress={onToggle}>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="section">
              {title}
            </AppText>

            <AppText variant="muted">
              {subtitle}
            </AppText>
          </View>

          <AppText variant="bold">
            {isOpen ? "Hide" : "Show"}
          </AppText>
        </AppRow>
      </Pressable>

      <View style={{ marginTop: 12 }}>
        <ProgressBar percent={percent} />
      </View>

      {isOpen ? (
        items.length === 0 ? (
          <View style={{ marginTop: 12 }}>
            <EmptyState message={emptyMessage} />
          </View>
        ) : (
          <View
            style={{
              marginTop: 14,
              gap: 12,
            }}
          >
            {items.map((item) => {
              const itemPercent =
                income > 0
                  ? (item.budget / income) * 100
                  : 0;

              return (
                <View key={item.id}>
                  <AppRow>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bold">
                        {item.name}
                      </AppText>

                      <AppText variant="muted">
                        {itemPercent.toFixed(1)}% of revenue
                      </AppText>
                    </View>

                    <View
                      style={{
                        alignItems: "flex-end",
                      }}
                    >
                      <AppText variant="bold">
                        {formatMoney(
                          item.budget,
                          true
                        )}
                      </AppText>

                      <AppText variant="muted">
                        {formatMoney(
                          item.spent,
                          true
                        )}{" "}
                        used
                      </AppText>
                    </View>
                  </AppRow>

                  <View style={{ marginTop: 8 }}>
                    <ProgressBar
                      percent={
                        item.budget > 0
                          ? (item.spent /
                              item.budget) *
                            100
                          : 0
                      }
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )
      ) : null}
    </AppCard>
  );
}

function CollapsibleCard({
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <AppCard>
      <Pressable onPress={onToggle}>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="section">
              {title}
            </AppText>

            {subtitle ? (
              <AppText variant="muted">
                {subtitle}
              </AppText>
            ) : null}
          </View>

          <AppText variant="bold">
            {isOpen ? "Hide" : "Show"}
          </AppText>
        </AppRow>
      </Pressable>

      {isOpen ? (
        <View style={{ marginTop: 14 }}>
          {children}
        </View>
      ) : null}
    </AppCard>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <AppRow>
      <AppText variant={strong ? "bold" : "muted"}>
        {label}
      </AppText>

      <AppText variant="bold">
        {formatMoney(value, true)}
      </AppText>
    </AppRow>
  );
}