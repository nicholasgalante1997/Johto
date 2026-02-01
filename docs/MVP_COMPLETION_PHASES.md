# Pokemon TCG MVP - Phased Completion Plan

**Created:** January 21, 2026
**Based on:** MVP_IMPLEMENTATION_PLAN.md + Current State Analysis

---

## Overview

This document outlines a phased approach to complete the Pokemon TCG MVP. The project is currently ~55-65% complete with substantial frontend work done. The remaining work focuses on:

1. Completing partial UI pages
2. Adding user authentication
3. Server-side persistence for decks/collections
4. Market value tracking
5. Testing foundation

---

## Phase A: Local-First MVP

**Duration:** 2-3 weeks
**Goal:** Ship a fully functional app using client-side (localStorage) persistence

### A.1 Complete Collection Page

**Priority:** HIGH
**Estimated Hours:** 8-12

**Current State:**

- Collection context exists with add/remove functionality
- localStorage persistence working
- Page shell exists but UI is minimal

**Tasks:**

- [ ] A.1.1 Create collection card grid displaying all owned cards
- [ ] A.1.2 Add quantity indicators on each card
- [ ] A.1.3 Implement collection statistics panel (total cards, unique cards, sets represented)
- [ ] A.1.4 Add filter controls (by set, by type, by rarity)
- [ ] A.1.5 Add sort controls (by name, by quantity, by date added)
- [ ] A.1.6 Integrate CardDetail modal for collection items
- [ ] A.1.7 Add "Remove from Collection" action in card detail

**Acceptance Criteria:**

- [ ] User can view all cards in their collection
- [ ] User can see quantity owned for each card
- [ ] User can filter and sort their collection
- [ ] User can remove cards from collection
- [ ] Collection statistics display accurately
- [ ] Collection persists across browser sessions

**Files to Modify:**

- `apps/web/src/web/pages/CollectionPage.tsx`
- `apps/web/src/web/contexts/Collection.tsx` (if needed)

---

### A.2 Complete Deck Detail Page

**Priority:** HIGH
**Estimated Hours:** 6-8

**Current State:**

- Deck context with full CRUD operations
- DeckBuilderPage complete with validation
- DeckDetailPage is a shell

**Tasks:**

- [ ] A.2.1 Display deck metadata (name, format, card count, legality)
- [ ] A.2.2 Group cards by type (Pokemon, Trainer, Energy)
- [ ] A.2.3 Show card quantities within each group
- [ ] A.2.4 Display deck statistics (type distribution, energy curve)
- [ ] A.2.5 Add "Edit Deck" button linking to DeckBuilderPage
- [ ] A.2.6 Add "Delete Deck" with confirmation
- [ ] A.2.7 Add "Clone Deck" functionality
- [ ] A.2.8 Display validation status prominently

**Acceptance Criteria:**

- [ ] User can view full deck details
- [ ] Cards are grouped logically
- [ ] Deck statistics are visible
- [ ] User can navigate to edit mode
- [ ] User can clone or delete deck

**Files to Modify:**

- `apps/web/src/web/pages/DeckDetailPage.tsx`
- `apps/web/src/web/components/DeckStats/` (create if needed)

---

### A.3 Toast Notification System

**Priority:** MEDIUM
**Estimated Hours:** 4-6

**Current State:**

- No global notification system
- Actions complete silently

**Tasks:**

- [ ] A.3.1 Create Toast component with variants (success, error, warning, info)
- [ ] A.3.2 Create ToastContext for global notification management
- [ ] A.3.3 Add toast on successful collection add/remove
- [ ] A.3.4 Add toast on deck create/update/delete
- [ ] A.3.5 Add toast on API errors
- [ ] A.3.6 Auto-dismiss after 3-5 seconds
- [ ] A.3.7 Support manual dismiss

**Acceptance Criteria:**

- [ ] Toasts appear for all user actions
- [ ] Toasts are visually distinct by type
- [ ] Toasts auto-dismiss
- [ ] Multiple toasts can stack

**Files to Create:**

- `apps/web/src/web/components/Toast/Toast.tsx`
- `apps/web/src/web/components/Toast/Toast.css`
- `apps/web/src/web/contexts/Toast.tsx`

---

### A.4 UI/UX Polish

**Priority:** MEDIUM
**Estimated Hours:** 8-10

**Tasks:**

- [ ] A.4.1 Add loading skeletons to all data-fetching pages
- [ ] A.4.2 Ensure consistent error states across pages
- [ ] A.4.3 Review and fix mobile responsiveness
- [ ] A.4.4 Add hover/focus states to all interactive elements
- [ ] A.4.5 Ensure consistent spacing and typography
- [ ] A.4.6 Add empty state illustrations
- [ ] A.4.7 Review color contrast for accessibility

**Acceptance Criteria:**

- [ ] No layout breaks on mobile
- [ ] All interactive elements have visible focus states
- [ ] Loading states prevent content jumping
- [ ] Error states are informative

**Files to Modify:**

- Various component CSS files
- Page components for loading/error states

---

### A.5 Decks Page Enhancement

**Priority:** MEDIUM
**Estimated Hours:** 4-6

**Tasks:**

- [ ] A.5.1 Display deck cards in a responsive grid
- [ ] A.5.2 Show deck thumbnail (first Pokemon card image)
- [ ] A.5.3 Add "New Deck" CTA button
- [ ] A.5.4 Add search/filter for decks
- [ ] A.5.5 Sort by name, date created, format

**Acceptance Criteria:**

- [ ] User can see all their decks
- [ ] User can easily create a new deck
- [ ] Decks have visual thumbnails

**Files to Modify:**

- `apps/web/src/web/pages/DecksPage.tsx`

---

### A.6 Basic Testing Setup

**Priority:** MEDIUM
**Estimated Hours:** 8-10

**Tasks:**

- [ ] A.6.1 Install and configure Vitest
- [ ] A.6.2 Set up React Testing Library
- [ ] A.6.3 Write tests for Button component
- [ ] A.6.4 Write tests for Card component
- [ ] A.6.5 Write tests for useDeckValidation hook
- [ ] A.6.6 Write tests for CollectionContext
- [ ] A.6.7 Configure test coverage reporting

**Acceptance Criteria:**

- [ ] Test suite runs with `bun test`
- [ ] At least 5 component tests pass
- [ ] At least 2 hook tests pass
- [ ] Coverage report generates

**Files to Create:**

- `apps/web/vitest.config.ts`
- `apps/web/src/web/components/**/*.test.tsx`
- `apps/web/src/web/hooks/**/*.test.ts`

---

### Phase A Summary

| Task                    | Hours     | Status  |
| ----------------------- | --------- | ------- |
| A.1 Collection Page     | 8-12      | Pending |
| A.2 Deck Detail Page    | 6-8       | Pending |
| A.3 Toast Notifications | 4-6       | Pending |
| A.4 UI/UX Polish        | 8-10      | Pending |
| A.5 Decks Page          | 4-6       | Pending |
| A.6 Testing Setup       | 8-10      | Pending |
| **TOTAL**               | **38-52** |         |

**Deliverable:** Fully functional single-user app with localStorage persistence

---

## Phase B: Server Persistence MVP

**Duration:** 3-4 weeks
**Goal:** Add user accounts and server-side storage

### B.1 User Authentication Backend

**Priority:** CRITICAL
**Estimated Hours:** 15-20

**Tasks:**

- [ ] B.1.1 Create users table in PostgreSQL (or extend SQLite)
- [ ] B.1.2 Implement password hashing with bcrypt
- [ ] B.1.3 Create POST `/api/v1/auth/register` endpoint
- [ ] B.1.4 Create POST `/api/v1/auth/login` endpoint
- [ ] B.1.5 Implement JWT token generation
- [ ] B.1.6 Create POST `/api/v1/auth/refresh` endpoint
- [ ] B.1.7 Create GET `/api/v1/auth/me` endpoint
- [ ] B.1.8 Add auth middleware to protect routes
- [ ] B.1.9 Add rate limiting on auth endpoints

**Acceptance Criteria:**

- [ ] User can register with username, email, password
- [ ] User can login and receive JWT
- [ ] Protected routes require valid JWT
- [ ] Passwords are securely hashed
- [ ] Tokens expire and can be refreshed

**Files to Create:**

- `apps/web/src/server/lib/api/handlers/auth.ts`
- `apps/web/src/server/lib/api/middleware/auth.ts`
- `apps/web/src/server/lib/api/services/auth.service.ts`

---

### B.2 User Authentication Frontend

**Priority:** CRITICAL
**Estimated Hours:** 12-15

**Tasks:**

- [ ] B.2.1 Create AuthContext for authentication state
- [ ] B.2.2 Create Login page with form validation
- [ ] B.2.3 Create Register page with form validation
- [ ] B.2.4 Create ProtectedRoute component
- [ ] B.2.5 Implement token storage (httpOnly cookie preferred)
- [ ] B.2.6 Add automatic token refresh logic
- [ ] B.2.7 Update Header to show login/logout state
- [ ] B.2.8 Redirect unauthenticated users from protected pages

**Acceptance Criteria:**

- [ ] User can register and login
- [ ] Auth state persists across page refreshes
- [ ] Protected pages redirect to login
- [ ] Logout clears auth state
- [ ] Token refreshes automatically

**Files to Create:**

- `apps/web/src/web/pages/LoginPage.tsx`
- `apps/web/src/web/pages/RegisterPage.tsx`
- `apps/web/src/web/contexts/Auth.tsx`
- `apps/web/src/web/components/ProtectedRoute/`

---

### B.3 Deck Server Persistence

**Priority:** HIGH
**Estimated Hours:** 15-20

**Tasks:**

- [ ] B.3.1 Create decks table in database
- [ ] B.3.2 Create deck_cards table for card associations
- [ ] B.3.3 Create POST `/api/v1/decks` endpoint (create)
- [ ] B.3.4 Create GET `/api/v1/decks` endpoint (list user's decks)
- [ ] B.3.5 Create GET `/api/v1/decks/:id` endpoint (get deck)
- [ ] B.3.6 Create PATCH `/api/v1/decks/:id` endpoint (update)
- [ ] B.3.7 Create DELETE `/api/v1/decks/:id` endpoint (delete)
- [ ] B.3.8 Create POST `/api/v1/decks/:id/cards` endpoint (add card)
- [ ] B.3.9 Create DELETE `/api/v1/decks/:id/cards/:cardId` endpoint
- [ ] B.3.10 Update DeckContext to use server API
- [ ] B.3.11 Sync existing localStorage decks to server on login

**Acceptance Criteria:**

- [ ] Decks persist to server database
- [ ] User can only access their own decks
- [ ] Deck cards are properly associated
- [ ] localStorage syncs to server on first login

**Files to Create:**

- `apps/web/src/server/lib/api/handlers/decks.ts`
- `apps/web/src/server/lib/api/services/deck.service.ts`

---

### B.4 Collection Server Persistence

**Priority:** HIGH
**Estimated Hours:** 10-15

**Tasks:**

- [ ] B.4.1 Create user_card_inventory table
- [ ] B.4.2 Create POST `/api/v1/inventory/cards` endpoint (add card)
- [ ] B.4.3 Create GET `/api/v1/inventory/cards` endpoint (list)
- [ ] B.4.4 Create PATCH `/api/v1/inventory/cards/:id` endpoint (update qty)
- [ ] B.4.5 Create DELETE `/api/v1/inventory/cards/:id` endpoint
- [ ] B.4.6 Create GET `/api/v1/inventory/stats` endpoint (statistics)
- [ ] B.4.7 Update CollectionContext to use server API
- [ ] B.4.8 Sync localStorage collection to server on login

**Acceptance Criteria:**

- [ ] Collection persists to server
- [ ] User can only access their own collection
- [ ] Quantities tracked per card
- [ ] Statistics calculated correctly

**Files to Create:**

- `apps/web/src/server/lib/api/handlers/inventory.ts`
- `apps/web/src/server/lib/api/services/inventory.service.ts`

---

### B.5 GraphQL Mutations

**Priority:** MEDIUM
**Estimated Hours:** 8-12

**Tasks:**

- [ ] B.5.1 Add createDeck mutation
- [ ] B.5.2 Add updateDeck mutation
- [ ] B.5.3 Add deleteDeck mutation
- [ ] B.5.4 Add addCardToCollection mutation
- [ ] B.5.5 Add removeCardFromCollection mutation
- [ ] B.5.6 Add updateCardQuantity mutation
- [ ] B.5.7 Add authentication to mutations
- [ ] B.5.8 Update frontend GraphQL hooks

**Acceptance Criteria:**

- [ ] All mutations work via GraphQL
- [ ] Mutations require authentication
- [ ] Frontend can use either REST or GraphQL

**Files to Modify:**

- `apps/web/src/server/lib/api/graphql/resolvers.ts`
- `apps/web/src/server/lib/api/graphql/schema.ts`
- `apps/web/src/web/graphql/hooks/mutations.ts`

---

### B.6 Integration Testing

**Priority:** MEDIUM
**Estimated Hours:** 10-15

**Tasks:**

- [ ] B.6.1 Test full registration → login → logout flow
- [ ] B.6.2 Test deck creation → edit → delete flow
- [ ] B.6.3 Test collection add → update → remove flow
- [ ] B.6.4 Test protected route redirects
- [ ] B.6.5 Test localStorage to server sync
- [ ] B.6.6 Test error handling on network failures

**Acceptance Criteria:**

- [ ] All critical user flows have tests
- [ ] Tests run in CI/CD
- [ ] Tests pass consistently

**Files to Create:**

- `apps/web/src/__tests__/integration/`
- `e2e/` (if using Playwright)

---

### Phase B Summary

| Task                       | Hours     | Status  |
| -------------------------- | --------- | ------- |
| B.1 Auth Backend           | 15-20     | Pending |
| B.2 Auth Frontend          | 12-15     | Pending |
| B.3 Deck Persistence       | 15-20     | Pending |
| B.4 Collection Persistence | 10-15     | Pending |
| B.5 GraphQL Mutations      | 8-12      | Pending |
| B.6 Integration Testing    | 10-15     | Pending |
| **TOTAL**                  | **70-97** |         |

**Deliverable:** Multi-user app with server-side persistence

---

## Phase C: Market Data MVP

**Duration:** 2-3 weeks
**Goal:** Add price tracking and market value features

### C.1 Price Data Sync Service

**Priority:** HIGH
**Estimated Hours:** 12-15

**Tasks:**

- [ ] C.1.1 Create card_price_history table
- [ ] C.1.2 Write price extraction script from card data
- [ ] C.1.3 Parse TCGPlayer prices from existing card JSON
- [ ] C.1.4 Parse Cardmarket prices from existing card JSON
- [ ] C.1.5 Store prices in database with timestamp
- [ ] C.1.6 Create CLI command for manual price sync
- [ ] C.1.7 Document price sync procedure

**Acceptance Criteria:**

- [ ] Prices extracted from card data
- [ ] Price history stored with dates
- [ ] Script can be run manually

**Files to Create:**

- `apps/scripts/lib/price-sync.js`
- Database migration for price_history table

---

### C.2 Price Display API

**Priority:** HIGH
**Estimated Hours:** 6-8

**Tasks:**

- [ ] C.2.1 Create GET `/api/v1/cards/:id/prices` endpoint
- [ ] C.2.2 Return current price from both markets
- [ ] C.2.3 Return price history (last 30 days)
- [ ] C.2.4 Calculate price trends (7-day, 30-day change)
- [ ] C.2.5 Add caching for price data

**Acceptance Criteria:**

- [ ] Price endpoints return correct data
- [ ] Trends calculated accurately
- [ ] Response cached for performance

**Files to Create:**

- `apps/web/src/server/lib/api/handlers/prices.ts`

---

### C.3 Price Display UI

**Priority:** HIGH
**Estimated Hours:** 10-12

**Tasks:**

- [ ] C.3.1 Add price badge to Card component
- [ ] C.3.2 Add price section to CardDetail modal
- [ ] C.3.3 Create PriceHistoryChart component (line chart)
- [ ] C.3.4 Show price trends with arrows (up/down)
- [ ] C.3.5 Add price to collection cards
- [ ] C.3.6 Show total collection value on CollectionPage

**Acceptance Criteria:**

- [ ] Prices visible on cards
- [ ] Price chart shows 30-day history
- [ ] Collection total value displayed

**Files to Create:**

- `apps/web/src/web/components/PriceHistoryChart/`
- `apps/web/src/web/components/PriceBadge/`

---

### C.4 Collection Value Tracking

**Priority:** MEDIUM
**Estimated Hours:** 6-8

**Tasks:**

- [ ] C.4.1 Calculate total collection value (sum of market prices × quantities)
- [ ] C.4.2 Show value breakdown by set
- [ ] C.4.3 Show most valuable cards
- [ ] C.4.4 Show value change over time (if history exists)
- [ ] C.4.5 Create GET `/api/v1/inventory/value` endpoint

**Acceptance Criteria:**

- [ ] Total value calculated correctly
- [ ] Value breakdown by set shown
- [ ] Most valuable cards highlighted

**Files to Modify:**

- `apps/web/src/web/pages/CollectionPage.tsx`
- `apps/web/src/server/lib/api/handlers/inventory.ts`

---

### Phase C Summary

| Task                   | Hours     | Status  |
| ---------------------- | --------- | ------- |
| C.1 Price Sync Service | 12-15     | Pending |
| C.2 Price Display API  | 6-8       | Pending |
| C.3 Price Display UI   | 10-12     | Pending |
| C.4 Collection Value   | 6-8       | Pending |
| **TOTAL**              | **34-43** |         |

**Deliverable:** Full-featured TCG platform with market tracking

---

## Phase D: Quality & Launch Prep (Optional)

**Duration:** 1-2 weeks
**Goal:** Production-ready quality

### D.1 Comprehensive Testing

- [ ] Unit tests for all components
- [ ] Unit tests for all hooks
- [ ] API endpoint tests
- [ ] E2E tests for critical flows
- [ ] > 70% code coverage

### D.2 Performance Optimization

- [ ] Code splitting for routes
- [ ] Image lazy loading
- [ ] API response caching
- [ ] Database query optimization
- [ ] Lighthouse audit

### D.3 Security Hardening

- [ ] HTTPS enforcement
- [ ] CSP headers
- [ ] Rate limiting on all endpoints
- [ ] Input sanitization
- [ ] Dependency audit

### D.4 Documentation

- [ ] API documentation (OpenAPI)
- [ ] User guide
- [ ] Deployment guide
- [ ] FAQ

---

## Total Effort Summary

| Phase                       | Hours       | Duration       |
| --------------------------- | ----------- | -------------- |
| Phase A: Local-First MVP    | 38-52       | 2-3 weeks      |
| Phase B: Server Persistence | 70-97       | 3-4 weeks      |
| Phase C: Market Data        | 34-43       | 2-3 weeks      |
| Phase D: Quality & Launch   | 30-40       | 1-2 weeks      |
| **TOTAL**                   | **172-232** | **8-12 weeks** |

---

## Recommended Approach

### Minimum Viable Product (Fastest Path)

**Phase A only (38-52 hours, 2-3 weeks)**

- Complete Collection and Deck Detail pages
- Add toast notifications
- Polish UI
- Deploy as static site with localStorage

### Standard MVP

**Phase A + B (108-149 hours, 5-7 weeks)**

- All of Phase A
- User authentication
- Server persistence
- Multi-user support

### Full MVP (As Described in Plan)

**Phase A + B + C (142-192 hours, 7-10 weeks)**

- All of Phase A and B
- Market value tracking
- Price history charts
- Collection value display

---

## Dependency Graph

```
Phase A (Local-First)
└── A.1 Collection Page ──┐
└── A.2 Deck Detail Page ─┼── A.4 UI/UX Polish
└── A.3 Toast System ─────┘
└── A.5 Decks Page
└── A.6 Testing Setup ────── (independent)

Phase B (Server Persistence)
└── B.1 Auth Backend ─────┬── B.2 Auth Frontend
                          │
└── B.3 Deck Persistence ─┼── B.5 GraphQL Mutations
└── B.4 Collection Persist┘
                          │
└── B.6 Integration Testing (after all B.*)

Phase C (Market Data)
└── C.1 Price Sync ───┬── C.2 Price API ──┬── C.3 Price UI
                      │                   │
                      └───────────────────┴── C.4 Collection Value
```

---

## Next Steps

1. **Start with Phase A.1** - Collection Page completion (highest impact)
2. **Then Phase A.2** - Deck Detail Page
3. **Then Phase A.3** - Toast notifications (improves UX across app)
4. **Evaluate** - Decide if local-first MVP is sufficient or proceed to Phase B

---

_This plan was created by analyzing the current codebase state against the MVP_IMPLEMENTATION_PLAN.md requirements._
