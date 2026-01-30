import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState
} from 'react';

/**
 * Catppuccin flavor variants
 */
export type CatppuccinFlavor = 'mocha' | 'macchiato' | 'frappe' | 'latte';

/**
 * Flavor metadata
 */
export const FLAVOR_META: Record<
  CatppuccinFlavor,
  { label: string; isDark: boolean }
> = {
  mocha: { label: 'Mocha', isDark: true },
  macchiato: { label: 'Macchiato', isDark: true },
  frappe: { label: 'Frappe', isDark: true },
  latte: { label: 'Latte', isDark: false }
};

export const FLAVORS: CatppuccinFlavor[] = [
  'mocha',
  'macchiato',
  'frappe',
  'latte'
];

const STORAGE_KEY = 'pokemon-tcg-theme';
const DEFAULT_FLAVOR: CatppuccinFlavor = 'mocha';
const THEME_LINK_ID = 'catppuccin-theme';

/**
 * Theme context value interface
 */
export interface ThemeContextValue {
  flavor: CatppuccinFlavor;
  isDark: boolean;
  setFlavor: (flavor: CatppuccinFlavor) => void;
  flavors: CatppuccinFlavor[];
  getFlavorMeta: (
    flavor: CatppuccinFlavor
  ) => { label: string; isDark: boolean };
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Get the stylesheet URL for a flavor
 */
function getThemeUrl(flavor: CatppuccinFlavor): string {
  return `/css/themes/catppuccin-${flavor}.css`;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

/**
 * Load or swap the theme stylesheet
 */
function loadThemeStylesheet(flavor: CatppuccinFlavor): void {
  if (!isBrowser()) return;

  const url = getThemeUrl(flavor);
  let link = window.document.getElementById(THEME_LINK_ID) as HTMLLinkElement | null;

  if (link) {
    // Update existing link
    link.href = url;
  } else {
    // Create new link element
    link = document.createElement('link');
    link.id = THEME_LINK_ID;
    link.rel = 'stylesheet';
    link.href = url;
    window.document.head.appendChild(link);
  }

  // Update data attribute on html element for CSS selectors
  window.document.documentElement.setAttribute('data-theme', flavor);
  window.document.documentElement.setAttribute(
    'data-theme-mode',
    FLAVOR_META[flavor].isDark ? 'dark' : 'light'
  );
}

/**
 * Get stored flavor from localStorage
 */
function getStoredFlavor(): CatppuccinFlavor {
  if (!isBrowser()) return DEFAULT_FLAVOR;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && FLAVORS.includes(stored as CatppuccinFlavor)) {
      return stored as CatppuccinFlavor;
    }
  } catch {
    // localStorage may be unavailable
  }

  return DEFAULT_FLAVOR;
}

/**
 * Store flavor to localStorage
 */
function storeFlavor(flavor: CatppuccinFlavor): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, flavor);
  } catch {
    // localStorage may be unavailable
  }
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultFlavor?: CatppuccinFlavor;
}

/**
 * Theme provider component
 */
export function ThemeProvider({
  children,
  defaultFlavor
}: ThemeProviderProps) {
  const [flavor, setFlavorState] = useState<CatppuccinFlavor>(() => {
    // Use provided default or try to get from storage
    return defaultFlavor || getStoredFlavor();
  });

  // Load theme stylesheet on mount and when flavor changes
  useEffect(() => {
    loadThemeStylesheet(flavor);
  }, [flavor]);

  const setFlavor = useCallback((newFlavor: CatppuccinFlavor) => {
    if (FLAVORS.includes(newFlavor)) {
      setFlavorState(newFlavor);
      storeFlavor(newFlavor);
    }
  }, []);

  const getFlavorMeta = useCallback(
    (f: CatppuccinFlavor) => FLAVOR_META[f],
    []
  );

  const value: ThemeContextValue = {
    flavor,
    isDark: FLAVOR_META[flavor].isDark,
    setFlavor,
    flavors: FLAVORS,
    getFlavorMeta
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook for components that may render outside provider
 */
export function useThemeOptional(): ThemeContextValue | null {
  return useContext(ThemeContext);
}
