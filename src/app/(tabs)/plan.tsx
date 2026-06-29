import { getPlanData } from "@/lib/planStore";
import { ScrollView, Text, View } from "react-native";

export default function PlanTab() {
  const plan = getPlanData();

  const finalSafeToSpend = plan.safeToSpend - plan.goalContributions;

  const percentOfIncome = (amount: number) => {
    if (plan.income <= 0) return 0;
    return (amount / plan.income) * 100;
  };

  const renderMoneySection = (
    title: string,
    data: Record<string, number>,
    total: number
  ) => {
    return (
      <View style={cardStyle}>
        <Text style={cardTitle}>{title}</Text>

        {Object.entries(data).map(([label, amount]) => (
          <View key={label} style={rowStyle}>
            <Text>{label}</Text>
            <Text>${amount}</Text>
          </View>
        ))}

        <View style={dividerStyle} />

        <Text style={{ fontWeight: "bold" }}>Total: ${total}</Text>
        <Text>{percentOfIncome(total).toFixed(1)}% of income</Text>
      </View>
    );
  };

  const recommendations = [];

  if (finalSafeToSpend < 0) {
    recommendations.push(
      `Your plan is over by $${Math.abs(
        finalSafeToSpend
      )}/month. Reduce spending or lower goal contributions until the plan is sustainable.`
    );
  }

  if (finalSafeToSpend >= 0 && finalSafeToSpend < 250) {
    recommendations.push(
      "Your plan works, but there is not much breathing room. Try to keep a small buffer so one surprise expense does not throw everything off."
    );
  }

  if (percentOfIncome(plan.lifestyle) > 25) {
    recommendations.push(
      "Lifestyle spending is taking a large chunk of your income. Eating out, shopping, and entertainment are usually the easiest places to free up money."
    );
  }

  if (percentOfIncome(plan.debt) > 15) {
    recommendations.push(
      "Debt payments are slowing down your progress. Once Housing Protection is stable, extra debt payments may become a strong next move."
    );
  }

  if (plan.goalContributions === 0) {
    recommendations.push(
      "You do not have monthly goal contributions yet. Future You needs a monthly amount assigned before spending money gets counted as safe."
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 32, fontWeight: "bold" }}>Your Plan</Text>

      <View style={cardStyle}>
        <Text style={cardTitle}>💰 Monthly Income</Text>
        <Text style={bigNumber}>${plan.income}</Text>
      </View>

      {renderMoneySection("Income Sources", plan.incomeDetails, plan.income)}

      {renderMoneySection(
        "🏠 Fixed Obligations",
        plan.obligationDetails,
        plan.obligations
      )}

      {renderMoneySection("💳 Debt", plan.debtDetails, plan.debt)}

      {renderMoneySection(
        "🛒 Lifestyle Spending",
        plan.lifestyleDetails,
        plan.lifestyle
      )}

      <View style={cardStyle}>
        <Text style={cardTitle}>🎯 Future You Contributions</Text>

        {plan.goals.map((goal) => (
  <View key={goal.id} style={rowStyle}>
    <View>
      <Text>
        {goal.emoji} {goal.name}
      </Text>

      <Text
        style={{
          fontSize: 12,
          opacity: 0.7,
        }}
      >
        {percentOfIncome(goal.monthly).toFixed(1)}% of income
      </Text>
    </View>

    <Text>${goal.monthly}</Text>
  </View>
))}

        <View style={dividerStyle} />

        <Text style={{ fontWeight: "bold" }}>
          Total Goal Contributions: ${plan.goalContributions}
        </Text>

        <Text style={{ marginTop: 8 }}>
          These are deducted before extra spending because Future You comes
          before entertainment money.
        </Text>
      </View>

      <View style={cardStyle}>
        <Text style={cardTitle}>
          🧮 Why Safe To Spend Is ${finalSafeToSpend}
        </Text>

        <View style={rowStyle}>
          <Text>Income</Text>
          <Text>${plan.income}</Text>
        </View>

        <View style={rowStyle}>
          <Text>- Fixed Obligations</Text>
          <Text>${plan.obligations}</Text>
        </View>

        <View style={rowStyle}>
          <Text>- Debt</Text>
          <Text>${plan.debt}</Text>
        </View>

        <View style={rowStyle}>
          <Text>- Lifestyle</Text>
          <Text>${plan.lifestyle}</Text>
        </View>

        <View style={rowStyle}>
          <Text>- Goal Contributions</Text>
          <Text>${plan.goalContributions}</Text>
        </View>

        <View style={dividerStyle} />

        <View style={rowStyle}>
          <Text style={{ fontWeight: "bold" }}>Safe To Spend</Text>
          <Text style={{ fontWeight: "bold" }}>${finalSafeToSpend}</Text>
        </View>
      </View>

      <View style={cardStyle}>
        <Text style={cardTitle}>Recommendations</Text>

        {recommendations.length === 0 ? (
          <Text>Your plan looks balanced. Keep funding Future You first.</Text>
        ) : (
          recommendations.map((rec, index) => (
            <Text key={index} style={{ marginBottom: 10 }}>
              ⚠️ {rec}
            </Text>
          ))
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

const bigNumber = {
  fontSize: 42,
  fontWeight: "bold" as const,
};

const rowStyle = {
  flexDirection: "row" as const,
  justifyContent: "space-between" as const,
  marginBottom: 8,
  gap: 12,
};

const dividerStyle = {
  height: 1,
  backgroundColor: "#ddd",
  marginVertical: 12,
};