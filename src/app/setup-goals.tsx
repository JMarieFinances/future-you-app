import { setPlanData } from "@/lib/planStore";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

type Goal = {
  id: string;
  emoji: string;
  name: string;
  target: string;
  current: string;
  monthly: string;
};

export default function SetupGoalsScreen() {
  const params = useLocalSearchParams();
  const housingTarget = Number(params.housingProtectionTarget) || 0;

  const [goals, setGoals] = useState<Goal[]>([
    {
      id: "housing",
      emoji: "🏠",
      name: "Housing Protection",
      target: String(housingTarget),
      current: "",
      monthly: "",
    },
    {
      id: "emergency",
      emoji: "🚨",
      name: "Emergency Fund",
      target: "10000",
      current: "",
      monthly: "",
    },
  ]);

  const updateGoal = (id: string, field: keyof Goal, value: string) => {
    setGoals((prevGoals) =>
      prevGoals.map((goal) =>
        goal.id === id ? { ...goal, [field]: value } : goal
      )
    );
  };

  const addGoal = (name: string, emoji: string) => {
    setGoals((prevGoals) => [
      ...prevGoals,
      {
        id: `${name}-${Date.now()}`,
        emoji,
        name,
        target: "",
        current: "",
        monthly: "",
      },
    ]);
  };

  const handleContinue = async () => {
    const cleanedGoals = goals.map((goal) => ({
      id: goal.id,
      emoji: goal.emoji,
      name: goal.name,
      target: Number(goal.target) || 0,
      current: Number(goal.current) || 0,
      monthly: Number(goal.monthly) || 0,
    }));

    const totalGoalContributions = cleanedGoals.reduce(
      (sum, goal) => sum + goal.monthly,
      0
    );

    await setPlanData({
  income: Number(params.income) || 0,
  obligations: Number(params.obligations) || 0,
  debt: Number(params.debt) || 0,
  lifestyle: Number(params.lifestyle) || 0,
  safeToSpend: Number(params.safeToSpend) || 0,
  goalContributions: totalGoalContributions,
  incomeDetails:
    typeof params.incomeDetails === "string"
      ? JSON.parse(params.incomeDetails)
      : {},
  obligationDetails:
    typeof params.obligationDetails === "string"
      ? JSON.parse(params.obligationDetails)
      : {},
  debtDetails:
    typeof params.debtDetails === "string"
      ? JSON.parse(params.debtDetails)
      : {},
  lifestyleDetails:
    typeof params.lifestyleDetails === "string"
      ? JSON.parse(params.lifestyleDetails)
      : {},
  goals: cleanedGoals,
});

    router.push({
      pathname: "/(tabs)/dashboard",
      params: {
        ...params,
        goals: JSON.stringify(cleanedGoals),
        goalContributions: totalGoalContributions,
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 32, fontWeight: "bold" }}>
        Future You Goals
      </Text>

      {goals.map((goal) => {
        const target = Number(goal.target) || 0;
        const current = Number(goal.current) || 0;
        const monthly = Number(goal.monthly) || 0;

        const percent =
          target > 0 ? Math.min((current / target) * 100, 100) : 0;

        const remaining = Math.max(target - current, 0);

        const monthsRemaining =
          monthly > 0 ? Math.ceil(remaining / monthly) : null;

        return (
          <View key={goal.id} style={cardStyle}>
            <Text style={titleStyle}>
              {goal.emoji} {goal.name}
            </Text>

            <TextInput
              placeholder="Goal Name"
              value={goal.name}
              onChangeText={(value) => updateGoal(goal.id, "name", value)}
              style={inputStyle}
            />

            <TextInput
              placeholder="Target Amount"
              value={goal.target}
              onChangeText={(value) => updateGoal(goal.id, "target", value)}
              keyboardType="numeric"
              style={inputStyle}
            />

            <TextInput
              placeholder="Current Saved"
              value={goal.current}
              onChangeText={(value) => updateGoal(goal.id, "current", value)}
              keyboardType="numeric"
              style={inputStyle}
            />

            <TextInput
              placeholder="Monthly Contribution"
              value={goal.monthly}
              onChangeText={(value) => updateGoal(goal.id, "monthly", value)}
              keyboardType="numeric"
              style={inputStyle}
            />

            <Text>{percent.toFixed(0)}% complete</Text>

            <Text>
              {monthsRemaining !== null
                ? `${monthsRemaining} months remaining`
                : "Add monthly contribution to estimate time."}
            </Text>
          </View>
        );
      })}

      <View style={cardStyle}>
        <Text style={titleStyle}>+ Add Goal</Text>

        <Pressable onPress={() => addGoal("House", "🏠")} style={smallButton}>
          <Text>House</Text>
        </Pressable>

        <Pressable
          onPress={() => addGoal("Vacation", "🏝️")}
          style={smallButton}
        >
          <Text>Vacation</Text>
        </Pressable>

        <Pressable onPress={() => addGoal("Car", "🚗")} style={smallButton}>
          <Text>Car</Text>
        </Pressable>

        <Pressable
          onPress={() => addGoal("Business", "💼")}
          style={smallButton}
        >
          <Text>Business</Text>
        </Pressable>

        <Pressable
          onPress={() => addGoal("Wedding", "💍")}
          style={smallButton}
        >
          <Text>Wedding</Text>
        </Pressable>

        <Pressable
          onPress={() => addGoal("College", "🎓")}
          style={smallButton}
        >
          <Text>College</Text>
        </Pressable>

        <Pressable
          onPress={() => addGoal("Custom Goal", "✨")}
          style={smallButton}
        >
          <Text>Custom</Text>
        </Pressable>
      </View>

      <Pressable onPress={handleContinue} style={mainButton}>
        <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
          Build My Future
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const cardStyle = {
  borderWidth: 1,
  borderRadius: 16,
  padding: 18,
};

const titleStyle = {
  fontSize: 22,
  fontWeight: "bold" as const,
  marginBottom: 12,
};

const inputStyle = {
  borderWidth: 1,
  borderRadius: 12,
  padding: 12,
  marginBottom: 12,
};

const smallButton = {
  borderWidth: 1,
  borderRadius: 12,
  padding: 12,
  marginBottom: 8,
};

const mainButton = {
  backgroundColor: "black",
  padding: 16,
  borderRadius: 12,
  marginBottom: 40,
};