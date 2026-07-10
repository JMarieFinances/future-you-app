import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { AppData } from "./types";

const BASE_STORAGE_KEY = "future-you";

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

let appData: AppData = structuredClone(defaultAppData);

function mergeAppData(saved: Partial<AppData>): AppData {
  return {
    ...defaultAppData,
    ...saved,

    personalPlan: {
      ...defaultAppData.personalPlan,
      ...(saved.personalPlan ?? {}),
    },

    settings: {
      ...defaultAppData.settings,
      ...(saved.settings ?? {}),

      notifications: {
        ...defaultAppData.settings.notifications,
        ...(saved.settings?.notifications ?? {}),
      },
    },

    purchases: saved.purchases ?? [],
    households: saved.households ?? [],
    businesses: saved.businesses ?? [],
    calendarEvents: saved.calendarEvents ?? [],
  };
}

async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

async function getStorageKey() {
  const user = await getCurrentUser();
  return user ? `${BASE_STORAGE_KEY}-${user.id}` : BASE_STORAGE_KEY;
}

export function getAppData() {
  return appData;
}

export async function loadAppData() {
  const user = await getCurrentUser();
  const storageKey = await getStorageKey();

  if (!user) {
    const saved = await AsyncStorage.getItem(storageKey);

    appData = saved
      ? mergeAppData(JSON.parse(saved))
      : structuredClone(defaultAppData);

    return appData;
  }

  const { data, error } = await supabase
    .from("user_app_data")
    .select("app_data")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!error && data?.app_data) {
    appData = mergeAppData(data.app_data as Partial<AppData>);
    await AsyncStorage.setItem(storageKey, JSON.stringify(appData));
    return appData;
  }

  const localSaved = await AsyncStorage.getItem(storageKey);

  appData = localSaved
    ? mergeAppData(JSON.parse(localSaved))
    : structuredClone(defaultAppData);

  await saveAppData();

  return appData;
}

export async function saveAppData() {
  const user = await getCurrentUser();
  const storageKey = await getStorageKey();

  await AsyncStorage.setItem(storageKey, JSON.stringify(appData));

  if (!user) return;

  const { error } = await supabase.from("user_app_data").upsert(
    {
      user_id: user.id,
      app_data: appData,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    console.log("Cloud sync failed:", error.message);
  }

  if (error) {
  console.log("Cloud sync failed:", error.message);
} else {
  console.log("Cloud sync success:", appData.settings.onboarded);
}
}

export async function updateAppData(updater: (data: AppData) => void) {
  updater(appData);
  await saveAppData();
}

export async function resetAppData() {
  appData = structuredClone(defaultAppData);
  await saveAppData();
}