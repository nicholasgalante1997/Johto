import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

import Document from './components/Document/Document';
import { DashboardLayout } from './components/DashboardLayout';
import { AppSidebar } from './components/AppSidebar';
import { DashboardHeader } from './components/DashboardHeader';
import { AppRoutes } from './routes';
import { CollectionProvider, useCollection } from './context/CollectionContext';
import { DeckProvider, useDecks } from './context/DeckContext';

function AppContent() {
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
      <AppRoutes />
    </DashboardLayout>
  );
}

function App() {
  return (
    <React.StrictMode>
      <Document
        description="Pokemon TCG Collection & Deck Manager"
        title="Pokemon TCG Dashboard"
      >
        <CollectionProvider>
          <DeckProvider>
            <AppContent />
          </DeckProvider>
        </CollectionProvider>
      </Document>
    </React.StrictMode>
  );
}

export default App;
