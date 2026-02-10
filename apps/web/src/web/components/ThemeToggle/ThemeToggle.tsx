import { Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../../themes';
import type { ThemeToggleProps } from './types';
import './ThemeToggle.css';

export function ThemeToggle({
  className = '',
  showLabel = false
}: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();

  // Don't render interactive content until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div
        className={`theme-toggle theme-toggle--loading ${className}`}
        aria-hidden="true"
      >
        <span className="theme-toggle__icon">
          <Sparkles size={18} />
        </span>
      </div>
    );
  }

  const isNebula = theme === 'nebula';
  const label = isNebula ? 'Nebula' : 'Catppuccin';
  const Icon = isNebula ? Sparkles : Moon;

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isNebula ? 'Catppuccin' : 'Nebula'} theme`}
      title={`Current: ${label}. Click to switch.`}
    >
      <span className="theme-toggle__icon">
        <Icon size={18} />
      </span>
      {showLabel && <span className="theme-toggle__label">{label}</span>}
    </button>
  );
}
