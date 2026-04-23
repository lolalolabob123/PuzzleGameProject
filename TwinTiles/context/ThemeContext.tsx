import React, { createContext, useContext, useState, ReactNode } from "react";
import { AVAILABLE_THEMES, GameTheme } from "../constants/themes";
import { uiThemes, UITheme } from "../constants/uiTheme";

type Ctx = {
  themeIndex: number;
  setTheme: (i: number) => void;
  theme: GameTheme;
  ui: UITheme;
};

const ThemeContext = createContext<Ctx | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeIndex, setThemeIndex] = useState(0);
  const theme = AVAILABLE_THEMES[themeIndex];
  const ui = uiThemes[theme.palette];

  return (
    <ThemeContext.Provider value={{ themeIndex, setTheme: setThemeIndex, theme, ui }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
};