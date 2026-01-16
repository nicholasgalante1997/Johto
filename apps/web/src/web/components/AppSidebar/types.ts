export interface NavItem {
  id: string;
  label: string;
  icon: string;
  to: string;
  count?: number;
}

export interface AppSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
  collectionCount?: number;
  deckCount?: number;
}
