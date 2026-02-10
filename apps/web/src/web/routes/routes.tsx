import type { RouteObject } from 'react-router';
import { Navigate } from 'react-router';

import BrowsePage from '../pages/BrowsePage';
import CollectionPage from '../pages/CollectionPage';
import DashboardPage from '../pages/DashboardPage';
import DecksPage from '../pages/DecksPage';
import DeckBuilderPage from '../pages/DeckBuilderPage';
import DeckDetailPage from '../pages/DeckDetailPage';

export const REACT_ROUTER_ROUTES: RouteObject[] = [
  {
    path: '/',
    index: true,
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: '/browse',
    Component: BrowsePage
  },
  {
    path: '/dashboard',
    Component: DashboardPage
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
