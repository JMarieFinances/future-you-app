import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { loadAppData } from "@/lib/appStore";
import { getPlanData } from "@/lib/planStore";

export default function DashboardScreen() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const load = async () => {
      await loadAppData();
      forceUpdate((prev) => prev + 1);
    };

    load();
  }, []);

  const plan = getPlanData();

  const totalIncome = plan.income;
  const totalObligations = plan.obligations;
  const totalDebt = plan.debt;
  const totalLifestyle = plan.lifestyle;

  const totalGoalContributions = plan.goalContributions;

  const finalSafeToSpend =
    plan.safeToSpend - totalGoalContributions;

  const weeklySafeToSpend = finalSafeToSpend / 4;
  const dailySafeToSpend = finalSafeToSpend / 30;

  const getFinancialStatus = () => {
    if (finalSafeToSpend < 0) {
      return {
        title: "🔴 Unsustainable",
        message:
          "Your current budget leaves you spending more than you make.",
      };
    }

    if (finalSafeToSpend < 250) {
      return {
        title: "🟡 Tight",
        message:
          "Your plan works, but you don't have much breathing room.",
      };
    }

    return {
      title: "🟢 Healthy",
      message:
        "You're funding your future while maintaining a healthy monthly cushion.",
    };
  };

  const financialStatus = getFinancialStatus();

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        gap: 16,
      }}
    >
      <Text
        style={{
          fontSize: 32,
          fontWeight: "bold",
        }}
      >
        Future You
      </Text>

      <View style={cardStyle}>
        <Text style={cardTitle}>
          💰 Safe To Spend
        </Text>

        <Text
          style={{
            fontSize: 42,
            fontWeight: "bold",
          }}
        >
          ${finalSafeToSpend.toFixed(0)}
        </Text>

        <Text>
          Weekly: ${weeklySafeToSpend.toFixed(2)}
        </Text>

        <Text>
          Daily: ${dailySafeToSpend.toFixed(2)}
        </Text>
      </View>

      <View style={cardStyle}>
        <Text style={cardTitle}>
          📊 Financial Status
        </Text>

        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
          }}
        >
          {financialStatus.title}
        </Text>

        <Text>{financialStatus.message}</Text>
      </View>

      <View style={cardStyle}>
        <Text style={cardTitle}>
          📈 Budget Breakdown
        </Text>

        <Text>Income: ${totalIncome}</Text>
        <Text>Fixed Expenses: ${totalObligations}</Text>
        <Text>Debt: ${totalDebt}</Text>
        <Text>Lifestyle: ${totalLifestyle}</Text>
        <Text>Goals: ${totalGoalContributions}</Text>
      </View>

      <View style={cardStyle}>
        <Text style={cardTitle}>
          🎯 Goal Progress
        </Text>

        {plan.goals.length === 0 ? (
          <Text>No goals yet.</Text>
        ) : (
          plan.goals.map((goal) => {
            const percent =
              goal.target > 0
                ? Math.min(
                    (goal.current / goal.target) * 100,
                    100
                  )
                : 0;

            return (
              <View
                key={goal.id}
                style={{
                  marginBottom: 12,
                }}
              >
                <Text>
                  {goal.emoji} {goal.name}
                </Text>

                <Text>
                  ${goal.current} / ${goal.target}
                </Text>

                <Text>
                  {percent.toFixed(0)}% Complete
                </Text>
              </View>
            );
          })
        )}
      </View>
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
  marginBottom: 8,
};