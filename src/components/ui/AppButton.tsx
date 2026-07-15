import { useTheme } from "@/lib/useTheme";
import {
  ActivityIndicator,
  Pressable,
  Text,
  ViewStyle,
} from "react-native";

type Props = {
  title: string;
  onPress: () => void;

  variant?:
    | "primary"
    | "outline"
    | "glass"
    | "danger";

  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle | ViewStyle[];
};

export default function AppButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
}: Props) {
  const theme = useTheme();

  const colors = theme.colors;

  const isOutline = variant === "outline";
  const isGlass = variant === "glass";
  const isDanger = variant === "danger";

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        theme.button,

        isOutline && {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.border,
        },

        isGlass && {
          backgroundColor: "rgba(255,255,255,0.08)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.15)",
        },

        isDanger && {
          backgroundColor: colors.danger,
        },

        disabled && {
          opacity: 0.45,
        },

        pressed &&
          !disabled && {
            transform: [
              {
                scale: 0.97,
              },
            ],
            opacity: 0.82,
          },

        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            isOutline
              ? colors.text
              : "white"
          }
        />
      ) : (
        <Text
          style={[
            theme.buttonText,

            isOutline && {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}