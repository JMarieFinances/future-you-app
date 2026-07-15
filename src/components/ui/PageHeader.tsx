import { useTheme } from "@/lib/useTheme";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import AppText from "./AppText";

type Props = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backLabel?: string;
  onBack?: () => void;
};

export default function PageHeader({
  title,
  subtitle,
  showBack = false,
  backLabel = "Back",
  onBack,
}: Props) {
  const { colors } = useTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/today");
  };

  return (
    <View
      style={{
        marginBottom: 22,
      }}
    >
      {showBack ? (
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => ({
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 14,
            opacity: pressed ? 0.65 : 1,
            transform: [
              {
                scale: pressed ? 0.98 : 1,
              },
            ],
          })}
        >
          <Text
            style={{
              color: colors.primary,
              fontSize: 20,
              fontWeight: "700",
            }}
          >
            ‹
          </Text>

          <AppText
            style={{
              color: colors.primary,
              fontSize: 15,
              fontWeight: "700",
            }}
          >
            {backLabel}
          </AppText>
        </Pressable>
      ) : null}

      <Text
        numberOfLines={2}
        style={{
          color: colors.text,
          fontSize: 32,
          lineHeight: 38,
          fontWeight: "800",
          letterSpacing: -1,
        }}
      >
        {title}
      </Text>

      {subtitle ? (
        <View
          style={{
            marginTop: 7,
            maxWidth: 620,
          }}
        >
          <AppText
            variant="muted"
            style={{
              fontSize: 15,
              lineHeight: 21,
            }}
          >
            {subtitle}
          </AppText>
        </View>
      ) : null}

      <View
        style={{
          width: 42,
          height: 4,
          borderRadius: 999,
          backgroundColor: colors.primary,
          marginTop: 14,
        }}
      />
    </View>
  );
}