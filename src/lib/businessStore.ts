import { getAppData, updateAppData } from "./appStore";
import { Business } from "./types";

export function getBusinesses() {
  return getAppData().businesses;
}

export async function addBusiness(
  business: Business
) {
  await updateAppData((app) => {
    app.businesses.push(business);
  });
}