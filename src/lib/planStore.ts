import { getAppData, updateAppData } from "./appStore";
import { PlanData } from "./types";

export function getPlanData(): PlanData {
  return getAppData().personalPlan;
}

export async function setPlanData(plan: PlanData) {
  console.log("SETTING PERSONAL PLAN:", plan);

  await updateAppData((app) => {
    app.personalPlan = plan;
  });
}