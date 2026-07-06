import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { AppData } from "./types";

const STORAGE_KEY = "future-you";

const defaultAppData: AppData = {
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

let appData: AppData = defaultAppData;

export function getAppData() {
  return appData;
}

export async function loadAppData() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);

    if (saved) {
      appData = JSON.parse(saved);
    }

    return appData;
  }

  const { data, error } = await supabase
    .from("user_app_data")
    .select("app_data")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);

    if (saved) {
      appData = JSON.parse(saved);
    }

    return appData;
  }

  if (data?.app_data) {
    appData = data.app_data as AppData;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    return appData;
  }

  const saved = await AsyncStorage.getItem(STORAGE_KEY);

  if (saved) {
    appData = JSON.parse(saved);
  } else {
    appData = defaultAppData;
  }

  await saveAppData();

  return appData;
}

export async function saveAppData() {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(appData));

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) return;

  await supabase.from("user_app_data").upsert({
    user_id: user.id,
    app_data: appData,
    updated_at: new Date().toISOString(),
  });
}

export async function updateAppData(updater: (data: AppData) => void) {
  updater(appData);
  await saveAppData();
}