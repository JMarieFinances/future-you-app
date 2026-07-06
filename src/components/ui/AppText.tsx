import { useTheme } from "@/lib/useTheme";
import { ReactNode } from "react";
import { Text } from "react-native";

type Variant = "title" | "section" | "body" | "muted" | "bold";

export default function AppText({
  children,
  variant = "body",
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  const theme = useTheme();

  const style =
    variant === "title"
      ? { fontSize: 32, fontWeight: "bold" as const, color: theme.colors.text }
      : variant === "section"
      ? { fontSize: 22, fontWeight: "bold" as const, color: theme.colors.text }
      : variant === "muted"
      ? { color: theme.colors.muted }
      : variant === "bold"
      ? { fontWeight: "bold" as const, color: theme.colors.text }
      : { color: theme.colors.text };

  return <Text style={style}>{children}</Text>;
}