import React, { useEffect, useState } from 'react';

import Document from './components/Document/Document';

import { DashboardLayout } from './components/DashboardLayout';
import { AppSidebar } from './components/AppSidebar';
import { DashboardHeader } from './components/DashboardHeader';
import { AppRoutes } from './routes';
import { CollectionProvider, useCollection } from './contexts/Collection';
import { DeckProvider, useDecks } from './contexts/Deck';
import { ThemeProvider } from './contexts/Theme';
import type { RouterLayerProps } from './routes/types';
import { QueryProvider } from './providers';

export type AppProps = {
  routes: RouterLayerProps;
};

function AppContent(props: AppProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { uniqueCards } = useCollection();
  const { deckCount } = useDecks();

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <DashboardLayout
      sidebar={
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          collectionCount={uniqueCards}
          deckCount={deckCount}
        />
      }
      header={<DashboardHeader onMenuClick={handleToggleSidebar} />}
      sidebarCollapsed={sidebarCollapsed}
    >
      <AppRoutes {...props.routes} />
    </DashboardLayout>
  );
}

export function App(props: AppProps) {
  useEffect(() => {
    console.log(
      'Welcome to the Pokemon TCG Collection & Deck Manager!-React mounted on client'
    );
  }, []);
  return (
    <React.StrictMode>
      <ThemeProvider>
        <QueryProvider>
          <CollectionProvider>
            <DeckProvider>
              <AppContent routes={props.routes} />
            </DeckProvider>
          </CollectionProvider>
        </QueryProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

export function withDocument<P extends {} = React.JSX.IntrinsicAttributes>(
  App: React.ComponentType<P>
) {
  return function AppWithDocument(props: P) {
    return (
      <Document
        description="Pokemon TCG Collection & Deck Manager"
        title="Pokemon TCG Dashboard"
      >
        <App {...props} />
      </Document>
    );
  };
}
