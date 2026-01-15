export interface SearchFilters {
  query: string;
  type?: string;
  rarity?: string;
  set?: string;
}

export interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  placeholder?: string;
  showFilters?: boolean;
  loading?: boolean;
  className?: string;
}
