import { useTheme } from "@/lib/useTheme";
import { View } from "react-native";

export default function ProgressBar({
  step,
  total,
}: {
  step: number;
  total: number;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        height: 10,
        backgroundColor: colors.border,
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: `${(step / total) * 100}%`,
          height: "100%",
          backgroundColor: colors.primary,
        }}
      />
    </View>
  );
}