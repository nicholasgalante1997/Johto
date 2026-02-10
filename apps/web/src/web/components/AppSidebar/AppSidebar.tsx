import React from 'react';
import {
  Home,
  Library,
  Search,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ROUTES } from '@/web/routes';
import type { AppSidebarProps, NavItem } from './types';
import './AppSidebar.css';

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home size={20} />,
    to: ROUTES.DASHBOARD
  },
  {
    id: 'collection',
    label: 'My Collection',
    icon: <Library size={20} />,
    to: ROUTES.COLLECTION
  },
  {
    id: 'browse',
    label: 'Browse Cards',
    icon: <Search size={20} />,
    to: ROUTES.BROWSE
  },
  {
    id: 'decks',
    label: 'My Decks',
    icon: <Layers size={20} />,
    to: ROUTES.DECKS
  }
];

const isActive = false; // Placeholder for active route logic

export function AppSidebar({
  collapsed = false,
  onToggleCollapse,
  className = '',
  collectionCount,
  deckCount
}: AppSidebarProps) {
  const classNames = [
    'app-sidebar',
    collapsed && 'app-sidebar--collapsed',
    className
  ]
    .filter(Boolean)
    .join(' ');

  // Add counts to nav items dynamically
  const getItemCount = (itemId: string): number | undefined => {
    switch (itemId) {
      case 'collection':
        return collectionCount;
      case 'decks':
        return deckCount;
      default:
        return undefined;
    }
  };

  return (
    <aside className={classNames}>
      <div className="app-sidebar__header">
        <div className="app-sidebar__logo">
          <span className="app-sidebar__logo-icon">
            <Layers size={24} aria-hidden="true" />
          </span>
          {!collapsed && (
            <span className="app-sidebar__logo-text">Pokemon TCG</span>
          )}
        </div>
        {onToggleCollapse && (
          <button
            className="app-sidebar__toggle"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            type="button"
          >
            {collapsed ? (
              <ChevronRight size={20} aria-hidden="true" />
            ) : (
              <ChevronLeft size={20} aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      <nav className="app-sidebar__nav">
        <ul className="app-sidebar__list">
          {NAV_ITEMS.map((item) => {
            const count = getItemCount(item.id);
            return (
              <li key={item.id}>
                <a
                  href={item.to}
                  className={`app-sidebar__item ${isActive ? 'app-sidebar__item--active' : ''}`}
                >
                  <span className="app-sidebar__icon">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="app-sidebar__label">{item.label}</span>
                      {count !== undefined && (
                        <span className="app-sidebar__count">{count}</span>
                      )}
                    </>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
