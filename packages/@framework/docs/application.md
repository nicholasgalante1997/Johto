# Application

The application is the central piece that ties together routes, middleware, and services.

## Creating an Application

```typescript
import { createApp } from '@pokemon/framework';

const app = createApp();
```

### With a Container

```typescript
import { createApp, createContainer } from '@pokemon/framework';

const container = createContainer().register('config', () => ({ port: 3001 }));

const app = createApp({ container });
```

## Adding Routes

### Direct Routes

```typescript
app.route('GET', '/health', (ctx) => ctx.json({ status: 'ok' }));
app.route('POST', '/users', async (ctx) => {
  const body = await ctx.request.json();
  return ctx.json({ created: true }, 201);
});
```

### Using Routers

```typescript
import { createRouter } from '@pokemon/framework';

const api = createRouter('/api/v1')
  .get('/cards', listCards)
  .get('/cards/:id', getCard)
  .post('/cards', createCard);

app.routes(api);
```

## Adding Middleware

Middleware runs in registration order for all requests:

```typescript
app
  .use(logging)
  .use(cors())
  .use(rateLimit({ max: 100 }));
```

## Starting the Server

```typescript
await app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
```

The `listen` method:

1. Starts all container services (calls `start()`)
2. Starts the HTTP server
3. Registers shutdown handlers for `SIGINT` and `SIGTERM`

## Handling Requests Programmatically

For testing, use `handle()` to process requests without starting a server:

```typescript
const response = await app.handle(new Request('http://localhost/api/v1/cards'));

expect(response.status).toBe(200);
const body = await response.json();
expect(body.data).toBeArray();
```

## Graceful Shutdown

The app automatically handles shutdown signals. You can also trigger it manually:

```typescript
await app.shutdown();
```

This calls `stop()` on all container services in reverse registration order.

## Type Safety

The app preserves service types from the container:

```typescript
const container = createContainer()
  .register('db', () => new DatabaseService())
  .register('cache', () => new CacheService());

// Services are typed in handlers
const app = createApp({ container }).route('GET', '/test', (ctx) => {
  // ctx.services.db is DatabaseService
  // ctx.services.cache is CacheService
  return ctx.json({ ok: true });
});
```
