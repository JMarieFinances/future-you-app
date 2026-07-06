import { useTheme } from "@/lib/useTheme";
import { Text, View } from "react-native";
import AppCard from "./AppCard";
import AppText from "./AppText";

export default function MetricCard({
  title,
  value,
  caption,
  tone = "primary",
}: {
  title: string;
  value: string;
  caption?: string;
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  const { colors } = useTheme();

  return (
    <AppCard>
      <View style={{ gap: 10 }}>
        <View
          style={{
            width: 34,
            height: 4,
            borderRadius: 999,
            backgroundColor: colors[tone],
          }}
        />

        <View>
          <AppText variant="muted">{title}</AppText>

          <Text
            style={{
              color: colors.text,
              fontSize: 28,
              fontWeight: "800",
              marginTop: 4,
              letterSpacing: -0.6,
            }}
          >
            {value}
          </Text>

          {caption ? (
            <View style={{ marginTop: 6 }}>
              <AppText variant="muted">{caption}</AppText>
            </View>
          ) : null}
        </View>
      </View>
    </AppCard>
  );
}