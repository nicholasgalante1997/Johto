# @pokemon/framework

Minimal, performant, type-safe microservice framework for Bun.

## Features

- **~500 lines** - Small, auditable codebase
- **Zero dependencies** - Just Bun
- **Type-safe** - Full TypeScript support with inference
- **Functional** - Routes are functions, composition over inheritance
- **Explicit DI** - Factory-based dependency injection, no reflection
- **Lifecycle management** - Container-managed service start/stop

## Quick Start

```typescript
import {
  createApp,
  createRouter,
  createContainer,
  cors,
  logging
} from '@pokemon/framework';

// 1. Create container with services
const container = createContainer()
  .register('db', () => new DatabaseService())
  .register('cards', (c) => new CardsService(c.get('db')));

// 2. Define routes
const cards = createRouter('/api/v1/cards')
  .get('/', async (ctx) => {
    const data = await ctx.services.cards.findAll();
    return ctx.json({ data });
  })
  .get('/:id', async (ctx) => {
    const card = await ctx.services.cards.findById(ctx.params.id);
    return card ? ctx.json({ data: card }) : ctx.notFound();
  });

// 3. Create and start app
const app = createApp({ container })
  .use(logging)
  .use(cors())
  .routes(cards);

await app.listen(3001, () => console.log('Server running on :3001'));
```

## API

### Application

```typescript
// Create app with optional container
const app = createApp({ container });

// Add global middleware
app.use(middleware);

// Add routes from a router
app.routes(router);

// Add single route
app.route('GET', '/health', handler);

// Handle request programmatically (for testing)
const response = await app.handle(request);

// Start server
await app.listen(3001, () => console.log('Ready'));

// Shutdown gracefully
await app.shutdown();
```

### Router

```typescript
const router = createRouter('/api/v1/cards')
  .use(authMiddleware)        // Router-specific middleware
  .get('/', listHandler)
  .get('/:id', getHandler)
  .post('/', createHandler)
  .put('/:id', updateHandler)
  .delete('/:id', deleteHandler);
```

### Container

```typescript
const container = createContainer()
  .register('config', () => loadConfig())
  .register('db', (c) => new Database(c.get('config').dbPath))
  .register('service', (c) => new Service(c.get('db')));

// Start all services (calls start() methods)
await container.start();

// Get a service
const service = container.get('service');

// Stop all services (calls stop() in reverse order)
await container.stop();
```

### Context

Handlers receive a context with request data and response helpers:

```typescript
async function handler(ctx) {
  // Request data
  ctx.method      // 'GET', 'POST', etc.
  ctx.path        // '/api/v1/cards/123'
  ctx.params      // { id: '123' }
  ctx.query       // QueryParams accessor
  ctx.headers     // Request headers
  ctx.services    // Registered services
  ctx.requestId   // Unique request ID

  // Query params
  ctx.query.get('name')           // string | undefined
  ctx.query.get('name', 'default') // string
  ctx.query.getNumber('page', 1)  // number
  ctx.query.getBool('active')     // boolean

  // Responses
  return ctx.json({ data });      // 200 JSON
  return ctx.json(data, 201);     // 201 JSON
  return ctx.text('OK');          // 200 text
  return ctx.empty();             // 204 no content
  return ctx.notFound();          // 404
  return ctx.badRequest('msg');   // 400
  return ctx.error('msg', 500);   // Custom error
}
```

### Middleware

```typescript
// Middleware signature
type Middleware = (ctx, next) => Response | Promise<Response>;

// Example
const timing: Middleware = async (ctx, next) => {
  const start = Date.now();
  const response = await next();
  console.log(`${ctx.path} took ${Date.now() - start}ms`);
  return response;
};
```

### Built-in Middleware

```typescript
import {
  cors,
  logging,
  rateLimit,
  securityHeaders,
  timing
} from '@pokemon/framework';

app
  .use(logging)                              // Request/response logging
  .use(cors({ origins: ['http://localhost:3000'] }))
  .use(rateLimit({ windowMs: 60000, max: 1000 }))
  .use(securityHeaders)                      // X-Frame-Options, etc.
  .use(timing);                              // Server-Timing header
```

### Services

Services can implement lifecycle hooks:

```typescript
import type { Service } from '@pokemon/framework';

class DatabaseService implements Service {
  private db: Database | null = null;

  async start() {
    this.db = new Database('./data.db');
    console.log('Database connected');
  }

  async stop() {
    this.db?.close();
    console.log('Database closed');
  }

  query(sql: string) {
    return this.db?.query(sql).all();
  }
}
```

## Testing

Use `app.handle()` to test without starting a server:

```typescript
import { describe, it, expect } from 'bun:test';

describe('Cards API', () => {
  it('returns cards', async () => {
    const response = await app.handle(
      new Request('http://test/api/v1/cards')
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toBeArray();
  });
});
```

## Validation

Use Zod or any validation library:

```typescript
import { z } from 'zod';

const SearchSchema = z.object({
  name: z.string().optional(),
  page: z.coerce.number().positive().default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20)
});

router.get('/search', async (ctx) => {
  const params = SearchSchema.parse(Object.fromEntries(ctx.query.raw));
  const results = await ctx.services.cards.search(params);
  return ctx.json({ data: results });
});
```

## License

MIT
