import { useTheme } from "@/lib/useTheme";
import { Tabs, router } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, Text } from "react-native";

const menuItems = [
  { label: "Today", route: "/(tabs)/today" },
  { label: "Dashboard", route: "/(tabs)/dashboard" },
  { label: "Goals", route: "/(tabs)/goals" },
  { label: "Plan", route: "/(tabs)/plan" },
  { label: "Afford", route: "/(tabs)/afford" },
  { label: "Calendar", route: "/(tabs)/calendar" },
  { label: "Review", route: "/(tabs)/review" },
  { label: "Profile", route: "/(tabs)/profile" },
  { label: "Settings", route: "/(tabs)/settings" },
];

export default function TabsLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen name="today" options={{ title: "Today" }} />
        <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
        <Tabs.Screen name="goals" options={{ title: "Goals" }} />
        <Tabs.Screen name="plan" options={{ title: "Plan" }} />
        <Tabs.Screen name="afford" options={{ title: "Afford" }} />
        <Tabs.Screen name="calendar" options={{ title: "Calendar" }} />
        <Tabs.Screen name="review" options={{ title: "Review" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
        <Tabs.Screen name="settings" options={{ title: "Settings" }} />
      </Tabs>

      <FloatingMenu />
    </>
  );
}

function FloatingMenu() {
  const { colors, theme } = useTheme();
  const [open, setOpen] = useState(false);

  const goTo = (route: string) => {
    setOpen(false);
    router.push(route as any);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          position: "absolute",
          right: 24,
          bottom: 28,
          width: 58,
          height: 58,
          borderRadius: 999,
          backgroundColor: colors.primary,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        <Text style={{ color: colors.card, fontSize: 26, fontWeight: "bold" }}>
          ☰
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade">
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,.45)",
            justifyContent: "flex-end",
            padding: 24,
          }}
        >
          <Pressable
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: theme.radius.card,
              padding: 18,
              gap: 10,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 24,
                fontWeight: "bold",
                marginBottom: 4,
              }}
            >
              Future You Menu
            </Text>

            {menuItems.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => goTo(item.route)}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 17,
                    fontWeight: "600",
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}