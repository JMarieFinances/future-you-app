import { addBusiness, getBusinesses } from "@/lib/businessStore";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function BusinessesScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [businessType, setBusinessType] = useState("Side Hustle");
  const [, forceUpdate] = useState(0);

  const businesses = getBusinesses();

 const handleCreate = async () => {
    if (!name.trim()) return;

    await addBusiness({
      id: Date.now().toString(),
      name,
      description,
      businessType,
    });

    setName("");
    setDescription("");
    setBusinessType("Side Hustle");
    forceUpdate((prev) => prev + 1);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 32, fontWeight: "bold" }}>
        Business Budgets
      </Text>

      <View style={cardStyle}>
        <Text style={cardTitle}>+ Create Business</Text>

        <TextInput
          placeholder="Business Name"
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
          placeholder="Business Type"
          value={businessType}
          onChangeText={setBusinessType}
          style={inputStyle}
        />

        <Pressable onPress={handleCreate} style={buttonStyle}>
          <Text style={buttonText}>Create Business</Text>
        </Pressable>
      </View>

      {businesses.map((business) => (
        <View key={business.id} style={cardStyle}>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>
            💼 {business.name}
          </Text>

          <Text>📋 {business.businessType}</Text>

          {business.description ? <Text>{business.description}</Text> : null}

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