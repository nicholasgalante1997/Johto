import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load pages for code splitting
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const CollectionPage = lazy(() => import('../pages/CollectionPage'));
const BrowsePage = lazy(() => import('../pages/BrowsePage'));
const DecksPage = lazy(() => import('../pages/DecksPage'));
const DeckDetailPage = lazy(() => import('../pages/DeckDetailPage'));
const DeckBuilderPage = lazy(() => import('../pages/DeckBuilderPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader__spinner" />
      <p>Loading...</p>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/collection" element={<CollectionPage />} />
        <Route path="/collection/:cardId" element={<CollectionPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/browse/:cardId" element={<BrowsePage />} />
        <Route path="/decks" element={<DecksPage />} />
        <Route path="/decks/new" element={<DeckBuilderPage />} />
        <Route path="/decks/:deckId" element={<DeckDetailPage />} />
        <Route path="/decks/:deckId/edit" element={<DeckBuilderPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

// Route path constants for type-safe navigation
export const ROUTES = {
  DASHBOARD: '/',
  COLLECTION: '/collection',
  COLLECTION_CARD: (cardId: string) => `/collection/${cardId}`,
  BROWSE: '/browse',
  BROWSE_CARD: (cardId: string) => `/browse/${cardId}`,
  DECKS: '/decks',
  DECK_NEW: '/decks/new',
  DECK_DETAIL: (deckId: string) => `/decks/${deckId}`,
  DECK_EDIT: (deckId: string) => `/decks/${deckId}/edit`,
} as const;
