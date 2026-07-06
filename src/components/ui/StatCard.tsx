import { useTheme } from "@/lib/useTheme";
import { Text } from "react-native";
import AppCard from "./AppCard";
import AppText from "./AppText";

type Tone = "primary" | "success" | "warning" | "danger";

export default function StatCard({
  title,
  value,
  tone = "primary",
}: {
  title: string;
  value: string;
  tone?: Tone;
}) {
  const { colors } = useTheme();

  return (
    <AppCard>
      <AppText variant="muted">{title}</AppText>

      <Text
        style={{
          color: colors[tone],
          fontSize: 22,
          fontWeight: "bold",
          marginTop: 4,
        }}
      >
        {value}
      </Text>
    </AppCard>
  );
}