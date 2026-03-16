import React, { createContext, useState, useContext } from 'react';
import { AVAILABLE_THEMES, GameTheme } from '../constants/themes';

const ThemeContext = createContext({
  theme: AVAILABLE_THEMES[0],
  themeIndex: 0,
  setTheme: (index: number) => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeIndex, setThemeIndex] = useState(0);

  return (
    <ThemeContext.Provider value={{ 
      theme: AVAILABLE_THEMES[themeIndex], 
      themeIndex, 
      setTheme: setThemeIndex 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);