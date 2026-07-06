import { ReactNode } from "react";
import { View } from "react-native";

export default function AppRow({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      }}
    >
      {children}
    </View>
  );
}