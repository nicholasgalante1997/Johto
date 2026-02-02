import type { RouteObject } from 'react-router';
import { Navigate } from 'react-router';

import CollectionPage from '../pages/CollectionPage';
import DecksPage from '../pages/DecksPage';
import DeckBuilderPage from '../pages/DeckBuilderPage';
import DeckDetailPage from '../pages/DeckDetailPage';

export const REACT_ROUTER_ROUTES: RouteObject[] = [
  {
    path: '/',
    index: true,
    element: <Navigate to="/decks" replace />
  },
  {
    path: '/decks',
    Component: DecksPage
  },
  {
    path: '/decks/new',
    Component: DeckBuilderPage
  },
  {
    path: '/decks/:deckId/edit',
    Component: DeckBuilderPage
  },
  {
    path: '/decks/:deckId',
    Component: DeckDetailPage
  },
  {
    path: '/collection/:cardId',
    Component: CollectionPage
  },
  {
    path: '/collection',
    Component: CollectionPage
  }
];
