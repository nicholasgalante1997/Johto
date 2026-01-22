# Pokemon TCG Dashboard - Specification Document

## Overview

This specification outlines the development of a comprehensive Pokemon TCG Dashboard for managing card collections and decks across different standard formats. The dashboard will be built using React 19 with SSR via Bun runtime, leveraging existing components and infrastructure.

**Version**: 1.0.0
**Last Updated**: 2024
**Status**: Draft

---

## Table of Contents

1. [Project Goals](#project-goals)
2. [Current State Analysis](#current-state-analysis)
3. [Architecture Overview](#architecture-overview)
4. [Route Structure](#route-structure)
5. [Phase 1: Routing & Layout Infrastructure](#phase-1-routing--layout-infrastructure)
6. [Phase 2: Dashboard Home & Collection Pages](#phase-2-dashboard-home--collection-pages)
7. [Phase 3: Deck Management System](#phase-3-deck-management-system)
8. [Phase 4: Deck Builder Interface](#phase-4-deck-builder-interface)
9. [Phase 5: Format Support & Validation](#phase-5-format-support--validation)
10. [Phase 6: Data Layer & API Integration](#phase-6-data-layer--api-integration)
11. [Phase 7: Polish & Optimization](#phase-7-polish--optimization)
12. [Component Inventory](#component-inventory)
13. [Data Models](#data-models)
14. [API Endpoints](#api-endpoints)

---

## Project Goals

### Primary Objectives

1. **Collection Management**: Allow users to browse, search, and organize their Pokemon card collection
2. **Deck Building**: Enable creation and editing of decks with drag-and-drop card selection
3. **Format Support**: Support multiple Pokemon TCG formats (Standard, Expanded, Unlimited, etc.)
4. **Deck Validation**: Validate decks against format rules (60 cards, 4-of rule, Basic Pokemon requirement)
5. **Responsive Design**: Mobile-first responsive design for all views
6. **SSR Performance**: Fast initial page loads with server-side rendering

### Non-Goals (v1.0)

- User authentication (will use local storage initially)
- Trading functionality
- Price tracking/market data
- Social features (sharing decks)
- Import/Export (future consideration)

---

## Current State Analysis

### Existing Components (Ready to Use)

| Component         | Location                      | Status            | Notes                                   |
| ----------------- | ----------------------------- | ----------------- | --------------------------------------- |
| `DashboardLayout` | `components/DashboardLayout/` | Ready             | Accepts sidebar, header, children slots |
| `Sidebar`         | `components/Sidebar/`         | Ready             | Collapsible, supports icons and counts  |
| `Header`          | `components/Header/`          | Needs Enhancement | Basic implementation, needs user menu   |
| `Card`            | `components/Card/`            | Ready             | Grid/list/detail variants               |
| `CardGrid`        | `components/CardGrid/`        | Ready             | Loading/empty states, column control    |
| `DeckCard`        | `components/DeckCard/`        | Ready             | Edit/delete actions, validity indicator |
| `DeckList`        | `components/DeckList/`        | Ready             | Grid/list layouts, create action        |
| `SearchBar`       | `components/SearchBar/`       | Ready             | Type/rarity/set filters                 |
| `Stats`           | `components/Stats/`           | Ready             | Trend indicators, color variants        |
| `Badge`           | `components/Badge/`           | Ready             | Type and rarity styling                 |
| `Button`          | `components/Button/`          | Ready             | Primary/secondary/ghost/danger          |
| `Document`        | `components/Document/`        | Ready             | HTML document wrapper                   |

### Existing Infrastructure

- **REST API**: `/api/v1/cards`, `/api/v1/sets` with pagination
- **GraphQL**: Schema defined but limited resolvers
- **Database**: SQLite with `pokemon_cards` and `sets` tables
- **SSR**: `renderWebApp()` with streaming support
- **Static Files**: CSS and assets served from `/public/`

### Components to Build

| Component         | Priority | Purpose                         |
| ----------------- | -------- | ------------------------------- |
| `DashboardHeader` | P0       | Enhanced header with navigation |
| `CollectionView`  | P0       | Collection browsing interface   |
| `DeckBuilder`     | P1       | Deck editing interface          |
| `CardDetail`      | P1       | Full card detail modal/page     |
| `FormatSelector`  | P1       | Format dropdown/tabs            |
| `DeckValidator`   | P1       | Deck validation display         |
| `Pagination`      | P2       | Page navigation                 |
| `FilterPanel`     | P2       | Advanced filtering sidebar      |
| `Toast`           | P2       | Notification system             |
| `Modal`           | P2       | Reusable modal component        |
| `EmptyState`      | P2       | Consistent empty states         |
| `Skeleton`        | P2       | Loading skeletons               |

> **Note**: Routing is handled by `react-router-dom` - no custom router component needed.

---

## Architecture Overview

### Client-Side Architecture

```
src/web/
├── App.tsx                    # Root app with react-router Routes
├── browser/
│   └── index.tsx              # Hydration entry with BrowserRouter
├── components/                 # Reusable UI components
│   ├── [Existing...]
│   ├── DashboardHeader/        # Enhanced header
│   ├── CardDetail/             # Card detail modal
│   ├── DeckBuilder/            # Deck building interface
│   ├── FormatSelector/         # Format selection
│   ├── Pagination/             # Page navigation
│   ├── Modal/                  # Modal wrapper
│   └── Toast/                  # Notifications
├── pages/                      # Route-level components
│   ├── DashboardPage.tsx       # Dashboard home
│   ├── CollectionPage.tsx      # Card collection
│   ├── DecksPage.tsx           # Deck list
│   ├── DeckDetailPage.tsx      # Single deck view
│   ├── DeckBuilderPage.tsx     # Deck editor
│   ├── BrowsePage.tsx          # Browse all cards
│   ├── NotFoundPage.tsx        # 404 page
│   └── ServerErrorPage.tsx     # Error page
├── hooks/                      # Custom React hooks
│   ├── useCards.ts             # Card fetching
│   ├── useDecks.ts             # Deck CRUD operations
│   ├── useCollection.ts        # Collection management
│   └── useLocalStorage.ts      # Persistence
├── context/                    # React context providers
│   ├── CollectionContext.tsx   # Collection state
│   └── DeckContext.tsx         # Deck editing state
├── routes/                     # Route configuration
│   └── index.tsx               # Route definitions using react-router
├── utils/                      # Utility functions
│   ├── format-rules.ts         # Format validation rules
│   ├── deck-validator.ts       # Deck validation logic
│   └── storage.ts              # LocalStorage helpers
└── types/                      # TypeScript types
    ├── deck.ts                 # Deck types
    └── collection.ts           # Collection types
```

> **Routing**: Uses `react-router-dom` v6 with `BrowserRouter` for client-side and `StaticRouter` for SSR.

### State Management Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      App Root                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  BrowserRouter (react-router-dom)                        │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  CollectionProvider (owned cards, localStorage)     │ │ │
│  │  │  ┌─────────────────────────────────────────────────┐ │ │ │
│  │  │  │  DeckProvider (deck list, current deck)        │ │ │ │
│  │  │  │  ┌─────────────────────────────────────────────┐ │ │ │ │
│  │  │  │  │  Routes & Page Components                  │ │ │ │ │
│  │  │  │  └─────────────────────────────────────────────┘ │ │ │ │
│  │  │  └─────────────────────────────────────────────────┘ │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**React Router Hooks Used**:

- `useNavigate()` - Programmatic navigation
- `useParams()` - Access route parameters (`:deckId`, `:cardId`)
- `useSearchParams()` - Access and modify query parameters
- `useLocation()` - Access current location object
- `NavLink` - Navigation links with active state styling

---

## Route Structure

### Route Definitions

| Route                 | Page Component           | Description                        |
| --------------------- | ------------------------ | ---------------------------------- |
| `/`                   | `DashboardPage`          | Dashboard home with overview stats |
| `/collection`         | `CollectionPage`         | User's card collection             |
| `/collection/:cardId` | `CollectionPage` + Modal | Card detail overlay                |
| `/browse`             | `BrowsePage`             | Browse all available cards         |
| `/browse/:cardId`     | `BrowsePage` + Modal     | Card detail overlay                |
| `/decks`              | `DecksPage`              | List of user's decks               |
| `/decks/new`          | `DeckBuilderPage`        | Create new deck                    |
| `/decks/:deckId`      | `DeckDetailPage`         | View deck details                  |
| `/decks/:deckId/edit` | `DeckBuilderPage`        | Edit existing deck                 |

### URL Parameters

```typescript
// Route params
interface RouteParams {
  cardId?: string; // Pokemon card ID (e.g., "base1-4")
  deckId?: string; // Deck UUID
}

// Query params
interface QueryParams {
  q?: string; // Search query
  type?: string; // Pokemon type filter
  rarity?: string; // Rarity filter
  set?: string; // Set filter
  format?: string; // Format filter (standard, expanded, unlimited)
  page?: number; // Pagination
  view?: 'grid' | 'list'; // View mode
}
```

---

## Phase 1: Routing & Layout Infrastructure

### Objective

Establish client-side routing using `react-router-dom` and enhance the dashboard layout for multi-page navigation.

### Dependencies

```bash
# Install react-router-dom
bun add react-router react-router-dom
bun add -D @types/react-router @types/react-router-dom  # if needed for types
```

### Deliverables

#### 1.1 React Router Setup

**Package**: `react-router-dom` v6.x

React Router provides all routing functionality out of the box:

- `BrowserRouter` - Client-side routing with HTML5 history API
- `StaticRouter` - Server-side rendering support
- `Routes` / `Route` - Declarative route definitions
- `Link` / `NavLink` - Navigation components
- Hooks: `useNavigate`, `useParams`, `useSearchParams`, `useLocation`

#### 1.2 Route Configuration

**File**: `src/web/routes/index.tsx`

```typescript
import { Routes, Route } from 'react-router-dom';

// Lazy load pages for code splitting
import { lazy, Suspense } from 'react';

const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const CollectionPage = lazy(() => import('../pages/CollectionPage'));
const BrowsePage = lazy(() => import('../pages/BrowsePage'));
const DecksPage = lazy(() => import('../pages/DecksPage'));
const DeckDetailPage = lazy(() => import('../pages/DeckDetailPage'));
const DeckBuilderPage = lazy(() => import('../pages/DeckBuilderPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

export function AppRoutes() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
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
```

#### 1.3 Client-Side Entry Point (Hydration)

**File**: `src/web/browser/index.tsx`

```typescript
import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from '../App';

hydrateRoot(
  document,
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```

#### 1.4 Server-Side Rendering

**File**: `src/server/lib/web/utils/render.tsx`

```typescript
import React from 'react';
import { renderToReadableStream, renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';

import App from '../../../../web/App';
import ServerErrorPage from '../../../../web/pages/ServerErrorPage';

export async function renderWebApp(request: Request) {
  const url = new URL(request.url);

  const bundle = await getBrowserJavascriptBundle();
  if (!bundle) {
    return new Response(
      renderToString(
        <ServerErrorPage error={new Error('Missing Web Assets')} />
      ),
      {
        status: 500,
        statusText: 'Internal Server Error',
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }

  const stream = await renderToReadableStream(
    <StaticRouter location={url.pathname + url.search}>
      <App />
    </StaticRouter>,
    {
      bootstrapScriptContent: `window.__INITIAL_STATE__ = ${JSON.stringify({})}`,
      bootstrapModules: [bundle]
    }
  );

  return new Response(stream, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
```

#### 1.5 Updated App.tsx

**File**: `src/web/App.tsx`

```typescript
import React from 'react';
import { useLocation } from 'react-router-dom';

import Document from './components/Document/Document';
import { DashboardLayout } from './components/DashboardLayout';
import { AppSidebar } from './components/AppSidebar';
import { DashboardHeader } from './components/DashboardHeader';
import { AppRoutes } from './routes';

function App() {
  const location = useLocation();

  return (
    <React.StrictMode>
      <Document
        description="Pokemon TCG Collection & Deck Manager"
        title="Pokemon TCG Dashboard"
      >
        <DashboardLayout
          sidebar={<AppSidebar currentPath={location.pathname} />}
          header={<DashboardHeader />}
        >
          <AppRoutes />
        </DashboardLayout>
      </Document>
    </React.StrictMode>
  );
}

export default App;
```

#### 1.6 App Sidebar with NavLink

**File**: `src/web/components/AppSidebar/AppSidebar.tsx`

```typescript
import React from 'react';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../routes';
import './AppSidebar.css';

interface AppSidebarProps {
  currentPath: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', to: ROUTES.DASHBOARD },
  { id: 'collection', label: 'My Collection', icon: '📚', to: ROUTES.COLLECTION },
  { id: 'browse', label: 'Browse Cards', icon: '🔍', to: ROUTES.BROWSE },
  { id: 'decks', label: 'My Decks', icon: '🎴', to: ROUTES.DECKS },
];

export function AppSidebar({ collapsed = false, onToggleCollapse }: AppSidebarProps) {
  return (
    <aside className={`app-sidebar ${collapsed ? 'app-sidebar--collapsed' : ''}`}>
      <div className="app-sidebar__header">
        {!collapsed && <h2 className="app-sidebar__title">Dashboard</h2>}
        {onToggleCollapse && (
          <button
            className="app-sidebar__toggle"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '»' : '«'}
          </button>
        )}
      </div>

      <nav className="app-sidebar__nav">
        <ul className="app-sidebar__list">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `app-sidebar__item ${isActive ? 'app-sidebar__item--active' : ''}`
                }
              >
                <span className="app-sidebar__icon">{item.icon}</span>
                {!collapsed && (
                  <span className="app-sidebar__label">{item.label}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
```

#### 1.7 Enhanced Dashboard Header

**File**: `src/web/components/DashboardHeader/DashboardHeader.tsx`

```typescript
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SearchBar } from '../SearchBar';
import { ROUTES } from '../../routes';
import type { DashboardHeaderProps, Breadcrumb } from './types';
import './DashboardHeader.css';

export function DashboardHeader({
  title,
  showSearch = false,
  onSearch,
  actions,
  breadcrumbs,
}: DashboardHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Auto-generate breadcrumbs from current path if not provided
  const defaultBreadcrumbs = generateBreadcrumbs(location.pathname);
  const displayBreadcrumbs = breadcrumbs || defaultBreadcrumbs;

  return (
    <header className="dashboard-header">
      <div className="dashboard-header__left">
        <Link to={ROUTES.DASHBOARD} className="dashboard-header__logo">
          <span className="dashboard-header__logo-icon">🎴</span>
          <span className="dashboard-header__logo-text">Pokemon TCG</span>
        </Link>

        {displayBreadcrumbs.length > 0 && (
          <nav className="dashboard-header__breadcrumbs" aria-label="Breadcrumb">
            <ol>
              {displayBreadcrumbs.map((crumb, index) => (
                <li key={crumb.href || index}>
                  {crumb.href ? (
                    <Link to={crumb.href}>{crumb.label}</Link>
                  ) : (
                    <span aria-current="page">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>

      <div className="dashboard-header__center">
        {showSearch && onSearch && (
          <SearchBar onSearch={onSearch} placeholder="Search cards..." />
        )}
        {title && <h1 className="dashboard-header__title">{title}</h1>}
      </div>

      <div className="dashboard-header__right">
        {actions}
      </div>
    </header>
  );
}

function generateBreadcrumbs(pathname: string): Breadcrumb[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: Breadcrumb[] = [];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = segment.charAt(0).toUpperCase() + segment.slice(1);
    breadcrumbs.push({
      label,
      href: currentPath === pathname ? undefined : currentPath,
    });
  }

  return breadcrumbs;
}
```

**File**: `src/web/components/DashboardHeader/types.ts`

```typescript
import type { SearchFilters } from '../SearchBar/types';

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface DashboardHeaderProps {
  title?: string;
  showSearch?: boolean;
  onSearch?: (filters: SearchFilters) => void;
  actions?: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
}
```

#### 1.8 Server-Side Route Handling

**File**: `src/server/lib/handleRequest.ts`

```typescript
import { renderWebApp } from './web/utils/render';
import {
  handleStaticFileRequest,
  isRequestForStaticFile
} from './renderStaticFile';
import { handleApiRequest } from './api';

// All frontend routes that should render the React app
const WEB_ROUTE_PATTERNS = [
  /^\/$/, // Dashboard
  /^\/collection(\/.*)?$/, // Collection and card detail
  /^\/browse(\/.*)?$/, // Browse and card detail
  /^\/decks$/, // Deck list
  /^\/decks\/new$/, // New deck
  /^\/decks\/[^\/]+$/, // Deck detail
  /^\/decks\/[^\/]+\/edit$/ // Edit deck
];

function isWebRoute(pathname: string): boolean {
  return WEB_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

export async function handleRequest(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Check if this is an API request
  if (path.startsWith('/api/v1/')) {
    return handleApiRequest(request);
  }

  // Check if this is a web route (render React app)
  if (isWebRoute(path)) {
    return renderWebApp(request);
  }

  // Check for static files
  if (await isRequestForStaticFile(request)) {
    return handleStaticFileRequest(request);
  }

  // 404 - Let React Router handle it by rendering the app
  return renderWebApp(request);
}
```

**File**: `src/server/lib/routes.ts`

```typescript
// Web routes handled by React Router
export const WEB_ROUTES = [
  '/',
  '/collection',
  '/collection/:cardId',
  '/browse',
  '/browse/:cardId',
  '/decks',
  '/decks/new',
  '/decks/:deckId',
  '/decks/:deckId/edit'
];

// API routes
export const API_ROUTES = [
  '/api/v1/cards',
  '/api/v1/cards/:id',
  '/api/v1/sets',
  '/api/v1/sets/:id',
  '/api/v1/sets/:id/cards'
];

/**
 * Check if a pathname is an API route
 */
export function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/v1/');
}
```

#### 1.9 Not Found Page

**File**: `src/web/pages/NotFoundPage.tsx`

```typescript
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { ROUTES } from '../routes';

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-page__content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <div className="not-found-page__actions">
          <Button variant="primary" onClick={() => navigate(ROUTES.DASHBOARD)}>
            Go to Dashboard
          </Button>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
```

#### 1.10 Page Shell Components

Create placeholder page components that will be fully implemented in Phase 2+:

**File**: `src/web/pages/DashboardPage.tsx`

```typescript
import React from 'react';

function DashboardPage() {
  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>
      <p>Welcome to Pokemon TCG Manager</p>
    </div>
  );
}

export default DashboardPage;
```

**File**: `src/web/pages/CollectionPage.tsx`

```typescript
import React from 'react';
import { useParams } from 'react-router-dom';

function CollectionPage() {
  const { cardId } = useParams<{ cardId?: string }>();

  return (
    <div className="collection-page">
      <h1>My Collection</h1>
      {cardId && <p>Viewing card: {cardId}</p>}
    </div>
  );
}

export default CollectionPage;
```

**File**: `src/web/pages/BrowsePage.tsx`

```typescript
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

function BrowsePage() {
  const { cardId } = useParams<{ cardId?: string }>();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');

  return (
    <div className="browse-page">
      <h1>Browse Cards</h1>
      {query && <p>Searching for: {query}</p>}
      {cardId && <p>Viewing card: {cardId}</p>}
    </div>
  );
}

export default BrowsePage;
```

**File**: `src/web/pages/DecksPage.tsx`

```typescript
import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../routes';

function DecksPage() {
  return (
    <div className="decks-page">
      <h1>My Decks</h1>
      <Link to={ROUTES.DECK_NEW}>Create New Deck</Link>
    </div>
  );
}

export default DecksPage;
```

**File**: `src/web/pages/DeckDetailPage.tsx`

```typescript
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ROUTES } from '../routes';

function DeckDetailPage() {
  const { deckId } = useParams<{ deckId: string }>();

  return (
    <div className="deck-detail-page">
      <h1>Deck Details</h1>
      <p>Deck ID: {deckId}</p>
      <Link to={ROUTES.DECK_EDIT(deckId!)}>Edit Deck</Link>
    </div>
  );
}

export default DeckDetailPage;
```

**File**: `src/web/pages/DeckBuilderPage.tsx`

```typescript
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';

function DeckBuilderPage() {
  const { deckId } = useParams<{ deckId?: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(deckId);

  return (
    <div className="deck-builder-page">
      <h1>{isEditing ? 'Edit Deck' : 'Create New Deck'}</h1>
      {isEditing && <p>Editing deck: {deckId}</p>}
      <button onClick={() => navigate(ROUTES.DECKS)}>Cancel</button>
    </div>
  );
}

export default DeckBuilderPage;
```

### Acceptance Criteria

- [ ] `react-router-dom` is installed and configured
- [ ] Client-side navigation works without full page reload
- [ ] Browser back/forward buttons work correctly
- [ ] Direct URL access renders correct page via SSR (StaticRouter)
- [ ] Route parameters are correctly parsed via `useParams()`
- [ ] Query parameters work via `useSearchParams()`
- [ ] Active route is highlighted in sidebar using `NavLink`
- [ ] 404 page displays for unknown routes
- [ ] Code splitting works with lazy-loaded pages
- [ ] Breadcrumb navigation generates automatically

### Files to Create/Modify

| File                                                     | Action                        |
| -------------------------------------------------------- | ----------------------------- |
| `package.json`                                           | Modify (add react-router-dom) |
| `src/web/routes/index.tsx`                               | Create                        |
| `src/web/browser/index.tsx`                              | Modify                        |
| `src/web/App.tsx`                                        | Modify                        |
| `src/web/components/AppSidebar/index.ts`                 | Create                        |
| `src/web/components/AppSidebar/AppSidebar.tsx`           | Create                        |
| `src/web/components/AppSidebar/AppSidebar.css`           | Create                        |
| `src/web/components/DashboardHeader/index.ts`            | Create                        |
| `src/web/components/DashboardHeader/DashboardHeader.tsx` | Create                        |
| `src/web/components/DashboardHeader/types.ts`            | Create                        |
| `src/web/components/DashboardHeader/DashboardHeader.css` | Create                        |
| `src/web/pages/DashboardPage.tsx`                        | Create                        |
| `src/web/pages/CollectionPage.tsx`                       | Create                        |
| `src/web/pages/BrowsePage.tsx`                           | Create                        |
| `src/web/pages/DecksPage.tsx`                            | Create                        |
| `src/web/pages/DeckDetailPage.tsx`                       | Create                        |
| `src/web/pages/DeckBuilderPage.tsx`                      | Create                        |
| `src/web/pages/NotFoundPage.tsx`                         | Create                        |
| `src/server/lib/web/utils/render.tsx`                    | Modify                        |
| `src/server/lib/handleRequest.ts`                        | Modify                        |
| `src/server/lib/routes.ts`                               | Modify                        |

### React Router Quick Reference

```typescript
// Navigation
import { Link, NavLink, useNavigate } from 'react-router-dom';

// Link - Basic navigation
<Link to="/decks">View Decks</Link>

// NavLink - Navigation with active state
<NavLink
  to="/collection"
  className={({ isActive }) => isActive ? 'active' : ''}
>
  Collection
</NavLink>

// Programmatic navigation
const navigate = useNavigate();
navigate('/decks');           // Push
navigate('/decks', { replace: true });  // Replace
navigate(-1);                 // Go back

// Route parameters
import { useParams } from 'react-router-dom';
const { deckId } = useParams<{ deckId: string }>();

// Query parameters
import { useSearchParams } from 'react-router-dom';
const [searchParams, setSearchParams] = useSearchParams();
const query = searchParams.get('q');
setSearchParams({ q: 'charizard', type: 'fire' });

// Current location
import { useLocation } from 'react-router-dom';
const location = useLocation();
// location.pathname, location.search, location.state
```

---

## Phase 2: Dashboard Home & Collection Pages

### Objective

Build the main dashboard overview and collection management pages.

### Deliverables

#### 2.1 Dashboard Home Page

**File**: `src/web/pages/DashboardPage.tsx`

**Features**:

- Collection statistics (total cards, unique cards, by type)
- Recent activity summary
- Quick actions (add cards, create deck, browse)
- Deck overview with format breakdown
- Featured/favorite cards display

**Layout**:

```
┌─────────────────────────────────────────────────────────────┐
│  DashboardHeader                                             │
├─────────────────────────────────────────────────────────────┤
│  Stats Grid (4 columns)                                      │
│  ┌──────────┬──────────┬──────────┬──────────┐              │
│  │ Total    │ Unique   │ Decks    │ Format   │              │
│  │ Cards    │ Cards    │ Created  │ Ready    │              │
│  └──────────┴──────────┴──────────┴──────────┘              │
├─────────────────────────────────────────────────────────────┤
│  Quick Actions                                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ Browse Cards │ │ Create Deck  │ │ My Collection│         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  Recent Decks (horizontal scroll)                            │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│  │ Deck 1 │ │ Deck 2 │ │ Deck 3 │ │ Deck 4 │               │
│  └────────┘ └────────┘ └────────┘ └────────┘               │
├─────────────────────────────────────────────────────────────┤
│  Collection by Type (pie/bar chart or type badges)           │
└─────────────────────────────────────────────────────────────┘
```

#### 2.2 Collection Page

**File**: `src/web/pages/CollectionPage.tsx`

**Features**:

- Grid/list view toggle
- Search and filter functionality
- Sort options (name, type, set, rarity, quantity)
- Pagination
- Card quantity management (+/- controls)
- Card detail modal on click
- Bulk actions (select multiple, remove)

**Layout**:

```
┌─────────────────────────────────────────────────────────────┐
│  DashboardHeader (title: "My Collection")                    │
├─────────────────────────────────────────────────────────────┤
│  Toolbar                                                     │
│  ┌─────────────────────────┐ ┌─────┐ ┌─────┐ ┌─────────┐   │
│  │ Search...               │ │Grid │ │List │ │ Sort ▼  │   │
│  └─────────────────────────┘ └─────┘ └─────┘ └─────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Filter Tags (active filters shown)                          │
│  [Type: Fire ×] [Rarity: Rare ×] [Clear All]                │
├─────────────────────────────────────────────────────────────┤
│  Card Grid                                                   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │        │ │        │ │        │ │        │ │        │   │
│  │ Card 1 │ │ Card 2 │ │ Card 3 │ │ Card 4 │ │ Card 5 │   │
│  │  ×2    │ │  ×1    │ │  ×4    │ │  ×1    │ │  ×3    │   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │
│  ... more rows ...                                          │
├─────────────────────────────────────────────────────────────┤
│  Pagination                                                  │
│  ← 1 2 3 ... 10 →                                           │
└─────────────────────────────────────────────────────────────┘
```

#### 2.3 Browse Page

**File**: `src/web/pages/BrowsePage.tsx`

**Features**:

- Browse all available cards (not just owned)
- Same search/filter as collection
- "Add to Collection" action on each card
- Set browser with expansion selection
- View by set or all cards

**Differences from Collection**:

- No quantity display
- "Add to Collection" instead of +/- controls
- Can filter by sets not in collection

#### 2.4 Card Detail Component

**File**: `src/web/components/CardDetail/CardDetail.tsx`

```typescript
interface CardDetailProps {
  card: Pokemon.Card;
  onClose: () => void;
  onAddToCollection?: (card: Pokemon.Card) => void;
  onAddToDeck?: (card: Pokemon.Card) => void;
  collectionQuantity?: number;
  isModal?: boolean;
}
```

**Features**:

- Large card image
- Full card information (HP, types, attacks, abilities)
- Set information and rarity
- Legality information by format
- Evolution chain links
- Collection controls
- "Add to Deck" action (context-aware)

#### 2.5 Collection Context & Hook

**File**: `src/web/context/CollectionContext.tsx`

```typescript
interface CollectionCard {
  cardId: string;
  quantity: number;
  dateAdded: string;
}

interface CollectionContextValue {
  cards: CollectionCard[];
  totalCards: number;
  uniqueCards: number;
  addCard: (cardId: string, quantity?: number) => void;
  removeCard: (cardId: string, quantity?: number) => void;
  setQuantity: (cardId: string, quantity: number) => void;
  getQuantity: (cardId: string) => number;
  hasCard: (cardId: string) => boolean;
  clear: () => void;
}
```

**File**: `src/web/hooks/useCollection.ts`

```typescript
function useCollection(): CollectionContextValue;
```

#### 2.6 Pagination Component

**File**: `src/web/components/Pagination/Pagination.tsx`

```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
}
```

#### 2.7 Modal Component

**File**: `src/web/components/Modal/Modal.tsx`

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

### Acceptance Criteria

- [ ] Dashboard displays accurate collection statistics
- [ ] Collection page shows all owned cards with quantities
- [ ] Search filters cards in real-time
- [ ] Type/rarity/set filters work correctly
- [ ] Grid and list views toggle properly
- [ ] Pagination works with filtered results
- [ ] Card quantities can be adjusted
- [ ] Card detail modal opens on card click
- [ ] Browse page shows all available cards
- [ ] "Add to Collection" updates collection state
- [ ] Collection persists in localStorage

### Files to Create/Modify

| File                                           | Action |
| ---------------------------------------------- | ------ |
| `src/web/pages/DashboardPage.tsx`              | Create |
| `src/web/pages/CollectionPage.tsx`             | Create |
| `src/web/pages/BrowsePage.tsx`                 | Create |
| `src/web/components/CardDetail/index.ts`       | Create |
| `src/web/components/CardDetail/CardDetail.tsx` | Create |
| `src/web/components/CardDetail/types.ts`       | Create |
| `src/web/components/CardDetail/CardDetail.css` | Create |
| `src/web/components/Pagination/index.ts`       | Create |
| `src/web/components/Pagination/Pagination.tsx` | Create |
| `src/web/components/Pagination/types.ts`       | Create |
| `src/web/components/Pagination/Pagination.css` | Create |
| `src/web/components/Modal/index.ts`            | Create |
| `src/web/components/Modal/Modal.tsx`           | Create |
| `src/web/components/Modal/types.ts`            | Create |
| `src/web/components/Modal/Modal.css`           | Create |
| `src/web/context/CollectionContext.tsx`        | Create |
| `src/web/hooks/useCollection.ts`               | Create |
| `src/web/hooks/useLocalStorage.ts`             | Create |

---

## Phase 3: Deck Management System

### Objective

Build deck listing, viewing, and CRUD operations.

### Deliverables

#### 3.1 Decks Page

**File**: `src/web/pages/DecksPage.tsx`

**Features**:

- Grid of deck cards (using existing `DeckList` component)
- Create new deck button
- Filter by format (Standard, Expanded, Unlimited)
- Sort by name, date modified, validity
- Edit/delete actions on each deck

**Layout**:

```
┌─────────────────────────────────────────────────────────────┐
│  DashboardHeader (title: "My Decks")                         │
├─────────────────────────────────────────────────────────────┤
│  Toolbar                                                     │
│  ┌──────────────────┐ ┌────────────────┐ ┌───────────────┐  │
│  │ + Create Deck    │ │ Format: All ▼  │ │ Sort: Date ▼  │  │
│  └──────────────────┘ └────────────────┘ └───────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Format Tabs (optional)                                      │
│  [All] [Standard] [Expanded] [Unlimited]                     │
├─────────────────────────────────────────────────────────────┤
│  Deck Grid                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │              │ │              │ │              │         │
│  │   Deck 1     │ │   Deck 2     │ │   Deck 3     │         │
│  │   60 cards   │ │   58 cards   │ │   60 cards   │         │
│  │   ✓ Valid    │ │   ✗ Invalid  │ │   ✓ Valid    │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│  ... more decks ...                                         │
├─────────────────────────────────────────────────────────────┤
│  Empty State (if no decks)                                   │
│  "No decks yet. Create your first deck!"                     │
│  [Create Deck]                                               │
└─────────────────────────────────────────────────────────────┘
```

#### 3.2 Deck Detail Page

**File**: `src/web/pages/DeckDetailPage.tsx`

**Features**:

- Deck name and description
- Format indicator
- Validity status with breakdown
- Card list grouped by type (Pokemon, Trainer, Energy)
- Card counts per category
- Edit and delete actions
- Export deck (future)

**Layout**:

```
┌─────────────────────────────────────────────────────────────┐
│  DashboardHeader (breadcrumb: Decks > Deck Name)             │
├─────────────────────────────────────────────────────────────┤
│  Deck Header                                                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Deck Name                           [Edit] [Delete]     │ │
│  │ Format: Standard  |  60 cards  |  ✓ Valid              │ │
│  │ Description text here...                                │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Deck Stats                                                  │
│  ┌──────────┬──────────┬──────────┬──────────┐              │
│  │ Pokemon  │ Trainer  │ Energy   │ Basics   │              │
│  │    20    │    30    │    10    │    8     │              │
│  └──────────┴──────────┴──────────┴──────────┘              │
├─────────────────────────────────────────────────────────────┤
│  Pokemon (20)                                                │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│  │ Card 1 │ │ Card 2 │ │ Card 3 │ │ Card 4 │               │
│  │  ×4    │ │  ×3    │ │  ×2    │ │  ×1    │               │
│  └────────┘ └────────┘ └────────┘ └────────┘               │
├─────────────────────────────────────────────────────────────┤
│  Trainers (30)                                               │
│  ... grouped cards ...                                       │
├─────────────────────────────────────────────────────────────┤
│  Energy (10)                                                 │
│  ... grouped cards ...                                       │
└─────────────────────────────────────────────────────────────┘
```

#### 3.3 Deck Context & Hook

**File**: `src/web/context/DeckContext.tsx`

```typescript
interface DeckCard {
  cardId: string;
  quantity: number;
}

interface Deck {
  id: string;
  name: string;
  description?: string;
  format: DeckFormat;
  cards: DeckCard[];
  coverCardId?: string;
  createdAt: string;
  updatedAt: string;
}

type DeckFormat = 'standard' | 'expanded' | 'unlimited';

interface DeckContextValue {
  decks: Deck[];
  currentDeck: Deck | null;
  createDeck: (deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>) => Deck;
  updateDeck: (id: string, updates: Partial<Deck>) => void;
  deleteDeck: (id: string) => void;
  getDeck: (id: string) => Deck | undefined;
  setCurrentDeck: (id: string | null) => void;
  addCardToDeck: (deckId: string, cardId: string, quantity?: number) => void;
  removeCardFromDeck: (
    deckId: string,
    cardId: string,
    quantity?: number
  ) => void;
}
```

**File**: `src/web/hooks/useDecks.ts`

```typescript
function useDecks(): DeckContextValue;
```

#### 3.4 Deck Types

**File**: `src/web/types/deck.ts`

```typescript
// Deck format definitions
export type DeckFormat = 'standard' | 'expanded' | 'unlimited' | 'theme';

// Deck validation result
export interface DeckValidation {
  isValid: boolean;
  totalCards: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  breakdown: {
    pokemon: number;
    trainer: number;
    energy: number;
    basicPokemon: number;
  };
}

export interface ValidationError {
  code: string;
  message: string;
  cardId?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  cardId?: string;
}

// Extended Deck type with computed properties
export interface DeckWithMeta extends Deck {
  validation: DeckValidation;
  cardCount: number;
  isComplete: boolean;
}
```

#### 3.5 Format Selector Component

**File**: `src/web/components/FormatSelector/FormatSelector.tsx`

```typescript
interface FormatSelectorProps {
  value: DeckFormat;
  onChange: (format: DeckFormat) => void;
  showAll?: boolean;
  disabled?: boolean;
  variant?: 'dropdown' | 'tabs';
}
```

#### 3.6 Delete Confirmation Dialog

**File**: `src/web/components/ConfirmDialog/ConfirmDialog.tsx`

```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}
```

### Acceptance Criteria

- [ ] Decks page lists all user decks
- [ ] Create deck navigates to deck builder
- [ ] Deck card shows name, count, validity
- [ ] Format filter works correctly
- [ ] Deck detail shows all cards grouped by type
- [ ] Edit button navigates to deck builder
- [ ] Delete shows confirmation dialog
- [ ] Deck data persists in localStorage
- [ ] Empty state shown when no decks

### Files to Create/Modify

| File                                                   | Action |
| ------------------------------------------------------ | ------ |
| `src/web/pages/DecksPage.tsx`                          | Create |
| `src/web/pages/DeckDetailPage.tsx`                     | Create |
| `src/web/context/DeckContext.tsx`                      | Create |
| `src/web/hooks/useDecks.ts`                            | Create |
| `src/web/types/deck.ts`                                | Create |
| `src/web/components/FormatSelector/index.ts`           | Create |
| `src/web/components/FormatSelector/FormatSelector.tsx` | Create |
| `src/web/components/FormatSelector/types.ts`           | Create |
| `src/web/components/FormatSelector/FormatSelector.css` | Create |
| `src/web/components/ConfirmDialog/index.ts`            | Create |
| `src/web/components/ConfirmDialog/ConfirmDialog.tsx`   | Create |
| `src/web/components/ConfirmDialog/types.ts`            | Create |
| `src/web/components/ConfirmDialog/ConfirmDialog.css`   | Create |

---

## Phase 4: Deck Builder Interface

### Objective

Build the interactive deck building/editing interface.

### Deliverables

#### 4.1 Deck Builder Page

**File**: `src/web/pages/DeckBuilderPage.tsx`

**Features**:

- Two-panel layout (card browser + deck contents)
- Real-time deck validation
- Drag-and-drop card addition (optional, click works too)
- Search/filter cards in browser panel
- Quantity controls in deck panel
- Auto-save or explicit save
- Cancel/discard changes option

**Layout**:

```
┌─────────────────────────────────────────────────────────────┐
│  DashboardHeader (title: "Deck Builder")                     │
│  [Cancel] [Save Deck]                                        │
├─────────────────────────────────────────────────────────────┤
│  Deck Info Bar                                               │
│  Name: [______________] Format: [Standard ▼]  60/60 cards   │
├──────────────────────────────┬──────────────────────────────┤
│  Card Browser                │  Deck Contents               │
│  ┌────────────────────────┐  │  ┌────────────────────────┐  │
│  │ Search cards...        │  │  │ Deck Validation        │  │
│  │ [Filters ▼]            │  │  │ ✓ Valid  |  60 cards   │  │
│  └────────────────────────┘  │  └────────────────────────┘  │
│  ┌────────────────────────┐  │  ┌────────────────────────┐  │
│  │ ┌──────┐ ┌──────┐     │  │  │ Pokemon (20)           │  │
│  │ │Card 1│ │Card 2│     │  │  │ ├ Charizard ×4 [-][+]  │  │
│  │ │ [+]  │ │ [+]  │     │  │  │ ├ Pikachu ×3 [-][+]    │  │
│  │ └──────┘ └──────┘     │  │  │ └ ...                   │  │
│  │ ┌──────┐ ┌──────┐     │  │  ├────────────────────────┤  │
│  │ │Card 3│ │Card 4│     │  │  │ Trainers (30)          │  │
│  │ │ [+]  │ │ [+]  │     │  │  │ ├ Professor's Research │  │
│  │ └──────┘ └──────┘     │  │  │ └ ...                   │  │
│  │ ... more cards ...    │  │  ├────────────────────────┤  │
│  │                       │  │  │ Energy (10)            │  │
│  │ [Load More]           │  │  │ ├ Fire Energy ×6       │  │
│  └────────────────────────┘  │  │ └ ...                   │  │
│                              │  └────────────────────────┘  │
└──────────────────────────────┴──────────────────────────────┘
```

#### 4.2 Deck Builder Component

**File**: `src/web/components/DeckBuilder/DeckBuilder.tsx`

```typescript
interface DeckBuilderProps {
  deck?: Deck;
  onSave: (deck: Deck) => void;
  onCancel: () => void;
}

// Internal state
interface DeckBuilderState {
  name: string;
  description: string;
  format: DeckFormat;
  cards: DeckCard[];
  isDirty: boolean;
  validation: DeckValidation;
}
```

**Sub-components**:

- `DeckBuilderHeader` - Name input, format selector, save/cancel
- `CardBrowser` - Left panel with search and card grid
- `DeckContents` - Right panel with deck cards grouped

#### 4.3 Card Browser Panel

**File**: `src/web/components/DeckBuilder/CardBrowser.tsx`

```typescript
interface CardBrowserProps {
  onAddCard: (card: Pokemon.Card) => void;
  deckCards: DeckCard[]; // To show which cards are already in deck
  format: DeckFormat; // To filter by format legality
}
```

**Features**:

- Search by name
- Filter by type, supertype (Pokemon/Trainer/Energy)
- Filter by legality (based on selected format)
- Show "in deck" indicator on cards
- Infinite scroll or pagination
- Quick add button on each card

#### 4.4 Deck Contents Panel

**File**: `src/web/components/DeckBuilder/DeckContents.tsx`

```typescript
interface DeckContentsProps {
  cards: DeckCard[];
  validation: DeckValidation;
  onUpdateQuantity: (cardId: string, quantity: number) => void;
  onRemoveCard: (cardId: string) => void;
  onCardClick: (cardId: string) => void;
}
```

**Features**:

- Cards grouped by supertype (Pokemon, Trainer, Energy)
- Quantity controls (+/-)
- Remove card button
- Validation errors/warnings inline
- Collapsible sections
- Card count per section

#### 4.5 Deck Builder Context

**File**: `src/web/components/DeckBuilder/DeckBuilderContext.tsx`

```typescript
// Local context for deck builder state
interface DeckBuilderContextValue {
  state: DeckBuilderState;
  actions: {
    setName: (name: string) => void;
    setDescription: (description: string) => void;
    setFormat: (format: DeckFormat) => void;
    addCard: (cardId: string, quantity?: number) => void;
    removeCard: (cardId: string, quantity?: number) => void;
    setCardQuantity: (cardId: string, quantity: number) => void;
    clearDeck: () => void;
    reset: () => void;
  };
}
```

#### 4.6 Unsaved Changes Warning

Use `react-router-dom`'s `useBlocker` hook (or `unstable_useBlocker` in v6.x) to prompt user when navigating away with unsaved changes:

```typescript
import { useBlocker } from 'react-router-dom';

function DeckBuilderPage() {
  const [isDirty, setIsDirty] = useState(false);

  // Block navigation when there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  // Show confirmation dialog when blocked
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (confirmed) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  // ...
}
```

Alternative: Use `beforeunload` event for browser tab/window close:

```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isDirty]);
```

### Acceptance Criteria

- [ ] Can create new deck from scratch
- [ ] Can edit existing deck
- [ ] Deck name and format are editable
- [ ] Card browser shows all available cards
- [ ] Can search and filter cards in browser
- [ ] Click card to add to deck
- [ ] Deck contents show cards grouped by type
- [ ] Can adjust quantities in deck
- [ ] Can remove cards from deck
- [ ] Real-time validation feedback
- [ ] Save creates/updates deck
- [ ] Cancel discards changes
- [ ] Unsaved changes warning works

### Files to Create/Modify

| File                                                    | Action |
| ------------------------------------------------------- | ------ |
| `src/web/pages/DeckBuilderPage.tsx`                     | Create |
| `src/web/components/DeckBuilder/index.ts`               | Create |
| `src/web/components/DeckBuilder/DeckBuilder.tsx`        | Create |
| `src/web/components/DeckBuilder/DeckBuilderContext.tsx` | Create |
| `src/web/components/DeckBuilder/CardBrowser.tsx`        | Create |
| `src/web/components/DeckBuilder/DeckContents.tsx`       | Create |
| `src/web/components/DeckBuilder/DeckBuilderHeader.tsx`  | Create |
| `src/web/components/DeckBuilder/types.ts`               | Create |
| `src/web/components/DeckBuilder/DeckBuilder.css`        | Create |

---

## Phase 5: Format Support & Validation

### Objective

Implement deck format rules and validation logic.

### Deliverables

#### 5.1 Format Rules Definition

**File**: `src/web/utils/format-rules.ts`

```typescript
export interface FormatRules {
  name: string;
  code: DeckFormat;
  minCards: number;
  maxCards: number;
  maxCopiesPerCard: number;
  basicPokemonRequired: boolean;
  legalSets: string[] | 'all';
  bannedCards: string[];
  restrictedCards: string[];
}

export const FORMAT_RULES: Record<DeckFormat, FormatRules> = {
  standard: {
    name: 'Standard',
    code: 'standard',
    minCards: 60,
    maxCards: 60,
    maxCopiesPerCard: 4,
    basicPokemonRequired: true,
    legalSets: ['sv1', 'sv2', 'sv3', ...],  // Current rotation
    bannedCards: [],
    restrictedCards: [],
  },
  expanded: {
    name: 'Expanded',
    code: 'expanded',
    minCards: 60,
    maxCards: 60,
    maxCopiesPerCard: 4,
    basicPokemonRequired: true,
    legalSets: 'all',  // BW onwards
    bannedCards: ['forest-of-giant-plants', ...],
    restrictedCards: [],
  },
  unlimited: {
    name: 'Unlimited',
    code: 'unlimited',
    minCards: 60,
    maxCards: 60,
    maxCopiesPerCard: 4,
    basicPokemonRequired: true,
    legalSets: 'all',
    bannedCards: [],
    restrictedCards: [],
  },
};

// Basic Energy cards are exempt from the 4-copy rule
export const BASIC_ENERGY_CARDS = [
  'Grass Energy', 'Fire Energy', 'Water Energy',
  'Lightning Energy', 'Psychic Energy', 'Fighting Energy',
  'Darkness Energy', 'Metal Energy', 'Fairy Energy',
];
```

#### 5.2 Deck Validator

**File**: `src/web/utils/deck-validator.ts`

```typescript
export function validateDeck(
  cards: DeckCard[],
  format: DeckFormat,
  cardData: Map<string, Pokemon.Card>
): DeckValidation {
  const rules = FORMAT_RULES[format];
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Calculate totals
  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0);
  const breakdown = calculateBreakdown(cards, cardData);

  // Validation checks
  validateCardCount(totalCards, rules, errors);
  validateCopyLimit(cards, rules, cardData, errors);
  validateBasicPokemon(breakdown, rules, errors);
  validateLegality(cards, rules, cardData, errors, warnings);
  validateBannedCards(cards, rules, cardData, errors);

  return {
    isValid: errors.length === 0,
    totalCards,
    errors,
    warnings,
    breakdown
  };
}

// Validation error codes
export const VALIDATION_ERRORS = {
  TOO_FEW_CARDS: 'TOO_FEW_CARDS',
  TOO_MANY_CARDS: 'TOO_MANY_CARDS',
  COPY_LIMIT_EXCEEDED: 'COPY_LIMIT_EXCEEDED',
  NO_BASIC_POKEMON: 'NO_BASIC_POKEMON',
  ILLEGAL_CARD: 'ILLEGAL_CARD',
  BANNED_CARD: 'BANNED_CARD'
};
```

#### 5.3 Validation Display Component

**File**: `src/web/components/DeckValidation/DeckValidation.tsx`

```typescript
interface DeckValidationProps {
  validation: DeckValidation;
  showBreakdown?: boolean;
  compact?: boolean;
}
```

**Features**:

- Green checkmark for valid decks
- Red X for invalid decks
- List of errors with icons
- List of warnings with icons
- Card count breakdown
- Click error to highlight card (optional)

#### 5.4 Format Info Component

**File**: `src/web/components/FormatInfo/FormatInfo.tsx`

```typescript
interface FormatInfoProps {
  format: DeckFormat;
  showRules?: boolean;
  showBannedList?: boolean;
}
```

**Features**:

- Format name and description
- Current legal sets
- Banned card list
- Rotation date (for Standard)

### Acceptance Criteria

- [ ] Deck validator checks card count (exactly 60)
- [ ] Deck validator checks 4-copy limit
- [ ] Basic energy exempt from copy limit
- [ ] Deck validator checks for basic Pokemon
- [ ] Deck validator checks format legality
- [ ] Deck validator identifies banned cards
- [ ] Validation errors display clearly
- [ ] Validation warnings display clearly
- [ ] Format rules are configurable

### Files to Create/Modify

| File                                                   | Action |
| ------------------------------------------------------ | ------ |
| `src/web/utils/format-rules.ts`                        | Create |
| `src/web/utils/deck-validator.ts`                      | Create |
| `src/web/components/DeckValidation/index.ts`           | Create |
| `src/web/components/DeckValidation/DeckValidation.tsx` | Create |
| `src/web/components/DeckValidation/types.ts`           | Create |
| `src/web/components/DeckValidation/DeckValidation.css` | Create |
| `src/web/components/FormatInfo/index.ts`               | Create |
| `src/web/components/FormatInfo/FormatInfo.tsx`         | Create |
| `src/web/components/FormatInfo/types.ts`               | Create |
| `src/web/components/FormatInfo/FormatInfo.css`         | Create |

---

## Phase 6: Data Layer & API Integration

### Objective

Connect frontend to backend API with proper data fetching patterns.

### Deliverables

#### 6.1 Card Fetching Hook

**File**: `src/web/hooks/useCards.ts`

```typescript
interface UseCardsOptions {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  rarity?: string;
  set?: string;
  supertype?: string;
  legality?: DeckFormat;
}

interface UseCardsResult {
  cards: Pokemon.Card[];
  loading: boolean;
  error: Error | null;
  pagination: {
    page: number;
    totalPages: number;
    totalItems: number;
  };
  refetch: () => void;
}

function useCards(options: UseCardsOptions): UseCardsResult;
```

#### 6.2 Single Card Hook

**File**: `src/web/hooks/useCard.ts`

```typescript
function useCard(cardId: string): {
  card: Pokemon.Card | null;
  loading: boolean;
  error: Error | null;
};
```

#### 6.3 Sets Fetching Hook

**File**: `src/web/hooks/useSets.ts`

```typescript
function useSets(): {
  sets: Pokemon.Set[];
  loading: boolean;
  error: Error | null;
};
```

#### 6.4 API Client Wrapper

**File**: `src/web/utils/api-client.ts`

```typescript
const API_BASE = '/api/v1';

export const api = {
  cards: {
    list: (params?: SearchParams) => fetch(`${API_BASE}/cards?${params}`),
    get: (id: string) => fetch(`${API_BASE}/cards/${id}`)
  },
  sets: {
    list: () => fetch(`${API_BASE}/sets`),
    get: (id: string) => fetch(`${API_BASE}/sets/${id}`),
    cards: (id: string, params?: SearchParams) =>
      fetch(`${API_BASE}/sets/${id}/cards?${params}`)
  }
};
```

#### 6.5 Card Data Cache

**File**: `src/web/context/CardCacheContext.tsx`

```typescript
// Cache card data to avoid refetching
interface CardCacheContextValue {
  getCard: (id: string) => Pokemon.Card | undefined;
  setCard: (card: Pokemon.Card) => void;
  setCards: (cards: Pokemon.Card[]) => void;
  preloadCards: (ids: string[]) => Promise<void>;
}
```

#### 6.6 Error Handling Component

**File**: `src/web/components/ErrorBoundary/ErrorBoundary.tsx`

```typescript
interface ErrorBoundaryProps {
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
  children: React.ReactNode;
}
```

#### 6.7 Loading States

**File**: `src/web/components/Skeleton/Skeleton.tsx`

```typescript
interface SkeletonProps {
  variant?: 'text' | 'card' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
  count?: number;
}
```

**File**: `src/web/components/CardSkeleton/CardSkeleton.tsx`

Skeleton specifically for card loading state.

### Acceptance Criteria

- [ ] Cards fetch from API correctly
- [ ] Pagination works with API
- [ ] Search/filter parameters sent to API
- [ ] Single card fetches correctly
- [ ] Sets fetch correctly
- [ ] Loading states display properly
- [ ] Errors display user-friendly message
- [ ] Card data is cached appropriately
- [ ] API errors are handled gracefully

### Files to Create/Modify

| File                                                 | Action |
| ---------------------------------------------------- | ------ |
| `src/web/hooks/useCards.ts`                          | Create |
| `src/web/hooks/useCard.ts`                           | Create |
| `src/web/hooks/useSets.ts`                           | Create |
| `src/web/utils/api-client.ts`                        | Create |
| `src/web/context/CardCacheContext.tsx`               | Create |
| `src/web/components/ErrorBoundary/index.ts`          | Create |
| `src/web/components/ErrorBoundary/ErrorBoundary.tsx` | Create |
| `src/web/components/Skeleton/index.ts`               | Create |
| `src/web/components/Skeleton/Skeleton.tsx`           | Create |
| `src/web/components/Skeleton/Skeleton.css`           | Create |
| `src/web/components/CardSkeleton/index.ts`           | Create |
| `src/web/components/CardSkeleton/CardSkeleton.tsx`   | Create |
| `src/web/components/CardSkeleton/CardSkeleton.css`   | Create |

---

## Phase 7: Polish & Optimization

### Objective

Final polish, performance optimization, and production readiness.

### Deliverables

#### 7.1 Toast Notifications

**File**: `src/web/components/Toast/Toast.tsx`

```typescript
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

// Toast context for global toasts
interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}
```

#### 7.2 Keyboard Navigation

- Focus management for modals
- Keyboard shortcuts for common actions
- Accessible focus indicators
- Tab navigation through card grids

#### 7.3 Mobile Responsiveness

- Responsive sidebar (drawer on mobile)
- Touch-friendly card interactions
- Swipe gestures for deck builder
- Mobile-optimized deck view

#### 7.4 Performance Optimizations

- Virtualized card grids for large collections
- Image lazy loading
- Bundle code splitting by route
- Preload critical routes
- Optimize re-renders with React.memo

#### 7.5 Accessibility Audit

- ARIA labels on all interactive elements
- Screen reader announcements
- Color contrast compliance
- Reduced motion support

#### 7.6 Final CSS Polish

- Consistent spacing and typography
- Hover and focus states
- Transition animations
- Dark mode support (optional)

#### 7.7 Testing

- Unit tests for validation logic
- Component tests with Bun test
- Integration tests for key flows
- Accessibility tests

### Acceptance Criteria

- [ ] Toast notifications work globally
- [ ] Keyboard navigation is smooth
- [ ] Mobile layout works on all pages
- [ ] Large collections perform well
- [ ] All images lazy load
- [ ] ARIA labels are comprehensive
- [ ] Focus management is correct
- [ ] Animations are smooth
- [ ] Tests cover critical paths

### Files to Create/Modify

| File                                                     | Action            |
| -------------------------------------------------------- | ----------------- |
| `src/web/components/Toast/index.ts`                      | Create            |
| `src/web/components/Toast/Toast.tsx`                     | Create            |
| `src/web/components/Toast/ToastContainer.tsx`            | Create            |
| `src/web/components/Toast/types.ts`                      | Create            |
| `src/web/components/Toast/Toast.css`                     | Create            |
| `src/web/context/ToastContext.tsx`                       | Create            |
| `src/web/hooks/useKeyboard.ts`                           | Create            |
| `src/web/components/VirtualizedGrid/VirtualizedGrid.tsx` | Create            |
| `public/css/index.css`                                   | Modify            |
| `src/web/**/__tests__/*.test.tsx`                        | Create (multiple) |

---

## Component Inventory

### Existing Components (No Changes Needed)

| Component         | Props Interface        | Notes                                       |
| ----------------- | ---------------------- | ------------------------------------------- |
| `Badge`           | `BadgeProps`           | Type/rarity styling                         |
| `Button`          | `ButtonProps`          | Variants: primary, secondary, ghost, danger |
| `Card`            | `CardProps`            | Variants: grid, list, detail                |
| `CardGrid`        | `CardGridProps`        | Loading/empty states                        |
| `DeckCard`        | `DeckCardProps`        | Edit/delete actions                         |
| `DeckList`        | `DeckListProps`        | Grid/list layouts                           |
| `SearchBar`       | `SearchBarProps`       | Type/rarity/set filters                     |
| `Stats`           | `StatsProps`           | Trend indicators                            |
| `Sidebar`         | `SidebarProps`         | Collapsible navigation                      |
| `DashboardLayout` | `DashboardLayoutProps` | Layout wrapper                              |
| `Document`        | `DocumentProps`        | HTML document                               |

### New Components Summary

| Component         | Phase | Priority |
| ----------------- | ----- | -------- |
| `AppSidebar`      | 1     | P0       |
| `DashboardHeader` | 1     | P0       |
| `CardDetail`      | 2     | P0       |
| `Pagination`      | 2     | P0       |
| `Modal`           | 2     | P0       |
| `FormatSelector`  | 3     | P1       |
| `ConfirmDialog`   | 3     | P1       |
| `DeckBuilder`     | 4     | P1       |
| `CardBrowser`     | 4     | P1       |
| `DeckContents`    | 4     | P1       |
| `DeckValidation`  | 5     | P1       |
| `FormatInfo`      | 5     | P2       |
| `ErrorBoundary`   | 6     | P1       |
| `Skeleton`        | 6     | P2       |
| `CardSkeleton`    | 6     | P2       |
| `Toast`           | 7     | P2       |
| `VirtualizedGrid` | 7     | P3       |

> **Note**: Routing is handled by `react-router-dom` - uses `Link`, `NavLink`, and router hooks from the library.

---

## Data Models

### Collection (localStorage)

```typescript
interface CollectionStore {
  version: number;
  cards: {
    [cardId: string]: {
      quantity: number;
      dateAdded: string;
    };
  };
}
```

### Decks (localStorage)

```typescript
interface DeckStore {
  version: number;
  decks: {
    [deckId: string]: {
      id: string;
      name: string;
      description?: string;
      format: DeckFormat;
      cards: { cardId: string; quantity: number }[];
      coverCardId?: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}
```

### LocalStorage Keys

```typescript
const STORAGE_KEYS = {
  COLLECTION: 'pokemon-tcg-collection',
  DECKS: 'pokemon-tcg-decks',
  PREFERENCES: 'pokemon-tcg-preferences'
};
```

---

## API Endpoints

### Existing Endpoints

| Endpoint                 | Method | Description                |
| ------------------------ | ------ | -------------------------- |
| `/api/v1/cards`          | GET    | List cards with pagination |
| `/api/v1/cards/:id`      | GET    | Get single card            |
| `/api/v1/sets`           | GET    | List sets                  |
| `/api/v1/sets/:id`       | GET    | Get single set             |
| `/api/v1/sets/:id/cards` | GET    | Get cards in set           |

### Query Parameters

| Param       | Type   | Description                 |
| ----------- | ------ | --------------------------- |
| `page`      | number | Page number (1-indexed)     |
| `limit`     | number | Items per page (default 20) |
| `q`         | string | Search query                |
| `type`      | string | Pokemon type filter         |
| `rarity`    | string | Rarity filter               |
| `supertype` | string | Pokemon/Trainer/Energy      |

### Future API Endpoints (v2)

| Endpoint                      | Method | Description            |
| ----------------------------- | ------ | ---------------------- |
| `/api/v1/decks`               | GET    | List user decks        |
| `/api/v1/decks`               | POST   | Create deck            |
| `/api/v1/decks/:id`           | GET    | Get deck               |
| `/api/v1/decks/:id`           | PUT    | Update deck            |
| `/api/v1/decks/:id`           | DELETE | Delete deck            |
| `/api/v1/collections`         | GET    | Get user collection    |
| `/api/v1/collections`         | POST   | Add to collection      |
| `/api/v1/collections/:cardId` | DELETE | Remove from collection |

---

## Implementation Order

### Recommended Sprint Plan

**Sprint 1 (Phase 1)**: Routing & Layout

- Install and configure `react-router-dom`
- Set up `BrowserRouter` (client) and `StaticRouter` (SSR)
- Create route configuration with lazy-loaded pages
- Build `AppSidebar` with `NavLink` components
- Build `DashboardHeader` with breadcrumbs
- Update server-side route handling
- Create page shell components

**Sprint 2 (Phase 2)**: Collection

- Dashboard home page
- Collection page
- Card detail modal
- Collection context
- LocalStorage persistence

**Sprint 3 (Phase 3)**: Decks

- Decks page
- Deck detail page
- Deck context
- Format selector

**Sprint 4 (Phase 4)**: Deck Builder

- Deck builder page
- Card browser panel
- Deck contents panel
- Real-time validation

**Sprint 5 (Phase 5)**: Validation

- Format rules
- Deck validator
- Validation display

**Sprint 6 (Phase 6)**: API Integration

- Data fetching hooks
- API client
- Error handling
- Loading states

**Sprint 7 (Phase 7)**: Polish

- Toast notifications
- Mobile responsiveness
- Accessibility
- Performance optimization
- Testing

---

## Success Metrics

1. **Functionality**: All CRUD operations work for collections and decks
2. **Validation**: Deck validation accurately reflects format rules
3. **Performance**: Initial page load < 2s, navigation < 500ms
4. **Accessibility**: WCAG 2.1 AA compliance
5. **Responsiveness**: Works on mobile, tablet, and desktop
6. **Persistence**: Data survives browser refresh

---

## Risk Mitigation

| Risk                                    | Mitigation                                        |
| --------------------------------------- | ------------------------------------------------- |
| Large card database impacts performance | Implement pagination, virtualization, and caching |
| Complex validation rules                | Thorough testing, configurable rules              |
| LocalStorage limits                     | Monitor storage usage, implement data pruning     |
| SSR hydration mismatches                | Careful client/server state synchronization       |
| API rate limiting                       | Implement request batching and caching            |

---

## Dependencies

### NPM Packages

```json
{
  "react-router-dom": "^6.x", // Required: Client-side routing
  "@tanstack/react-query": "^5.x", // Optional: for data fetching
  "uuid": "^9.x" // For deck ID generation
}
```

**Installation**:

```bash
bun add react-router-dom
bun add uuid
# Optional
bun add @tanstack/react-query
```

### External Resources

- Pokemon TCG API for card images (already configured)
- Google Fonts (already configured)
- Pico CSS (already included)

---

## Appendix: Sidebar Navigation Structure

```typescript
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../routes';

// Navigation items configuration
const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '🏠',
    to: ROUTES.DASHBOARD,
  },
  {
    id: 'collection',
    label: 'My Collection',
    icon: '📚',
    to: ROUTES.COLLECTION,
    // count: collectionCount,  // Can be added dynamically
  },
  {
    id: 'browse',
    label: 'Browse Cards',
    icon: '🔍',
    to: ROUTES.BROWSE,
  },
  {
    id: 'decks',
    label: 'My Decks',
    icon: '🎴',
    to: ROUTES.DECKS,
    // count: deckCount,  // Can be added dynamically
  },
];

// Usage with react-router NavLink
{NAV_ITEMS.map((item) => (
  <NavLink
    key={item.id}
    to={item.to}
    className={({ isActive }) =>
      `sidebar-item ${isActive ? 'sidebar-item--active' : ''}`
    }
  >
    <span className="sidebar-item__icon">{item.icon}</span>
    <span className="sidebar-item__label">{item.label}</span>
    {item.count !== undefined && (
      <span className="sidebar-item__count">{item.count}</span>
    )}
  </NavLink>
))}
```

---

_End of Specification Document_
