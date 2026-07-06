import { getAppData, updateAppData } from "./appStore";
import { Business } from "./types";

export function getBusinesses() {
  return getAppData().businesses;
}

export async function addBusiness(business: Business) {
  await updateAppData((app) => {
    app.businesses.push(business);
  });
}

export async function updateBusiness(
  businessId: string,
  updates: Partial<Business>
) {
  await updateAppData((app) => {
    const business = app.businesses.find((item) => item.id === businessId);

    if (!business) return;

    Object.assign(business, updates);
  });
}