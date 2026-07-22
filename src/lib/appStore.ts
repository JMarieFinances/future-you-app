import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import type { AppData } from "./types";

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

let appData: AppData =
  cloneValue(defaultAppData);

let activeUserId: string | null =
  null;

let loadPromise:
  | Promise<AppData>
  | null = null;

let saveQueue: Promise<void> =
  Promise.resolve();

function cloneValue<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value)
  ) as T;
}

function mergeById<T extends { id: string }>(
  first: T[] | undefined,
  second: T[] | undefined
): T[] {
  const map = new Map<string, T>();

  (first ?? []).forEach((item) => {
    if (item?.id) {
      map.set(
        item.id,
        cloneValue(item)
      );
    }
  });

  (second ?? []).forEach((item) => {
    if (item?.id) {
      map.set(
        item.id,
        cloneValue(item)
      );
    }
  });

  return Array.from(map.values());
}

function normalizeAppData(
  saved?: Partial<AppData> | null
): AppData {
  return {
    ...cloneValue(defaultAppData),
    ...(saved
      ? cloneValue(saved)
      : {}),

    personalPlan: {
      ...cloneValue(
        defaultAppData.personalPlan
      ),
      ...(saved?.personalPlan
        ? cloneValue(
            saved.personalPlan
          )
        : {}),
    },

    settings: {
      ...cloneValue(
        defaultAppData.settings
      ),
      ...(saved?.settings
        ? cloneValue(saved.settings)
        : {}),

      notifications: {
        ...cloneValue(
          defaultAppData.settings
            .notifications
        ),
        ...(saved?.settings
          ?.notifications
          ? cloneValue(
              saved.settings
                .notifications
            )
          : {}),
      },
    },

    purchases: cloneValue(
      saved?.purchases ?? []
    ),

    households: cloneValue(
      saved?.households ?? []
    ),

    businesses: cloneValue(
      saved?.businesses ?? []
    ),

    calendarEvents: cloneValue(
      saved?.calendarEvents ?? []
    ),
  };
}

function mergeLocalAndCloud(
  cloudData: Partial<AppData>,
  localData: Partial<AppData>
): AppData {
  const cloud =
    normalizeAppData(cloudData);

  const local =
    normalizeAppData(localData);

  return {
    ...cloud,

    personalPlan: {
      ...cloud.personalPlan,
      ...local.personalPlan,

      incomeDetails: {
        ...cloud.personalPlan
          .incomeDetails,
        ...local.personalPlan
          .incomeDetails,
      },

      obligationDetails: {
        ...cloud.personalPlan
          .obligationDetails,
        ...local.personalPlan
          .obligationDetails,
      },

      debtDetails: {
        ...cloud.personalPlan
          .debtDetails,
        ...local.personalPlan
          .debtDetails,
      },

      lifestyleDetails: {
        ...cloud.personalPlan
          .lifestyleDetails,
        ...local.personalPlan
          .lifestyleDetails,
      },

      subscriptionDetails: {
        ...cloud.personalPlan
          .subscriptionDetails,
        ...local.personalPlan
          .subscriptionDetails,
      },

      subscriptionDueDates: {
        ...cloud.personalPlan
          .subscriptionDueDates,
        ...local.personalPlan
          .subscriptionDueDates,
      },

      obligationDueDates: {
        ...cloud.personalPlan
          .obligationDueDates,
        ...local.personalPlan
          .obligationDueDates,
      },

      goals: mergeById(
        cloud.personalPlan.goals,
        local.personalPlan.goals
      ),
    },

    settings: {
      ...cloud.settings,
      ...local.settings,

      notifications: {
        ...cloud.settings
          .notifications,
        ...local.settings
          .notifications,
      },
    },

    purchases: mergeById(
      cloud.purchases,
      local.purchases
    ),

    households: mergeById(
      cloud.households,
      local.households
    ),

    businesses: mergeById(
      cloud.businesses,
      local.businesses
    ),

    calendarEvents: mergeById(
      cloud.calendarEvents,
      local.calendarEvents
    ),
  };
}

async function getSessionUserId(): Promise<
  string | null
> {
  const {
    data,
    error,
  } =
    await supabase.auth.getSession();

  if (error) {
    console.log(
      "Unable to read auth session:",
      error.message
    );

    return activeUserId;
  }

  const userId =
    data.session?.user.id ?? null;

  activeUserId = userId;

  return userId;
}

function getStorageKey(
  userId: string | null
) {
  return userId
    ? `${BASE_STORAGE_KEY}-${userId}`
    : BASE_STORAGE_KEY;
}

async function readStoredData(
  key: string
): Promise<Partial<AppData> | null> {
  try {
    const saved =
      await AsyncStorage.getItem(key);

    if (!saved) {
      return null;
    }

    return JSON.parse(
      saved
    ) as Partial<AppData>;
  } catch (error) {
    console.log(
      "Unable to read stored app data:",
      error
    );

    return null;
  }
}

async function writeStoredData(
  key: string,
  value: AppData
) {
  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify(value)
    );
  } catch (error) {
    console.log(
      "Unable to save local app data:",
      error
    );
  }
}

export function getAppData(): AppData {
  return appData;
}

export async function loadAppData(): Promise<AppData> {
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = performLoad();

  try {
    return await loadPromise;
  } finally {
    loadPromise = null;
  }
}

async function performLoad(): Promise<AppData> {
  const userId =
    await getSessionUserId();

  const storageKey =
    getStorageKey(userId);

  const localSaved =
    await readStoredData(
      storageKey
    );

  if (!userId) {
    appData = normalizeAppData(
      localSaved
    );

    return appData;
  }

  try {
    const {
      data,
      error,
    } = await supabase
      .from("user_app_data")
      .select("app_data")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.log(
        "Unable to load cloud app data:",
        error.message
      );

      appData =
        normalizeAppData(
          localSaved
        );

      return appData;
    }

    const cloudSaved =
      data?.app_data
        ? (data.app_data as Partial<AppData>)
        : null;

    if (
      cloudSaved &&
      localSaved
    ) {
      appData =
        mergeLocalAndCloud(
          cloudSaved,
          localSaved
        );
    } else {
      appData =
        normalizeAppData(
          cloudSaved ??
            localSaved
        );
    }

    await writeStoredData(
      storageKey,
      appData
    );

    await queueCloudSave(
      userId,
      appData
    );

    return appData;
  } catch (error) {
    console.log(
      "Cloud load request failed:",
      error
    );

    appData =
      normalizeAppData(
        localSaved
      );

    return appData;
  }
}

export async function saveAppData(): Promise<void> {
  const snapshot =
    cloneValue(appData);

  saveQueue = saveQueue
    .catch(() => undefined)
    .then(async () => {
      const userId =
        await getSessionUserId();

      const storageKey =
        getStorageKey(userId);

      await writeStoredData(
        storageKey,
        snapshot
      );

      if (!userId) {
        console.log(
          "Saved locally without a signed-in user."
        );

        return;
      }

      await saveCloudSnapshot(
        userId,
        snapshot
      );
    });

  await saveQueue;
}

async function queueCloudSave(
  userId: string,
  value: AppData
) {
  const snapshot =
    cloneValue(value);

  saveQueue = saveQueue
    .catch(() => undefined)
    .then(() =>
      saveCloudSnapshot(
        userId,
        snapshot
      )
    );

  await saveQueue;
}

async function saveCloudSnapshot(
  userId: string,
  snapshot: AppData
) {
  try {
    const { error } =
      await supabase
        .from("user_app_data")
        .upsert(
          {
            user_id: userId,
            app_data: snapshot,
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

    if (error) {
      console.log(
        "Cloud sync failed:",
        error.message
      );

      return;
    }

    console.log(
      "Cloud sync success:",
      {
        userId,
        households:
          snapshot.households
            ?.length ?? 0,
        businesses:
          snapshot.businesses
            ?.length ?? 0,
      }
    );
  } catch (error) {
    console.log(
      "Cloud sync request failed:",
      error
    );
  }
}

export async function updateAppData(
  updater: (
    data: AppData
  ) => void
): Promise<AppData> {
  updater(appData);

  appData =
    normalizeAppData(appData);

  await saveAppData();

  return appData;
}

export async function resetAppData(): Promise<AppData> {
  appData =
    cloneValue(defaultAppData);

  await saveAppData();

  return appData;
}