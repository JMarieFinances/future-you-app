import { useTheme } from "@/lib/useTheme";
import { ReactNode } from "react";
import { View } from "react-native";

export default function AppCard({ children }: { children: ReactNode }) {
  const theme = useTheme();

  return <View style={theme.card}>{children}</View>;
}