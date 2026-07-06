import { getAppData, updateAppData } from "./appStore";
import { NotificationSettings, ThemeType } from "./types";

export function getTheme() {
  return getAppData().settings.theme;
}

export async function setTheme(theme: ThemeType) {
  await updateAppData((app) => {
    app.settings.theme = theme;
  });
}

export function getNotifications() {
  return getAppData().settings.notifications;
}

export async function updateNotification(key: keyof NotificationSettings) {
  await updateAppData((app) => {
    app.settings.notifications[key] = !app.settings.notifications[key];
  });
}

export const themes = [
  {
    id: "future-you",
    emoji: "💚",
    name: "Future You",
    description: "Clean, modern, and focused.",
    colors: {
      background: "#ffffff",
      card: "#ffffff",
      text: "#111827",
      muted: "#6b7280",
      primary: "#111827",
      success: "#16a34a",
      warning: "#f59e0b",
      danger: "#dc2626",
      border: "#e5e7eb",
      progressTrack: "#e5e7eb",
      progressFill: "#111827",
      income: "#16a34a",
      expense: "#dc2626",
      savings: "#2563eb",
    },
    radius: {
      card: 18,
      button: 14,
      input: 12,
    },
  },
  {
    id: "midnight",
    emoji: "🌙",
    name: "Midnight",
    description: "Dark, sleek, and focused.",
    colors: {
      background: "#020617",
      card: "#0f172a",
      text: "#f8fafc",
      muted: "#94a3b8",
      primary: "#a78bfa",
      success: "#22c55e",
      warning: "#facc15",
      danger: "#f87171",
      border: "#334155",
      progressTrack: "#1e293b",
      progressFill: "#a78bfa",
      income: "#22c55e",
      expense: "#f87171",
      savings: "#38bdf8",
    },
    radius: {
      card: 20,
      button: 16,
      input: 14,
    },
  },
  {
    id: "lavender",
    emoji: "💜",
    name: "Lavender",
    description: "Soft, calm, and pretty.",
    colors: {
      background: "#faf5ff",
      card: "#ffffff",
      text: "#2e1065",
      muted: "#7e22ce",
      primary: "#8b5cf6",
      success: "#22c55e",
      warning: "#f59e0b",
      danger: "#dc2626",
      border: "#e9d5ff",
      progressTrack: "#ede9fe",
      progressFill: "#8b5cf6",
      income: "#22c55e",
      expense: "#dc2626",
      savings: "#8b5cf6",
    },
    radius: {
      card: 24,
      button: 18,
      input: 16,
    },
  },
  {
    id: "ocean",
    emoji: "🌊",
    name: "Ocean",
    description: "Clean, cool, and relaxed.",
    colors: {
      background: "#ecfeff",
      card: "#ffffff",
      text: "#083344",
      muted: "#0e7490",
      primary: "#0891b2",
      success: "#16a34a",
      warning: "#f59e0b",
      danger: "#dc2626",
      border: "#a5f3fc",
      progressTrack: "#cffafe",
      progressFill: "#0891b2",
      income: "#16a34a",
      expense: "#dc2626",
      savings: "#0284c7",
    },
    radius: {
      card: 20,
      button: 14,
      input: 14,
    },
  },
  {
    id: "rose-gold",
    emoji: "🌹",
    name: "Rose Gold",
    description: "Warm, elegant, and luxury-coded.",
    colors: {
      background: "#fff7ed",
      card: "#ffffff",
      text: "#431407",
      muted: "#9a3412",
      primary: "#f97316",
      success: "#16a34a",
      warning: "#f59e0b",
      danger: "#dc2626",
      border: "#fed7aa",
      progressTrack: "#ffedd5",
      progressFill: "#f97316",
      income: "#16a34a",
      expense: "#dc2626",
      savings: "#ea580c",
    },
    radius: {
      card: 22,
      button: 18,
      input: 16,
    },
  },
  {
    id: "money-mode",
    emoji: "💰",
    name: "Money Mode",
    description: "Bold, sharp, and built for hustlers.",
    colors: {
      background: "#052e16",
      card: "#064e3b",
      text: "#f0fdf4",
      muted: "#bbf7d0",
      primary: "#22c55e",
      success: "#4ade80",
      warning: "#facc15",
      danger: "#f87171",
      border: "#15803d",
      progressTrack: "#14532d",
      progressFill: "#22c55e",
      income: "#4ade80",
      expense: "#f87171",
      savings: "#facc15",
    },
    radius: {
      card: 14,
      button: 10,
      input: 10,
    },
  },
] as const;

export type ThemeConfig = (typeof themes)[number];

export function getThemeConfig() {
  const selectedTheme = getTheme();

  return themes.find((theme) => theme.id === selectedTheme) ?? themes[0];
}

export function getThemeColors() {
  return getThemeConfig().colors;
}