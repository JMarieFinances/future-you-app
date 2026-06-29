import { getPlanData, type Goal } from "@/lib/planStore";
import { ScrollView, Text, View } from "react-native";

export default function GoalsTab() {
  const { goals } = getPlanData();

  const protectionGoals = goals.filter(
    (goal) => goal.id === "housing" || goal.id === "emergency"
  );

  const majorGoals = goals.filter((goal) =>
    ["House", "Business", "College"].includes(goal.name)
  );

  const lifestyleGoals = goals.filter((goal) =>
    ["Vacation", "Car", "Wedding"].includes(goal.name)
  );

  const customGoals = goals.filter(
    (goal) =>
      goal.id !== "housing" &&
      goal.id !== "emergency" &&
      !["House", "Business", "College"].includes(goal.name) &&
      !["Vacation", "Car", "Wedding"].includes(goal.name)
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 32, fontWeight: "bold" }}>Goals</Text>

      {goals.length === 0 ? (
        <Text>No goals yet. Complete setup first.</Text>
      ) : (
        <>
          <GoalSection title="🛡 Protection" goals={protectionGoals} />
          <GoalSection title="🏆 Major Goals" goals={majorGoals} />
          <GoalSection title="🌴 Lifestyle Goals" goals={lifestyleGoals} />
          <GoalSection title="✨ Custom Goals" goals={customGoals} />
        </>
      )}
    </ScrollView>
  );
}

function GoalSection({
  title,
  goals,
}: {
  title: string;
  goals: Goal[];
}) {
  if (goals.length === 0) return null;

  return (
    <View style={{ gap: 12 }}>
      <Text style={sectionTitle}>{title}</Text>

      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} />
      ))}
    </View>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const percent =
    goal.target > 0
      ? Math.min((goal.current / goal.target) * 100, 100)
      : 0;

  const remaining = Math.max(goal.target - goal.current, 0);

  const monthsRemaining =
    goal.monthly > 0 ? Math.ceil(remaining / goal.monthly) : null;

  return (
    <View style={cardStyle}>
      <Text style={goalTitle}>
        {goal.emoji} {goal.name}
      </Text>

      <Text style={timeText}>
        {monthsRemaining !== null
          ? `${monthsRemaining} months remaining`
          : "Add a monthly contribution"}
      </Text>

      <Text>
        ${goal.current} / ${goal.target}
      </Text>

      <Text>{percent.toFixed(0)}% complete</Text>

      <View style={progressTrack}>
        <View style={[progressFill, { width: `${percent}%` }]} />
      </View>

      <Text>Remaining: ${remaining}</Text>
      <Text>Monthly Contribution: ${goal.monthly}</Text>
    </View>
  );
}

const sectionTitle = {
  fontSize: 22,
  fontWeight: "bold" as const,
  marginTop: 8,
};

const cardStyle = {
  borderWidth: 1,
  borderRadius: 16,
  padding: 18,
};

const goalTitle = {
  fontSize: 22,
  fontWeight: "bold" as const,
  marginBottom: 6,
};

const timeText = {
  fontSize: 18,
  fontWeight: "600" as const,
  marginBottom: 8,
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