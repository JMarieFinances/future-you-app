import { addHousehold, getHouseholds } from "@/lib/householdStore";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function HouseholdsScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState("1");
  const [, forceUpdate] = useState(0);

  const households = getHouseholds();

  const handleCreate = async () => {
    if (!name.trim()) return;

    await addHousehold({
      id: Date.now().toString(),
      name,
      description,
      members: Number(members) || 1,
    });

    setName("");
    setDescription("");
    setMembers("1");
    forceUpdate((prev) => prev + 1);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 32, fontWeight: "bold" }}>
        Household Budgets
      </Text>

      <View style={cardStyle}>
        <Text style={cardTitle}>+ Create Household</Text>

        <TextInput
          placeholder="Household Name"
          value={name}
          onChangeText={setName}
          style={inputStyle}
        />

        <TextInput
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
          style={inputStyle}
        />

        <TextInput
          placeholder="Number of Members"
          value={members}
          onChangeText={setMembers}
          keyboardType="numeric"
          style={inputStyle}
        />

        <Pressable onPress={handleCreate} style={buttonStyle}>
          <Text style={buttonText}>Create Household</Text>
        </Pressable>
      </View>

      {households.map((household) => (
        <View key={household.id} style={cardStyle}>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>
            🏠 {household.name}
          </Text>

          <Text>
            👥 {household.members} Member
            {household.members === 1 ? "" : "s"}
          </Text>

          {household.description ? <Text>{household.description}</Text> : null}

          <Text style={{ marginTop: 8 }}>Budget setup coming next.</Text>
        </View>
      ))}
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

const inputStyle = {
  borderWidth: 1,
  borderRadius: 12,
  padding: 12,
  marginBottom: 12,
};

const buttonStyle = {
  backgroundColor: "black",
  padding: 14,
  borderRadius: 12,
};

const buttonText = {
  color: "white",
  textAlign: "center" as const,
  fontWeight: "600" as const,
};