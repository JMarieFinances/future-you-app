import { useTheme } from "@/lib/useTheme";
import { View, ViewStyle } from "react-native";

type Props = {
  percent: number;
  height?: number;
  color?: string;
  trackColor?: string;
  rounded?: boolean;
  style?: ViewStyle | ViewStyle[];
};

export default function ProgressBar({
  percent,
  height = 10,
  color,
  trackColor,
  rounded = true,
  style,
}: Props) {
  const { colors } = useTheme();

  const progress = Math.max(
    0,
    Math.min(percent, 100)
  );

  const fillColor =
    color ??
    (progress >= 100
      ? colors.success
      : colors.progressFill);

  return (
    <View
      style={[
        {
          height,
          borderRadius: rounded
            ? 999
            : 4,
          backgroundColor:
            trackColor ??
            colors.progressTrack,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <View
        style={{
          width: `${progress}%`,
          height: "100%",
          borderRadius: rounded
            ? 999
            : 4,
          backgroundColor: fillColor,

          shadowColor: fillColor,
          shadowOpacity: 0.45,
          shadowRadius: 8,
          shadowOffset: {
            width: 0,
            height: 0,
          },
          elevation: 2,
        }}
      />

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: height / 2,

          backgroundColor:
            "rgba(255,255,255,0.18)",
        }}
      />
    </View>
  );
}