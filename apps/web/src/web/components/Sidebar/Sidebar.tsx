import React from 'react';
import type { SidebarProps } from './types';
import './Sidebar.css';

export function Sidebar({
  items,
  activeItemId,
  onItemClick,
  collapsed = false,
  onToggleCollapse,
  className = ''
}: SidebarProps) {
  const classNames = [
    'pokemon-sidebar',
    collapsed && 'pokemon-sidebar--collapsed',
    className
  ]
    .filter(Boolean)
    .join(' ');

  const handleItemClick = (item: (typeof items)[0]) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, item: (typeof items)[0]) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleItemClick(item);
    }
  };

  return (
    <aside className={classNames}>
      <div className="pokemon-sidebar__header">
        {!collapsed && <h2 className="pokemon-sidebar__title">Dashboard</h2>}
        {onToggleCollapse && (
          <button
            className="pokemon-sidebar__toggle"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '»' : '«'}
          </button>
        )}
      </div>

      <nav className="pokemon-sidebar__nav">
        <ul className="pokemon-sidebar__list">
          {items.map((item) => {
            const isActive = item.id === activeItemId;
            const itemClassNames = [
              'pokemon-sidebar__item',
              isActive && 'pokemon-sidebar__item--active'
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <li key={item.id}>
                <a
                  href={item.href || '#'}
                  className={itemClassNames}
                  onClick={(e) => {
                    if (onItemClick) {
                      e.preventDefault();
                      handleItemClick(item);
                    }
                  }}
                  onKeyDown={(e) => handleKeyDown(e, item)}
                  tabIndex={0}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.icon && (
                    <span className="pokemon-sidebar__icon">{item.icon}</span>
                  )}
                  {!collapsed && (
                    <>
                      <span className="pokemon-sidebar__label">
                        {item.label}
                      </span>
                      {item.count !== undefined && (
                        <span className="pokemon-sidebar__count">
                          {item.count}
                        </span>
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
