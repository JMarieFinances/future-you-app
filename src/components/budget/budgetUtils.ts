import { BudgetItem } from "@/lib/types";

export type BudgetSectionConfig<T extends string> = {
  key: T;
  title: string;
  items: string[];
};

export function getBudgetTotal(items: BudgetItem[]) {
  return items.reduce((sum, item) => sum + item.budget, 0);
}

export function getSpentTotal(items: BudgetItem[]) {
  return items.reduce((sum, item) => sum + item.spent, 0);
}

export function getPercent(spent: number, budget: number) {
  if (!budget) return 0;
  return (spent / budget) * 100;
}

export function getBudgetHealth(spent: number, assigned: number) {
  const percent = getPercent(spent, assigned);

  if (percent >= 100) {
    return {
      title: "Overspending",
      message: "You have spent more than the assigned budget.",
    };
  }

  if (percent >= 75) {
    return {
      title: "Watch Spending",
      message: "You are getting close to the budget limit.",
    };
  }

  return {
    title: "On Track",
    message: "Spending is still in a healthy range.",
  };
}

export function getInsights(sections: BudgetItem[][], label: string) {
  const allItems = sections.flat();

  if (allItems.length === 0) {
    return [`Set up budget items to unlock ${label} insights.`];
  }

  const highestUsed = [...allItems].sort(
    (a, b) => getPercent(b.spent, b.budget) - getPercent(a.spent, a.budget)
  )[0];

  const insights = [
    `${highestUsed.name} is ${getPercent(
      highestUsed.spent,
      highestUsed.budget
    ).toFixed(0)}% used.`,
  ];

  if (allItems.some((item) => item.spent > item.budget)) {
    insights.push(`At least one ${label} category is over budget.`);
  } else {
    insights.push(`No ${label} categories are over budget right now.`);
  }

  return insights;
}