import { useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";

export default function NotificationsScreen() {
  const [settings, setSettings] = useState({
    goalReminders: true,
    billReminders: true,
    milestones: true,
    monthlyCheckIn: true,
    affordAlerts: true,
    budgetWarnings: true,
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const NotificationRow = ({
    title,
    setting,
  }: {
    title: string;
    setting: keyof typeof settings;
  }) => (
    <Pressable onPress={() => toggle(setting)} style={cardStyle}>
      <Text style={{ fontSize: 18, fontWeight: "600" }}>{title}</Text>

      <Text style={{ marginTop: 8 }}>
        {settings[setting] ? "✅ On" : "❌ Off"}
      </Text>
    </Pressable>
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 32, fontWeight: "bold" }}>Notifications</Text>

      <NotificationRow title="🎯 Goal Reminders" setting="goalReminders" />
      <NotificationRow title="🏠 Bill Reminders" setting="billReminders" />
      <NotificationRow title="🏆 Goal Milestones" setting="milestones" />
      <NotificationRow title="📅 Monthly Check-In" setting="monthlyCheckIn" />
      <NotificationRow title="🛒 Afford Alerts" setting="affordAlerts" />
      <NotificationRow title="⚠️ Budget Warnings" setting="budgetWarnings" />
    </ScrollView>
  );
}

const cardStyle = {
  borderWidth: 1,
  borderRadius: 16,
  padding: 18,
};