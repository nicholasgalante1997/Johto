import React from 'react';
import type { DashboardLayoutProps } from './types';
import './DashboardLayout.css';

export function DashboardLayout({
  children,
  sidebar,
  header,
  showSidebar = true,
  sidebarCollapsed = false,
  onToggleSidebar,
  className = ''
}: DashboardLayoutProps) {
  const classNames = [
    'pokemon-dashboard-layout',
    !showSidebar && 'pokemon-dashboard-layout--no-sidebar',
    sidebarCollapsed && 'pokemon-dashboard-layout--sidebar-collapsed',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames}>
      {showSidebar && sidebar && (
        <div className="pokemon-dashboard-layout__sidebar">{sidebar}</div>
      )}
      <div className="pokemon-dashboard-layout__main">
        {header && (
          <div className="pokemon-dashboard-layout__header">{header}</div>
        )}
        <div className="pokemon-dashboard-layout__content">{children}</div>
      </div>
    </div>
  );
}
