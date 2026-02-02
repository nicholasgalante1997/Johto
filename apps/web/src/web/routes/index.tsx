import React from 'react';
import IsomorphicRouter, { type RouterLayerProps } from './RouterLayer';

export function AppRoutes(props: RouterLayerProps) {
  return <IsomorphicRouter {...props} />;
}

// Route path constants for type-safe navigation
export const ROUTES = {
  HOME: '/',
  DECKS: '/decks',
  DECK_NEW: '/decks/new',
  DECK_DETAIL: (deckId: string) => `/decks/${deckId}`,
  DECK_EDIT: (deckId: string) => `/decks/${deckId}/edit`,
  COLLECTION: '/collection',
  COLLECTION_CARD: (cardId: string) => `/collection/${cardId}`
} as const;
