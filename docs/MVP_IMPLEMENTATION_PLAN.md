# Pokemon TCG Workspace - MVP Implementation Plan

**Target Features:**

- Store and manage decks of cards
- Store and manage ownership of cards with market value
- Easy approach to scaling features out

**Estimated Timeline:** 8-10 weeks (solo developer) | 4-6 weeks (2-person team)
**Total Effort:** 200-250 hours

---

## Table of Contents

1. [Phase 0: Foundation & Prerequisites](#phase-0-foundation--prerequisites)
2. [Phase 1: User Authentication & Authorization](#phase-1-user-authentication--authorization)
3. [Phase 2: Core API Endpoints](#phase-2-core-api-endpoints)
4. [Phase 3: Card Ownership Management](#phase-3-card-ownership-management)
5. [Phase 4: Market Value Tracking](#phase-4-market-value-tracking)
6. [Phase 5: Deck Management](#phase-5-deck-management)
7. [Phase 6: Frontend Implementation](#phase-6-frontend-implementation)
8. [Phase 7: Testing & Quality Assurance](#phase-7-testing--quality-assurance)
9. [Phase 8: Scalability & Performance](#phase-8-scalability--performance)
10. [Phase 9: Launch Preparation](#phase-9-launch-preparation)

---

## Phase 0: Foundation & Prerequisites

**Duration:** 1-2 days | **Effort:** 8-12 hours

### Overview

Set up development environment, verify infrastructure, and establish coding standards.

### Work Items

#### 0.1 Environment Setup & Verification

**Tasks:**

- [ ] Verify all Docker services start successfully
- [ ] Create `.env` files from templates
- [ ] Run database migrations and verify schema
- [ ] Execute data sync to populate card/set data
- [ ] Verify PostgreSQL contains card data (check row counts)
- [ ] Verify Neo4j contains nodes (run MATCH query)
- [ ] Test health check endpoint
- [ ] Document environment variables

**Acceptance Criteria:**

- ✅ All 4 Docker services (postgres, neo4j, tcg-api, web) are healthy
- ✅ PostgreSQL has >10,000 cards and >100 sets
- ✅ Neo4j has corresponding nodes
- ✅ `curl http://localhost:8080/health` returns 200 OK
- ✅ `.env.example` files documented for all required variables

**Files to Create/Modify:**

- `.env.postgres.database`
- `.env.neo4j.database`
- `apps/tcg-api/.env`
- `.env.example` (documentation)

---

#### 0.2 Database Schema Extensions

**Tasks:**

- [ ] Design schema for user card ownership
- [ ] Design schema for deck management
- [ ] Design schema for price history tracking
- [ ] Create migration file for new tables
- [ ] Add indexes for performance
- [ ] Document schema relationships

**New Tables Required:**

```sql
-- User card ownership with quantity tracking
CREATE TABLE user_card_inventory (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id TEXT NOT NULL REFERENCES pokemon_cards(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    condition VARCHAR(50) DEFAULT 'near_mint', -- near_mint, lightly_played, etc.
    acquired_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    purchase_price DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, card_id, condition)
);

-- Deck management
CREATE TABLE decks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    format VARCHAR(50) DEFAULT 'standard', -- standard, expanded, unlimited
    is_public BOOLEAN DEFAULT false,
    is_legal BOOLEAN DEFAULT false, -- validated against format rules
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE deck_cards (
    id SERIAL PRIMARY KEY,
    deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    card_id TEXT NOT NULL REFERENCES pokemon_cards(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    is_sideboard BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_quantity CHECK (quantity > 0 AND quantity <= 4), -- Pokemon TCG rules
    UNIQUE(deck_id, card_id, is_sideboard)
);

-- Price history for market value tracking
CREATE TABLE card_price_history (
    id SERIAL PRIMARY KEY,
    card_id TEXT NOT NULL REFERENCES pokemon_cards(id),
    market VARCHAR(50) NOT NULL, -- tcgplayer, cardmarket
    price_type VARCHAR(50) NOT NULL, -- market, low, mid, high
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_card_market_date (card_id, market, recorded_at)
);

-- Indexes for performance
CREATE INDEX idx_user_inventory_user ON user_card_inventory(user_id);
CREATE INDEX idx_user_inventory_card ON user_card_inventory(card_id);
CREATE INDEX idx_decks_user ON decks(user_id);
CREATE INDEX idx_deck_cards_deck ON deck_cards(deck_id);
CREATE INDEX idx_deck_cards_card ON deck_cards(card_id);
```

**Acceptance Criteria:**

- ✅ Migration file created: `database/migrations/001_user_features.sql`
- ✅ All tables created with proper constraints
- ✅ Foreign key relationships established
- ✅ Indexes created for query optimization
- ✅ Can run migration successfully on clean database
- ✅ Schema documented in `docs/database-schema.md`

**Files to Create:**

- `database/migrations/001_user_features.sql`
- `docs/database-schema.md`

---

#### 0.3 Neo4j Graph Schema Extensions

**Tasks:**

- [ ] Define User node structure
- [ ] Create OWNS relationship (User -> Card)
- [ ] Create HAS_DECK relationship (User -> Deck)
- [ ] Create CONTAINS relationship (Deck -> Card)
- [ ] Set up constraints and indexes
- [ ] Document Cypher queries for common operations

**Neo4j Schema:**

```cypher
// User node
CREATE CONSTRAINT user_id_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.id IS UNIQUE;

// Deck node
CREATE CONSTRAINT deck_id_unique IF NOT EXISTS
FOR (d:Deck) REQUIRE d.id IS UNIQUE;

// Relationships
// User -[:OWNS {quantity, condition, acquired_date}]-> PokemonCard
// User -[:HAS_DECK]-> Deck
// Deck -[:CONTAINS {quantity, is_sideboard}]-> PokemonCard
```

**Acceptance Criteria:**

- ✅ Constraints created for User and Deck nodes
- ✅ Relationship patterns documented
- ✅ Sample Cypher queries tested
- ✅ Graph schema visualized and documented

**Files to Create:**

- `database/neo4j-schema.cypher`
- `docs/neo4j-relationships.md`

---

#### 0.4 Project Structure & Scalability Foundation

**Tasks:**

- [ ] Create modular route structure in Rust backend
- [ ] Set up error handling framework
- [ ] Create response types/DTOs
- [ ] Set up logging configuration
- [ ] Create API versioning structure (`/api/v1`)
- [ ] Document coding standards

**Directory Structure:**

```
apps/tcg-api/src/
├── main.rs
├── routes/
│   ├── mod.rs
│   ├── auth.rs          # Authentication endpoints
│   ├── cards.rs         # Card browsing endpoints
│   ├── sets.rs          # Set endpoints
│   ├── inventory.rs     # User card ownership
│   ├── decks.rs         # Deck management
│   └── market.rs        # Price/market data
├── models/
│   ├── mod.rs
│   ├── user.rs
│   ├── card.rs
│   ├── deck.rs
│   └── inventory.rs
├── services/           # Business logic layer
│   ├── mod.rs
│   ├── auth_service.rs
│   ├── deck_service.rs
│   └── inventory_service.rs
├── middleware/
│   ├── mod.rs
│   ├── auth.rs         # JWT validation
│   └── rate_limit.rs   # Rate limiting
├── utils/
│   ├── mod.rs
│   ├── error.rs        # Custom error types
│   └── response.rs     # API response types
└── config/
    └── mod.rs          # Configuration management
```

**Acceptance Criteria:**

- ✅ Directory structure created
- ✅ Module system configured in `mod.rs` files
- ✅ Custom error types defined (ApiError enum)
- ✅ Response wrapper types created (ApiResponse<T>)
- ✅ Coding standards documented in `CONTRIBUTING.md`
- ✅ API versioning prefix configured

**Files to Create:**

- `apps/tcg-api/src/routes/mod.rs`
- `apps/tcg-api/src/services/mod.rs`
- `apps/tcg-api/src/utils/error.rs`
- `apps/tcg-api/src/utils/response.rs`
- `CONTRIBUTING.md`

---

## Phase 1: User Authentication & Authorization

**Duration:** 1 week | **Effort:** 30-40 hours

### Overview

Implement secure user registration, login, and JWT-based authentication.

### Work Items

#### 1.1 Backend: Authentication Infrastructure

**Tasks:**

- [ ] Add JWT dependencies to Rust project (`jsonwebtoken`, `bcrypt`)
- [ ] Create User model with password hashing
- [ ] Implement JWT token generation/validation
- [ ] Create authentication middleware
- [ ] Set up refresh token mechanism
- [ ] Implement password reset flow (email optional for MVP)

**Dependencies:**

```toml
# Add to apps/tcg-api/Cargo.toml
jsonwebtoken = "9.2"
bcrypt = "0.15"
serde_json = "1.0"
chrono = "0.4"
```

**Code Structure:**

```rust
// apps/tcg-api/src/models/user.rs
pub struct User {
    pub id: i32,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
}

pub struct Claims {
    pub sub: i32,        // user id
    pub username: String,
    pub exp: usize,      // expiration
}

// apps/tcg-api/src/services/auth_service.rs
pub async fn register_user(username, email, password) -> Result<User>
pub async fn login_user(email, password) -> Result<(String, String)> // (access_token, refresh_token)
pub async fn verify_token(token: &str) -> Result<Claims>
pub async fn refresh_access_token(refresh_token: &str) -> Result<String>
```

**Acceptance Criteria:**

- ✅ User can register with username, email, password
- ✅ Passwords are hashed with bcrypt (cost factor 12)
- ✅ Login returns JWT access token (15min expiry) + refresh token (7 days)
- ✅ JWT contains user_id and username claims
- ✅ Middleware validates JWT on protected routes
- ✅ Invalid/expired tokens return 401 Unauthorized
- ✅ Refresh token endpoint generates new access token
- ✅ Email validation (basic regex)
- ✅ Username uniqueness enforced
- ✅ Password minimum 8 characters

**Files to Create:**

- `apps/tcg-api/src/models/user.rs`
- `apps/tcg-api/src/services/auth_service.rs`
- `apps/tcg-api/src/middleware/auth.rs`
- `apps/tcg-api/src/routes/auth.rs`

---

#### 1.2 Backend: Authentication Endpoints

**Tasks:**

- [ ] Implement POST `/api/v1/auth/register`
- [ ] Implement POST `/api/v1/auth/login`
- [ ] Implement POST `/api/v1/auth/refresh`
- [ ] Implement POST `/api/v1/auth/logout` (invalidate refresh token)
- [ ] Implement GET `/api/v1/auth/me` (get current user)
- [ ] Add request validation
- [ ] Add rate limiting (5 attempts per minute for login)

**API Specifications:**

```yaml
POST /api/v1/auth/register
Request:
  {
    "username": "string (3-30 chars)",
    "email": "string (valid email)",
    "password": "string (8-100 chars)"
  }
Response: 201
  {
    "user": {
      "id": 1,
      "username": "trainer_ash",
      "email": "ash@pokemon.com",
      "created_at": "2025-12-27T10:00:00Z"
    },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }

POST /api/v1/auth/login
Request:
  {
    "email": "string",
    "password": "string"
  }
Response: 200
  {
    "user": { ... },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }

POST /api/v1/auth/refresh
Request:
  {
    "refresh_token": "string"
  }
Response: 200
  {
    "access_token": "eyJ..."
  }

GET /api/v1/auth/me
Headers:
  Authorization: Bearer <access_token>
Response: 200
  {
    "id": 1,
    "username": "trainer_ash",
    "email": "ash@pokemon.com",
    "created_at": "2025-12-27T10:00:00Z"
  }
```

**Acceptance Criteria:**

- ✅ All endpoints return proper HTTP status codes
- ✅ Validation errors return 400 with descriptive messages
- ✅ Duplicate username/email returns 409 Conflict
- ✅ Invalid credentials return 401 Unauthorized
- ✅ Rate limiting triggers after 5 failed login attempts
- ✅ CORS headers allow frontend origin
- ✅ Passwords never returned in responses
- ✅ All endpoints tested with curl/Postman

**Files to Modify:**

- `apps/tcg-api/src/routes/auth.rs`
- `apps/tcg-api/src/main.rs` (register routes)

---

#### 1.3 Frontend: Authentication UI

**Tasks:**

- [ ] Create AuthContext for global auth state
- [ ] Build Login page component
- [ ] Build Register page component
- [ ] Create ProtectedRoute wrapper component
- [ ] Implement token storage (localStorage/cookies)
- [ ] Create auth API client service
- [ ] Add auth state to Header (Login/Logout buttons)
- [ ] Implement automatic token refresh

**Components:**

```
apps/web/src/
├── contexts/
│   └── AuthContext.tsx
├── pages/
│   ├── Login.tsx
│   └── Register.tsx
├── components/
│   ├── ProtectedRoute.tsx
│   └── Header.tsx (modify)
├── services/
│   └── auth.service.ts
└── hooks/
    └── useAuth.ts
```

**Acceptance Criteria:**

- ✅ Login form with email/password fields
- ✅ Register form with username/email/password fields
- ✅ Form validation with error messages
- ✅ Successful login stores token and redirects to dashboard
- ✅ Logout clears token and redirects to home
- ✅ Protected routes redirect to login if not authenticated
- ✅ Header shows username when logged in
- ✅ Token automatically refreshed before expiry
- ✅ Loading states during API calls
- ✅ Error messages displayed for failed requests

**Files to Create:**

- `apps/web/src/contexts/AuthContext.tsx`
- `apps/web/src/pages/Login.tsx`
- `apps/web/src/pages/Register.tsx`
- `apps/web/src/components/ProtectedRoute.tsx`
- `apps/web/src/services/auth.service.ts`
- `apps/web/src/hooks/useAuth.ts`

---

## Phase 2: Core API Endpoints

**Duration:** 1 week | **Effort:** 25-35 hours

### Overview

Implement foundational card and set browsing endpoints.

### Work Items

#### 2.1 Backend: Card Endpoints

**Tasks:**

- [ ] Implement GET `/api/v1/cards` (list with pagination)
- [ ] Implement GET `/api/v1/cards/:id` (single card)
- [ ] Implement GET `/api/v1/cards/search` (text search)
- [ ] Add filtering (type, rarity, set_id, supertype)
- [ ] Add sorting (name, hp, release_date)
- [ ] Optimize queries with proper indexes
- [ ] Add response caching headers

**API Specifications:**

```yaml
GET /api/v1/cards?page=1&limit=20&type=Fire&rarity=Rare&sort=name
Response: 200
  {
    "data": [
      {
        "id": "xy1-1",
        "name": "Charizard",
        "supertype": "Pokémon",
        "subtypes": ["Stage 2"],
        "types": ["Fire"],
        "hp": "180",
        "set": {
          "id": "xy1",
          "name": "XY Base Set",
          "series": "XY",
          "images": { ... }
        },
        "images": {
          "small": "https://...",
          "large": "https://..."
        },
        "tcgplayer": {
          "url": "https://...",
          "prices": { "holofoil": { "market": 45.99 } }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total_pages": 500,
      "total_count": 10000
    }
  }

GET /api/v1/cards/search?q=pikachu&limit=10
Response: 200
  {
    "data": [ ... ],  // Cards matching "pikachu"
    "count": 47
  }
```

**Acceptance Criteria:**

- ✅ Pagination works correctly (default limit: 20, max: 100)
- ✅ Filters can be combined (type=Fire&rarity=Rare)
- ✅ Search is case-insensitive and partial match
- ✅ Invalid card ID returns 404
- ✅ Response time < 200ms for paginated queries
- ✅ Cache-Control headers set (5 minutes for card data)
- ✅ All fields properly serialized to JSON

**Files to Create:**

- `apps/tcg-api/src/routes/cards.rs`
- `apps/tcg-api/src/models/card.rs` (extend existing)

---

#### 2.2 Backend: Set Endpoints

**Tasks:**

- [ ] Implement GET `/api/v1/sets` (list all sets)
- [ ] Implement GET `/api/v1/sets/:id` (single set)
- [ ] Implement GET `/api/v1/sets/:id/cards` (all cards in set)
- [ ] Add sorting by release_date
- [ ] Add series filtering

**API Specifications:**

```yaml
GET /api/v1/sets?series=XY&sort=release_date
Response: 200
  {
    "data": [
      {
        "id": "xy1",
        "name": "XY Base Set",
        "series": "XY",
        "total": 146,
        "printed_total": 146,
        "release_date": "2014-02-05",
        "images": {
          "symbol": "https://...",
          "logo": "https://..."
        }
      }
    ],
    "count": 11
  }

GET /api/v1/sets/xy1/cards?page=1&limit=50
Response: 200
  {
    "data": [ ... ],  // All cards in XY Base Set
    "pagination": { ... }
  }
```

**Acceptance Criteria:**

- ✅ All sets returned with correct data
- ✅ Sets sorted by release_date (newest first by default)
- ✅ Set detail includes card count
- ✅ Cards in set properly paginated
- ✅ Invalid set ID returns 404

**Files to Create:**

- `apps/tcg-api/src/routes/sets.rs`
- `apps/tcg-api/src/models/set.rs` (extend existing)

---

#### 2.3 Frontend: Card & Set Browsing

**Tasks:**

- [ ] Create CardList page
- [ ] Create CardDetail page
- [ ] Create SetList page
- [ ] Create SetDetail page
- [ ] Build FilterBar component
- [ ] Build PaginationControls component
- [ ] Build CardGrid component
- [ ] Build CardCard component (single card display)
- [ ] Implement API integration with React Query
- [ ] Add loading skeletons

**Acceptance Criteria:**

- ✅ Card list displays in grid layout (4 columns desktop)
- ✅ Filters update URL query params
- ✅ Pagination maintains filter state
- ✅ Card images lazy-load
- ✅ Clicking card navigates to detail page
- ✅ Card detail shows all attributes (attacks, abilities, etc.)
- ✅ Set list shows logos and card counts
- ✅ Loading states display skeletons
- ✅ Empty states show helpful messages
- ✅ Responsive design (mobile-friendly)

**Files to Create:**

- `apps/web/src/pages/CardList.tsx`
- `apps/web/src/pages/CardDetail.tsx`
- `apps/web/src/pages/SetList.tsx`
- `apps/web/src/pages/SetDetail.tsx`
- `apps/web/src/components/CardGrid.tsx`
- `apps/web/src/components/CardCard.tsx`
- `apps/web/src/components/FilterBar.tsx`
- `apps/web/src/components/PaginationControls.tsx`
- `apps/web/src/services/cards.service.ts`

---

## Phase 3: Card Ownership Management

**Duration:** 1.5 weeks | **Effort:** 35-45 hours

### Overview

Enable users to track which cards they own, including quantity and condition.

### Work Items

#### 3.1 Backend: Inventory Models & Services

**Tasks:**

- [ ] Create UserCardInventory model in Rust
- [ ] Implement inventory service layer
- [ ] Add validation for card conditions
- [ ] Implement quantity management logic
- [ ] Add Neo4j OWNS relationship creation

**Code Structure:**

```rust
// apps/tcg-api/src/models/inventory.rs
pub struct UserCardInventory {
    pub id: i32,
    pub user_id: i32,
    pub card_id: String,
    pub quantity: i32,
    pub condition: CardCondition,
    pub acquired_date: DateTime<Utc>,
    pub purchase_price: Option<f64>,
    pub notes: Option<String>,
}

pub enum CardCondition {
    Mint,
    NearMint,
    LightlyPlayed,
    ModeratelyPlayed,
    HeavilyPlayed,
    Damaged,
}

// apps/tcg-api/src/services/inventory_service.rs
pub async fn add_card_to_inventory(user_id, card_id, quantity, condition, price) -> Result<UserCardInventory>
pub async fn remove_card_from_inventory(user_id, inventory_id) -> Result<()>
pub async fn update_card_quantity(inventory_id, quantity) -> Result<UserCardInventory>
pub async fn get_user_inventory(user_id, filters) -> Result<Vec<UserCardInventory>>
pub async fn get_inventory_value(user_id) -> Result<f64>
```

**Acceptance Criteria:**

- ✅ Models map to database schema correctly
- ✅ CardCondition enum validated
- ✅ Quantity must be >= 1
- ✅ Purchase price is optional
- ✅ Business logic isolated in service layer
- ✅ Neo4j OWNS relationship created on add
- ✅ Relationship deleted on remove

**Files to Create:**

- `apps/tcg-api/src/models/inventory.rs`
- `apps/tcg-api/src/services/inventory_service.rs`

---

#### 3.2 Backend: Inventory API Endpoints

**Tasks:**

- [ ] Implement POST `/api/v1/inventory/cards` (add card to collection)
- [ ] Implement GET `/api/v1/inventory/cards` (get user's collection)
- [ ] Implement PATCH `/api/v1/inventory/cards/:id` (update quantity/condition)
- [ ] Implement DELETE `/api/v1/inventory/cards/:id` (remove card)
- [ ] Implement GET `/api/v1/inventory/stats` (collection statistics)
- [ ] Add authentication middleware to all endpoints
- [ ] Add pagination for collection listing

**API Specifications:**

```yaml
POST /api/v1/inventory/cards
Headers:
  Authorization: Bearer <token>
Request:
  {
    "card_id": "xy1-1",
    "quantity": 2,
    "condition": "near_mint",
    "purchase_price": 45.99,
    "notes": "Pulled from booster pack"
  }
Response: 201
  {
    "id": 123,
    "user_id": 1,
    "card_id": "xy1-1",
    "quantity": 2,
    "condition": "near_mint",
    "purchase_price": 45.99,
    "current_market_value": 52.00,
    "acquired_date": "2025-12-27T10:00:00Z",
    "card": {
      "name": "Charizard",
      "images": { ... }
    }
  }

GET /api/v1/inventory/cards?page=1&limit=50&set=xy1&sort=value
Headers:
  Authorization: Bearer <token>
Response: 200
  {
    "data": [ ... ],
    "pagination": { ... },
    "total_value": 1250.50
  }

GET /api/v1/inventory/stats
Response: 200
  {
    "total_cards": 347,
    "unique_cards": 215,
    "total_value": 1250.50,
    "value_by_set": [
      { "set": "Base Set", "value": 450.00 },
      ...
    ],
    "condition_breakdown": {
      "mint": 45,
      "near_mint": 120,
      "lightly_played": 50
    }
  }
```

**Acceptance Criteria:**

- ✅ Only authenticated users can access inventory
- ✅ Users can only view/modify their own inventory
- ✅ Adding duplicate card updates quantity (not creates new row)
- ✅ Deleting card with quantity > 1 decreases quantity
- ✅ Invalid card_id returns 404
- ✅ Stats calculated correctly across all owned cards
- ✅ Collection can be filtered by set, type, rarity
- ✅ Sorting works (by value, name, acquired_date)

**Files to Create:**

- `apps/tcg-api/src/routes/inventory.rs`

---

#### 3.3 Frontend: Collection Management UI

**Tasks:**

- [ ] Create MyCollection page (list view)
- [ ] Create AddCardModal component
- [ ] Create InventoryCard component (shows quantity, value)
- [ ] Create CollectionStats widget
- [ ] Implement "Add to Collection" button on card detail page
- [ ] Add quantity adjustment controls (+ / -)
- [ ] Build collection value chart (optional: use Chart.js)
- [ ] Add bulk import via CSV (optional for MVP)

**Components:**

```
apps/web/src/pages/
├── MyCollection.tsx
└── CollectionStats.tsx

apps/web/src/components/
├── AddCardModal.tsx
├── InventoryCard.tsx
├── CollectionValueChart.tsx
└── QuantityControls.tsx
```

**Acceptance Criteria:**

- ✅ Collection page shows all owned cards with images
- ✅ Each card displays: quantity, condition, purchase price, current value
- ✅ Can add card from detail page with condition selector
- ✅ Can adjust quantity with +/- buttons
- ✅ Can delete card from collection
- ✅ Stats widget shows: total cards, unique cards, total value
- ✅ Collection filterable by set, type, condition
- ✅ Loading states during API operations
- ✅ Success/error toasts for actions
- ✅ Optimistic UI updates for quantity changes

**Files to Create:**

- `apps/web/src/pages/MyCollection.tsx`
- `apps/web/src/pages/CollectionStats.tsx`
- `apps/web/src/components/AddCardModal.tsx`
- `apps/web/src/components/InventoryCard.tsx`
- `apps/web/src/services/inventory.service.ts`

---

#### 3.4 Neo4j Graph Queries for Ownership

**Tasks:**

- [ ] Implement Cypher queries for ownership traversal
- [ ] Create endpoint to get collection as graph
- [ ] Build visualization of card relationships (optional)
- [ ] Add graph-based recommendations (cards to complete set)

**Cypher Queries:**

```cypher
// Get all cards owned by user
MATCH (u:User {id: $user_id})-[o:OWNS]->(c:PokemonCard)
RETURN c, o.quantity, o.condition

// Find missing cards from sets user collects
MATCH (u:User {id: $user_id})-[:OWNS]->(c:PokemonCard)-[:BELONGS_TO]->(s:PokemonCardSet)
WITH s, COUNT(DISTINCT c) as owned
MATCH (s)<-[:BELONGS_TO]-(all:PokemonCard)
WITH s, owned, COUNT(all) as total
WHERE owned < total
RETURN s.name, owned, total, (total - owned) as missing

// Recommend next cards to collect (cards in sets user already collects)
MATCH (u:User {id: $user_id})-[:OWNS]->(:PokemonCard)-[:BELONGS_TO]->(s:PokemonCardSet)
MATCH (s)<-[:BELONGS_TO]-(rec:PokemonCard)
WHERE NOT (u)-[:OWNS]->(rec)
RETURN rec, s
LIMIT 10
```

**Acceptance Criteria:**

- ✅ Graph queries return correct ownership data
- ✅ Can retrieve collection with relationships
- ✅ Missing cards query accurate
- ✅ Recommendations based on collecting patterns
- ✅ Query performance < 500ms for users with <1000 cards

**Files to Create:**

- `packages/@database/neo4j/src/queries/ownership.ts`
- `apps/tcg-api/src/routes/graph.rs` (optional)

---

## Phase 4: Market Value Tracking

**Duration:** 1 week | **Effort:** 25-30 hours

### Overview

Track card market values over time and display in user inventory.

### Work Items

#### 4.1 Backend: Price Data Sync Service

**Tasks:**

- [ ] Create price sync script (extends existing db:sync)
- [ ] Parse TCGPlayer prices from card data
- [ ] Parse Cardmarket prices from card data
- [ ] Insert into card_price_history table
- [ ] Schedule daily price updates (cron job or background task)
- [ ] Calculate price trends (7-day, 30-day change)

**Code Structure:**

```typescript
// apps/scripts/src/commands/sync-prices.ts
async function syncPrices() {
  const cards = await getAllCards();

  for (const card of cards) {
    if (card.tcgplayer?.prices) {
      await savePriceHistory({
        card_id: card.id,
        market: 'tcgplayer',
        price_type: 'market',
        price: card.tcgplayer.prices.holofoil?.market,
        recorded_at: new Date()
      });
    }

    if (card.cardmarket?.prices) {
      await savePriceHistory({
        card_id: card.id,
        market: 'cardmarket',
        price_type: 'averageSellPrice',
        price: card.cardmarket.prices.averageSellPrice,
        recorded_at: new Date()
      });
    }
  }
}
```

**Acceptance Criteria:**

- ✅ Script runs successfully and inserts price records
- ✅ Duplicate price checks (don't insert same price multiple times per day)
- ✅ Handles missing price data gracefully
- ✅ Logs progress and errors
- ✅ Can be run manually or via cron
- ✅ Performance: processes 10,000 cards in < 5 minutes

**Files to Create:**

- `apps/scripts/src/commands/sync-prices.ts`
- `packages/@database/postgres/src/queries/prices.ts`

---

#### 4.2 Backend: Price API Endpoints

**Tasks:**

- [ ] Implement GET `/api/v1/cards/:id/prices` (price history)
- [ ] Implement GET `/api/v1/cards/:id/prices/current` (latest price)
- [ ] Add price trends calculation
- [ ] Cache price data (Redis optional, or in-memory)

**API Specifications:**

```yaml
GET /api/v1/cards/xy1-1/prices?market=tcgplayer&days=30
Response: 200
  {
    "card_id": "xy1-1",
    "market": "tcgplayer",
    "current_price": 52.00,
    "price_history": [
      {
        "date": "2025-12-27",
        "price": 52.00
      },
      {
        "date": "2025-12-26",
        "price": 50.50
      },
      ...
    ],
    "trends": {
      "7_day_change": 2.50,
      "7_day_change_percent": 5.05,
      "30_day_change": 7.00,
      "30_day_change_percent": 15.56
    }
  }

GET /api/v1/cards/xy1-1/prices/current
Response: 200
  {
    "tcgplayer": {
      "market": 52.00,
      "low": 45.00,
      "mid": 50.00,
      "high": 60.00,
      "updated_at": "2025-12-27T10:00:00Z"
    },
    "cardmarket": {
      "averageSellPrice": 48.00,
      "lowPrice": 42.00,
      "updated_at": "2025-12-27T09:00:00Z"
    }
  }
```

**Acceptance Criteria:**

- ✅ Price history returns correct data points
- ✅ Trends calculated accurately
- ✅ Current prices from both markets
- ✅ Data cached for 1 hour
- ✅ Missing price data returns empty array (not error)

**Files to Create:**

- `apps/tcg-api/src/routes/market.rs`
- `apps/tcg-api/src/services/market_service.rs`

---

#### 4.3 Frontend: Price Display & Charts

**Tasks:**

- [ ] Add current price to CardDetail page
- [ ] Create PriceHistoryChart component (line chart)
- [ ] Show price trends with +/- indicators
- [ ] Display price on InventoryCard
- [ ] Calculate and display total collection value
- [ ] Add price alerts (optional: notify when card reaches target price)

**Components:**

```
apps/web/src/components/
├── PriceHistoryChart.tsx
├── PriceBadge.tsx
└── CollectionValueSummary.tsx
```

**Acceptance Criteria:**

- ✅ Card detail page shows current market price
- ✅ Price history chart displays 30-day trend
- ✅ Trend indicators show % change (green up, red down)
- ✅ Collection page shows total value at top
- ✅ Value updates when prices refresh
- ✅ Chart responsive on mobile
- ✅ Prices formatted with currency ($XX.XX)

**Files to Create:**

- `apps/web/src/components/PriceHistoryChart.tsx`
- `apps/web/src/components/PriceBadge.tsx`
- `apps/web/src/components/CollectionValueSummary.tsx`

---

#### 4.4 Background Job for Price Updates

**Tasks:**

- [ ] Set up cron job in Docker Compose
- [ ] Create background task runner (or use system cron)
- [ ] Schedule daily price sync (e.g., 2 AM UTC)
- [ ] Add monitoring/alerting for failed syncs
- [ ] Document maintenance procedures

**Docker Compose:**

```yaml
services:
  price-sync:
    build:
      context: .
      dockerfile: Dockerfile.scripts
    command: bun run sync-prices
    depends_on:
      - postgres
      - neo4j
    environment:
      - CRON_SCHEDULE=0 2 * * * # Daily at 2 AM UTC
    restart: unless-stopped
```

**Acceptance Criteria:**

- ✅ Cron job runs daily automatically
- ✅ Logs written to file or stdout
- ✅ Failed syncs send alert (email or Slack)
- ✅ Can be triggered manually via script
- ✅ Doesn't block other services

**Files to Create:**

- `Dockerfile.scripts`
- `apps/scripts/entrypoint.sh`

---

## Phase 5: Deck Management

**Duration:** 2 weeks | **Effort:** 50-60 hours

### Overview

Allow users to create, edit, and manage Pokemon TCG decks with validation.

### Work Items

#### 5.1 Backend: Deck Models & Services

**Tasks:**

- [ ] Create Deck and DeckCard models
- [ ] Implement deck validation rules (Pokemon TCG format)
- [ ] Create deck service layer
- [ ] Add Neo4j HAS_DECK and CONTAINS relationships
- [ ] Implement deck legality checker

**Pokemon TCG Deck Rules:**

- Exactly 60 cards in deck (main deck)
- Maximum 4 copies of any card (except basic Energy)
- Must have at least 1 Basic Pokemon
- Format-specific rules (Standard, Expanded, Unlimited)

**Code Structure:**

```rust
// apps/tcg-api/src/models/deck.rs
pub struct Deck {
    pub id: i32,
    pub user_id: i32,
    pub name: String,
    pub description: Option<String>,
    pub format: DeckFormat,
    pub is_public: bool,
    pub is_legal: bool,
}

pub enum DeckFormat {
    Standard,
    Expanded,
    Unlimited,
}

pub struct DeckCard {
    pub id: i32,
    pub deck_id: i32,
    pub card_id: String,
    pub quantity: i32,
    pub is_sideboard: bool,
}

// apps/tcg-api/src/services/deck_service.rs
pub async fn create_deck(user_id, name, format) -> Result<Deck>
pub async fn add_card_to_deck(deck_id, card_id, quantity) -> Result<DeckCard>
pub async fn remove_card_from_deck(deck_id, card_id) -> Result<()>
pub async fn validate_deck(deck_id) -> Result<DeckValidation>
pub async fn get_user_decks(user_id) -> Result<Vec<Deck>>
pub async fn clone_deck(deck_id, new_name) -> Result<Deck>

pub struct DeckValidation {
    pub is_legal: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub card_count: i32,
    pub has_basic_pokemon: bool,
}
```

**Acceptance Criteria:**

- ✅ Deck model maps to schema
- ✅ Validation enforces 60-card limit
- ✅ Validation enforces 4-copy limit
- ✅ Validation checks for Basic Pokemon
- ✅ Format rules applied correctly
- ✅ Neo4j relationships created
- ✅ Service methods isolated from routes

**Files to Create:**

- `apps/tcg-api/src/models/deck.rs`
- `apps/tcg-api/src/services/deck_service.rs`
- `apps/tcg-api/src/utils/deck_validator.rs`

---

#### 5.2 Backend: Deck API Endpoints

**Tasks:**

- [ ] Implement POST `/api/v1/decks` (create deck)
- [ ] Implement GET `/api/v1/decks` (list user's decks)
- [ ] Implement GET `/api/v1/decks/:id` (get deck details)
- [ ] Implement PATCH `/api/v1/decks/:id` (update name/description)
- [ ] Implement DELETE `/api/v1/decks/:id` (delete deck)
- [ ] Implement POST `/api/v1/decks/:id/cards` (add card to deck)
- [ ] Implement DELETE `/api/v1/decks/:id/cards/:card_id` (remove card)
- [ ] Implement PATCH `/api/v1/decks/:id/cards/:card_id` (update quantity)
- [ ] Implement POST `/api/v1/decks/:id/validate` (check legality)
- [ ] Implement POST `/api/v1/decks/:id/clone` (duplicate deck)
- [ ] Implement GET `/api/v1/decks/public` (browse public decks)

**API Specifications:**

```yaml
POST /api/v1/decks
Request:
  {
    "name": "Fire Deck",
    "description": "Charizard-focused deck",
    "format": "standard",
    "is_public": false
  }
Response: 201
  {
    "id": 1,
    "user_id": 1,
    "name": "Fire Deck",
    "description": "Charizard-focused deck",
    "format": "standard",
    "is_public": false,
    "is_legal": false,
    "card_count": 0,
    "created_at": "2025-12-27T10:00:00Z"
  }

POST /api/v1/decks/1/cards
Request:
  {
    "card_id": "xy1-1",
    "quantity": 2
  }
Response: 201
  {
    "id": 1,
    "deck_id": 1,
    "card_id": "xy1-1",
    "quantity": 2,
    "card": {
      "name": "Charizard",
      "images": { ... }
    }
  }

POST /api/v1/decks/1/validate
Response: 200
  {
    "is_legal": false,
    "card_count": 45,
    "errors": [
      "Deck must contain exactly 60 cards (currently 45)",
      "Deck must contain at least 1 Basic Pokémon"
    ],
    "warnings": [
      "Consider adding more Trainer cards"
    ]
  }

GET /api/v1/decks/public?format=standard&sort=popular
Response: 200
  {
    "data": [
      {
        "id": 5,
        "name": "Meta Charizard",
        "user": { "username": "trainer_ash" },
        "format": "standard",
        "card_count": 60,
        "is_legal": true,
        "likes": 45,
        "views": 1200
      }
    ],
    "pagination": { ... }
  }
```

**Acceptance Criteria:**

- ✅ Only deck owner can modify/delete deck
- ✅ Adding card beyond 4 copies returns 400 error
- ✅ Validation returns detailed error messages
- ✅ Public decks browsable by anyone
- ✅ Private decks only visible to owner
- ✅ Deck clone creates independent copy
- ✅ Removing card updates deck card_count
- ✅ All endpoints properly authenticated

**Files to Create:**

- `apps/tcg-api/src/routes/decks.rs`

---

#### 5.3 Frontend: Deck Builder UI

**Tasks:**

- [ ] Create MyDecks page (list all decks)
- [ ] Create DeckBuilder page (visual deck editor)
- [ ] Create DeckView page (read-only deck display)
- [ ] Build DeckCard component (shows mana curve, type distribution)
- [ ] Build CardSelector modal (add cards to deck)
- [ ] Create DeckStats widget (card count, legality status)
- [ ] Implement drag-and-drop card adding (optional)
- [ ] Add export to text list feature
- [ ] Add import from text list feature

**Components:**

```
apps/web/src/pages/
├── MyDecks.tsx
├── DeckBuilder.tsx
└── DeckView.tsx

apps/web/src/components/
├── DeckCard.tsx
├── DeckList.tsx
├── CardSelector.tsx
├── DeckStats.tsx
├── DeckValidationPanel.tsx
└── TypeDistributionChart.tsx
```

**UI Features:**

- Deck list shows: name, format, card count, legality badge
- Deck builder has 3 sections: deck list, card browser, stats
- Visual indicators for card limits (4 copies)
- Real-time validation feedback
- Type distribution pie chart
- Mana curve histogram (by Energy cost)

**Acceptance Criteria:**

- ✅ Can create new deck from MyDecks page
- ✅ Deck builder shows all deck cards with quantities
- ✅ Can search and add cards from browser
- ✅ Quantity controls work (+/- buttons)
- ✅ Validation errors displayed in red panel
- ✅ Legality badge shows green (legal) or red (illegal)
- ✅ Stats update in real-time as cards added
- ✅ Can clone deck with new name
- ✅ Can delete deck with confirmation modal
- ✅ Export deck as text list (CSV or plaintext)
- ✅ Import deck from text list

**Files to Create:**

- `apps/web/src/pages/MyDecks.tsx`
- `apps/web/src/pages/DeckBuilder.tsx`
- `apps/web/src/pages/DeckView.tsx`
- `apps/web/src/components/DeckCard.tsx`
- `apps/web/src/components/CardSelector.tsx`
- `apps/web/src/components/DeckStats.tsx`
- `apps/web/src/components/DeckValidationPanel.tsx`
- `apps/web/src/services/decks.service.ts`

---

#### 5.4 Neo4j Deck Relationships & Queries

**Tasks:**

- [ ] Create HAS_DECK relationship (User -> Deck)
- [ ] Create CONTAINS relationship (Deck -> Card with quantity)
- [ ] Implement deck recommendation queries
- [ ] Find similar decks based on card overlap
- [ ] Suggest cards for deck based on archetypes

**Cypher Queries:**

```cypher
// Create deck relationships
MATCH (u:User {id: $user_id})
CREATE (u)-[:HAS_DECK]->(d:Deck {
  id: $deck_id,
  name: $name,
  format: $format
})

// Add card to deck
MATCH (d:Deck {id: $deck_id}), (c:PokemonCard {id: $card_id})
CREATE (d)-[:CONTAINS {quantity: $quantity}]->(c)

// Find similar decks (based on shared cards)
MATCH (d1:Deck {id: $deck_id})-[:CONTAINS]->(c:PokemonCard)<-[:CONTAINS]-(d2:Deck)
WHERE d1 <> d2 AND d2.is_public = true
WITH d2, COUNT(DISTINCT c) as shared_cards
WHERE shared_cards > 20
RETURN d2, shared_cards
ORDER BY shared_cards DESC
LIMIT 5

// Suggest cards for deck (cards frequently used with current cards)
MATCH (d:Deck {id: $deck_id})-[:CONTAINS]->(my_cards:PokemonCard)
MATCH (my_cards)<-[:CONTAINS]-(other_decks:Deck)-[:CONTAINS]->(suggestions:PokemonCard)
WHERE NOT (d)-[:CONTAINS]->(suggestions)
  AND other_decks.format = d.format
WITH suggestions, COUNT(DISTINCT other_decks) as frequency
RETURN suggestions, frequency
ORDER BY frequency DESC
LIMIT 10
```

**Acceptance Criteria:**

- ✅ Deck nodes created in Neo4j
- ✅ CONTAINS relationships have quantity property
- ✅ Similar decks query returns relevant results
- ✅ Card suggestions based on deck archetype
- ✅ Queries perform well (< 500ms)

**Files to Create:**

- `packages/@database/neo4j/src/queries/decks.ts`
- `apps/tcg-api/src/routes/recommendations.rs` (optional)

---

## Phase 6: Frontend Implementation

**Duration:** 2 weeks | **Effort:** 45-55 hours

### Overview

Complete all frontend pages and user experiences.

### Work Items

#### 6.1 Routing & Navigation

**Tasks:**

- [ ] Install and configure React Router
- [ ] Define all routes
- [ ] Update Header with navigation links
- [ ] Create breadcrumb component
- [ ] Implement 404 page
- [ ] Add loading page/spinner

**Routes:**

```typescript
// apps/web/src/App.tsx
const routes = [
  { path: '/', element: <Home /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/cards', element: <CardList /> },
  { path: '/cards/:id', element: <CardDetail /> },
  { path: '/sets', element: <SetList /> },
  { path: '/sets/:id', element: <SetDetail /> },
  { path: '/collection', element: <MyCollection />, protected: true },
  { path: '/collection/stats', element: <CollectionStats />, protected: true },
  { path: '/decks', element: <MyDecks />, protected: true },
  { path: '/decks/new', element: <DeckBuilder />, protected: true },
  { path: '/decks/:id', element: <DeckView />, protected: true },
  { path: '/decks/:id/edit', element: <DeckBuilder />, protected: true },
  { path: '/profile', element: <Profile />, protected: true },
  { path: '*', element: <NotFound /> },
];
```

**Acceptance Criteria:**

- ✅ All routes navigate correctly
- ✅ Protected routes redirect to login
- ✅ Header highlights active page
- ✅ Breadcrumbs show current location
- ✅ 404 page displays for invalid routes
- ✅ Browser back/forward work correctly

**Files to Create:**

- `apps/web/src/routes.tsx`
- `apps/web/src/pages/Home.tsx`
- `apps/web/src/pages/NotFound.tsx`
- `apps/web/src/components/Breadcrumb.tsx`

---

#### 6.2 State Management

**Tasks:**

- [ ] Set up React Query for server state
- [ ] Configure cache invalidation strategies
- [ ] Create custom hooks for all API calls
- [ ] Implement optimistic updates for mutations
- [ ] Add error boundaries

**Custom Hooks:**

```typescript
// apps/web/src/hooks/
useCards(filters);
useCard(id);
useSets();
useSet(id);
useInventory(filters);
useAddToInventory();
useUpdateInventory();
useDecks();
useDeck(id);
useAddCardToDeck();
useValidateDeck();
```

**Acceptance Criteria:**

- ✅ React Query installed and configured
- ✅ All API calls use custom hooks
- ✅ Loading states handled globally
- ✅ Error states trigger error boundaries
- ✅ Cache invalidated on mutations
- ✅ Optimistic updates for UX

**Files to Create:**

- `apps/web/src/lib/react-query.ts`
- `apps/web/src/hooks/useCards.ts`
- `apps/web/src/hooks/useInventory.ts`
- `apps/web/src/hooks/useDecks.ts`
- `apps/web/src/components/ErrorBoundary.tsx`

---

#### 6.3 UI/UX Polish

**Tasks:**

- [ ] Implement loading skeletons for all pages
- [ ] Add toast notifications (success/error messages)
- [ ] Create empty states for all lists
- [ ] Add confirmation modals for destructive actions
- [ ] Implement search with debouncing
- [ ] Add keyboard shortcuts (optional)
- [ ] Ensure accessibility (ARIA labels, focus management)
- [ ] Test responsive design on mobile

**UI Library (optional):**
Consider adding a component library like:

- Radix UI + Tailwind CSS
- Chakra UI
- Material UI
- Or continue with Pico CSS + custom components

**Acceptance Criteria:**

- ✅ All lists show skeleton loaders
- ✅ Toasts appear for actions (added to collection, deck created, etc.)
- ✅ Empty states have helpful CTAs
- ✅ Delete actions require confirmation
- ✅ Search input debounced (300ms)
- ✅ Mobile-responsive (breakpoints: 640px, 768px, 1024px)
- ✅ Keyboard navigation works
- ✅ Screen reader accessible

**Files to Create:**

- `apps/web/src/components/Skeleton.tsx`
- `apps/web/src/components/Toast.tsx`
- `apps/web/src/components/EmptyState.tsx`
- `apps/web/src/components/ConfirmModal.tsx`
- `apps/web/src/hooks/useDebounce.ts`

---

#### 6.4 Home Page & Dashboard

**Tasks:**

- [ ] Design home page layout
- [ ] Show featured/recent cards
- [ ] Display collection summary (if logged in)
- [ ] Show recent decks
- [ ] Add quick actions (browse cards, build deck)
- [ ] Display trending cards (most added to collections)

**Acceptance Criteria:**

- ✅ Home page loads in < 1 second
- ✅ Featured cards rotate daily
- ✅ Logged-in users see personalized dashboard
- ✅ Quick actions navigate correctly
- ✅ Trending section updates weekly

**Files to Create:**

- `apps/web/src/pages/Home.tsx`
- `apps/web/src/components/FeaturedCards.tsx`
- `apps/web/src/components/QuickActions.tsx`

---

## Phase 7: Testing & Quality Assurance

**Duration:** 1.5 weeks | **Effort:** 35-45 hours

### Overview

Comprehensive testing to ensure quality and reliability.

### Work Items

#### 7.1 Backend Unit Tests (Rust)

**Tasks:**

- [ ] Set up test framework (built-in Rust testing)
- [ ] Write tests for auth service
- [ ] Write tests for inventory service
- [ ] Write tests for deck service
- [ ] Write tests for deck validation logic
- [ ] Mock database for tests
- [ ] Aim for >70% code coverage

**Test Structure:**

```rust
// apps/tcg-api/src/services/deck_service.rs
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_deck() {
        let deck = create_deck(1, "Test Deck", DeckFormat::Standard).await.unwrap();
        assert_eq!(deck.name, "Test Deck");
        assert_eq!(deck.is_legal, false);
    }

    #[tokio::test]
    async fn test_deck_validation_card_limit() {
        let result = validate_deck_with_61_cards().await;
        assert!(result.errors.contains(&"Deck must contain exactly 60 cards".to_string()));
    }
}
```

**Acceptance Criteria:**

- ✅ All service methods have tests
- ✅ Edge cases covered (empty deck, over-limit, etc.)
- ✅ Tests run with `cargo test`
- ✅ All tests pass
- ✅ Code coverage >70%

**Files to Create:**

- Tests in `apps/tcg-api/src/services/*_test.rs`
- Tests in `apps/tcg-api/src/utils/*_test.rs`

---

#### 7.2 Frontend Unit Tests (React)

**Tasks:**

- [ ] Set up Vitest or Jest
- [ ] Install React Testing Library
- [ ] Write tests for auth components
- [ ] Write tests for deck builder logic
- [ ] Write tests for custom hooks
- [ ] Mock API calls
- [ ] Aim for >60% code coverage

**Test Examples:**

```typescript
// apps/web/src/components/DeckStats.test.tsx
import { render, screen } from '@testing-library/react';
import { DeckStats } from './DeckStats';

describe('DeckStats', () => {
  it('displays card count', () => {
    render(<DeckStats cards={mockCards} />);
    expect(screen.getByText('60 cards')).toBeInTheDocument();
  });

  it('shows illegal status when deck invalid', () => {
    render(<DeckStats cards={mockInvalidDeck} />);
    expect(screen.getByText('Illegal')).toHaveClass('badge-error');
  });
});
```

**Acceptance Criteria:**

- ✅ Test framework configured
- ✅ Key components tested
- ✅ Custom hooks tested
- ✅ Tests run with `bun test`
- ✅ All tests pass
- ✅ Code coverage >60%

**Files to Create:**

- `apps/web/vitest.config.ts`
- Tests in `apps/web/src/**/*.test.tsx`

---

#### 7.3 Integration Tests

**Tasks:**

- [ ] Test full authentication flow (register -> login -> access protected route)
- [ ] Test card ownership flow (browse -> add to collection -> view collection)
- [ ] Test deck building flow (create deck -> add cards -> validate -> save)
- [ ] Test price tracking flow (view card -> check price history)
- [ ] Use Playwright or Cypress for E2E tests

**E2E Test Examples:**

```typescript
// e2e/deck-builder.spec.ts
test('user can build a valid deck', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name=email]', 'test@example.com');
  await page.fill('[name=password]', 'password123');
  await page.click('button[type=submit]');

  await page.goto('/decks/new');
  await page.fill('[name=name]', 'My Fire Deck');

  // Add 60 cards
  for (let i = 0; i < 15; i++) {
    await page.click('[data-testid=add-card-xy1-1]');
  }

  await page.click('[data-testid=validate-deck]');
  await expect(page.locator('[data-testid=legality-badge]')).toHaveText(
    'Legal'
  );

  await page.click('[data-testid=save-deck]');
  await expect(page).toHaveURL('/decks/1');
});
```

**Acceptance Criteria:**

- ✅ All critical user flows tested
- ✅ Tests run in CI/CD pipeline
- ✅ Tests pass consistently
- ✅ Screenshots captured on failure

**Files to Create:**

- `e2e/auth.spec.ts`
- `e2e/collection.spec.ts`
- `e2e/deck-builder.spec.ts`
- `playwright.config.ts`

---

#### 7.4 API Testing

**Tasks:**

- [ ] Create Postman/Insomnia collection
- [ ] Test all endpoints with valid data
- [ ] Test error cases (401, 404, 400, 500)
- [ ] Test rate limiting
- [ ] Test pagination
- [ ] Document API in OpenAPI/Swagger format

**Acceptance Criteria:**

- ✅ Postman collection with all endpoints
- ✅ All happy paths tested
- ✅ All error paths tested
- ✅ Environment variables for local/staging/prod
- ✅ OpenAPI spec generated

**Files to Create:**

- `docs/api-collection.postman.json`
- `docs/openapi.yaml`

---

## Phase 8: Scalability & Performance

**Duration:** 1 week | **Effort:** 25-30 hours

### Overview

Optimize for scale and prepare for growth.

### Work Items

#### 8.1 Database Optimization

**Tasks:**

- [ ] Analyze slow queries with EXPLAIN
- [ ] Add composite indexes for common queries
- [ ] Optimize N+1 queries
- [ ] Add database connection pooling limits
- [ ] Set up read replicas (optional, for future)
- [ ] Implement database backups

**Indexes to Add:**

```sql
-- Composite indexes for common queries
CREATE INDEX idx_cards_set_type ON pokemon_cards(set_id, types);
CREATE INDEX idx_cards_rarity_set ON pokemon_cards(rarity, set_id);
CREATE INDEX idx_inventory_user_card ON user_card_inventory(user_id, card_id);
CREATE INDEX idx_deck_cards_deck_card ON deck_cards(deck_id, card_id);

-- Full-text search index
CREATE INDEX idx_cards_name_trgm ON pokemon_cards USING gin(name gin_trgm_ops);
```

**Acceptance Criteria:**

- ✅ All queries under 100ms for typical datasets
- ✅ No N+1 queries detected
- ✅ Connection pool configured (max 20 connections)
- ✅ Database backups automated daily
- ✅ Full-text search performs well

**Files to Create:**

- `database/optimizations.sql`
- `database/backup.sh`

---

#### 8.2 API Performance & Caching

**Tasks:**

- [ ] Add Redis for caching (optional, or use in-memory)
- [ ] Cache card/set listings (TTL: 1 hour)
- [ ] Cache price data (TTL: 1 hour)
- [ ] Add ETag headers for conditional requests
- [ ] Implement response compression (gzip)
- [ ] Add request rate limiting (100 req/min per user)
- [ ] Monitor API latency

**Caching Strategy:**

```
GET /api/v1/cards -> Cache for 1 hour
GET /api/v1/sets -> Cache for 1 hour
GET /api/v1/cards/:id/prices -> Cache for 1 hour
GET /api/v1/inventory/cards -> No cache (user-specific)
GET /api/v1/decks/:id -> Cache for 5 minutes
```

**Acceptance Criteria:**

- ✅ Cache hit rate >80% for card/set endpoints
- ✅ API response time <100ms (cached), <300ms (uncached)
- ✅ Rate limiting prevents abuse
- ✅ Compression reduces payload by >60%
- ✅ ETag support for conditional GET

**Files to Create:**

- `apps/tcg-api/src/middleware/cache.rs`
- `apps/tcg-api/src/middleware/rate_limit.rs`
- `packages/@cache/redis/` (if using Redis)

---

#### 8.3 Frontend Performance

**Tasks:**

- [ ] Implement code splitting (lazy load routes)
- [ ] Optimize images (lazy loading, WebP format)
- [ ] Add service worker for PWA (optional)
- [ ] Minimize bundle size (analyze with webpack-bundle-analyzer)
- [ ] Enable gzip compression on server
- [ ] Add performance monitoring (Web Vitals)

**Code Splitting:**

```typescript
// apps/web/src/App.tsx
const CardList = lazy(() => import('./pages/CardList'));
const DeckBuilder = lazy(() => import('./pages/DeckBuilder'));
const MyCollection = lazy(() => import('./pages/MyCollection'));
```

**Acceptance Criteria:**

- ✅ Initial bundle size <500KB
- ✅ Lazy loading reduces initial load time by >40%
- ✅ Images lazy-load below fold
- ✅ Lighthouse score >90 (Performance)
- ✅ First Contentful Paint <1.5s
- ✅ Time to Interactive <3.5s

**Files to Create:**

- `apps/web/webpack.config.js` (update)
- `apps/web/src/serviceWorker.ts` (optional)

---

#### 8.4 Scalability Architecture

**Tasks:**

- [ ] Document horizontal scaling strategy
- [ ] Set up load balancer (NGINX or cloud LB)
- [ ] Configure auto-scaling for API containers
- [ ] Separate read/write database connections
- [ ] Plan for CDN integration (for card images)
- [ ] Document disaster recovery procedures

**Scaling Plan:**

```
Current (MVP):
- 1x API server (Rust)
- 1x Web server (Bun)
- 1x PostgreSQL
- 1x Neo4j

Future (Scale):
- Nx API servers behind load balancer
- Static web assets on CDN
- PostgreSQL primary + read replicas
- Redis cluster for caching
- Neo4j cluster (optional)
```

**Acceptance Criteria:**

- ✅ Architecture diagram created
- ✅ Load balancer configured
- ✅ API can scale horizontally (stateless)
- ✅ Database supports read replicas
- ✅ Disaster recovery plan documented

**Files to Create:**

- `docs/architecture.md`
- `docs/scaling-strategy.md`
- `nginx.conf` (load balancer config)

---

## Phase 9: Launch Preparation

**Duration:** 3-5 days | **Effort:** 15-20 hours

### Overview

Final preparations before MVP launch.

### Work Items

#### 9.1 Documentation

**Tasks:**

- [ ] Write user guide (how to use the platform)
- [ ] Document API endpoints (OpenAPI/Swagger)
- [ ] Create developer setup guide (README)
- [ ] Document deployment process
- [ ] Create FAQ page
- [ ] Add Terms of Service and Privacy Policy (consult legal)

**Acceptance Criteria:**

- ✅ README with setup instructions
- ✅ API documentation complete
- ✅ User guide with screenshots
- ✅ FAQ covers common questions
- ✅ Legal pages drafted

**Files to Create:**

- `README.md` (update)
- `docs/USER_GUIDE.md`
- `docs/API_DOCUMENTATION.md`
- `docs/DEPLOYMENT.md`
- `docs/FAQ.md`

---

#### 9.2 Deployment & DevOps

**Tasks:**

- [ ] Set up production environment (cloud provider)
- [ ] Configure CI/CD pipeline (GitHub Actions)
- [ ] Set up monitoring (Prometheus, Grafana, or cloud monitoring)
- [ ] Configure error tracking (Sentry or similar)
- [ ] Set up logging aggregation
- [ ] Configure automated backups
- [ ] Set up SSL certificates
- [ ] Configure environment variables for production

**CI/CD Pipeline:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: bun install
      - run: bun test
      - run: cargo test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: docker build -t tcg-api .
      - run: docker push registry/tcg-api:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: ssh deploy@server 'docker-compose pull && docker-compose up -d'
```

**Acceptance Criteria:**

- ✅ Production environment provisioned
- ✅ CI/CD pipeline runs on push to main
- ✅ Monitoring dashboards configured
- ✅ Error tracking captures exceptions
- ✅ Logs centralized and searchable
- ✅ Automated backups run daily
- ✅ SSL certificates valid
- ✅ Zero-downtime deployments

**Files to Create:**

- `.github/workflows/deploy.yml`
- `docker-compose.prod.yml`
- `docs/DEPLOYMENT.md`

---

#### 9.3 Security Hardening

**Tasks:**

- [ ] Run security audit on dependencies
- [ ] Implement HTTPS only
- [ ] Add CSP (Content Security Policy) headers
- [ ] Enable CSRF protection
- [ ] Implement rate limiting on auth endpoints
- [ ] Add input sanitization
- [ ] Set up WAF (Web Application Firewall) if available
- [ ] Run penetration testing (basic)

**Security Checklist:**

- ✅ No secrets in environment variables (use secrets manager)
- ✅ Database credentials rotated
- ✅ JWT secrets strong (256-bit)
- ✅ HTTPS enforced
- ✅ CSP headers prevent XSS
- ✅ SQL injection prevented (parameterized queries)
- ✅ Rate limiting on all endpoints
- ✅ Dependencies scanned for vulnerabilities

**Acceptance Criteria:**

- ✅ Security audit passes
- ✅ All communications encrypted
- ✅ No high/critical vulnerabilities
- ✅ Rate limiting prevents brute force
- ✅ CSP headers configured

**Files to Create:**

- `docs/SECURITY.md`
- `security-audit-report.md`

---

#### 9.4 Final QA & Beta Testing

**Tasks:**

- [ ] Run full regression test suite
- [ ] Conduct user acceptance testing (UAT)
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices (iOS, Android)
- [ ] Load testing (simulate 100 concurrent users)
- [ ] Fix critical bugs
- [ ] Invite beta testers for feedback
- [ ] Address beta feedback

**Acceptance Criteria:**

- ✅ All automated tests pass
- ✅ No critical/high bugs
- ✅ Works on Chrome, Firefox, Safari (latest versions)
- ✅ Responsive on mobile devices
- ✅ System handles 100 concurrent users
- ✅ Beta testers satisfied (>80% positive feedback)

---

## MVP Feature Checklist

### Core Features

- [ ] User registration and login
- [ ] Browse all Pokemon cards with pagination
- [ ] Search cards by name
- [ ] Filter cards by type, rarity, set
- [ ] View detailed card information
- [ ] Browse all Pokemon card sets
- [ ] View all cards in a set

### Card Ownership

- [ ] Add cards to personal collection
- [ ] Track quantity and condition
- [ ] Remove cards from collection
- [ ] View collection value (based on market prices)
- [ ] Filter/sort collection

### Market Value

- [ ] Display current market prices (TCGPlayer, Cardmarket)
- [ ] Show price history (30-day chart)
- [ ] Track total collection value
- [ ] Daily price updates via cron job

### Deck Management

- [ ] Create new decks
- [ ] Add/remove cards from decks
- [ ] Validate deck legality (format rules)
- [ ] View deck statistics (card count, type distribution)
- [ ] Clone decks
- [ ] Delete decks
- [ ] Make decks public/private
- [ ] Browse public decks

### Scalability Features

- [ ] API versioning (/api/v1)
- [ ] Modular service architecture
- [ ] Database indexes optimized
- [ ] Caching strategy implemented
- [ ] Horizontal scaling possible
- [ ] Monitoring and logging

---

## Success Metrics for MVP Launch

### Technical Metrics

- ✅ 99% uptime
- ✅ API response time <300ms (p95)
- ✅ Page load time <2s (p95)
- ✅ Zero critical security vulnerabilities
- ✅ Test coverage >65%

### User Metrics (First Month)

- ✅ 100+ registered users
- ✅ 1,000+ cards added to collections
- ✅ 50+ decks created
- ✅ 70% user retention (week 1 to week 4)
- ✅ <5% error rate on user actions

---

## Estimated Timeline Summary

| Phase                    | Duration       | Effort (Hours)    |
| ------------------------ | -------------- | ----------------- |
| Phase 0: Foundation      | 1-2 days       | 8-12              |
| Phase 1: Authentication  | 1 week         | 30-40             |
| Phase 2: Core API        | 1 week         | 25-35             |
| Phase 3: Card Ownership  | 1.5 weeks      | 35-45             |
| Phase 4: Market Value    | 1 week         | 25-30             |
| Phase 5: Deck Management | 2 weeks        | 50-60             |
| Phase 6: Frontend        | 2 weeks        | 45-55             |
| Phase 7: Testing         | 1.5 weeks      | 35-45             |
| Phase 8: Scalability     | 1 week         | 25-30             |
| Phase 9: Launch Prep     | 3-5 days       | 15-20             |
| **TOTAL**                | **8-10 weeks** | **293-372 hours** |

**Team Recommendations:**

- **Solo Developer:** 8-10 weeks (full-time), 16-20 weeks (part-time)
- **2-Person Team:** 4-6 weeks (full-time), 8-12 weeks (part-time)
- **3-Person Team:** 3-4 weeks (full-time), 6-8 weeks (part-time)

---

## Risk Mitigation

### High-Risk Items

1. **Deck Validation Complexity:** Pokemon TCG rules are complex
   - Mitigation: Start with basic validation, iterate based on user feedback

2. **Price Data Accuracy:** External APIs may change or have downtime
   - Mitigation: Cache prices, implement fallback strategies

3. **Neo4j Learning Curve:** Team may be unfamiliar with graph databases
   - Mitigation: Focus on PostgreSQL first, Neo4j for advanced features

4. **Scope Creep:** Feature requests may expand scope
   - Mitigation: Strict adherence to MVP feature list, park future ideas in backlog

### Medium-Risk Items

1. **Performance with Large Datasets:** 20,000+ cards
   - Mitigation: Implement pagination, caching, indexes early

2. **Authentication Security:** JWT implementation must be secure
   - Mitigation: Use battle-tested libraries, security audit

---

## Post-MVP Roadmap (Future Phases)

### Phase 10: Social Features (Future)

- User profiles with avatars
- Follow other collectors
- Like/comment on decks
- Share collection on social media
- Activity feed

### Phase 11: Trading & Marketplace (Future)

- Create trade offers
- Accept/reject trades
- Marketplace for buying/selling
- Escrow system
- Reputation/rating system

### Phase 12: Advanced Analytics (Future)

- Collection insights (most valuable cards, completion %)
- Deck performance tracking (win/loss)
- Meta analysis (popular decks, trending cards)
- Price predictions (ML-based)
- Portfolio value over time

### Phase 13: Mobile Apps (Future)

- React Native iOS app
- React Native Android app
- Barcode scanning for quick add
- Push notifications

---

## Conclusion

This phased approach provides a clear path to MVP with well-defined work items and acceptance criteria. The focus on deck management, card ownership with market value tracking, and scalable architecture ensures the platform can grow with user demand.

**Key Principles:**

1. **Iterative Development:** Build in phases, test frequently
2. **User-Centric:** Focus on core user needs first
3. **Scalable Foundation:** Design for growth from day one
4. **Quality First:** Don't compromise on testing and security

**Next Steps:**

1. Review and approve this plan
2. Set up development environment (Phase 0)
3. Begin Phase 1 (Authentication)
4. Establish weekly sprint reviews

Good luck building your Pokemon TCG workspace! 🎮
