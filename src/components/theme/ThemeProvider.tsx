import { getThemeColors } from "@/lib/settingsStore";
import { createContext, ReactNode, useContext, useMemo } from "react";

const ThemeContext = createContext(getThemeColors());

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const colors = useMemo(() => getThemeColors(), []);

  return (
    <ThemeContext.Provider value={colors}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}