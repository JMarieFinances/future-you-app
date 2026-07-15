import HouseholdDashboard from "@/components/household/HouseholdDashboard";
import HouseholdList from "@/components/household/HouseholdList";
import HouseholdSetup from "@/components/household/HouseholdSetup";
import NewHouseholdTransaction from "@/components/household/NewHouseholdTransaction";
import { loadAppData } from "@/lib/appStore";
import { getHouseholds } from "@/lib/householdStore";
import { deletePurchase } from "@/lib/purchaseStore";
import { Household, Purchase } from "@/lib/types";
import { useEffect, useState } from "react";

type ViewMode =
  | "list"
  | "setup"
  | "dashboard"
  | "transaction";

export default function HouseholdsScreen() {
  const [selectedHousehold, setSelectedHousehold] =
    useState<Household | null>(null);

  const [selectedTransaction, setSelectedTransaction] =
    useState<Purchase | null>(null);

  const [viewMode, setViewMode] =
    useState<ViewMode>("list");

  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      await loadAppData();
      forceUpdate((previous) => previous + 1);
    };

    loadData();
  }, []);

  const refreshSelectedHousehold = async (
    householdId: string
  ) => {
    await loadAppData();

    const updatedHousehold = getHouseholds().find(
      (household) => household.id === householdId
    );

    if (updatedHousehold) {
      setSelectedHousehold(updatedHousehold);
    }

    forceUpdate((previous) => previous + 1);
  };

  if (viewMode === "setup") {
    return (
      <HouseholdSetup
        household={selectedHousehold ?? undefined}
        onBack={() => {
          if (selectedHousehold) {
            setViewMode("dashboard");
          } else {
            setViewMode("list");
          }
        }}
        onSave={(savedHousehold) => {
          setSelectedHousehold(savedHousehold);
          setSelectedTransaction(null);
          setViewMode("dashboard");
          forceUpdate((previous) => previous + 1);
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
        onBack={() => {
          setSelectedHousehold(null);
          setSelectedTransaction(null);
          setViewMode("list");
          forceUpdate((previous) => previous + 1);
        }}
        onEditBudget={() => {
          setViewMode("setup");
        }}
        onAddTransaction={() => {
          setSelectedTransaction(null);
          setViewMode("transaction");
        }}
        onEditTransaction={(transaction) => {
          setSelectedTransaction(transaction);
          setViewMode("transaction");
        }}
        onDeleteTransaction={async (id) => {
          await deletePurchase(id);
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
        transaction={selectedTransaction}
        onBack={() => {
          setSelectedTransaction(null);
          setViewMode("dashboard");
        }}
        onSave={async (updatedHousehold) => {
          setSelectedTransaction(null);
          setSelectedHousehold(updatedHousehold);

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
      onCreate={() => {
        setSelectedHousehold(null);
        setSelectedTransaction(null);
        setViewMode("setup");
      }}
      onOpen={(household) => {
        setSelectedHousehold(household);
        setSelectedTransaction(null);
        setViewMode("dashboard");
      }}
    />
  );
}