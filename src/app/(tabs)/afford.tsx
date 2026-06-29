import { getPlanData } from "@/lib/planStore";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function AffordTab() {
  const plan = getPlanData();

  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [purchaseType, setPurchaseType] = useState<"oneTime" | "monthly">(
    "oneTime"
  );

  const cost = Number(price) || 0;
  const currentSafeToSpend = plan.safeToSpend - plan.goalContributions;

  const afterPurchase =
    purchaseType === "oneTime"
      ? currentSafeToSpend - cost
      : currentSafeToSpend - cost;

  const saveForItMonths =
    cost > 0 && currentSafeToSpend > 0
      ? Math.ceil(cost / currentSafeToSpend)
      : null;

  const goalImpacts = plan.goals.map((goal) => {
    const delay =
      goal.monthly > 0 && cost > 0 ? Math.ceil(cost / goal.monthly) : null;

    return {
      ...goal,
      delay,
    };
  });

  const getStatus = () => {
    if (cost <= 0) return "Enter a price to analyze this purchase.";

    if (afterPurchase < 0) return "🔴 Not Recommended";

    if (afterPurchase < 100) return "🟡 Possible, but tight";

    return "🟢 Comfortable";
  };

  const getRecommendation = () => {
    if (cost <= 0) return "Add an item and price to see your Future You impact.";

    if (afterPurchase < 0) {
      return "Buying this now would push your safe-to-spend negative. Saving for it first protects Future You.";
    }

    if (afterPurchase < 100) {
      return "You can technically afford this, but it leaves very little breathing room.";
    }

    return "This purchase fits inside your current plan without breaking Future You.";
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 32, fontWeight: "bold" }}>
        Can I Afford This?
      </Text>

      <View style={cardStyle}>
        <Text style={cardTitle}>Purchase</Text>

        <TextInput
          placeholder="Item Name"
          value={itemName}
          onChangeText={setItemName}
          style={inputStyle}
        />

        <TextInput
          placeholder="Price"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          style={inputStyle}
        />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => setPurchaseType("oneTime")}
            style={[
              toggleButton,
              purchaseType === "oneTime" && selectedButton,
            ]}
          >
            <Text>One-Time</Text>
          </Pressable>

          <Pressable
            onPress={() => setPurchaseType("monthly")}
            style={[
              toggleButton,
              purchaseType === "monthly" && selectedButton,
            ]}
          >
            <Text>Monthly</Text>
          </Pressable>
        </View>
      </View>

      <View style={cardStyle}>
        <Text style={cardTitle}>Status</Text>
        <Text style={{ fontSize: 22, fontWeight: "bold" }}>{getStatus()}</Text>
        <Text style={{ marginTop: 8 }}>{getRecommendation()}</Text>
      </View>

      <View style={cardStyle}>
        <Text style={cardTitle}>Safe-To-Spend Impact</Text>
        <Text>Current Safe To Spend: ${currentSafeToSpend}</Text>
        <Text>After Purchase: ${afterPurchase}</Text>
      </View>

      <View style={cardStyle}>
        <Text style={cardTitle}>Goal Impact</Text>

        {goalImpacts.length === 0 ? (
  <Text>Complete setup first to see goal impact.</Text>
) : (
  goalImpacts.map((goal) => (
    <View key={goal.id} style={{ marginBottom: 12 }}>
      <Text style={{ fontWeight: "bold" }}>
        {goal.emoji} {goal.name}
      </Text>

      {goal.delay !== null ? (
        <Text>
          This purchase costs about {goal.delay} month
          {goal.delay === 1 ? "" : "s"} of your current ${goal.monthly}/month
          contribution, so buying it now could push this goal back by around{" "}
          {goal.delay} month{goal.delay === 1 ? "" : "s"}.
        </Text>
      ) : (
        <Text>
          No estimate yet because this goal does not have a monthly contribution.
        </Text>
      )}
    </View>
  ))
)}
      </View>

      <View style={cardStyle}>
        <Text style={cardTitle}>What If You Saved For It?</Text>

        {saveForItMonths !== null ? (
          <>
            <Text>
              If you set aside your current safe-to-spend amount each month,
              you could afford this in:
            </Text>

            <Text style={{ fontSize: 28, fontWeight: "bold", marginTop: 8 }}>
              {saveForItMonths} months
            </Text>

            <Text style={{ marginTop: 8 }}>
              This keeps your existing Future You goals untouched.
            </Text>
          </>
        ) : (
          <Text>
            Add a price and keep your safe-to-spend positive to estimate a
            savings timeline.
          </Text>
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

const inputStyle = {
  borderWidth: 1,
  borderRadius: 12,
  padding: 12,
  marginBottom: 12,
};

const toggleButton = {
  borderWidth: 1,
  borderRadius: 12,
  padding: 12,
  flex: 1,
  alignItems: "center" as const,
};

const selectedButton = {
  backgroundColor: "#d9f99d",
};