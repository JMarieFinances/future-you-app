import ProgressBar from "@/components/budget/ProgressBar";
import {
    getBudgetTotal,
    getSpentTotal,
} from "@/components/budget/budgetUtils";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import MetricCard from "@/components/ui/MetricCard";
import type {
    BudgetItem,
    Business,
    Purchase,
} from "@/lib/types";
import { useState } from "react";
import { Pressable, View } from "react-native";

type PlanSection =
  | "revenue"
  | "operating"
  | "spending"
  | "savings"
  | "summary"
  | "transactions";

type Props = {
  business: Business;
  transactions: Purchase[];
  onEditBudget: () => void;
  onAddTransaction: () => void;
  onEditTransaction: (
    transaction: Purchase
  ) => void;
  onDeleteTransaction: (
    transactionId: string
  ) => void;
};

const formatMoney = (
  amount: number,
  includeCents = false
) =>
  `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: includeCents
      ? 2
      : 0,
    maximumFractionDigits: includeCents
      ? 2
      : 0,
  })}`;

export default function BusinessPlan({
  business,
  transactions,
  onEditBudget,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: Props) {
  const [openSections, setOpenSections] =
    useState<
      Record<PlanSection, boolean>
    >({
      revenue: true,
      operating: true,
      spending: false,
      savings: false,
      summary: true,
      transactions: false,
    });

  const revenue =
    business.budget.businessIncome;

  const operatingBudget =
    getBudgetTotal(
      business.budget.operatingExpenses
    );

  const spendingBudget =
    getBudgetTotal(
      business.budget.businessSpending
    );

  const savingsBudget =
    getBudgetTotal(
      business.budget.businessSavings
    );

  const assigned =
    operatingBudget +
    spendingBudget +
    savingsBudget;

  const operatingSpent =
    getSpentTotal(
      business.budget.operatingExpenses
    );

  const spendingSpent =
    getSpentTotal(
      business.budget.businessSpending
    );

  const savingsSpent =
    getSpentTotal(
      business.budget.businessSavings
    );

  const spent =
    operatingSpent +
    spendingSpent +
    savingsSpent;

  const ownerPay =
    business.incomeMode === "separate"
      ? 0
      : business.ownerPay || 0;

  const plannedRemaining =
    revenue - assigned - ownerPay;

  const actualRemaining =
    revenue - spent - ownerPay;

  const assignedPercent =
    revenue > 0
      ? (assigned / revenue) * 100
      : 0;

  const spentPercent =
    revenue > 0
      ? (spent / revenue) * 100
      : 0;

  const toggleSection = (
    section: PlanSection
  ) => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  return (
    <>
      <AppCard glass>
        <AppRow>
          <View style={{ flex: 1 }}>
            <AppText variant="muted">
              Planned Cash Remaining
            </AppText>

            <View style={{ marginTop: 4 }}>
              <AppText variant="title">
                {formatMoney(
                  plannedRemaining
                )}
              </AppText>
            </View>

            <AppText variant="muted">
              Revenue after planned expenses,
              savings, and owner pay
            </AppText>
          </View>

          <AppButton
            title="Edit Budget"
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
            value={`${assignedPercent.toFixed(
              0
            )}%`}
            caption={formatMoney(assigned)}
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
            value={`${spentPercent.toFixed(
              0
            )}%`}
            caption={formatMoney(spent)}
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
          revenue
        )} monthly`}
        isOpen={openSections.revenue}
        onToggle={() =>
          toggleSection("revenue")
        }
        items={
          business.budget.revenueSources
        }
        income={revenue}
        emptyMessage="No revenue sources have been added."
      />

      <PlanSectionCard
        title="Operating Expenses"
        subtitle={`${formatMoney(
          operatingBudget
        )} planned`}
        isOpen={openSections.operating}
        onToggle={() =>
          toggleSection("operating")
        }
        items={
          business.budget
            .operatingExpenses
        }
        income={revenue}
        emptyMessage="No operating expenses have been added."
      />

      <PlanSectionCard
        title="Business Spending"
        subtitle={`${formatMoney(
          spendingBudget
        )} planned`}
        isOpen={openSections.spending}
        onToggle={() =>
          toggleSection("spending")
        }
        items={
          business.budget
            .businessSpending
        }
        income={revenue}
        emptyMessage="No business spending categories have been added."
      />

      <PlanSectionCard
        title="Savings and Reserves"
        subtitle={`${formatMoney(
          savingsBudget
        )} planned`}
        isOpen={openSections.savings}
        onToggle={() =>
          toggleSection("savings")
        }
        items={
          business.budget
            .businessSavings
        }
        income={revenue}
        emptyMessage="No savings or reserve categories have been added."
      />

      <CollapsibleCard
        title="Plan Summary"
        subtitle="Monthly business allocation"
        isOpen={openSections.summary}
        onToggle={() =>
          toggleSection("summary")
        }
      >
        <View style={{ gap: 12 }}>
          <SummaryRow
            label="Monthly revenue"
            value={revenue}
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
                "rgba(255,255,255,0.08)",
            }}
          />

          <SummaryRow
            label="Planned remaining"
            value={plannedRemaining}
            strong
          />

          <SummaryRow
            label="Actual remaining"
            value={actualRemaining}
            strong
          />
        </View>
      </CollapsibleCard>

      <CollapsibleCard
        title="Transactions"
        subtitle={`${transactions.length} saved`}
        isOpen={
          openSections.transactions
        }
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
            transactions.map(
              (transaction) => (
                <AppCard
                  key={transaction.id}
                >
                  <AppRow>
                    <Pressable
                      onPress={() =>
                        onEditTransaction(
                          transaction
                        )
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
                        marginLeft: 12,
                      }}
                    >
                      <AppText variant="bold">
                        {transaction.type ===
                        "income"
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
                        style={({
                          pressed,
                        }) => ({
                          marginTop: 6,
                          opacity: pressed
                            ? 0.55
                            : 1,
                        })}
                      >
                        <AppText variant="muted">
                          Delete
                        </AppText>
                      </Pressable>
                    </View>
                  </AppRow>
                </AppCard>
              )
            )
          )}
        </View>
      </CollapsibleCard>
    </>
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
    income > 0
      ? (total / income) * 100
      : 0;

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
            <EmptyState
              message={emptyMessage}
            />
          </View>
        ) : (
          <View
            style={{
              marginTop: 14,
              gap: 14,
            }}
          >
            {items.map((item) => {
              const itemPercent =
                income > 0
                  ? (item.budget /
                      income) *
                    100
                  : 0;

              const usagePercent =
                item.budget > 0
                  ? (item.spent /
                      item.budget) *
                    100
                  : 0;

              return (
                <View key={item.id}>
                  <AppRow>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bold">
                        {item.name}
                      </AppText>

                      <AppText variant="muted">
                        {itemPercent.toFixed(
                          1
                        )}
                        % of revenue
                      </AppText>
                    </View>

                    <View
                      style={{
                        alignItems:
                          "flex-end",
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

                  <View
                    style={{
                      marginTop: 8,
                    }}
                  >
                    <ProgressBar
                      percent={
                        usagePercent
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
      <AppText
        variant={
          strong ? "bold" : "muted"
        }
      >
        {label}
      </AppText>

      <AppText variant="bold">
        {formatMoney(value, true)}
      </AppText>
    </AppRow>
  );
}