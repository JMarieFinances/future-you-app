import BudgetDashboard from "@/components/budget/BudgetDashboard";
import { getPurchases } from "@/lib/purchaseStore";
import { Business, Purchase } from "@/lib/types";

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
  const transactions = getPurchases().filter(
    (purchase) =>
      purchase.budgetType === "business" && purchase.budgetId === business.id
  );

  return (
    <BudgetDashboard
      title={business.name}
      subtitle={`${business.businessType}${
        business.description ? ` · ${business.description}` : ""
      }`}
      incomeLabel="Business Income"
      incomeSubtext="Monthly business revenue"
      income={business.budget.businessIncome}
      insightLabel="business"
      healthTitle="Business Health"
      backLabel="Back to businesses"
      emptyTransactionsText="No business transactions yet."
      transactions={transactions}
      sections={[
        {
          id: "operatingExpenses",
          title: "Operating Expenses",
          items: business.budget.operatingExpenses,
        },
        {
          id: "businessSpending",
          title: "Business Spending",
          items: business.budget.businessSpending,
        },
        {
          id: "businessSavings",
          title: "Business Savings",
          items: business.budget.businessSavings,
        },
      ]}
      onBack={onBack}
      onEditBudget={onEditBudget}
      onAddTransaction={onAddTransaction}
      onEditTransaction={onEditTransaction}
      onDeleteTransaction={onDeleteTransaction}
    />
  );
}