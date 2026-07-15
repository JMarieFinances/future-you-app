import AppCard from "@/components/ui/AppCard";
import AppText from "@/components/ui/AppText";
import { Pressable, ScrollView, View } from "react-native";

export type WorkspaceTabOption<T extends string> = {
  key: T;
  label: string;
  badge?: number;
};

type Props<T extends string> = {
  tabs: WorkspaceTabOption<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
};

export default function WorkspaceTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
}: Props<T>) {
  return (
    <AppCard glass>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          gap: 8,
        }}
      >
        {tabs.map((tab) => {
          const selected = activeTab === tab.key;

          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              style={({ pressed }) => ({
                flexGrow: 1,
                minWidth: 88,
                minHeight: 44,
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.72 : 1,
                transform: [
                  {
                    scale: pressed ? 0.98 : 1,
                  },
                ],
                backgroundColor: selected
                  ? "rgba(255,255,255,0.13)"
                  : "transparent",
              })}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                }}
              >
                <AppText
                  variant={selected ? "bold" : "muted"}
                >
                  {tab.label}
                </AppText>

                {tab.badge && tab.badge > 0 ? (
                  <View
                    style={{
                      minWidth: 20,
                      height: 20,
                      paddingHorizontal: 6,
                      borderRadius: 999,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor:
                        "rgba(255,255,255,0.14)",
                    }}
                  >
                    <AppText variant="bold">
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </AppText>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </AppCard>
  );
}