# Microservice Framework Options

## Goals

- **Minimal**: Small API surface, few abstractions, easy to understand in one sitting
- **Performant**: Near-zero overhead, no runtime reflection, optimized for Bun
- **Clean**: Self-documenting code, consistent patterns, no magic
- **Scalable**: Patterns that work for 5 routes or 500 routes
- **Well-documented**: Comprehensive JSDoc, examples in comments

---

## Option A: Functional Router

**Philosophy**: Routes are functions. Composition over inheritance. No classes required.

```typescript
// packages/@framework/src/router.ts
import { createRouter, get, post, param, query } from '@pokemon/framework';

const cards = createRouter('/api/v1/cards')
  .use(logging)
  .use(cors)
  .get('/', listCards)
  .get('/search', searchCards)
  .get('/:id', getCard);

// Handler signature - pure function
async function listCards(ctx: Context): Promise<Response> {
  const page = ctx.query.get('page', 1);
  const cards = await db.cards.findAll({ page });
  return ctx.json({ data: cards });
}

// apps/rest-api/src/main.ts
const app = createApp()
  .use(cards)
  .use(sets)
  .use(health);

app.listen(3001);
```

**Pros**:
- Zero reflection, zero decorators
- Extremely fast startup
- Easy to test (just functions)
- Tree-shakeable
- ~50 lines of framework code

**Cons**:
- No automatic dependency injection
- Manual wiring required
- Less discoverable than classes

**Performance**: ⭐⭐⭐⭐⭐ (fastest)
**Simplicity**: ⭐⭐⭐⭐⭐
**Scalability**: ⭐⭐⭐ (manual organization needed)

---

## Option B: Service Container

**Philosophy**: Thin container for services. Routes defined declaratively. No decorators.

```typescript
// packages/@framework/src/container.ts
import { Container, Router } from '@pokemon/framework';

// Define services as plain classes
class DatabaseService {
  private db: Database;

  async start() {
    this.db = new Database(process.env.DATABASE_PATH);
  }

  async stop() {
    this.db.close();
  }

  query<T>(sql: string, params?: any[]): T[] {
    return this.db.query(sql).all(...params) as T[];
  }
}

class CardsService {
  constructor(private db: DatabaseService) {}

  findAll(page: number, limit: number) {
    return this.db.query('SELECT * FROM cards LIMIT ? OFFSET ?', [limit, (page-1)*limit]);
  }
}

// Wire up container
const container = new Container()
  .register('db', DatabaseService)
  .register('cards', CardsService, ['db']);

// Define routes referencing services
const routes = new Router()
  .get('/api/v1/cards', async (ctx) => {
    const cards = ctx.services.cards.findAll(ctx.query.page, ctx.query.limit);
    return ctx.json({ data: cards });
  });

// apps/rest-api/src/main.ts
const app = createApp({ container, routes });
app.listen(3001);
```

**Pros**:
- Explicit dependency graph
- Services are testable with mocks
- No magic - you see exactly what's wired
- Lifecycle hooks (start/stop)

**Cons**:
- Manual dependency declaration
- Slightly more boilerplate than DI

**Performance**: ⭐⭐⭐⭐⭐
**Simplicity**: ⭐⭐⭐⭐
**Scalability**: ⭐⭐⭐⭐

---

## Option C: File-Based Routing

**Philosophy**: Convention over configuration. Directory structure = routes.

```
apps/rest-api/src/
├── routes/
│   ├── api/
│   │   └── v1/
│   │       ├── cards/
│   │       │   ├── index.ts        → GET /api/v1/cards
│   │       │   ├── [id].ts         → GET /api/v1/cards/:id
│   │       │   └── search.ts       → GET /api/v1/cards/search
│   │       └── sets/
│   │           ├── index.ts        → GET /api/v1/sets
│   │           └── [id]/
│   │               ├── index.ts    → GET /api/v1/sets/:id
│   │               └── cards.ts    → GET /api/v1/sets/:id/cards
│   └── health.ts                   → GET /health
├── services/
│   ├── database.ts
│   └── cards.ts
└── main.ts
```

```typescript
// routes/api/v1/cards/index.ts
import { RouteHandler } from '@pokemon/framework';
import { cardsService } from '../../../services/cards';

export const get: RouteHandler = async (ctx) => {
  const { page = 1, pageSize = 60 } = ctx.query;
  const result = await cardsService.findAll({ page, pageSize });
  return ctx.json(result);
};

// routes/api/v1/cards/[id].ts
export const get: RouteHandler = async (ctx) => {
  const card = await cardsService.findById(ctx.params.id);
  if (!card) return ctx.notFound();
  return ctx.json({ data: card });
};

// main.ts
import { createApp, loadRoutes } from '@pokemon/framework';

const app = createApp();
await loadRoutes(app, './routes');
app.listen(3001);
```

**Pros**:
- Zero route configuration
- File structure mirrors API structure
- Easy to find code for any endpoint
- Scales naturally with API growth

**Cons**:
- Build step required for route discovery
- Harder to see full route picture without file tree
- Dynamic routing is implicit

**Performance**: ⭐⭐⭐⭐ (small build-time cost)
**Simplicity**: ⭐⭐⭐⭐⭐
**Scalability**: ⭐⭐⭐⭐⭐

---

## Option D: Minimal Decorators

**Philosophy**: Decorators only where they add value. No modules, no complex DI.

```typescript
// packages/@framework/src/decorators.ts
import { Controller, Get, Post, Param, Query } from '@pokemon/framework';

@Controller('/api/v1/cards')
class CardsController {
  constructor(private cards: CardsService) {}

  @Get('/')
  list(@Query('page') page = 1, @Query('pageSize') pageSize = 60) {
    return this.cards.findAll({ page, pageSize });
  }

  @Get('/:id')
  get(@Param('id') id: string) {
    return this.cards.findById(id);
  }
}

// main.ts - explicit wiring, no auto-discovery
import { createApp } from '@pokemon/framework';

const db = new DatabaseService();
const cards = new CardsService(db);
const controller = new CardsController(cards);

const app = createApp()
  .controller(controller)
  .listen(3001);
```

**Pros**:
- Familiar pattern (NestJS-like)
- Decorators only for routes
- Manual DI = explicit dependencies
- No reflection for DI, only for routes

**Cons**:
- Requires `reflect-metadata`
- Decorator syntax is polarizing
- Slightly more ceremony than functional

**Performance**: ⭐⭐⭐⭐ (reflection at startup only)
**Simplicity**: ⭐⭐⭐⭐
**Scalability**: ⭐⭐⭐⭐

---

## Option E: Protocol-Based (Trait Pattern)

**Philosophy**: Define interfaces, implement simply. Factory functions wire everything.

```typescript
// packages/@framework/src/protocols.ts

/** Handler that processes a request and returns a response */
interface Handler {
  handle(ctx: Context): Promise<Response>;
}

/** Service with lifecycle management */
interface Service {
  start?(): Promise<void>;
  stop?(): Promise<void>;
}

/** Route definition */
interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  handler: Handler;
}

// Implementation
class GetCardsHandler implements Handler {
  constructor(private cards: CardsService) {}

  async handle(ctx: Context): Promise<Response> {
    const page = ctx.query.get('page', 1);
    const cards = await this.cards.findAll({ page });
    return Response.json({ data: cards });
  }
}

// Factory wires everything
function createCardsRoutes(cards: CardsService): Route[] {
  return [
    { method: 'GET', path: '/api/v1/cards', handler: new GetCardsHandler(cards) },
    { method: 'GET', path: '/api/v1/cards/:id', handler: new GetCardHandler(cards) },
  ];
}

// main.ts
const db = new DatabaseService();
const cards = new CardsService(db);

const app = createApp()
  .routes(createCardsRoutes(cards))
  .routes(createSetsRoutes(db))
  .listen(3001);
```

**Pros**:
- Maximum type safety
- Explicit contracts
- Easy to test each handler
- No framework magic

**Cons**:
- More files (one handler per route)
- Verbose for simple endpoints
- Factory functions add indirection

**Performance**: ⭐⭐⭐⭐⭐
**Simplicity**: ⭐⭐⭐
**Scalability**: ⭐⭐⭐⭐⭐

---

## Comparison Matrix

| Criteria | A: Functional | B: Container | C: File-Based | D: Decorators | E: Protocol |
|----------|--------------|--------------|---------------|---------------|-------------|
| Lines of framework code | ~50 | ~150 | ~200 | ~300 | ~100 |
| Startup time | Fastest | Fast | Medium | Fast | Fast |
| Runtime overhead | None | Minimal | None | Minimal | None |
| Learning curve | Low | Low | Very Low | Medium | Medium |
| Type safety | Good | Good | Good | Excellent | Excellent |
| Testability | Excellent | Excellent | Good | Excellent | Excellent |
| IDE support | Good | Good | Limited | Excellent | Excellent |
| Dependency injection | Manual | Explicit | Manual | Manual | Manual |
| Code organization | Free-form | Structured | Enforced | Structured | Structured |

---

## Recommended: Hybrid Approach

Combine **Option A (Functional)** as the core with **Option B (Container)** for services:

```typescript
// packages/@framework/src/index.ts - Complete API

/**
 * Create a new application instance
 */
export function createApp(options?: AppOptions): App;

/**
 * Create a router for grouping routes
 */
export function createRouter(basePath?: string): Router;

/**
 * Create a service container
 */
export function createContainer(): Container;

// Context provided to all handlers
interface Context {
  readonly request: Request;
  readonly params: Record<string, string>;
  readonly query: QueryParams;
  readonly headers: Headers;
  readonly services: ServiceMap;

  json(data: unknown, status?: number): Response;
  text(data: string, status?: number): Response;
  notFound(message?: string): Response;
  error(message: string, status?: number): Response;
}

// Handler is just an async function
type Handler = (ctx: Context) => Promise<Response> | Response;

// Middleware wraps handlers
type Middleware = (ctx: Context, next: () => Promise<Response>) => Promise<Response>;
```

**Example Application**:

```typescript
// apps/rest-api/src/main.ts
import { createApp, createRouter, createContainer } from '@pokemon/framework';
import { DatabaseService } from './services/database';
import { CardsService } from './services/cards';
import { SetsService } from './services/sets';
import { cors, logging, rateLimit } from './middleware';

// 1. Create container and register services
const container = createContainer()
  .singleton('db', () => new DatabaseService())
  .singleton('cards', (c) => new CardsService(c.get('db')))
  .singleton('sets', (c) => new SetsService(c.get('db')));

// 2. Define routes
const cards = createRouter('/api/v1/cards')
  .get('/', async (ctx) => {
    const { page = 1, pageSize = 60 } = ctx.query;
    const result = await ctx.services.cards.findAll({ page, pageSize });
    return ctx.json({ data: result.cards, meta: { page, pageSize, total: result.total } });
  })
  .get('/search', async (ctx) => {
    const { name, type, rarity } = ctx.query;
    if (!name && !type && !rarity) {
      return ctx.error('At least one search parameter required', 400);
    }
    const cards = await ctx.services.cards.search({ name, type, rarity });
    return ctx.json({ data: cards });
  })
  .get('/:id', async (ctx) => {
    const card = await ctx.services.cards.findById(ctx.params.id);
    if (!card) return ctx.notFound(`Card ${ctx.params.id} not found`);
    return ctx.json({ data: card });
  });

const sets = createRouter('/api/v1/sets')
  .get('/', async (ctx) => {
    const sets = await ctx.services.sets.findAll();
    return ctx.json({ data: sets });
  })
  .get('/:id', async (ctx) => {
    const set = await ctx.services.sets.findById(ctx.params.id);
    if (!set) return ctx.notFound();
    return ctx.json({ data: set });
  })
  .get('/:id/cards', async (ctx) => {
    const cards = await ctx.services.cards.findBySet(ctx.params.id);
    return ctx.json({ data: cards });
  });

const health = createRouter()
  .get('/health', (ctx) => ctx.json({ status: 'healthy', timestamp: new Date().toISOString() }))
  .get('/ready', async (ctx) => {
    const dbOk = await ctx.services.db.ping();
    return ctx.json({ ready: dbOk }, dbOk ? 200 : 503);
  });

// 3. Create and start app
const app = createApp({ container })
  .use(logging)
  .use(cors({ origins: ['http://localhost:3000'] }))
  .use(rateLimit({ windowMs: 60000, max: 1000 }))
  .routes(cards)
  .routes(sets)
  .routes(health);

await container.start();
app.listen(3001, () => console.log('REST API running on :3001'));
```

---

## Framework Implementation Estimate

| Component | Lines | Complexity |
|-----------|-------|------------|
| App & Server | ~60 | Low |
| Router | ~80 | Low |
| Context | ~50 | Low |
| Container | ~70 | Low |
| Middleware pipeline | ~40 | Low |
| Built-in middleware | ~100 | Low |
| **Total** | **~400** | **Low** |

---

## Next Steps

1. **Select an option** (or confirm hybrid approach)
2. **Create detailed implementation spec** for chosen option
3. **Build framework package** (`packages/@framework`)
4. **Migrate REST API** as proof of concept
5. **Migrate GraphQL API** and BFF

---

## Questions

1. **Preferred style**: Functional (A), Container (B), File-based (C), Decorators (D), Protocol (E), or Hybrid?
2. **Service lifecycle**: Should container manage start/stop, or keep it manual?
3. **Validation**: Built-in or bring-your-own (e.g., Zod)?
4. **GraphQL**: Same framework or separate patterns?
