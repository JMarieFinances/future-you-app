import { useTheme } from "@/lib/useTheme";
import { View } from "react-native";

export default function ProgressBar({
  percent,
}: {
  percent: number;
}) {
  const { colors } = useTheme();

  const safePercent = Math.min(percent, 100);

  return (
    <View
      style={{
        height: 8,
        borderRadius: 999,
        backgroundColor: colors.progressTrack,
        overflow: "hidden",
        marginVertical: 8,
      }}
    >
      <View
        style={{
          width: `${safePercent}%`,
          height: "100%",
          backgroundColor: colors.progressFill,
        }}
      />
    </View>
  );
}