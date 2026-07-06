import { getBusinesses } from "./businessStore";
import { getHouseholds } from "./householdStore";
import { getPlanData } from "./planStore";
import { getPurchases } from "./purchaseStore";
import { BudgetItem, Goal, Purchase } from "./types";

function sumBudget(items: BudgetItem[] = []) {
  return items.reduce((sum, item) => sum + item.budget, 0);
}

function sumPurchases(purchases: Purchase[], type: "income" | "expense") {
  return purchases
    .filter((purchase) => purchase.type === type)
    .reduce((sum, purchase) => sum + purchase.amount, 0);
}

function sumDetails(details?: Record<string, number>) {
  return Object.values(details ?? {}).reduce((sum, value) => sum + value, 0);
}

function isThisMonth(date: string) {
  const purchaseDate = new Date(date);
  const now = new Date();

  return (
    purchaseDate.getMonth() === now.getMonth() &&
    purchaseDate.getFullYear() === now.getFullYear()
  );
}

export function getFinancialSummary() {
  const plan = getPlanData();
  const households = getHouseholds();
  const businesses = getBusinesses();
  const purchases = getPurchases();

  const monthlyPurchases = purchases.filter((purchase) =>
    isThisMonth(purchase.date)
  );

  const personalPurchases = monthlyPurchases.filter(
    (purchase) => purchase.budgetType === "personal"
  );

  const householdPurchases = monthlyPurchases.filter(
    (purchase) => purchase.budgetType === "household"
  );

  const businessPurchases = monthlyPurchases.filter(
    (purchase) => purchase.budgetType === "business"
  );

  const personalSpent = sumPurchases(personalPurchases, "expense");
  const householdSpent = sumPurchases(householdPurchases, "expense");
  const businessSpent = sumPurchases(businessPurchases, "expense");
  const personalIncomeLogged = sumPurchases(personalPurchases, "income");

  const fixedExpenses = plan.obligations ?? sumDetails(plan.obligationDetails);
  const subscriptions = plan.subscriptions ?? sumDetails(plan.subscriptionDetails);
  const debt = plan.debt ?? sumDetails(plan.debtDetails);
  const lifestyle = plan.lifestyle ?? sumDetails(plan.lifestyleDetails);

  const activeGoals = plan.goals.filter((goal) => !goal.archived);
  const goalSaved = plan.goals.reduce((sum, goal) => sum + goal.current, 0);
  const goalTarget = plan.goals.reduce((sum, goal) => sum + goal.target, 0);
  const goalMonthly = activeGoals.reduce((sum, goal) => sum + goal.monthly, 0);
  const goalProgress =
    goalTarget > 0 ? Math.min((goalSaved / goalTarget) * 100, 100) : 0;

  const householdIncome = households.reduce(
    (sum, household) => sum + household.budget.householdIncome,
    0
  );

  const householdAssigned = households.reduce(
    (sum, household) =>
      sum +
      sumBudget(household.budget.bills) +
      sumBudget(household.budget.spending) +
      sumBudget(household.budget.savings),
    0
  );

  const householdPersonalPull = households.reduce((sum, household) => {
    if (household.includedInPersonalPlan) return sum;
    return sum + household.budget.householdIncome;
  }, 0);

  const businessMainIncome = businesses
    .filter((business) => business.incomeMode === "main")
    .reduce((sum, business) => sum + business.budget.businessIncome, 0);

  const businessCombinedIncome = businesses
    .filter((business) => business.incomeMode === "combined")
    .reduce((sum, business) => sum + business.budget.businessIncome, 0);

  const businessSeparateIncome = businesses
    .filter(
      (business) =>
        !business.incomeMode || business.incomeMode === "separate"
    )
    .reduce((sum, business) => sum + business.budget.businessIncome, 0);

  const personalBaseIncome =
    businessMainIncome > 0
      ? businessMainIncome + personalIncomeLogged
      : plan.income + businessCombinedIncome + personalIncomeLogged;

  const businessIncome =
    businessMainIncome + businessCombinedIncome + businessSeparateIncome;

  const businessAssigned = businesses.reduce(
    (sum, business) =>
      sum +
      sumBudget(business.budget.operatingExpenses) +
      sumBudget(business.budget.businessSpending) +
      sumBudget(business.budget.businessSavings),
    0
  );

  const plannedPersonalTotal =
    fixedExpenses + subscriptions + debt + lifestyle + goalMonthly;

  const totalAssigned =
    plannedPersonalTotal + householdAssigned + businessAssigned;

  const totalIncome =
    personalBaseIncome + householdIncome + businessSeparateIncome;

  const totalSpent = personalSpent + householdSpent + businessSpent;

  const safeToSpend =
    personalBaseIncome -
    plannedPersonalTotal -
    householdPersonalPull -
    personalSpent;

  const netCashFlow = totalIncome - totalSpent;
  const estimatedSaved = Math.max(totalIncome - totalAssigned - totalSpent, 0);
  const savingsRate =
    totalIncome > 0 ? (estimatedSaved / totalIncome) * 100 : 0;

  const biggestExpense = [...monthlyPurchases]
    .filter((purchase) => purchase.type === "expense")
    .sort((a, b) => b.amount - a.amount)[0];

  const recentTransactions = [...monthlyPurchases].reverse().slice(0, 8);

  const budgetScore = getBudgetScore({
    safeToSpend,
    totalIncome,
    totalSpent,
    goals: plan.goals,
  });

  return {
    plan,
    households,
    businesses,
    purchases,
    monthlyPurchases,

    personalBaseIncome,
    personalSpent,

    fixedExpenses,
    subscriptions,
    subscriptionDetails: plan.subscriptionDetails ?? {},
    debt,
    lifestyle,

    householdIncome,
    householdAssigned,
    householdSpent,
    householdPersonalPull,

    businessIncome,
    businessMainIncome,
    businessCombinedIncome,
    businessSeparateIncome,
    businessAssigned,
    businessSpent,

    goalSaved,
    goalTarget,
    goalMonthly,
    goalProgress,

    totalIncome,
    totalSpent,
    totalAssigned,
    estimatedSaved,
    netCashFlow,
    savingsRate,
    safeToSpend,
    budgetScore,
    biggestExpense,
    recentTransactions,
  };
}

export function getMonthlyReview() {
  const summary = getFinancialSummary();

  const wins: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (summary.totalSpent === 0) {
    recommendations.push("No purchases have been logged yet this month.");
  }

  if (summary.safeToSpend >= 0) {
    wins.push(`You still have $${summary.safeToSpend.toFixed(0)} safe to spend.`);
  } else {
    warnings.push(
      `You are $${Math.abs(summary.safeToSpend).toFixed(0)} over your safe-to-spend amount.`
    );
  }

  if (summary.goalMonthly > 0) {
    wins.push(`You planned $${summary.goalMonthly.toFixed(0)} toward goals.`);
  }

  if (summary.subscriptions > 0) {
    recommendations.push(
      `Subscriptions total $${summary.subscriptions.toFixed(0)} this month.`
    );
  }

  if (summary.biggestExpense) {
    recommendations.push(
      `${summary.biggestExpense.name} was your largest logged purchase at $${summary.biggestExpense.amount.toFixed(0)}.`
    );
  }

  return {
    month: new Date().toLocaleString("default", { month: "long" }),
    year: new Date().getFullYear(),
    income: summary.totalIncome,
    spent: summary.totalSpent,
    saved: summary.estimatedSaved,
    netCashFlow: summary.netCashFlow,
    savingsRate: summary.savingsRate,
    budgetScore: summary.budgetScore,
    goalContributions: summary.goalMonthly,
    biggestExpense: summary.biggestExpense,
    wins,
    warnings,
    recommendations,
  };
}

function getBudgetScore({
  safeToSpend,
  totalIncome,
  totalSpent,
  goals,
}: {
  safeToSpend: number;
  totalIncome: number;
  totalSpent: number;
  goals: Goal[];
}) {
  let score = 100;

  if (safeToSpend < 0) score -= 30;
  if (totalIncome > 0 && totalSpent / totalIncome > 0.85) score -= 20;
  if (goals.length === 0) score -= 10;
  if (goals.length > 0 && goals.every((goal) => goal.monthly <= 0)) score -= 10;

  score = Math.max(0, Math.min(score, 100));

  return {
    score,
    label:
      score >= 90
        ? "Excellent"
        : score >= 75
        ? "Healthy"
        : score >= 60
        ? "Watch closely"
        : "Needs attention",
  };
}