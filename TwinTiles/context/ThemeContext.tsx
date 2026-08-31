import React, { createContext, useContext, useMemo, ReactNode } from "react";
import { AVAILABLE_THEMES, GameTheme } from "../constants/themes";
import { uiThemes, UITheme } from "../constants/uiTheme";
import { useProfile } from "./ProfileContext";

type ThemeContextValue = {
  themeIndex: number;
  setTheme: (index: number) => Promise<void>;
  theme: GameTheme;
  ui: UITheme;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { profile, updateProfile } = useProfile();

  // Find theme index based on profile's saved theme ID (fallback to 0)
  const themeIndex = useMemo(() => {
    if (!profile?.equippedTheme) return 0;
    const idx = AVAILABLE_THEMES.findIndex((t) => t.id === profile.equippedTheme);
    return idx !== -1 ? idx : 0;
  }, [profile?.equippedTheme]);

  const theme = AVAILABLE_THEMES[themeIndex] || AVAILABLE_THEMES[0];
  const ui = uiThemes[theme.palette] || uiThemes.classic;

  const setTheme = async (index: number) => {
    const selectedTheme = AVAILABLE_THEMES[index];
    if (!selectedTheme || !profile) return;

    await updateProfile({
      ...profile,
      equippedTheme: selectedTheme.id,
    });
  };

  return (
    <ThemeContext.Provider value={{ themeIndex, setTheme, theme, ui }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
};