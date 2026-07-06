import { useTheme } from "@/lib/useTheme";
import { ReactNode } from "react";
import { ScrollView } from "react-native";

export default function AppPage({ children }: { children: ReactNode }) {
  const theme = useTheme();

  return (
    <ScrollView
      style={theme.page}
      contentContainerStyle={{ padding: 24, gap: 16 }}
    >
      {children}
    </ScrollView>
  );
}