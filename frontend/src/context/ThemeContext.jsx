import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { THEME_CLAIR, THEME_SOMBRE } from '../config/valeurs.js';

const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);

const CLE = 'opqual_theme';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const sauve = localStorage.getItem(CLE);
    if (sauve) return sauve;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? THEME_SOMBRE : THEME_CLAIR;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === THEME_SOMBRE ? 'dark' : 'light');
    localStorage.setItem(CLE, theme);
  }, [theme]);

  const basculer = useCallback(() => setTheme((t) => (t === THEME_SOMBRE ? THEME_CLAIR : THEME_SOMBRE)), []);
  return <ThemeContext.Provider value={{ theme, sombre: theme === THEME_SOMBRE, setTheme, basculer }}>{children}</ThemeContext.Provider>;
}
