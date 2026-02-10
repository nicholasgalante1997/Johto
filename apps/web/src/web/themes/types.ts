export type ThemeName = 'nebula' | 'catppuccin';

export interface ThemeContextValue {
  /** Current active theme */
  theme: ThemeName;
  /** Update the current theme */
  setTheme: (theme: ThemeName) => void;
  /** Toggle between themes */
  toggleTheme: () => void;
  /** Whether the component has mounted (for SSR hydration safety) */
  mounted: boolean;
}

export const THEME_STORAGE_KEY = 'pokemon-tcg-theme';
export const DEFAULT_THEME: ThemeName = 'nebula';
