import HouseholdDashboard from "@/components/household/HouseholdDashboard";
import HouseholdList from "@/components/household/HouseholdList";
import HouseholdSetup from "@/components/household/HouseholdSetup";
import NewHouseholdTransaction from "@/components/household/NewHouseholdTransaction";
import { loadAppData } from "@/lib/appStore";
import { getHouseholds } from "@/lib/householdStore";
import { deletePurchase } from "@/lib/purchaseStore";
import { Household, Purchase } from "@/lib/types";
import { useEffect, useState } from "react";

type ViewMode = "list" | "setup" | "dashboard" | "transaction";

export default function HouseholdsScreen() {
  const [selectedHousehold, setSelectedHousehold] =
    useState<Household | null>(null);

  const [selectedTransaction, setSelectedTransaction] =
    useState<Purchase | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      await loadAppData();
      forceUpdate((prev) => prev + 1);
    };

    loadData();
  }, []);

  if (selectedHousehold && viewMode === "setup") {
    return (
      <HouseholdSetup
        household={selectedHousehold}
        onBack={() => setViewMode("dashboard")}
        onSave={(updated) => {
          setSelectedHousehold(updated);
          setViewMode("dashboard");
          forceUpdate((prev) => prev + 1);
        }}
      />
    );
  }

  if (selectedHousehold && viewMode === "dashboard") {
    return (
      <HouseholdDashboard
        household={selectedHousehold}
        onBack={() => {
          setSelectedHousehold(null);
          setSelectedTransaction(null);
          setViewMode("list");
          forceUpdate((prev) => prev + 1);
        }}
        onEditBudget={() => setViewMode("setup")}
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
  await loadAppData();

  const updatedHousehold = getHouseholds().find(
    (item) => item.id === selectedHousehold.id
  );

  if (updatedHousehold) {
    setSelectedHousehold(updatedHousehold);
  }

  forceUpdate((prev) => prev + 1);
}}
      />
    );
  }

  if (selectedHousehold && viewMode === "transaction") {
    return (
      <NewHouseholdTransaction
        household={selectedHousehold}
        transaction={selectedTransaction}
        onBack={() => {
          setSelectedTransaction(null);
          setViewMode("dashboard");
        }}
        onSave={(updated) => {
          setSelectedTransaction(null);
          setSelectedHousehold(updated);
          setViewMode("dashboard");
          forceUpdate((prev) => prev + 1);
        }}
      />
    );
  }

  return (
    <HouseholdList
      onCreate={(household) => {
        setSelectedHousehold(household);
        setViewMode("setup");
      }}
      onOpen={(household) => {
        setSelectedHousehold(household);
        setViewMode("dashboard");
      }}
    />
  );
}