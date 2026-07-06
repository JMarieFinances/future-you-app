import ProgressBar from "@/components/budget/ProgressBar";
import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import { getAppData, loadAppData } from "@/lib/appStore";
import { getFinancialSummary } from "@/lib/financeEngine";
import { useTheme } from "@/lib/useTheme";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function TodayScreen() {
  const { colors } = useTheme();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const load = async () => {
      await loadAppData();
      forceUpdate((prev) => prev + 1);
    };

    load();
  }, []);

  const summary = getFinancialSummary();
  const app = getAppData();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  const activeGoals = summary.plan.goals.filter(
    (goal) => !goal.archived && goal.target > goal.current
  );

  const recentPurchases = summary.recentTransactions.slice(0, 4);

  return (
    <AppPage>
      <PageHeader
        title={`${greeting}${app.settings.userName ? `, ${app.settings.userName}` : ""}`}
        subtitle="Here's what Future You needs to know today."
      />

      <AppCard>
        <AppText variant="muted">Safe To Spend</AppText>

        <Text
          style={{
            color: summary.safeToSpend < 0 ? colors.danger : colors.primary,
            fontSize: 46,
            fontWeight: "bold",
            marginTop: 4,
          }}
        >
          ${summary.safeToSpend.toFixed(0)}
        </Text>

        <AppText variant="muted">
          {summary.safeToSpend < 0
            ? "You're over your safe spending limit."
            : "Available after bills, goals, and planned spending."}
        </AppText>
      </AppCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Budget Score"
            value={`${summary.budgetScore.score}/100`}
            caption={summary.budgetScore.label}
            tone={
              summary.budgetScore.score >= 80
                ? "success"
                : summary.budgetScore.score >= 60
                ? "warning"
                : "danger"
            }
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Saved"
            value={`$${summary.estimatedSaved.toFixed(0)}`}
            caption="Estimated"
            tone="success"
          />
        </View>
      </View>

      <AppCard>
        <AppText variant="section">Today</AppText>

        <View style={{ marginTop: 10, gap: 8 }}>
          <AppText variant="muted">No bills are manually due today yet.</AppText>
          <AppText variant="muted">
            Monthly Review is waiting in the Review tab.
          </AppText>
          <AppText variant="muted">
            Calendar will show paydays, bills, goals, and business reminders.
          </AppText>
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="section">Quick Actions</AppText>

        <View style={{ marginTop: 12, gap: 10 }}>
          <AppButton
            title="Add Purchase"
            onPress={() => router.push("/(tabs)/dashboard")}
          />

          <AppButton
            title="Add Goal"
            onPress={() => router.push("/(tabs)/goals")}
            variant="outline"
          />

          <AppButton
            title="Household"
            onPress={() => router.push("/households")}
            variant="outline"
          />

          <AppButton
            title="Business"
            onPress={() => router.push("/businesses")}
            variant="outline"
          />
        </View>
      </AppCard>

      <AppCard>
        <AppRow>
          <AppText variant="section">Goals</AppText>

          <Pressable onPress={() => router.push("/(tabs)/goals")}>
            <AppText variant="muted">See All</AppText>
          </Pressable>
        </AppRow>

        {activeGoals.length === 0 ? (
          <View style={{ marginTop: 10 }}>
            <EmptyState message="No active goals yet. Add one to start building Future You." />
          </View>
        ) : (
          <View style={{ marginTop: 12, gap: 14 }}>
            {activeGoals.slice(0, 3).map((goal) => {
              const percent =
                goal.target > 0
                  ? Math.min((goal.current / goal.target) * 100, 100)
                  : 0;

              return (
                <View key={goal.id}>
                  <AppRow>
                    <AppText variant="bold">
                      {goal.emoji} {goal.name}
                    </AppText>

                    <AppText variant="muted">{percent.toFixed(0)}%</AppText>
                  </AppRow>

                  <ProgressBar percent={percent} />

                  <AppText variant="muted">
                    ${goal.current.toFixed(0)} saved • $
                    {Math.max(goal.target - goal.current, 0).toFixed(0)} left
                  </AppText>
                </View>
              );
            })}
          </View>
        )}
      </AppCard>

      <AppCard>
        <AppText variant="section">Recent Purchases</AppText>

        {recentPurchases.length === 0 ? (
          <View style={{ marginTop: 10 }}>
            <EmptyState message="No purchases yet. Add one to activate your activity feed." />
          </View>
        ) : (
          <View style={{ marginTop: 10, gap: 10 }}>
            {recentPurchases.map((purchase) => (
              <AppRow key={purchase.id}>
                <View>
                  <AppText variant="bold">{purchase.name}</AppText>
                  <AppText variant="muted">
                    {purchase.budgetType} • {purchase.category}
                  </AppText>
                </View>

                <Text
                  style={{
                    color:
                      purchase.type === "income"
                        ? colors.income
                        : colors.expense,
                    fontWeight: "bold",
                  }}
                >
                  {purchase.type === "income" ? "+" : "-"}$
                  {purchase.amount.toFixed(2)}
                </Text>
              </AppRow>
            ))}
          </View>
        )}
      </AppCard>

      <AppCard>
        <AppText variant="section">Monthly Snapshot</AppText>

        <View style={{ marginTop: 12, gap: 8 }}>
          <AppRow>
            <AppText variant="muted">Income</AppText>
            <AppText variant="bold">${summary.totalIncome.toFixed(0)}</AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">Spent</AppText>
            <AppText variant="bold">${summary.totalSpent.toFixed(0)}</AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">Saved</AppText>
            <AppText variant="bold">${summary.estimatedSaved.toFixed(0)}</AppText>
          </AppRow>

          <AppRow>
            <AppText variant="muted">Savings Rate</AppText>
            <AppText variant="bold">{summary.savingsRate.toFixed(0)}%</AppText>
          </AppRow>
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="section">Future You Tip</AppText>

        <View style={{ marginTop: 10 }}>
          <AppText variant="muted">{getTip(summary.safeToSpend)}</AppText>
        </View>
      </AppCard>
    </AppPage>
  );
}

function getTip(safeToSpend: number) {
  if (safeToSpend < 0) {
    return "Pause non-essential spending and review your plan today.";
  }

  if (safeToSpend < 100) {
    return "You're close to your limit. Keep purchases small until your next income date.";
  }

  return `You have $${safeToSpend.toFixed(0)} safe to spend. Future You is still on track.`;
}