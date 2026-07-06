import AppCard from "@/components/ui/AppCard";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import {
  getTheme,
  getThemeConfig,
  setTheme,
  themes,
  type ThemeType,
} from "@/lib/settingsStore";
import { useTheme } from "@/lib/useTheme";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

export default function ThemesScreen() {
  const { colors } = useTheme();
  const [selectedTheme, setSelectedTheme] =
    useState<ThemeType>("future-you");

  useEffect(() => {
    setSelectedTheme(getTheme());
  }, []);

  const currentTheme = getThemeConfig();

  const handleSelect = async (theme: ThemeType) => {
    await setTheme(theme);
    setSelectedTheme(theme);
  };

  return (
    <AppPage>
      <PageHeader
        title="Themes"
        subtitle="Make Future You feel like your own financial workspace."
      />

      <AppCard>
        <AppRow>
          <View>
            <AppText variant="muted">Current Theme</AppText>
            <AppText variant="section">
              {currentTheme.emoji} {currentTheme.name}
            </AppText>
            <AppText variant="muted">{currentTheme.description}</AppText>
          </View>

          <AppText variant="bold">Active</AppText>
        </AppRow>
      </AppCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Style"
            value={currentTheme.name}
            caption="Workspace mode"
            tone="primary"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Accent"
            value="Live"
            caption="Applied across app"
            tone="success"
          />
        </View>
      </View>

      <AppCard>
        <AppText variant="section">Theme Library</AppText>

        <View style={{ marginTop: 12, gap: 12 }}>
          {themes.map((theme) => {
            const isSelected = selectedTheme === theme.id;

            return (
              <Pressable
                key={theme.id}
                onPress={() => handleSelect(theme.id)}
                style={{
                  borderWidth: isSelected ? 3 : 1,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderRadius: 18,
                  padding: 16,
                }}
              >
                <AppRow>
                  <View style={{ flex: 1 }}>
                    <AppText variant="section">
                      {theme.emoji} {theme.name}
                    </AppText>
                    <AppText variant="muted">{theme.description}</AppText>
                  </View>

                  {isSelected ? <AppText variant="bold">Selected</AppText> : null}
                </AppRow>

                <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
                  <Swatch color={theme.colors.background} />
                  <Swatch color={theme.colors.card} />
                  <Swatch color={theme.colors.primary} />
                  <Swatch color={theme.colors.success} />
                  <Swatch color={theme.colors.warning} />
                  <Swatch color={theme.colors.danger} />
                </View>
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="section">Launch Note</AppText>
        <AppText variant="muted">
          Theme changes are saved and used by the new launch screens. Older
          screens will update as they are moved into the shared UI system.
        </AppText>
      </AppCard>
    </AppPage>
  );
}

function Swatch({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 26,
        height: 26,
        borderRadius: 999,
        backgroundColor: color,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,.15)",
      }}
    />
  );
}