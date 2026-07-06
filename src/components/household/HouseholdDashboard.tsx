import BudgetDashboard from "@/components/budget/BudgetDashboard";
import { getPurchases } from "@/lib/purchaseStore";
import { Household, Purchase } from "@/lib/types";

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
  const transactions = getPurchases().filter(
    (purchase) =>
      purchase.budgetType === "household" && purchase.budgetId === household.id
  );

  return (
    <BudgetDashboard
      title={household.name}
      subtitle={`${household.members} contributor${
        household.members === 1 ? "" : "s"
      }${household.description ? ` · ${household.description}` : ""}`}
      incomeLabel="Household Income"
      incomeSubtext="Monthly shared money available"
      income={household.budget.householdIncome}
      insightLabel="household"
      healthTitle="Budget Health"
      backLabel="Back to households"
      emptyTransactionsText="No household transactions yet."
      transactions={transactions}
      sections={[
        { id: "bills", title: "Bills", items: household.budget.bills },
        { id: "spending", title: "Household Spending", items: household.budget.spending },
        { id: "savings", title: "Household Savings", items: household.budget.savings },
      ]}
      onBack={onBack}
      onEditBudget={onEditBudget}
      onAddTransaction={onAddTransaction}
      onEditTransaction={onEditTransaction}
      onDeleteTransaction={onDeleteTransaction}
    />
  );
}