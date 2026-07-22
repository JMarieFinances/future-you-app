import HouseholdDashboard from "@/components/household/HouseholdDashboard";
import HouseholdList from "@/components/household/HouseholdList";
import HouseholdSetup from "@/components/household/HouseholdSetup";
import NewHouseholdTransaction from "@/components/household/NewHouseholdTransaction";
import AppPage from "@/components/ui/AppPage";
import AppText from "@/components/ui/AppText";
import { loadAppData } from "@/lib/appStore";
import {
  getHouseholds,
  loadHouseholds,
} from "@/lib/householdStore";
import { deletePurchase } from "@/lib/purchaseStore";
import {
  getSharedWorkspaces,
  refreshSharedWorkspacesIntoAppData,
} from "@/lib/sharedWorkspaceStore";
import type {
  Household,
  Purchase,
} from "@/lib/types";
import {
  useFocusEffect
} from "expo-router";
import {
  useCallback,
  useState,
} from "react";

type ViewMode =
  | "list"
  | "setup"
  | "dashboard"
  | "transaction";

export default function HouseholdsScreen() {
  const [households, setHouseholds] =
    useState<Household[]>([]);

  const [
    selectedHousehold,
    setSelectedHousehold,
  ] = useState<Household | null>(null);

  const [
    selectedTransaction,
    setSelectedTransaction,
  ] = useState<Purchase | null>(null);

  const [viewMode, setViewMode] =
    useState<ViewMode>("list");

  const [loading, setLoading] =
    useState(true);

  const refreshHouseholds =
    useCallback(async () => {
      setLoading(true);

      try {
        await loadAppData();

        const sharedWorkspaces =
          await getSharedWorkspaces(
            "household"
          );

        console.log(
          "Accessible shared households:",
          sharedWorkspaces.map(
            (workspace) => ({
              id: workspace.id,
              name: workspace.name,
              role:
                workspace.current_user_role,
              localId:
                workspace.local_workspace_id,
            })
          )
        );

        await refreshSharedWorkspacesIntoAppData();

        const loadedHouseholds =
          await loadHouseholds();

        setHouseholds([
          ...loadedHouseholds,
        ]);

        if (selectedHousehold) {
          const refreshed =
            loadedHouseholds.find(
              (household) =>
                household.id ===
                selectedHousehold.id
            );

          if (refreshed) {
            setSelectedHousehold(
              refreshed
            );
          }
        }
      } catch (error) {
        console.log(
          "Unable to refresh households:",
          error
        );
      } finally {
        setLoading(false);
      }
    }, [selectedHousehold?.id]);

  useFocusEffect(
    useCallback(() => {
      refreshHouseholds();
    }, [refreshHouseholds])
  );

  const refreshSelectedHousehold =
    async (householdId: string) => {
      await refreshHouseholds();

      const updated =
        getHouseholds().find(
          (household) =>
            household.id === householdId
        );

      if (updated) {
        setSelectedHousehold(updated);
      }
    };

  if (
    loading &&
    viewMode === "list" &&
    households.length === 0
  ) {
    return (
      <AppPage>
        <AppText variant="muted">
          Loading households...
        </AppText>
      </AppPage>
    );
  }

  if (viewMode === "setup") {
    return (
      <HouseholdSetup
        household={
          selectedHousehold ?? undefined
        }
        onBack={() => {
          setViewMode(
            selectedHousehold
              ? "dashboard"
              : "list"
          );
        }}
        onSave={async (
          savedHousehold
        ) => {
          setSelectedHousehold(
            savedHousehold
          );

          setSelectedTransaction(null);
          setViewMode("dashboard");

          await refreshSelectedHousehold(
            savedHousehold.id
          );
        }}
      />
    );
  }

  if (
    selectedHousehold &&
    viewMode === "dashboard"
  ) {
    return (
      <HouseholdDashboard
        household={selectedHousehold}
        onBack={async () => {
          setSelectedHousehold(null);
          setSelectedTransaction(null);
          setViewMode("list");

          await refreshHouseholds();
        }}
        onEditBudget={() => {
          setViewMode("setup");
        }}
        onAddTransaction={() => {
          setSelectedTransaction(null);
          setViewMode("transaction");
        }}
        onEditTransaction={(
          transaction
        ) => {
          setSelectedTransaction(
            transaction
          );

          setViewMode("transaction");
        }}
        onDeleteTransaction={async (
          transactionId
        ) => {
          await deletePurchase(
            transactionId
          );

          await refreshSelectedHousehold(
            selectedHousehold.id
          );
        }}
      />
    );
  }

  if (
    selectedHousehold &&
    viewMode === "transaction"
  ) {
    return (
      <NewHouseholdTransaction
        household={selectedHousehold}
        transaction={
          selectedTransaction
        }
        onBack={() => {
          setSelectedTransaction(null);
          setViewMode("dashboard");
        }}
        onSave={async (
          updatedHousehold
        ) => {
          setSelectedTransaction(null);

          await refreshSelectedHousehold(
            updatedHousehold.id
          );

          setViewMode("dashboard");
        }}
      />
    );
  }

  return (
    <HouseholdList
      households={households}
      loading={loading}
      onRefresh={
        refreshHouseholds
      }
      onCreate={() => {
        setSelectedHousehold(null);
        setSelectedTransaction(null);
        setViewMode("setup");
      }}
      onOpen={(household) => {
        setSelectedHousehold(
          household
        );

        setSelectedTransaction(null);
        setViewMode("dashboard");
      }}
    />
  );
}