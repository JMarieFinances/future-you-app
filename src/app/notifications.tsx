import AppCard from "@/components/ui/AppCard";
import AppPage from "@/components/ui/AppPage";
import AppRow from "@/components/ui/AppRow";
import AppText from "@/components/ui/AppText";
import MetricCard from "@/components/ui/MetricCard";
import PageHeader from "@/components/ui/PageHeader";
import {
  getNotifications,
  updateNotification,
} from "@/lib/settingsStore";
import { NotificationSettings } from "@/lib/types";
import { useState } from "react";
import { Pressable, View } from "react-native";

const notificationOptions: {
  key: keyof NotificationSettings;
  title: string;
  description: string;
}[] = [
  {
    key: "goalReminders",
    title: "Goal Reminders",
    description: "Remind you to contribute toward your goals.",
  },
  {
    key: "billReminders",
    title: "Bill Reminders",
    description: "Help you stay ahead of rent, utilities, and other bills.",
  },
  {
    key: "milestones",
    title: "Goal Milestones",
    description: "Celebrate when you reach savings milestones.",
  },
  {
    key: "monthlyCheckIn",
    title: "Monthly Check-In",
    description: "Prompt your monthly review and budget reset.",
  },
  {
    key: "affordAlerts",
    title: "Afford Alerts",
    description: "Warn you when a purchase could hurt your plan.",
  },
  {
    key: "budgetWarnings",
    title: "Budget Warnings",
    description: "Notify you when a category is close to going over.",
  },
];

export default function NotificationsScreen() {
  const [settings, setSettings] = useState(getNotifications());

  const activeCount = notificationOptions.filter(
    (option) => settings[option.key]
  ).length;

  const toggle = async (key: keyof NotificationSettings) => {
    await updateNotification(key);
    setSettings(getNotifications());
  };

  return (
    <AppPage>
      <PageHeader
  title="Notifications"
  subtitle="Manage your notification preferences."
  showBack
/>

      <AppCard>
        <AppText variant="muted">Notification Center</AppText>

        <View style={{ marginTop: 4 }}>
          <AppText variant="title">{activeCount} Active</AppText>
        </View>

        <AppText variant="muted">
          These settings power reminders, budget warnings, affordability alerts,
          and monthly reviews.
        </AppText>
      </AppCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Active"
            value={`${activeCount}`}
            caption="Enabled alerts"
            tone="success"
          />
        </View>

        <View style={{ flex: 1 }}>
          <MetricCard
            title="Paused"
            value={`${notificationOptions.length - activeCount}`}
            caption="Disabled alerts"
            tone="warning"
          />
        </View>
      </View>

      <AppCard>
        <AppText variant="section">Alert Settings</AppText>

        <View style={{ marginTop: 12, gap: 12 }}>
          {notificationOptions.map((option) => {
            const enabled = settings[option.key];

            return (
              <Pressable key={option.key} onPress={() => toggle(option.key)}>
                <AppCard>
                  <AppRow>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bold">{option.title}</AppText>
                      <AppText variant="muted">{option.description}</AppText>
                    </View>

                    <AppText variant="bold">{enabled ? "On" : "Off"}</AppText>
                  </AppRow>
                </AppCard>
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="section">How These Work</AppText>
        <View style={{ marginTop: 10, gap: 8 }}>
          <AppText variant="muted">
            Budget warnings appear when spending gets close to a limit.
          </AppText>
          <AppText variant="muted">
            Afford alerts appear when a purchase could reduce safe-to-spend.
          </AppText>
          <AppText variant="muted">
            Monthly check-ins power the Monthly Review experience.
          </AppText>
        </View>
      </AppCard>
    </AppPage>
  );
}