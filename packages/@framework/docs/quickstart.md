# Quick Start

Get `@pokemon/framework` running in your project.

## Prerequisites

- [Bun](https://bun.sh) 1.0 or later
- TypeScript 5.0 or later (recommended)

## Installation

### 1. Install the package

```bash
bun add @pokemon/framework
```

Or if using within the monorepo:

```bash
# The package is already available as a workspace dependency
```

### 2. Create your first app

Create a new file `server.ts`:

```typescript
import { createApp, cors, logging } from '@pokemon/framework';

const app = createApp()
  .use(logging)
  .use(cors())
  .route('GET', '/health', (ctx) => ctx.json({ status: 'ok' }))
  .route('GET', '/hello/:name', (ctx) => {
    return ctx.json({ message: `Hello, ${ctx.params.name}!` });
  });

await app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
```

### 3. Run the server

```bash
bun run server.ts
```

## Verify It's Working

```bash
# Health check
curl http://localhost:3001/health
# {"status":"ok"}

# Dynamic route
curl http://localhost:3001/hello/world
# {"message":"Hello, world!"}
```

## Adding Services

For more complex applications, use the container for dependency injection:

```typescript
import {
  createApp,
  createContainer,
  createRouter,
  cors,
  logging
} from '@pokemon/framework';
import type { Service } from '@pokemon/framework';

// Define a service with lifecycle hooks
class DatabaseService implements Service {
  private connection: any = null;

  async start() {
    this.connection = await connectToDatabase();
    console.log('Database connected');
  }

  async stop() {
    await this.connection?.close();
    console.log('Database disconnected');
  }

  query(sql: string) {
    return this.connection.query(sql);
  }
}

// Create container
const container = createContainer()
  .register('db', () => new DatabaseService());

// Create router
const api = createRouter('/api')
  .get('/users', async (ctx) => {
    const users = await ctx.services.db.query('SELECT * FROM users');
    return ctx.json({ data: users });
  });

// Create and start app
const app = createApp({ container })
  .use(logging)
  .use(cors())
  .routes(api);

await app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
```

## Next Steps

- [Application](application.md) - Learn about the app lifecycle
- [Router](router.md) - Define routes and extract parameters
- [Context](context.md) - Request handling and response helpers
- [Container](container.md) - Dependency injection patterns
- [Middleware](middleware.md) - Built-in and custom middleware
