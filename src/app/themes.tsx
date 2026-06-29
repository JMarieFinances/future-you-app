import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { setTheme, themes, type ThemeType } from "@/lib/settingsStore";

export default function ThemesScreen() {
  const [selectedTheme, setSelectedTheme] =
    useState<ThemeType>("future-you");

  const currentThemeInfo = themes.find(
    (theme) => theme.id === selectedTheme
  );

  const handleSelect = (theme: ThemeType) => {
    setSelectedTheme(theme);
    setTheme(theme);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 32, fontWeight: "bold" }}>Themes</Text>

      <View style={cardStyle}>
        <Text style={cardTitle}>Current Theme</Text>

        <Text style={{ fontSize: 18 }}>
          {currentThemeInfo?.emoji} {currentThemeInfo?.name}
        </Text>
      </View>

      {themes.map((theme) => (
        <Pressable
          key={theme.id}
          onPress={() => handleSelect(theme.id as ThemeType)}
          style={[
            cardStyle,
            selectedTheme === theme.id && {
              borderWidth: 3,
              backgroundColor: "#f0fdf4",
            },
          ]}
        >
          <Text style={{ fontSize: 22, fontWeight: "bold" }}>
            {theme.emoji} {theme.name}
          </Text>

          <Text>{theme.description}</Text>

          {selectedTheme === theme.id ? (
            <Text style={{ marginTop: 8, fontWeight: "bold" }}>
              Selected
            </Text>
          ) : null}
        </Pressable>
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
  marginBottom: 8,
};