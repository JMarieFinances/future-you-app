import { getPlanData } from "@/lib/planStore";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function ProfileTab() {
  const plan = getPlanData();

  const finalSafeToSpend =
    plan.safeToSpend - plan.goalContributions;

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
        Profile
      </Text>

      <View style={cardStyle}>
        <Text style={cardTitle}>
          📊 Financial Snapshot
        </Text>

        <Text>Income: ${plan.income}</Text>
        <Text>Goals: {plan.goals.length}</Text>
        <Text>
          Goal Contributions: ${plan.goalContributions}
        </Text>
        <Text>
          Safe To Spend: ${finalSafeToSpend}
        </Text>
      </View>

      <MenuButton title="🏠 Household Budgets" route="/households" />
<MenuButton title="💼 Business Budgets" route="/businesses" />


      <MenuButton
        title="🎨 Themes"
        route="/themes"
      />

      <MenuButton
        title="🔔 Notifications"
        route="/notifications"
      />
    </ScrollView>
  );
}

function MenuButton({
  title,
  route,
}: {
  title: string;
  route: string;
}) {
  return (
    <Pressable
      onPress={() => router.push(route)}
      style={cardStyle}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: "600",
        }}
      >
        {title}
      </Text>
    </Pressable>
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