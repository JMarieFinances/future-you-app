import { getAppData, updateAppData } from "./appStore";
import { Purchase } from "./types";

export function getPurchases() {
  return getAppData().purchases ?? [];
}

export async function addPurchase(purchase: Purchase) {
  await updateAppData((app) => {
    app.purchases ??= [];
    app.purchases.push(purchase);
  });
}

export async function updatePurchase(updatedPurchase: Purchase) {
  await updateAppData((app) => {
    app.purchases = app.purchases.map((purchase) =>
      purchase.id === updatedPurchase.id ? updatedPurchase : purchase
    );
  });
}

export async function deletePurchase(id: string) {
  await updateAppData((app) => {
    app.purchases = app.purchases.filter(
      (purchase) => purchase.id !== id
    );
  });
}