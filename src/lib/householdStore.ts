import {
  getAppData,
  updateAppData,
} from "./appStore";
import {
  getSharedWorkspaces,
  type SharedWorkspace,
} from "./sharedWorkspaceStore";
import type { Household } from "./types";

export function getHouseholds(): Household[] {
  return getAppData().households ?? [];
}

export async function loadHouseholds(): Promise<Household[]> {
  const localHouseholds =
    getHouseholds().filter(isValidHousehold);

  let sharedWorkspaces: SharedWorkspace[] = [];

  try {
    sharedWorkspaces =
      await getSharedWorkspaces(
        "household"
      );
  } catch (error) {
    console.log(
      "Unable to load shared households:",
      error
    );

    return localHouseholds;
  }

  const householdMap =
    new Map<string, Household>();

  localHouseholds.forEach(
    (household) => {
      householdMap.set(
        household.id,
        cloneHousehold(household)
      );
    }
  );

  sharedWorkspaces.forEach(
    (workspace) => {
      if (
        workspace.type !==
        "household"
      ) {
        return;
      }

      const household =
        workspace.workspace_data;

      if (!isValidHousehold(household)) {
        console.log(
          "Invalid shared household data:",
          {
            workspaceId:
              workspace.id,
            workspaceName:
              workspace.name,
            workspaceData:
              household,
          }
        );

        return;
      }

      householdMap.set(
        household.id,
        cloneHousehold(household)
      );
    }
  );

  const mergedHouseholds =
    Array.from(
      householdMap.values()
    );

  await updateAppData((app) => {
    app.households =
      mergedHouseholds;
  });

  console.log(
    "Loaded household access:",
    sharedWorkspaces.map(
      (workspace) => ({
        sharedWorkspaceId:
          workspace.id,
        householdId:
          workspace.workspace_data
            ?.id,
        name: workspace.name,
        role:
          workspace.current_user_role,
        ownerId:
          workspace.owner_id,
      })
    )
  );

  console.log(
    "Households saved locally:",
    mergedHouseholds.map(
      (household) => ({
        id: household.id,
        name: household.name,
      })
    )
  );

  return mergedHouseholds;
}

export async function addHousehold(
  household: Household
) {
  if (!isValidHousehold(household)) {
    throw new Error(
      "The household data is invalid."
    );
  }

  await updateAppData((app) => {
    app.households ??= [];

    const existingIndex =
      app.households.findIndex(
        (item) =>
          item.id === household.id
      );

    if (existingIndex >= 0) {
      app.households[
        existingIndex
      ] = cloneHousehold(
        household
      );

      return;
    }

    app.households.push(
      cloneHousehold(household)
    );
  });
}

export async function updateHousehold(
  householdId: string,
  updates: Partial<Household>
) {
  await updateAppData((app) => {
    app.households ??= [];

    const householdIndex =
      app.households.findIndex(
        (item) =>
          item.id === householdId
      );

    if (householdIndex < 0) {
      return;
    }

    app.households[
      householdIndex
    ] = {
      ...app.households[
        householdIndex
      ],
      ...cloneValue(updates),
    };
  });
}

export async function replaceHousehold(
  household: Household
) {
  await addHousehold(household);
}

export async function removeHousehold(
  householdId: string
) {
  await updateAppData((app) => {
    app.households =
      (
        app.households ?? []
      ).filter(
        (household) =>
          household.id !==
          householdId
      );
  });
}

export async function refreshHousehold(
  householdId: string
): Promise<Household | null> {
  const households =
    await loadHouseholds();

  return (
    households.find(
      (household) =>
        household.id ===
        householdId
    ) ?? null
  );
}

function cloneHousehold(
  household: Household
): Household {
  return cloneValue(household);
}

function cloneValue<T>(
  value: T
): T {
  return JSON.parse(
    JSON.stringify(value)
  ) as T;
}

function isValidHousehold(
  value: unknown
): value is Household {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const household =
    value as Partial<Household>;

  return Boolean(
    household.id &&
      household.name &&
      household.budget &&
      typeof household
        .budget
        .householdIncome ===
        "number"
  );
}