import BusinessDashboard from "@/components/business/BusinessDashboard";
import BusinessList from "@/components/business/BusinessList";
import BusinessSetup from "@/components/business/BusinessSetup";
import NewBusinessTransaction from "@/components/business/NewBusinessTransaction";
import { loadAppData } from "@/lib/appStore";
import { getBusinesses } from "@/lib/businessStore";
import { deletePurchase } from "@/lib/purchaseStore";
import { Business, Purchase } from "@/lib/types";
import { useEffect, useState } from "react";

type ViewMode = "list" | "setup" | "dashboard" | "transaction";

export default function BusinessesScreen() {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null
  );

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

  if (selectedBusiness && viewMode === "setup") {
    return (
      <BusinessSetup
        business={selectedBusiness}
        onBack={() => setViewMode("dashboard")}
        onSave={(updated) => {
          setSelectedBusiness(updated);
          setViewMode("dashboard");
          forceUpdate((prev) => prev + 1);
        }}
      />
    );
  }

  if (selectedBusiness && viewMode === "dashboard") {
    return (
      <BusinessDashboard
        business={selectedBusiness}
        onBack={() => {
          setSelectedBusiness(null);
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

  const updatedBusiness = getBusinesses().find(
    (item) => item.id === selectedBusiness.id
  );

  if (updatedBusiness) {
    setSelectedBusiness(updatedBusiness);
  }

  forceUpdate((prev) => prev + 1);
}}
      />
    );
  }

  if (selectedBusiness && viewMode === "transaction") {
    return (
      <NewBusinessTransaction
        business={selectedBusiness}
        transaction={selectedTransaction}
        onBack={() => {
          setSelectedTransaction(null);
          setViewMode("dashboard");
        }}
        onSave={(updated) => {
          setSelectedTransaction(null);
          setSelectedBusiness(updated);
          setViewMode("dashboard");
          forceUpdate((prev) => prev + 1);
        }}
      />
    );
  }

  return (
    <BusinessList
      onCreate={(business) => {
        setSelectedBusiness(business);
        setViewMode("setup");
      }}
      onOpen={(business) => {
        setSelectedBusiness(business);
        setViewMode("dashboard");
      }}
    />
  );
}