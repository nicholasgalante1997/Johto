import type { ReactNode } from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  count?: number;
}

export interface SidebarProps {
  items: NavItem[];
  activeItemId?: string;
  onItemClick?: (item: NavItem) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}
