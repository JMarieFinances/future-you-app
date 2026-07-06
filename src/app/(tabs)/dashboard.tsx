import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import BudgetDashboardSection from "@/components/budget/BudgetDashboardSection";
import ProgressBar from "@/components/budget/ProgressBar";
import CategoryDetailsModal from "@/components/dashboard/CategoryDetailsModal";
import PurchaseDetailsModal from "@/components/dashboard/PurchaseDetailsModal";
import PurchaseFormModal from "@/components/dashboard/PurchaseFormModal";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";

import { getUpcomingEvents } from "@/components/calendar/calendarUtils";
import { loadAppData } from "@/lib/appStore";
import { getCalendarEvents } from "@/lib/calendarStore";
import { getFinancialSummary } from "@/lib/financeEngine";
import {
  addPurchase,
  deletePurchase,
  updatePurchase,
} from "@/lib/purchaseStore";
import type { BudgetItem, Purchase } from "@/lib/types";
import { useTheme } from "@/lib/useTheme";

const fallbackCategories = [
  "Groceries",
  "Dining Out",
  "Gas",
  "Shopping",
  "Entertainment",
  "Personal Care",
  "Miscellaneous",
];

export default function DashboardScreen() {
  const { colors } = useTheme();
  const [, forceUpdate] = useState(0);

  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [purchaseName, setPurchaseName] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [purchaseCategory, setPurchaseCategory] = useState("");

  useEffect(() => {
    const load = async () => {
      await loadAppData();
      setLoaded(true);
      forceUpdate((prev) => prev + 1);
    };

    load();
  }, []);

  if (!loaded) {
    return (
      <View
        style={{
          flex: 1,
          padding: 24,
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <AppText variant="section">Loading Future You...</AppText>
      </View>
    );
  }

  const summary = getFinancialSummary();
  const plan = summary.plan;
  const purchases = summary.purchases;

  const personalPurchases = purchases.filter(
    (purchase) => purchase.budgetType === "personal"
  );

  const lifestyleCategories = Object.entries(plan.lifestyleDetails);
  const categoryNames =
    lifestyleCategories.length > 0
      ? lifestyleCategories.map(([category]) => category)
      : fallbackCategories;

  const personalBudgetItems: BudgetItem[] = categoryNames.map((category) => {
    const budget = plan.lifestyleDetails[category] ?? 0;

    const spent = personalPurchases
      .filter(
        (purchase) =>
          purchase.type === "expense" && purchase.category === category
      )
      .reduce((sum, purchase) => sum + purchase.amount, 0);

    return {
      id: category,
      name: category,
      budget,
      spent,
    };
  });

  const totalOverspent = personalBudgetItems.reduce(
    (sum, item) => sum + Math.max(item.spent - item.budget, 0),
    0
  );

  const dailySafeToSpend = summary.safeToSpend / 30;
  const weeklySafeToSpend = summary.safeToSpend / 4;

  const safePercent =
    summary.personalBaseIncome > 0
      ? Math.max(
          0,
          Math.min((summary.safeToSpend / summary.personalBaseIncome) * 100, 100)
        )
      : 0;

  const recentPurchases = [...purchases].reverse().slice(0, 5);
  const upcomingEvents = getUpcomingEvents(getCalendarEvents()).slice(0, 4);

  const activeGoals = plan.goals.filter(
    (goal) => !goal.archived && goal.target > goal.current
  );
  const nextGoal = [...activeGoals].sort((a, b) => b.monthly - a.monthly)[0];

  const greeting = getGreeting();
  const dashboardMessage = getDashboardMessage({
    safeToSpend: summary.safeToSpend,
    upcomingCount: upcomingEvents.length,
    score: summary.budgetScore.score,
  });

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
    setPurchaseCategory(categoryNames[0] ?? "Miscellaneous");
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

  const openCategoryPurchase = () => {
    if (!selectedCategory) return;

    setEditingPurchase(null);
    setPurchaseName("");
    setPurchaseAmount("");
    setPurchaseCategory(selectedCategory);
    setSelectedCategory(null);
    setFormOpen(true);
  };

  const handleSavePurchase = async () => {
    if (!purchaseName.trim()) return;

    const amount = Number(purchaseAmount) || 0;
    if (amount <= 0) return;

    const category = purchaseCategory || categoryNames[0] || "Miscellaneous";

    if (editingPurchase) {
      await updatePurchase({
        ...editingPurchase,
        name: purchaseName.trim(),
        amount,
        category,
      });
    } else {
      await addPurchase({
        id: Date.now().toString(),
        name: purchaseName.trim(),
        amount,
        category,
        date: new Date().toISOString(),
        budgetType: "personal",
        type: "expense",
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

  const insights = getDashboardInsights({
    safeToSpend: summary.safeToSpend,
    overspent: totalOverspent,
    lifestyleItems: personalBudgetItems,
    upcomingCount: upcomingEvents.length,
    goalsCount: plan.goals.length,
  });

  return (
    <AppPage>
      <PageHeader title={`${greeting} 👋`} subtitle={dashboardMessage} />

      <SectionLabel title="Today’s Snapshot" />

      <AppCard>
        <AppText variant="muted">Safe To Spend</AppText>

        <Text
          style={{
            color: summary.safeToSpend < 0 ? colors.danger : colors.primary,
            fontSize: 48,
            fontWeight: "800",
            marginTop: 4,
            letterSpacing: -1.2,
          }}
        >
          ${summary.safeToSpend.toFixed(0)}
        </Text>

        <ProgressBar percent={safePercent} />

        <AppText variant="muted">
          {summary.safeToSpend < 0
            ? "Pause non-essential spending and review your plan."
            : `${safePercent.toFixed(0)}% of your personal income is still flexible.`}
        </AppText>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
          <MiniStat title="Today" value={`$${dailySafeToSpend.toFixed(2)}`} />
          <MiniStat
            title="This Week"
            value={`$${weeklySafeToSpend.toFixed(2)}`}
          />
          <MiniStat
            title="This Month"
            value={`$${summary.safeToSpend.toFixed(2)}`}
          />
        </View>
      </AppCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Income"
            value={`$${summary.totalIncome.toFixed(0)}`}
            caption="This month"
            tone="success"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Spent"
            value={`$${summary.totalSpent.toFixed(0)}`}
            caption="Logged"
            tone="warning"
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Saved"
            value={`$${summary.estimatedSaved.toFixed(0)}`}
            caption={`${summary.savingsRate.toFixed(0)}% rate`}
            tone="success"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Goals"
            value={`$${summary.goalMonthly.toFixed(0)}`}
            caption="Monthly plan"
            tone="primary"
          />
        </View>
      </View>

      <SectionLabel title="Lifestyle" />

      <BudgetDashboardSection
        title="Personal Lifestyle"
        items={personalBudgetItems}
      />

      <SectionLabel title="Planning" />

      <AppCard>
        <AppRow>
          <AppText variant="section">Goals</AppText>

          <Pressable onPress={() => router.push("/(tabs)/goals")}>
            <AppText variant="muted">See All</AppText>
          </Pressable>
        </AppRow>

        {!nextGoal ? (
          <View style={{ marginTop: 10 }}>
            <EmptyState message="No active goals yet. Add one to start tracking your future." />
          </View>
        ) : (
          <View style={{ marginTop: 12 }}>
            <AppRow>
              <AppText variant="bold">
                {nextGoal.emoji} {nextGoal.name}
              </AppText>
              <AppText variant="muted">
                {getGoalPercent(nextGoal.current, nextGoal.target).toFixed(0)}%
              </AppText>
            </AppRow>

            <ProgressBar
              percent={getGoalPercent(nextGoal.current, nextGoal.target)}
            />

            <AppText variant="muted">
              ${nextGoal.current.toFixed(0)} saved • $
              {Math.max(nextGoal.target - nextGoal.current, 0).toFixed(0)} left
            </AppText>
          </View>
        )}
      </AppCard>

      <AppCard>
        <AppText variant="section">Upcoming This Week</AppText>

        {upcomingEvents.length === 0 ? (
          <View style={{ marginTop: 10 }}>
            <EmptyState message="No upcoming calendar events yet." />
          </View>
        ) : (
          <View style={{ marginTop: 12, gap: 12 }}>
            {upcomingEvents.map((event) => (
              <AppRow key={event.id}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: getEventColor(event.type, colors),
                  }}
                />

                <View style={{ flex: 1 }}>
                  <AppText variant="bold">{event.title}</AppText>
                  <AppText variant="muted">
  {new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    event.day
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}
</AppText>
                </View>

                {event.amount !== undefined ? (
                  <AppText variant="bold">${event.amount.toFixed(0)}</AppText>
                ) : null}
              </AppRow>
            ))}
          </View>
        )}
      </AppCard>

      <SectionLabel title="Quick Actions" />

      <AppCard>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <AppButton title="+ Expense" onPress={openAddPurchase} />
          </View>

          <View style={{ flex: 1 }}>
            <AppButton
              title="Review Plan"
              onPress={() => router.push("/(tabs)/plan")}
              variant="outline"
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <View style={{ flex: 1 }}>
            <AppButton
              title="Afford"
              onPress={() => router.push("/(tabs)/afford")}
              variant="outline"
            />
          </View>

          <View style={{ flex: 1 }}>
            <AppButton
              title="Calendar"
              onPress={() => router.push("/(tabs)/calendar")}
              variant="outline"
            />
          </View>
        </View>
      </AppCard>

      <SectionLabel title="Activity" />

      <AppCard>
        <AppText variant="section">Recent Purchases</AppText>

        {recentPurchases.length === 0 ? (
          <View style={{ marginTop: 10 }}>
            <EmptyState message="No purchases yet. Add your first expense to activate the dashboard." />
          </View>
        ) : (
          <View style={{ marginTop: 8 }}>
            {recentPurchases.map((purchase) => (
              <Pressable
                key={purchase.id}
                onPress={() => setSelectedPurchase(purchase)}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <AppRow>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bold">{purchase.name}</AppText>
                    <AppText variant="muted">
                      {purchase.budgetType} • {purchase.category} •{" "}
                      {new Date(purchase.date).toLocaleDateString()}
                    </AppText>
                  </View>

                  <Text
                    style={{
                      color:
                        purchase.type === "income"
                          ? colors.income
                          : colors.expense,
                      fontWeight: "800",
                    }}
                  >
                    {purchase.type === "income" ? "+" : "-"}$
                    {purchase.amount.toFixed(2)}
                  </Text>
                </AppRow>
              </Pressable>
            ))}
          </View>
        )}
      </AppCard>

      <AppCard>
        <AppText variant="section">Smart Insights</AppText>

        <View style={{ marginTop: 10, gap: 8 }}>
          {insights.map((insight) => (
            <AppText key={insight} variant="muted">
              • {insight}
            </AppText>
          ))}
        </View>
      </AppCard>

      <SectionLabel title="Budget Workspaces" />

      <AppCard>
        <View style={{ gap: 14 }}>
          <WorkspaceRow
            title="Personal"
            value={`$${summary.safeToSpend.toFixed(0)} safe`}
            caption={`${personalPurchases.length} transactions`}
          />

          <WorkspaceRow
            title="Household"
            value={
              summary.households.length
                ? `$${(summary.householdIncome - summary.householdSpent).toFixed(
                    0
                  )} left`
                : "Not created"
            }
            caption={`${summary.households.length} household${
              summary.households.length === 1 ? "" : "s"
            }`}
          />

          <WorkspaceRow
            title="Business"
            value={
              summary.businesses.length
                ? `$${(summary.businessIncome - summary.businessSpent).toFixed(
                    0
                  )} left`
                : "Not created"
            }
            caption={`${summary.businesses.length} business${
              summary.businesses.length === 1 ? "" : "es"
            }`}
          />
        </View>
      </AppCard>

      <SectionLabel title="Monthly Summary" />

      <AppCard>
        <AppText variant="section">Monthly Snapshot</AppText>

        <View style={{ marginTop: 12, gap: 8 }}>
          <ReviewRow
            label="Income"
            value={`$${summary.totalIncome.toFixed(2)}`}
          />
          <ReviewRow
            label="Spent"
            value={`$${summary.totalSpent.toFixed(2)}`}
          />
          <ReviewRow
            label="Saved"
            value={`$${summary.estimatedSaved.toFixed(2)}`}
          />
          <ReviewRow
            label="Goal Contributions"
            value={`$${summary.goalMonthly.toFixed(2)}`}
          />
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="section">Spending Breakdown</AppText>
        <SpendingChart
          personal={summary.personalSpent}
          household={summary.householdSpent}
          business={summary.businessSpent}
        />
      </AppCard>

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

      <CategoryDetailsModal
        category={selectedCategory}
        budget={
          selectedCategory ? plan.lifestyleDetails[selectedCategory] || 0 : 0
        }
        purchases={personalPurchases.filter(
          (purchase) => purchase.category === selectedCategory
        )}
        onClose={() => setSelectedCategory(null)}
        onAddPurchase={openCategoryPurchase}
      />
    </AppPage>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <View style={{ marginTop: 6, marginBottom: -4 }}>
      <AppText variant="section">{title}</AppText>
    </View>
  );
}

function MiniStat({ title, value }: { title: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <AppText variant="muted">{title}</AppText>
      <AppText variant="bold">{value}</AppText>
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <AppRow>
      <AppText variant="muted">{label}</AppText>
      <AppText variant="bold">{value}</AppText>
    </AppRow>
  );
}

function WorkspaceRow({
  title,
  value,
  caption,
}: {
  title: string;
  value: string;
  caption: string;
}) {
  return (
    <View>
      <AppRow>
        <AppText variant="bold">{title}</AppText>
        <AppText variant="bold">{value}</AppText>
      </AppRow>
      <AppText variant="muted">{caption}</AppText>
    </View>
  );
}

function SpendingChart({
  personal,
  household,
  business,
}: {
  personal: number;
  household: number;
  business: number;
}) {
  const { colors } = useTheme();
  const total = personal + household + business;

  const rows = [
    { label: "Personal", value: personal, color: colors.primary },
    { label: "Household", value: household, color: colors.savings },
    { label: "Business", value: business, color: colors.success },
  ];

  if (total <= 0) {
    return (
      <View style={{ marginTop: 10 }}>
        <EmptyState message="Add purchases to see your spending breakdown." />
      </View>
    );
  }

  return (
    <View style={{ marginTop: 14, gap: 12 }}>
      {rows.map((row) => {
        const percent = total > 0 ? (row.value / total) * 100 : 0;

        return (
          <View key={row.label}>
            <AppRow>
              <AppText variant="muted">{row.label}</AppText>
              <AppText variant="bold">
                ${row.value.toFixed(0)} • {percent.toFixed(0)}%
              </AppText>
            </AppRow>

            <View
              style={{
                height: 10,
                borderRadius: 999,
                backgroundColor: colors.progressTrack,
                overflow: "hidden",
                marginTop: 6,
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${Math.min(percent, 100)}%`,
                  backgroundColor: row.color,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function getEventColor(type: string, colors: any) {
  if (type === "payday") return colors.income;
  if (type === "goal") return colors.savings;
  if (type === "business") return colors.success;
  if (type === "review") return colors.warning;
  return colors.primary;
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function getGoalPercent(current: number, target: number) {
  if (target <= 0) return 0;
  return Math.min((current / target) * 100, 100);
}

function getDashboardMessage({
  safeToSpend,
  upcomingCount,
  score,
}: {
  safeToSpend: number;
  upcomingCount: number;
  score: number;
}) {
  if (safeToSpend < 0) return "Your plan needs attention today.";
  if (upcomingCount > 0) return "You have upcoming money events this month.";
  if (score >= 85) return "Your finances are looking healthy.";
  return "Here's how your money is doing today.";
}

function getDashboardInsights({
  safeToSpend,
  overspent,
  lifestyleItems,
  upcomingCount,
  goalsCount,
}: {
  safeToSpend: number;
  overspent: number;
  lifestyleItems: BudgetItem[];
  upcomingCount: number;
  goalsCount: number;
}) {
  const insights: string[] = [];

  if (safeToSpend >= 0) {
    insights.push(
      `You have $${safeToSpend.toFixed(0)} safe to spend this month.`
    );
  } else {
    insights.push("Your safe-to-spend is negative. Review your plan today.");
  }

  if (overspent > 0) {
    insights.push(
      `Overspending has reduced your safe-to-spend by $${overspent.toFixed(0)}.`
    );
  }

  const highest = [...lifestyleItems].sort((a, b) => b.spent - a.spent)[0];

  if (highest && highest.spent > 0) {
    insights.push(`${highest.name} is your highest personal spending category.`);
  }

  if (upcomingCount > 0) {
    insights.push(
      `${upcomingCount} calendar event${upcomingCount === 1 ? "" : "s"} coming up.`
    );
  }

  if (goalsCount === 0) {
    insights.push("Add at least one goal so Future You can track progress.");
  }

  return insights.slice(0, 5);
}