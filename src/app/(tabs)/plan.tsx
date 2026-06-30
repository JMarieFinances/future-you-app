import { getPlanData, setPlanData } from "@/lib/planStore";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type EditingItem =
  | {
      type: "income" | "obligation" | "debt" | "lifestyle";
      label: string;
      value: number;
    }
  | {
      type: "goal";
      goalId: string;
      label: string;
      value: number;
    };

export default function PlanTab() {
  const [plan, setPlan] = useState(getPlanData());
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const finalSafeToSpend = plan.safeToSpend - plan.goalContributions;

  const percentOfIncome = (amount: number) => {
    if (plan.income <= 0) return 0;
    return (amount / plan.income) * 100;
  };

  const recalculatePlan = (updatedPlan: typeof plan) => {
    const income = Object.values(updatedPlan.incomeDetails).reduce(
      (sum, value) => sum + value,
      0
    );

    const obligations = Object.values(updatedPlan.obligationDetails).reduce(
      (sum, value) => sum + value,
      0
    );

    const debt = Object.values(updatedPlan.debtDetails).reduce(
      (sum, value) => sum + value,
      0
    );

    const lifestyle = Object.values(updatedPlan.lifestyleDetails).reduce(
      (sum, value) => sum + value,
      0
    );

    const goalContributions = updatedPlan.goals.reduce(
      (sum, goal) => sum + goal.monthly,
      0
    );

    return {
      ...updatedPlan,
      income,
      obligations,
      debt,
      lifestyle,
      goalContributions,
      safeToSpend: income - obligations - debt - lifestyle,
    };
  };

  const openEdit = (item: EditingItem) => {
    setEditingItem(item);
    setEditingValue(String(item.value));
  };

  const saveEdit = async () => {
    if (!editingItem) return;

    const newValue = Number(editingValue) || 0;

    let updatedPlan = { ...plan };

    if (editingItem.type === "income") {
      updatedPlan = {
        ...updatedPlan,
        incomeDetails: {
          ...updatedPlan.incomeDetails,
          [editingItem.label]: newValue,
        },
      };
    }

    if (editingItem.type === "obligation") {
      updatedPlan = {
        ...updatedPlan,
        obligationDetails: {
          ...updatedPlan.obligationDetails,
          [editingItem.label]: newValue,
        },
      };
    }

    if (editingItem.type === "debt") {
      updatedPlan = {
        ...updatedPlan,
        debtDetails: {
          ...updatedPlan.debtDetails,
          [editingItem.label]: newValue,
        },
      };
    }

    if (editingItem.type === "lifestyle") {
      updatedPlan = {
        ...updatedPlan,
        lifestyleDetails: {
          ...updatedPlan.lifestyleDetails,
          [editingItem.label]: newValue,
        },
      };
    }

    if (editingItem.type === "goal") {
      updatedPlan = {
        ...updatedPlan,
        goals: updatedPlan.goals.map((goal) =>
          goal.id === editingItem.goalId
            ? {
                ...goal,
                monthly: newValue,
              }
            : goal
        ),
      };
    }

    const recalculated = recalculatePlan(updatedPlan);

    setPlan(recalculated);
    await setPlanData(recalculated);

    setEditingItem(null);
    setEditingValue("");
  };

  const renderMoneySection = (
    title: string,
    type: "income" | "obligation" | "debt" | "lifestyle",
    data: Record<string, number>,
    total: number
  ) => {
    return (
      <View style={cardStyle}>
        <Text style={cardTitle}>{title}</Text>

        {Object.entries(data).map(([label, amount]) => (
          <Pressable
            key={label}
            onPress={() => openEdit({ type, label, value: amount })}
            style={editableRow}
          >
            <Text>{label}</Text>
            <Text>${amount}</Text>
          </Pressable>
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

      {renderMoneySection("Income Sources", "income", plan.incomeDetails, plan.income)}

      {renderMoneySection(
        "🏠 Fixed Obligations",
        "obligation",
        plan.obligationDetails,
        plan.obligations
      )}

      {renderMoneySection("💳 Debt", "debt", plan.debtDetails, plan.debt)}

      {renderMoneySection(
        "🛒 Lifestyle Spending",
        "lifestyle",
        plan.lifestyleDetails,
        plan.lifestyle
      )}

      <View style={cardStyle}>
        <Text style={cardTitle}>🎯 Future You Contributions</Text>

        {plan.goals.map((goal) => (
          <Pressable
            key={goal.id}
            onPress={() =>
              openEdit({
                type: "goal",
                goalId: goal.id,
                label: goal.name,
                value: goal.monthly,
              })
            }
            style={editableRow}
          >
            <View>
              <Text>
                {goal.emoji} {goal.name}
              </Text>

              <Text style={{ fontSize: 12, opacity: 0.7 }}>
                {percentOfIncome(goal.monthly).toFixed(1)}% of income
              </Text>
            </View>

            <Text>${goal.monthly}</Text>
          </Pressable>
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
        <Text style={cardTitle}>🧮 Why Safe To Spend Is ${finalSafeToSpend}</Text>

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

      <Modal visible={editingItem !== null} transparent animationType="slide">
        <View style={modalBackdrop}>
          <View style={modalCard}>
            <Text style={modalTitle}>{editingItem?.label}</Text>

            <TextInput
              value={editingValue}
              onChangeText={setEditingValue}
              keyboardType="numeric"
              style={inputStyle}
            />

            <Pressable onPress={saveEdit} style={saveButton}>
              <Text style={saveButtonText}>Save Changes</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setEditingItem(null);
                setEditingValue("");
              }}
            >
              <Text style={{ textAlign: "center" }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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

const editableRow = {
  flexDirection: "row" as const,
  justifyContent: "space-between" as const,
  alignItems: "center" as const,
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: "#eee",
};

const dividerStyle = {
  height: 1,
  backgroundColor: "#ddd",
  marginVertical: 12,
};

const modalBackdrop = {
  flex: 1,
  justifyContent: "center" as const,
  backgroundColor: "rgba(0,0,0,.4)",
  padding: 24,
};

const modalCard = {
  backgroundColor: "white",
  borderRadius: 20,
  padding: 20,
};

const modalTitle = {
  fontSize: 24,
  fontWeight: "bold" as const,
  marginBottom: 20,
};

const inputStyle = {
  borderWidth: 1,
  borderRadius: 12,
  padding: 12,
  marginBottom: 20,
};

const saveButton = {
  backgroundColor: "black",
  padding: 14,
  borderRadius: 12,
  marginBottom: 10,
};

const saveButtonText = {
  color: "white",
  textAlign: "center" as const,
};