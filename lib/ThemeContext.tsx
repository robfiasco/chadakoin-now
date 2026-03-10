import React, { createContext, useContext, useState } from 'react';
import { THEMES, Theme, ThemeId, DEFAULT_THEME_ID } from './themes';

interface ThemeContextValue {
  theme: Theme;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME_ID);
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];

  function cycleTheme() {
    const idx = THEMES.findIndex(t => t.id === themeId);
    const next = THEMES[(idx + 1) % THEMES.length];
    setThemeId(next.id);
  }

  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
