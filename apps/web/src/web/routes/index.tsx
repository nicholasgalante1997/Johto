import React, { Suspense, lazy } from 'react';
import IsomorphicRouter, { type RouterLayerProps } from './RouterLayer';

// Lazy load pages for code splitting

// Loading fallback component
function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader__spinner" />
      <p>Loading...</p>
    </div>
  );
}

export function AppRoutes(props: RouterLayerProps) {
  return <IsomorphicRouter {...props} />;
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
  DECK_EDIT: (deckId: string) => `/decks/${deckId}/edit`
} as const;
