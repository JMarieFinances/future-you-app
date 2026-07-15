import { getAppData, updateAppData } from "./appStore";
import { Business } from "./types";

export function getBusinesses() {
  return getAppData().businesses;
}

export function getBusiness(id: string) {
  return getAppData().businesses.find(
    (business) => business.id === id
  );
}

export async function addBusiness(
  business: Business
) {
  await updateAppData((app) => {
    app.businesses.push(business);

    if (
      business.incomeMode !== "separate" &&
      business.ownerPay > 0
    ) {
      app.personalPlan.income += business.ownerPay;

      app.personalPlan.incomeDetails[
        `business-${business.id}`
      ] = business.ownerPay;
    }
  });
}

export async function updateBusiness(
  businessId: string,
  updates: Partial<Business>
) {
  await updateAppData((app) => {
    const business = app.businesses.find(
      (item) => item.id === businessId
    );

    if (!business) return;

    const previousIncome =
      business.incomeMode !== "separate"
        ? business.ownerPay
        : 0;

    Object.assign(business, updates);

    const newIncome =
      business.incomeMode !== "separate"
        ? business.ownerPay
        : 0;

    app.personalPlan.income -= previousIncome;
    app.personalPlan.income += newIncome;

    if (newIncome > 0) {
      app.personalPlan.incomeDetails[
        `business-${business.id}`
      ] = newIncome;
    } else {
      delete app.personalPlan.incomeDetails[
        `business-${business.id}`
      ];
    }
  });
}

export async function deleteBusiness(
  businessId: string
) {
  await updateAppData((app) => {
    const business = app.businesses.find(
      (item) => item.id === businessId
    );

    if (!business) return;

    if (
      business.incomeMode !== "separate"
    ) {
      app.personalPlan.income -= business.ownerPay;

      delete app.personalPlan.incomeDetails[
        `business-${business.id}`
      ];
    }

    app.businesses = app.businesses.filter(
      (item) => item.id !== businessId
    );
  });
}