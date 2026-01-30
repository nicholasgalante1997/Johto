import React from 'react';
import { useTheme, type CatppuccinFlavor } from '../../contexts/Theme';
import './ThemeSwitcher.css';

export interface ThemeSwitcherProps {
  /** Display style variant */
  variant?: 'dropdown' | 'buttons' | 'compact';
  /** Show flavor labels */
  showLabels?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * Theme switcher component for selecting Catppuccin flavors
 */
export function ThemeSwitcher({
  variant = 'dropdown',
  showLabels = true,
  className = ''
}: ThemeSwitcherProps) {
  const { flavor, setFlavor, flavors, getFlavorMeta } = useTheme();

  if (variant === 'dropdown') {
    return (
      <div className={`theme-switcher theme-switcher--dropdown ${className}`}>
        {showLabels && (
          <label htmlFor="theme-select" className="theme-switcher__label">
            Theme
          </label>
        )}
        <select
          id="theme-select"
          className="theme-switcher__select"
          value={flavor}
          onChange={(e) => setFlavor(e.target.value as CatppuccinFlavor)}
        >
          {flavors.map((f) => (
            <option key={f} value={f}>
              {getFlavorMeta(f).label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className={`theme-switcher theme-switcher--buttons ${className}`}>
        {showLabels && (
          <span className="theme-switcher__label">Theme</span>
        )}
        <div className="theme-switcher__button-group">
          {flavors.map((f) => (
            <button
              key={f}
              type="button"
              className={`theme-switcher__button ${flavor === f ? 'theme-switcher__button--active' : ''}`}
              onClick={() => setFlavor(f)}
              aria-pressed={flavor === f}
            >
              {getFlavorMeta(f).label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Compact variant - just color swatches
  return (
    <div className={`theme-switcher theme-switcher--compact ${className}`}>
      {flavors.map((f) => (
        <button
          key={f}
          type="button"
          className={`theme-switcher__swatch theme-switcher__swatch--${f} ${flavor === f ? 'theme-switcher__swatch--active' : ''}`}
          onClick={() => setFlavor(f)}
          aria-label={`Switch to ${getFlavorMeta(f).label} theme`}
          aria-pressed={flavor === f}
          title={getFlavorMeta(f).label}
        />
      ))}
    </div>
  );
}

export default ThemeSwitcher;
