import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppData } from "./types";

const STORAGE_KEY = "future-you";

let appData: AppData = {
  personalPlan: {
    income: 0,
    obligations: 0,
    debt: 0,
    lifestyle: 0,
    safeToSpend: 0,
    goalContributions: 0,

    incomeDetails: {},
    obligationDetails: {},
    debtDetails: {},
    lifestyleDetails: {},

    goals: [],
  },

  households: [],

  businesses: [],

  settings: {
    theme: "future-you",

    notifications: {
      goalReminders: true,
      billReminders: true,
      milestones: true,
      monthlyCheckIn: true,
      affordAlerts: true,
      budgetWarnings: true,
    },
  },
};

export function getAppData() {
  return appData;
}


export async function loadAppData() {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);

  console.log("LOADED RAW DATA:", saved);

  if (saved) {
    appData = JSON.parse(saved);
  }

  console.log("LOADED PERSONAL PLAN:", appData.personalPlan);

  return appData;
}

export async function saveAppData() {
  console.log("SAVING APP DATA:", appData.personalPlan);

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(appData)
  );
}

export async function updateAppData(
  updater: (data: AppData) => void
) {
  updater(appData);

  await saveAppData();
}

