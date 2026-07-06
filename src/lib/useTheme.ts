import { getThemeConfig } from "./settingsStore";

export function useTheme() {
  const theme = getThemeConfig();
  const colors = theme.colors;

  return {
    theme,
    colors,

    page: {
      flex: 1,
      backgroundColor: colors.background,
    },

    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: theme.radius.card,
      padding: 18,
    },

    title: {
      color: colors.text,
    },

    text: {
      color: colors.text,
    },

    muted: {
      color: colors.muted,
    },

    button: {
      backgroundColor: colors.primary,
      borderRadius: theme.radius.button,
      padding: 14,
      alignItems: "center" as const,
    },

    buttonText: {
      color: colors.card,
      fontWeight: "600" as const,
    },

    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      color: colors.text,
      borderRadius: theme.radius.input,
      padding: 12,
    },
  };
}