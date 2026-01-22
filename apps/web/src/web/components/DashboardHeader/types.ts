import type { SearchFilters } from '../SearchBar/types';

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface DashboardHeaderProps {
  title?: string;
  showSearch?: boolean;
  onSearch?: (filters: SearchFilters) => void;
  actions?: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
  onMenuClick?: () => void;
  pathname?: string;
}
