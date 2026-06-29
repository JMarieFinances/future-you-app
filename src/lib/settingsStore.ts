export type ThemeType =
  | "future-you"
  | "midnight"
  | "lavender"
  | "ocean"
  | "rose-gold"
  | "money-mode";

  export type NotificationSettings = {
  goalReminders: boolean;
  billReminders: boolean;
  milestones: boolean;
  monthlyCheckIn: boolean;
  affordAlerts: boolean;
  budgetWarnings: boolean;
};

let notifications: NotificationSettings = {
  goalReminders: true,
  billReminders: true,
  milestones: true,
  monthlyCheckIn: true,
  affordAlerts: true,
  budgetWarnings: true,
};

export function getNotifications() {
  return notifications;
}

export function updateNotification(
  key: keyof NotificationSettings
) {
  notifications = {
    ...notifications,
    [key]: !notifications[key],
  };
}

let selectedTheme: ThemeType = "future-you";

export function getTheme() {
  return selectedTheme;
}

export function setTheme(theme: ThemeType) {
  selectedTheme = theme;
}

export const themes = [
  {
    id: "future-you",
    emoji: "💚",
    name: "Future You",
    description: "Default theme",
  },
  {
    id: "midnight",
    emoji: "🌙",
    name: "Midnight",
    description: "Dark mode lovers",
  },
  {
    id: "lavender",
    emoji: "💜",
    name: "Lavender",
    description: "Soft and calm",
  },
  {
    id: "ocean",
    emoji: "🌊",
    name: "Ocean",
    description: "Clean and focused",
  },
  {
    id: "rose-gold",
    emoji: "🌹",
    name: "Rose Gold",
    description: "Elegant",
  },
  {
    id: "money-mode",
    emoji: "💰",
    name: "Money Mode",
    description: "Built for hustlers",
  },
];