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
    
    subscriptions: 0,
subscriptionDetails: {},
subscriptionDueDates: {},
obligationDueDates: {},

    goals: [],
  },

  purchases: [],
  
  households: [],

  businesses: [],

  calendarEvents: [],
  
  settings: {
  theme: "future-you",
  onboarded: false,
  userName: "",
  paySchedule: "biweekly",
  budgetStyle: "custom",
  primaryGoal: "Save Money",

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

  console.log("LOADED APP DATA:", appData);

  return appData;
}

export async function saveAppData() {
  console.log("SAVING APP DATA:", appData);

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

export async function updateAppData(
  updater: (data: AppData) => void
) {
  updater(appData);

  await saveAppData();
}

