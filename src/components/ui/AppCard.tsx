import { useTheme } from "@/lib/useTheme";
import { BlurView } from "expo-blur";
import { ReactNode } from "react";
import {
  Platform,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";

type Props = {
  children: ReactNode;
  glass?: boolean;
  style?: StyleProp<ViewStyle>;
};

function isDarkColor(color?: string) {
  if (!color || !color.startsWith("#")) {
    return true;
  }

  const hex = color.replace("#", "");

  if (hex.length !== 6) {
    return true;
  }

  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);

  const brightness =
    (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness < 145;
}

export default function AppCard({
  children,
  glass = false,
  style,
}: Props) {
  const theme = useTheme();

  if (!glass) {
    return (
      <View style={[theme.card, style]}>
        {children}
      </View>
    );
  }

  const darkTheme = isDarkColor(
    theme.colors.background
  );

  const glassBackground = darkTheme
    ? "rgba(255, 255, 255, 0.055)"
    : "rgba(255, 255, 255, 0.72)";

  const glassBorder = darkTheme
    ? "rgba(255, 255, 255, 0.12)"
    : "rgba(255, 255, 255, 0.88)";

  const highlightColor = darkTheme
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(255, 255, 255, 0.62)";

  if (Platform.OS === "web") {
    return (
      <View
        style={[
          theme.card,
          {
            overflow: "hidden",
            backgroundColor: glassBackground,
            borderWidth: 1,
            borderColor: glassBorder,
            shadowColor: "#000",
            shadowOpacity: darkTheme ? 0.22 : 0.1,
            shadowRadius: 18,
            shadowOffset: {
              width: 0,
              height: 8,
            },
          },
          style,
        ]}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 18,
            right: 18,
            height: 1,
            backgroundColor: highlightColor,
          }}
        />

        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        theme.card,
        {
          overflow: "hidden",
          backgroundColor: glassBackground,
          borderWidth: 1,
          borderColor: glassBorder,
          shadowColor: "#000",
          shadowOpacity: darkTheme ? 0.22 : 0.1,
          shadowRadius: 18,
          shadowOffset: {
            width: 0,
            height: 8,
          },
          elevation: 6,
        },
        style,
      ]}
    >
      <BlurView
        intensity={darkTheme ? 35 : 55}
        tint={darkTheme ? "dark" : "light"}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }}
      />

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 18,
          right: 18,
          height: 1,
          backgroundColor: highlightColor,
        }}
      />

      {children}
    </View>
  );
}