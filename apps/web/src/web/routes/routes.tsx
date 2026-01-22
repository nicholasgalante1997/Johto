import type { RouteObject } from 'react-router';

import BrowsePage from '../pages/BrowsePage';
import CollectionPage from '../pages/CollectionPage';
import DashboardPage from '@/web/pages/DashboardPage';
import DecksPage from '../pages/DecksPage';
import DeckBuilderPage from '../pages/DeckBuilderPage';
import DeckDetailPage from '../pages/DeckDetailPage';

export const REACT_ROUTER_ROUTES: RouteObject[] = [
  {
    path: '/',
    index: true,
    Component: DashboardPage
  },
  {
    path: '/browse/:cardId',
    Component: BrowsePage
  },
  {
    path: '/browse',
    Component: BrowsePage
  },
  {
    path: '/collection/:cardId',
    Component: CollectionPage
  },
  {
    path: '/collection',
    Component: CollectionPage
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
    Component: DeckDetailPage
  },
  {
    path: '/decks/:deckId',
    Component: DeckDetailPage
  }
];
