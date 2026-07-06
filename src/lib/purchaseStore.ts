import { getAppData, updateAppData } from "./appStore";
import { Purchase } from "./types";

export function getPurchases() {
  return getAppData().purchases ?? [];
}

export async function addPurchase(purchase: Purchase) {
  await updateAppData((app) => {
    app.purchases ??= [];
    app.purchases.push(purchase);

    applyBudgetImpact(app, purchase, 1);
  });
}

export async function updatePurchase(updatedPurchase: Purchase) {
  await updateAppData((app) => {
    const existing = app.purchases.find(
      (purchase) => purchase.id === updatedPurchase.id
    );

    if (existing) {
      applyBudgetImpact(app, existing, -1);
    }

    app.purchases = app.purchases.map((purchase) =>
      purchase.id === updatedPurchase.id ? updatedPurchase : purchase
    );

    applyBudgetImpact(app, updatedPurchase, 1);
  });
}

export async function deletePurchase(id: string) {
  await updateAppData((app) => {
    const existing = app.purchases.find((purchase) => purchase.id === id);

    if (existing) {
      applyBudgetImpact(app, existing, -1);
    }

    app.purchases = app.purchases.filter((purchase) => purchase.id !== id);
  });
}

function applyBudgetImpact(
  app: any,
  purchase: Purchase,
  direction: 1 | -1
) {
  if (purchase.type !== "expense") return;

  if (purchase.budgetType === "personal") return;

  if (purchase.budgetType === "household" && purchase.budgetId) {
    const household = app.households.find(
      (item: any) => item.id === purchase.budgetId
    );

    const section = household?.budget[
      purchase.category as keyof typeof household.budget
    ];

    if (Array.isArray(section)) {
      const budgetItem = section.find(
        (item: any) => item.name === purchase.subcategory
      );

      if (budgetItem) {
        budgetItem.spent = Math.max(
          0,
          budgetItem.spent + purchase.amount * direction
        );
      }
    }
  }

  if (purchase.budgetType === "business" && purchase.budgetId) {
    const business = app.businesses.find(
      (item: any) => item.id === purchase.budgetId
    );

    const section = business?.budget[
      purchase.category as keyof typeof business.budget
    ];

    if (Array.isArray(section)) {
      const budgetItem = section.find(
        (item: any) => item.name === purchase.subcategory
      );

      if (budgetItem) {
        budgetItem.spent = Math.max(
          0,
          budgetItem.spent + purchase.amount * direction
        );
      }
    }
  }
}