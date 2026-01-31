# Container

The container manages service registration, dependency injection, and lifecycle.

## Creating a Container

```typescript
import { createContainer } from '@pokemon/framework';

const container = createContainer();
```

## Registering Services

Services are registered with a name and a factory function:

```typescript
const container = createContainer()
  .register('config', () => ({
    port: 3001,
    dbUrl: process.env.DATABASE_URL
  }))
  .register('db', (c) => new DatabaseService(c.get('config').dbUrl))
  .register('cards', (c) => new CardsService(c.get('db')));
```

The factory function receives the container, allowing dependency resolution.

## Singleton vs Transient

By default, services are singletons (created once, cached):

```typescript
container.register('singleton', () => new Service());

container.get('singleton') === container.get('singleton'); // true
```

For transient services (new instance each time):

```typescript
container.register('transient', () => new Service(), { transient: true });

container.get('transient') === container.get('transient'); // false
```

## Service Lifecycle

Services can implement `start()` and `stop()` methods:

```typescript
import type { Service } from '@pokemon/framework';

class DatabaseService implements Service {
  private connection: Connection | null = null;

  async start() {
    this.connection = await createConnection();
    console.log('Database connected');
  }

  async stop() {
    await this.connection?.close();
    console.log('Database disconnected');
  }

  query(sql: string) {
    return this.connection!.query(sql);
  }
}
```

### Starting Services

```typescript
await container.start();
```

This calls `start()` on all services in registration order. Services without a `start()` method are skipped.

### Stopping Services

```typescript
await container.stop();
```

This calls `stop()` on all services in **reverse** registration order. This ensures dependencies are stopped before the services that depend on them.

## Accessing Services

### Direct Access

```typescript
const db = container.get('db');
const cards = container.get('cards');
```

### Proxy Access

The `services` property provides a convenient proxy:

```typescript
const { db, cards } = container.services;
```

### Checking Existence

```typescript
if (container.has('cache')) {
  const cache = container.get('cache');
}
```

## Type Safety

The container tracks registered service types:

```typescript
const container = createContainer()
  .register('db', () => new DatabaseService())
  .register('cache', () => new CacheService());

// TypeScript knows the types
const db = container.get('db'); // DatabaseService
const cache = container.get('cache'); // CacheService

// Error: 'unknown' is not a registered service
container.get('unknown');
```

## With the Application

Pass the container when creating the app:

```typescript
const app = createApp({ container }).route('GET', '/users', (ctx) => {
  // ctx.services is typed with all registered services
  const users = await ctx.services.db.findUsers();
  return ctx.json({ data: users });
});
```

## Example: Full Setup

```typescript
import { createApp, createContainer, createRouter } from '@pokemon/framework';
import type { Service } from '@pokemon/framework';

// Config service (no lifecycle needed)
const createConfig = () => ({
  port: Number(process.env.PORT) || 3001,
  dbUrl: process.env.DATABASE_URL!
});

// Database service with lifecycle
class DatabaseService implements Service {
  constructor(private url: string) {}

  async start() {
    // Connect to database
  }

  async stop() {
    // Close connection
  }

  query(sql: string) {
    /* ... */
  }
}

// Business logic service
class CardsService {
  constructor(private db: DatabaseService) {}

  async findAll() {
    return this.db.query('SELECT * FROM cards');
  }

  async findById(id: string) {
    return this.db.query(`SELECT * FROM cards WHERE id = ?`, [id]);
  }
}

// Wire it all together
const container = createContainer()
  .register('config', createConfig)
  .register('db', (c) => new DatabaseService(c.get('config').dbUrl))
  .register('cards', (c) => new CardsService(c.get('db')));

const router = createRouter('/api/v1/cards').get('/', async (ctx) => {
  const cards = await ctx.services.cards.findAll();
  return ctx.json({ data: cards });
});

const app = createApp({ container }).routes(router);

await app.listen(3001);
```
