import React from 'react';
import type { ButtonProps } from './types';
import './Button.css';

export function Button({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
}: ButtonProps) {
  const classNames = [
    'pokemon-button',
    `pokemon-button--${variant}`,
    `pokemon-button--${size}`,
    fullWidth && 'pokemon-button--full-width',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
