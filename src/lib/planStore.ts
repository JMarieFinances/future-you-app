import { getAppData, updateAppData } from "./appStore";
import { PlanData } from "./types";

export function getPlanData(): PlanData {
  return getAppData().personalPlan;
}

export async function setPlanData(plan: PlanData) {
  await updateAppData((app) => {
    app.personalPlan = plan;
  });
}