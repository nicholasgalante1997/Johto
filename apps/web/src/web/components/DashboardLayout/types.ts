export interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  showSidebar?: boolean;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  className?: string;
}
