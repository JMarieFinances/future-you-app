import AppCard from "@/components/ui/AppCard";
import AppText from "@/components/ui/AppText";
import { Pressable, View } from "react-native";

export type WorkspaceQuickAction = {
  id: string;
  title: string;
  subtitle?: string;
  symbol?: string;
  disabled?: boolean;
  onPress: () => void;
};

type Props = {
  actions: WorkspaceQuickAction[];
  title?: string;
  subtitle?: string;
};

export default function WorkspaceQuickActions({
  actions,
  title = "Quick Actions",
  subtitle = "Jump into the most common workspace tasks.",
}: Props) {
  return (
    <AppCard>
      <AppText variant="section">{title}</AppText>

      <View style={{ marginTop: 4 }}>
        <AppText variant="muted">{subtitle}</AppText>
      </View>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 14,
        }}
      >
        {actions.map((action) => (
          <Pressable
            key={action.id}
            disabled={action.disabled}
            onPress={() => {
              if (!action.disabled) {
                action.onPress();
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={action.title}
            style={({ pressed }) => ({
              width: "48%",
              minWidth: 150,
              flexGrow: 1,
              minHeight: 104,
              padding: 15,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
              backgroundColor: "rgba(255,255,255,0.05)",
              justifyContent: "space-between",
              cursor: action.disabled ? "default" : "pointer",
              opacity: action.disabled
                ? 0.4
                : pressed
                ? 0.68
                : 1,
              transform: [
                {
                  scale:
                    pressed && !action.disabled
                      ? 0.98
                      : 1,
                },
              ],
            })}
          >
            <View
              pointerEvents="none"
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.09)",
              }}
            >
              <AppText variant="bold">
                {action.symbol ?? "+"}
              </AppText>
            </View>

            <View
              pointerEvents="none"
              style={{ marginTop: 14 }}
            >
              <AppText variant="bold">
                {action.title}
              </AppText>

              {action.subtitle ? (
                <View style={{ marginTop: 3 }}>
                  <AppText variant="muted">
                    {action.subtitle}
                  </AppText>
                </View>
              ) : null}
            </View>
          </Pressable>
        ))}
      </View>
    </AppCard>
  );
}