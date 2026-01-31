# @pokemon/framework

> Minimal, performant, type-safe microservice framework for Bun

## What is this?

`@pokemon/framework` is a lightweight HTTP framework designed for building microservices with Bun. It provides just enough structure for routing, middleware, and dependency injection without the complexity of larger frameworks.

## Key Features

<div class="feature-grid">
  <div class="feature-card">
    <h4>~500 Lines</h4>
    <p>Small, auditable codebase. No magic, no hidden complexity.</p>
  </div>
  <div class="feature-card">
    <h4>Zero Dependencies</h4>
    <p>Built entirely on Bun's native APIs. Nothing else required.</p>
  </div>
  <div class="feature-card">
    <h4>Type-Safe</h4>
    <p>Full TypeScript support with intelligent type inference.</p>
  </div>
  <div class="feature-card">
    <h4>Functional</h4>
    <p>Routes are functions. Composition over inheritance.</p>
  </div>
  <div class="feature-card">
    <h4>Explicit DI</h4>
    <p>Factory-based dependency injection. No decorators or reflection.</p>
  </div>
  <div class="feature-card">
    <h4>Lifecycle Management</h4>
    <p>Container-managed service start/stop for graceful shutdown.</p>
  </div>
</div>

## Quick Example

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

## Getting Started

Ready to dive in? Check out the [Quick Start Guide](quickstart.md) to get started.

---

<p style="text-align: center; color: var(--text-muted); font-size: 0.9rem;">
  Built with ⚡ for the Pokemon TCG Platform
</p>
