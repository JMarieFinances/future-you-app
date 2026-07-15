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
import { Household, Purchase } from "@/lib/types";
import { useState } from "react";
import { Pressable, View } from "react-native";

type Section =
  | "income"
  | "bills"
  | "spending"
  | "savings"
  | "transactions"
  | "summary";

export default function HouseholdPlan({
  household,
  transactions,
  onEditBudget,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: {
  household: Household;
  transactions: Purchase[];
  onEditBudget: () => void;
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Purchase) => void;
  onDeleteTransaction: (id: string) => void;
}) {
  const [open, setOpen] = useState<Record<Section, boolean>>({
    income: true,
    bills: true,
    spending: false,
    savings: false,
    transactions: false,
    summary: true,
  });

  const toggle = (section: Section) =>
    setOpen((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));

  const income = household.budget.householdIncome;

  const billsTotal = getBudgetTotal(household.budget.bills);
  const spendingTotal = getBudgetTotal(
    household.budget.spending
  );
  const savingsTotal = getBudgetTotal(
    household.budget.savings
  );

  const assigned =
    billsTotal +
    spendingTotal +
    savingsTotal;

  const spent =
    getSpentTotal(household.budget.bills) +
    getSpentTotal(household.budget.spending) +
    getSpentTotal(household.budget.savings);

  const remaining = income - assigned;

  return (
    <>
      <AppCard glass>
        <AppRow>
          <View>
            <AppText variant="muted">
              Household Plan
            </AppText>

            <View style={{ marginTop: 4 }}>
              <AppText variant="title">
                ${remaining.toFixed(0)}
              </AppText>
            </View>

            <AppText variant="muted">
              Remaining after planning
            </AppText>
          </View>

          <AppButton
            title="Edit Budget"
            onPress={onEditBudget}
          />
        </AppRow>
      </AppCard>

      <SectionCard
        title="Income"
        subtitle={`$${income.toFixed(0)} monthly`}
        open={open.income}
        onToggle={() => toggle("income")}
      >
        {household.budget.incomeSources.length === 0 ? (
          <EmptyState message="No income sources yet." />
        ) : (
          household.budget.incomeSources.map((item) => (
            <BudgetRow
              key={item.id}
              name={item.name}
              budget={item.budget}
              spent={item.spent}
            />
          ))
        )}
      </SectionCard>

      <SectionCard
        title="Bills"
        subtitle={`$${billsTotal.toFixed(0)} planned`}
        open={open.bills}
        onToggle={() => toggle("bills")}
      >
        {household.budget.bills.length === 0 ? (
          <EmptyState message="No bills yet." />
        ) : (
          household.budget.bills.map((item) => (
            <BudgetRow
              key={item.id}
              name={item.name}
              budget={item.budget}
              spent={item.spent}
            />
          ))
        )}
      </SectionCard>

      <SectionCard
        title="Household Spending"
        subtitle={`$${spendingTotal.toFixed(0)} planned`}
        open={open.spending}
        onToggle={() => toggle("spending")}
      >
        {household.budget.spending.length === 0 ? (
          <EmptyState message="No spending categories yet." />
        ) : (
          household.budget.spending.map((item) => (
            <BudgetRow
              key={item.id}
              name={item.name}
              budget={item.budget}
              spent={item.spent}
            />
          ))
        )}
      </SectionCard>

      <SectionCard
        title="Savings"
        subtitle={`$${savingsTotal.toFixed(0)} planned`}
        open={open.savings}
        onToggle={() => toggle("savings")}
      >
        {household.budget.savings.length === 0 ? (
          <EmptyState message="No savings categories yet." />
        ) : (
          household.budget.savings.map((item) => (
            <BudgetRow
              key={item.id}
              name={item.name}
              budget={item.budget}
              spent={item.spent}
            />
          ))
        )}
      </SectionCard>

      <SectionCard
        title="Summary"
        subtitle="Monthly overview"
        open={open.summary}
        onToggle={() => toggle("summary")}
      >
        <SummaryRow
          label="Income"
          value={income}
        />

        <SummaryRow
          label="Assigned"
          value={assigned}
        />

        <SummaryRow
          label="Spent"
          value={spent}
        />

        <SummaryRow
          label="Remaining"
          value={remaining}
        />
      </SectionCard>

      <SectionCard
        title="Transactions"
        subtitle={`${transactions.length} total`}
        open={open.transactions}
        onToggle={() =>
          toggle("transactions")
        }
      >
        <AppButton
          title="Add Transaction"
          onPress={onAddTransaction}
        />

        <View
          style={{
            marginTop: 14,
            gap: 10,
          }}
        >
          {transactions.length === 0 ? (
            <EmptyState message="No household transactions." />
          ) : (
            transactions.map((transaction) => (
              <AppCard key={transaction.id}>
                <AppRow>
                  <Pressable
                    style={{ flex: 1 }}
                    onPress={() =>
                      onEditTransaction(
                        transaction
                      )
                    }
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
                      $
                      {transaction.amount.toFixed(
                        2
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
      </SectionCard>
    </>
  );
}

function SectionCard({
  title,
  subtitle,
  open,
  onToggle,
  children,
}: any) {
  return (
    <AppCard>
      <Pressable onPress={onToggle}>
        <AppRow>
          <View>
            <AppText variant="section">
              {title}
            </AppText>

            <AppText variant="muted">
              {subtitle}
            </AppText>
          </View>

          <AppText variant="bold">
            {open ? "Hide" : "Show"}
          </AppText>
        </AppRow>
      </Pressable>

      {open ? (
        <View
          style={{
            marginTop: 14,
          }}
        >
          {children}
        </View>
      ) : null}
    </AppCard>
  );
}

function BudgetRow({
  name,
  budget,
  spent,
}: any) {
  return (
    <View
      style={{
        marginBottom: 16,
      }}
    >
      <AppRow>
        <AppText variant="bold">
          {name}
        </AppText>

        <AppText variant="bold">
          ${budget.toFixed(0)}
        </AppText>
      </AppRow>

      <ProgressBar
        percent={
          budget === 0
            ? 0
            : (spent / budget) * 100
        }
      />

      <AppText variant="muted">
        ${spent.toFixed(0)} spent
      </AppText>
    </View>
  );
}

function SummaryRow({
  label,
  value,
}: any) {
  return (
    <AppRow>
      <AppText variant="muted">
        {label}
      </AppText>

      <AppText variant="bold">
        ${value.toFixed(0)}
      </AppText>
    </AppRow>
  );
}