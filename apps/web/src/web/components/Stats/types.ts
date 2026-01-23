import type { ReactNode } from 'react';

export interface StatItem {
  id: string;
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export interface StatsProps {
  stats: StatItem[];
  layout?: 'grid' | 'row';
  columns?: 2 | 3 | 4;
  className?: string;
}
