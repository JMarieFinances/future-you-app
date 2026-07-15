import BusinessDashboard from "@/components/business/BusinessDashboard";
import BusinessList from "@/components/business/BusinessList";
import BusinessSetup from "@/components/business/BusinessSetup";
import NewBusinessTransaction from "@/components/business/NewBusinessTransaction";
import { loadAppData } from "@/lib/appStore";
import { getBusinesses } from "@/lib/businessStore";
import { deletePurchase } from "@/lib/purchaseStore";
import { Business, Purchase } from "@/lib/types";
import { useEffect, useState } from "react";

type ViewMode =
  | "list"
  | "setup"
  | "dashboard"
  | "transaction";

export default function BusinessesScreen() {
  const [selectedBusiness, setSelectedBusiness] =
    useState<Business | null>(null);

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

  const refreshSelectedBusiness = async (
    businessId: string
  ) => {
    await loadAppData();

    const updatedBusiness = getBusinesses().find(
      (business) => business.id === businessId
    );

    if (updatedBusiness) {
      setSelectedBusiness(updatedBusiness);
    }

    forceUpdate((previous) => previous + 1);
  };

  if (viewMode === "setup") {
    return (
      <BusinessSetup
        business={selectedBusiness ?? undefined}
        onBack={() => {
          if (selectedBusiness) {
            setViewMode("dashboard");
          } else {
            setViewMode("list");
          }
        }}
        onSave={(savedBusiness) => {
          setSelectedBusiness(savedBusiness);
          setSelectedTransaction(null);
          setViewMode("dashboard");
          forceUpdate((previous) => previous + 1);
        }}
      />
    );
  }

  if (
    selectedBusiness &&
    viewMode === "dashboard"
  ) {
    return (
      <BusinessDashboard
        business={selectedBusiness}
        onBack={() => {
          setSelectedBusiness(null);
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
          await refreshSelectedBusiness(
            selectedBusiness.id
          );
        }}
      />
    );
  }

  if (
    selectedBusiness &&
    viewMode === "transaction"
  ) {
    return (
      <NewBusinessTransaction
        business={selectedBusiness}
        transaction={selectedTransaction}
        onBack={() => {
          setSelectedTransaction(null);
          setViewMode("dashboard");
        }}
        onSave={async (updatedBusiness) => {
          setSelectedTransaction(null);
          setSelectedBusiness(updatedBusiness);

          await refreshSelectedBusiness(
            updatedBusiness.id
          );

          setViewMode("dashboard");
        }}
      />
    );
  }

  return (
    <BusinessList
      onCreate={() => {
        setSelectedBusiness(null);
        setSelectedTransaction(null);
        setViewMode("setup");
      }}
      onOpen={(business) => {
        setSelectedBusiness(business);
        setSelectedTransaction(null);
        setViewMode("dashboard");
      }}
    />
  );
}