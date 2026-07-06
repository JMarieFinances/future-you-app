import AppCard from "@/components/ui/AppCard";
import AppText from "@/components/ui/AppText";
import { View } from "react-native";

export default function RecommendationCard({
  level,
  title,
  message,
}: {
  level: "success" | "warning" | "danger";
  title: string;
  message: string;
}) {
  const colors = {
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
  };

  const labels = {
    success: "🟢",
    warning: "🟡",
    danger: "🔴",
  };

  return (
    <AppCard>
      <View
        style={{
          borderLeftWidth: 6,
          borderLeftColor: colors[level],
          paddingLeft: 14,
        }}
      >
        <AppText variant="section">
          {labels[level]} {title}
        </AppText>

        <View style={{ marginTop: 8 }}>
          <AppText variant="muted">
            {message}
          </AppText>
        </View>
      </View>
    </AppCard>
  );
}