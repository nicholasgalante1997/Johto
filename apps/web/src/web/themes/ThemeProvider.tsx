import {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode
} from 'react';
import type { ThemeName, ThemeContextValue } from './types';
import { THEME_STORAGE_KEY, DEFAULT_THEME } from './types';

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
  /** Override the default theme (useful for testing) */
  defaultTheme?: ThemeName;
}

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeName>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // On mount, check localStorage for saved preference
  useEffect(() => {
    setMounted(true);

    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'nebula' || stored === 'catppuccin') {
      setThemeState(stored);
    }
  }, []);

  // Apply theme to document when it changes (only after mount to avoid hydration mismatch)
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme, mounted]);

  const setTheme = useCallback((newTheme: ThemeName) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'nebula' ? 'catppuccin' : 'nebula'));
  }, []);

  const value: ThemeContextValue = {
    theme,
    setTheme,
    toggleTheme,
    mounted
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
