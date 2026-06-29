import { getAppData, updateAppData } from "./appStore";
import { Household } from "./types";

export function getHouseholds() {
  return getAppData().households;
}

export async function addHousehold(
  household: Household
) {
  await updateAppData((app) => {
    app.households.push(household);
  });
}