import { getFinancialSummary } from "@/lib/financeEngine";
import { Purchase } from "@/lib/types";

export type PurchaseType = "one-time" | "monthly";

export type PurchaseSimulation = {
  name: string;
  amount: number;
  category: string;
  purchaseType: PurchaseType;
};

export function simulatePurchase(purchase: PurchaseSimulation) {
  const summary = getFinancialSummary();

  const before = summary.safeToSpend;
  const monthlyImpact =
    purchase.purchaseType === "monthly" ? purchase.amount : purchase.amount;

  const after = before - monthlyImpact;
  const goalDelayDays = getGoalDelayDays(purchase.amount, summary.goalMonthly);
  const billsCovered = after >= 0;
  const subscriptionsCovered = after >= 0;

  const recommendation = getRecommendation({
    after,
    goalDelayDays,
  });

  return {
    summary,
    before,
    after,
    goalDelayDays,
    billsCovered,
    subscriptionsCovered,
    recommendation,
  };
}

export function getRecommendation({
  after,
  goalDelayDays,
}: {
  after: number;
  goalDelayDays: number;
}) {
  if (after < 0) {
    return {
      level: "danger" as const,
      title: "Wait for now",
      message:
        "This purchase would push your safe spending below zero this month.",
    };
  }

  if (goalDelayDays > 7) {
    return {
      level: "warning" as const,
      title: "Proceed with caution",
      message:
        "You can afford it, but it may slow your goal progress.",
    };
  }

  return {
    level: "success" as const,
    title: "Go for it",
    message:
      "Your bills, subscriptions, and goals stay on track after this purchase.",
  };
}

export function getGoalDelayDays(amount: number, monthlyGoalContribution: number) {
  if (monthlyGoalContribution <= 0 || amount <= 0) return 0;

  const dailyGoalPace = monthlyGoalContribution / 30;

  if (dailyGoalPace <= 0) return 0;

  return Math.ceil(amount / dailyGoalPace);
}

export function createPurchaseFromSimulation(
  purchase: PurchaseSimulation
): Purchase {
  return {
    id: Date.now().toString(),
    name: purchase.name.trim() || "Purchase",
    amount: purchase.amount,
    category: purchase.category,
    date: new Date().toISOString(),
    type: "expense",
    budgetType: "personal",
    notes:
      purchase.purchaseType === "monthly"
        ? "Monthly purchase simulated in Afford."
        : "One-time purchase simulated in Afford.",
  };
}