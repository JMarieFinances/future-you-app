import { getAppData, updateAppData } from "./appStore";
import { Household } from "./types";

export function getHouseholds() {
  return getAppData().households;
}

export async function addHousehold(household: Household) {
  await updateAppData((app) => {
    app.households.push(household);
  });
}

export async function updateHousehold(
  householdId: string,
  updates: Partial<Household>
) {
  await updateAppData((app) => {
    const household = app.households.find((item) => item.id === householdId);

    if (!household) return;

    Object.assign(household, updates);
  });
}