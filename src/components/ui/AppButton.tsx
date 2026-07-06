import { useTheme } from "@/lib/useTheme";
import { Pressable, Text } from "react-native";

export default function AppButton({
  title,
  onPress,
  variant = "primary",
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline";
}) {
  const theme = useTheme();

  const isOutline = variant === "outline";

  return (
    <Pressable
      onPress={onPress}
      style={[
        theme.button,
        isOutline && {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text
        style={[
          theme.buttonText,
          isOutline && {
            color: theme.colors.text,
          },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}