# Router

Routers group related routes under a common base path and can have their own middleware.

## Creating a Router

```typescript
import { createRouter } from '@pokemon/framework';

const api = createRouter('/api/v1');
```

## Adding Routes

Routers support all common HTTP methods:

```typescript
const cards = createRouter('/api/v1/cards')
  .get('/', listCards)          // GET /api/v1/cards
  .get('/:id', getCard)         // GET /api/v1/cards/:id
  .post('/', createCard)        // POST /api/v1/cards
  .put('/:id', updateCard)      // PUT /api/v1/cards/:id
  .patch('/:id', patchCard)     // PATCH /api/v1/cards/:id
  .delete('/:id', deleteCard);  // DELETE /api/v1/cards/:id
```

## Path Parameters

Use `:paramName` syntax to capture path segments:

```typescript
const router = createRouter('/users')
  .get('/:userId/posts/:postId', (ctx) => {
    const { userId, postId } = ctx.params;
    return ctx.json({ userId, postId });
  });
```

Path parameters are:
- Automatically URL-decoded
- Available as `ctx.params`
- Type-safe as `Record<string, string>`

## Router Middleware

Add middleware that only applies to routes in this router:

```typescript
const adminRouter = createRouter('/admin')
  .use(authMiddleware)
  .use(adminOnlyMiddleware)
  .get('/users', listAllUsers)
  .delete('/users/:id', deleteUser);
```

Middleware execution order:
1. Global middleware (from `app.use()`)
2. Router middleware (from `router.use()`)
3. Route handler

## Registering with the App

```typescript
const app = createApp()
  .routes(cardsRouter)
  .routes(usersRouter)
  .routes(adminRouter);
```

## Multiple Routers

Organize your API into logical groups:

```typescript
// routes/cards.ts
export const cardsRouter = createRouter('/api/v1/cards')
  .get('/', listCards)
  .get('/:id', getCard);

// routes/sets.ts
export const setsRouter = createRouter('/api/v1/sets')
  .get('/', listSets)
  .get('/:id', getSet);

// app.ts
import { cardsRouter } from './routes/cards';
import { setsRouter } from './routes/sets';

const app = createApp()
  .routes(cardsRouter)
  .routes(setsRouter);
```

## Path Normalization

Paths are automatically normalized:
- Empty paths become `/`
- Leading slashes are added if missing
- Trailing slashes are removed
- Multiple consecutive slashes are collapsed

```typescript
createRouter('api/v1');      // becomes /api/v1
createRouter('/api/v1/');    // becomes /api/v1
createRouter('//api//v1//'); // becomes /api/v1
```
