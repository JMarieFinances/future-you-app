import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import PurchaseDetailsModal from "@/components/dashboard/PurchaseDetailsModal";
import PurchaseFormModal from "@/components/dashboard/PurchaseFormModal";
import { loadAppData } from "@/lib/appStore";
import { getPlanData } from "@/lib/planStore";
import {
  addPurchase,
  deletePurchase,
  getPurchases,
  updatePurchase,
} from "@/lib/purchaseStore";
import type { Purchase } from "@/lib/types";

export default function DashboardScreen() {
  const [, forceUpdate] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  const [purchaseName, setPurchaseName] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [purchaseCategory, setPurchaseCategory] = useState("");

  useEffect(() => {
    const load = async () => {
      await loadAppData();
      forceUpdate((prev) => prev + 1);
    };

    load();
  }, []);

  const plan = getPlanData();

  const purchases = getPurchases().filter(
    (purchase) => purchase.budgetType === "personal"
  );

  const lifestyleCategories = Object.entries(plan.lifestyleDetails);
  const categoryNames = lifestyleCategories.map(([category]) => category);

  const getSpentForCategory = (category: string) =>
    purchases
      .filter((purchase) => purchase.category === category)
      .reduce((sum, purchase) => sum + purchase.amount, 0);

  const totalOverspent = lifestyleCategories.reduce(
    (sum, [category, budget]) => {
      const spent = getSpentForCategory(category);
      return sum + Math.max(spent - budget, 0);
    },
    0
  );

  const baseSafeToSpend = plan.safeToSpend - plan.goalContributions;
  const finalSafeToSpend = baseSafeToSpend - totalOverspent;

  const weeklySafeToSpend = finalSafeToSpend / 4;
  const dailySafeToSpend = finalSafeToSpend / 30;

  const recentPurchases = purchases.slice(-5).reverse();

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  const resetForm = () => {
    setPurchaseName("");
    setPurchaseAmount("");
    setPurchaseCategory("");
    setEditingPurchase(null);
    setFormOpen(false);
  };

  const openAddPurchase = () => {
    setEditingPurchase(null);
    setPurchaseName("");
    setPurchaseAmount("");
    setPurchaseCategory(categoryNames[0] ?? "");
    setFormOpen(true);
  };

  const openEditPurchase = () => {
    if (!selectedPurchase) return;

    setEditingPurchase(selectedPurchase);
    setPurchaseName(selectedPurchase.name);
    setPurchaseAmount(String(selectedPurchase.amount));
    setPurchaseCategory(selectedPurchase.category);

    setSelectedPurchase(null);
    setFormOpen(true);
  };

  const handleSavePurchase = async () => {
    if (!purchaseName.trim()) return;

    const amount = Number(purchaseAmount) || 0;
    if (amount <= 0) return;

    const category = purchaseCategory || categoryNames[0] || "Other";

    if (editingPurchase) {
      await updatePurchase({
        ...editingPurchase,
        name: purchaseName,
        amount,
        category,
      });
    } else {
      await addPurchase({
        id: Date.now().toString(),
        name: purchaseName,
        amount,
        category,
        date: new Date().toISOString(),
        budgetType: "personal",
      });
    }

    resetForm();
    forceUpdate((prev) => prev + 1);
  };

  const handleDeletePurchase = async () => {
    if (!selectedPurchase) return;

    await deletePurchase(selectedPurchase.id);
    setSelectedPurchase(null);
    forceUpdate((prev) => prev + 1);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 32, fontWeight: "bold" }}>Future You</Text>

      <View style={cardStyle}>
        <Text style={cardTitle}>💰 Safe To Spend</Text>

        <Text style={{ fontSize: 44, fontWeight: "bold" }}>
          ${finalSafeToSpend.toFixed(0)}
        </Text>

        <View style={threeColumn}>
          <View>
            <Text style={miniLabel}>Today</Text>
            <Text style={miniNumber}>${dailySafeToSpend.toFixed(2)}</Text>
          </View>

          <View>
            <Text style={miniLabel}>This Week</Text>
            <Text style={miniNumber}>${weeklySafeToSpend.toFixed(2)}</Text>
          </View>

          <View>
            <Text style={miniLabel}>This Month</Text>
            <Text style={miniNumber}>${finalSafeToSpend.toFixed(2)}</Text>
          </View>
        </View>

        {totalOverspent > 0 ? (
          <Text style={{ marginTop: 12, fontWeight: "bold" }}>
            🚨 Overspending reduced this by ${totalOverspent}.
          </Text>
        ) : (
          <Text style={{ marginTop: 12 }}>
            Purchases only reduce this when a category goes over budget.
          </Text>
        )}
      </View>

      <Pressable onPress={openAddPurchase} style={buttonStyle}>
        <Text style={buttonText}>+ Add Purchase</Text>
      </Pressable>

      <View style={cardStyle}>
        <Text style={cardTitle}>🛍 Budget Tracker</Text>

        {lifestyleCategories.length === 0 ? (
          <Text>No lifestyle categories yet.</Text>
        ) : (
          lifestyleCategories.map(([category, budget]) => {
            const spent = getSpentForCategory(category);
            const remaining = budget - spent;
            const percent =
              budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
            const overspent = Math.max(spent - budget, 0);

            return (
              <View key={category} style={trackerCard}>
                <View style={rowStyle}>
                  <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                    {category}
                  </Text>

                  <Text style={{ fontWeight: "bold" }}>
                    ${spent} / ${budget}
                  </Text>
                </View>

                <View style={progressTrack}>
                  <View style={[progressFill, { width: `${percent}%` }]} />
                </View>

                {overspent > 0 ? (
                  <Text style={{ fontWeight: "bold" }}>
                    🚨 Over by ${overspent}. Safe To Spend reduced.
                  </Text>
                ) : (
                  <Text>${remaining} remaining</Text>
                )}
              </View>
            );
          })
        )}
      </View>

      <View style={cardStyle}>
        <Text style={cardTitle}>📈 Recent Activity</Text>

        {recentPurchases.length === 0 ? (
          <Text>No purchases yet.</Text>
        ) : (
          recentPurchases.map((purchase) => (
            <Pressable
              key={purchase.id}
              style={activityRow}
              onPress={() => setSelectedPurchase(purchase)}
            >
              <View>
                <Text style={{ fontWeight: "bold" }}>{purchase.name}</Text>
                <Text style={{ opacity: 0.7 }}>
                  {purchase.category} • {formatDate(purchase.date)}
                </Text>
              </View>

              <Text style={{ fontWeight: "bold" }}>-${purchase.amount}</Text>
            </Pressable>
          ))
        )}
      </View>

      <View style={cardStyle}>
        <Text style={cardTitle}>🎯 Focus Goals</Text>

        {plan.goals.length === 0 ? (
          <Text>No goals yet.</Text>
        ) : (
          plan.goals.slice(0, 2).map((goal) => {
            const percent =
              goal.target > 0
                ? Math.min((goal.current / goal.target) * 100, 100)
                : 0;

            const remaining = Math.max(goal.target - goal.current, 0);

            return (
              <View key={goal.id} style={trackerCard}>
                <View style={rowStyle}>
                  <Text style={{ fontWeight: "bold" }}>
                    {goal.emoji} {goal.name}
                  </Text>

                  <Text>{percent.toFixed(0)}%</Text>
                </View>

                <View style={progressTrack}>
                  <View style={[progressFill, { width: `${percent}%` }]} />
                </View>

                <Text>
                  ${goal.current} saved • ${remaining} remaining
                </Text>
              </View>
            );
          })
        )}
      </View>

      <PurchaseFormModal
        visible={formOpen}
        editingPurchase={editingPurchase}
        purchaseName={purchaseName}
        purchaseAmount={purchaseAmount}
        purchaseCategory={purchaseCategory}
        categories={categoryNames}
        onChangeName={setPurchaseName}
        onChangeAmount={setPurchaseAmount}
        onChangeCategory={setPurchaseCategory}
        onSave={handleSavePurchase}
        onClose={resetForm}
      />

      <PurchaseDetailsModal
        purchase={selectedPurchase}
        onClose={() => setSelectedPurchase(null)}
        onEdit={openEditPurchase}
        onDelete={handleDeletePurchase}
      />
    </ScrollView>
  );
}

const cardStyle = {
  borderWidth: 1,
  borderRadius: 16,
  padding: 18,
};

const cardTitle = {
  fontSize: 22,
  fontWeight: "bold" as const,
  marginBottom: 12,
};

const rowStyle = {
  flexDirection: "row" as const,
  justifyContent: "space-between" as const,
  gap: 12,
};

const threeColumn = {
  flexDirection: "row" as const,
  justifyContent: "space-between" as const,
  marginTop: 12,
  gap: 8,
};

const miniLabel = {
  fontSize: 12,
  opacity: 0.7,
};

const miniNumber = {
  fontSize: 16,
  fontWeight: "bold" as const,
};

const buttonStyle = {
  backgroundColor: "black",
  padding: 16,
  borderRadius: 12,
};

const buttonText = {
  color: "white",
  textAlign: "center" as const,
  fontWeight: "600" as const,
};

const trackerCard = {
  borderWidth: 1,
  borderRadius: 14,
  padding: 14,
  marginBottom: 12,
  borderColor: "#ddd",
};

const progressTrack = {
  height: 10,
  backgroundColor: "#e5e5e5",
  borderRadius: 999,
  marginVertical: 10,
  overflow: "hidden" as const,
};

const progressFill = {
  height: "100%",
  backgroundColor: "green",
  borderRadius: 999,
};

const activityRow = {
  flexDirection: "row" as const,
  justifyContent: "space-between" as const,
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: "#eee",
};