import PurchaseForm from "@/components/afford/PurchaseForm";
import PurchaseHistory from "@/components/afford/PurchaseHistory";
import PurchaseImpact from "@/components/afford/PurchaseImpact";
import RecommendationCard from "@/components/afford/RecommendationCard";
import {
  createPurchaseFromSimulation,
  PurchaseType,
  simulatePurchase,
} from "@/components/afford/affordUtils";
import AppCard from "@/components/ui/AppCard";
import AppPage from "@/components/ui/AppPage";
import AppText from "@/components/ui/AppText";
import PageHeader from "@/components/ui/PageHeader";
import { loadAppData } from "@/lib/appStore";
import { getFinancialSummary } from "@/lib/financeEngine";
import { addPurchase, deletePurchase } from "@/lib/purchaseStore";
import { Purchase } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";

export default function AffordScreen() {
  const [isReady, setIsReady] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Shopping");
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("one-time");

  useEffect(() => {
    const load = async () => {
      await loadAppData();
      setIsReady(true);
    };

    load();
  }, [refreshKey]);

  const refresh = async () => {
    await loadAppData();
    setRefreshKey((prev) => prev + 1);
  };

  const resetForm = () => {
    setName("");
    setAmount("");
    setCategory("Shopping");
    setPurchaseType("one-time");
  };

  if (!isReady) {
    return <AppPage />;
  }

  const summary = getFinancialSummary();
  const purchaseAmount = Number(amount) || 0;

  const simulation = useMemo(
    () =>
      simulatePurchase({
        name,
        amount: purchaseAmount,
        category,
        purchaseType,
      }),
    [name, purchaseAmount, category, purchaseType, refreshKey]
  );

  const purchaseHistory = summary.purchases
    .filter(
      (purchase) =>
        purchase.budgetType === "personal" && purchase.type === "expense"
    )
    .slice()
    .reverse();

  const savePurchase = async () => {
    if (!name.trim() || purchaseAmount <= 0) return;

    const purchase = createPurchaseFromSimulation({
      name,
      amount: purchaseAmount,
      category,
      purchaseType,
    });

    await addPurchase(purchase);
    resetForm();
    await refresh();
  };

  const loadPurchase = (purchase: Purchase) => {
    setName(purchase.name);
    setAmount(String(purchase.amount));
    setCategory(purchase.category || "Shopping");
    setPurchaseType(
      purchase.notes?.includes("Monthly purchase") ? "monthly" : "one-time"
    );
  };

  const removePurchase = async (purchaseId: string) => {
    await deletePurchase(purchaseId);
    await refresh();
  };

  return (
    <AppPage>
      <PageHeader
        title="Afford"
        subtitle="Simulate a purchase before it hits your budget."
      />

      <AppCard>
        <AppText variant="muted">Current Safe To Spend</AppText>

        <View style={{ marginTop: 4 }}>
          <AppText variant="title">${summary.safeToSpend.toFixed(2)}</AppText>
        </View>

        <AppText variant="muted">
          Based on your income, fixed expenses, subscriptions, debt, lifestyle,
          goals, and household setup.
        </AppText>
      </AppCard>

      <PurchaseForm
        name={name}
        setName={setName}
        amount={amount}
        setAmount={setAmount}
        category={category}
        setCategory={setCategory}
        purchaseType={purchaseType}
        setPurchaseType={setPurchaseType}
        onSave={savePurchase}
      />

      {purchaseAmount > 0 ? (
        <>
          <PurchaseImpact
            before={simulation.before}
            after={simulation.after}
            billsCovered={simulation.billsCovered}
            subscriptionsCovered={simulation.subscriptionsCovered}
            goalDelayDays={simulation.goalDelayDays}
          />

          <RecommendationCard
            level={simulation.recommendation.level}
            title={simulation.recommendation.title}
            message={simulation.recommendation.message}
          />
        </>
      ) : null}

      <PurchaseHistory
        purchases={purchaseHistory}
        onSelect={loadPurchase}
        onDelete={removePurchase}
      />
    </AppPage>
  );
}