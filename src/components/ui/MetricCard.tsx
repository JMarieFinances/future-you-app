import { useTheme } from "@/lib/useTheme";
import { Text, View, ViewStyle } from "react-native";
import AppCard from "./AppCard";
import AppText from "./AppText";

type Tone =
  | "primary"
  | "success"
  | "warning"
  | "danger";

type Props = {
  title: string;
  value: string;
  caption?: string;
  tone?: Tone;
  glass?: boolean;
  style?: ViewStyle | ViewStyle[];
};

export default function MetricCard({
  title,
  value,
  caption,
  tone = "primary",
  glass = true,
  style,
}: Props) {
  const { colors } = useTheme();

  const backgrounds = {
    primary: "rgba(59,130,246,0.08)",
    success: "rgba(34,197,94,0.08)",
    warning: "rgba(245,158,11,0.08)",
    danger: "rgba(239,68,68,0.08)",
  };

  return (
    <AppCard
      glass={glass}
      style={[
        {
          minHeight: 112,
          paddingVertical: 18,
          backgroundColor: backgrounds[tone],
        },
        style,
      ]}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "space-between",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <View
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              backgroundColor: colors[tone],
            }}
          />

          <AppText variant="muted">
            {title}
          </AppText>
        </View>

        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            color: colors.text,
            fontSize: 38,
            fontWeight: "800",
            letterSpacing: -1.5,
            marginTop: 8,
          }}
        >
          {value}
        </Text>

        {caption ? (
          <AppText
            variant="muted"
            style={{
              marginTop: 2,
            }}
          >
            {caption}
          </AppText>
        ) : null}

        <View
          style={{
            marginTop: 16,
            height: 4,
            borderRadius: 999,
            overflow: "hidden",
            backgroundColor: "rgba(255,255,255,.08)",
          }}
        >
          <View
            style={{
              width: "45%",
              height: "100%",
              backgroundColor: colors[tone],
              borderRadius: 999,
            }}
          />
        </View>
      </View>
    </AppCard>
  );
}