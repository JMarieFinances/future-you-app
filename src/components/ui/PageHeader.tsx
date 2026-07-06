import { router } from "expo-router";
import { Pressable, View } from "react-native";
import AppText from "./AppText";

export default function PageHeader({
  title,
  subtitle,
  showBack = false,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}) {
  return (
    <View style={{ marginBottom: 20 }}>
      {showBack && (
        <Pressable
          onPress={() => router.back()}
          style={{ marginBottom: 12 }}
        >
          <AppText style={{ fontSize: 16 }}>← Back</AppText>
        </Pressable>
      )}

      <AppText variant="title">{title}</AppText>

      {subtitle ? (
        <AppText variant="muted">{subtitle}</AppText>
      ) : null}
    </View>
  );
}