# Middleware

Middleware intercepts requests and responses, enabling cross-cutting concerns like logging, authentication, and CORS.

## Middleware Signature

```typescript
type Middleware = (
  ctx: Context,
  next: () => Promise<Response>
) => Response | Promise<Response>;
```

## How Middleware Works

Middleware forms an "onion" around your handlers:

```
Request
  → Middleware 1 (before)
    → Middleware 2 (before)
      → Handler
    ← Middleware 2 (after)
  ← Middleware 1 (after)
Response
```

## Writing Custom Middleware

### Basic Middleware

```typescript
const timing: Middleware = async (ctx, next) => {
  const start = Date.now();
  const response = await next();
  const duration = Date.now() - start;
  console.log(`${ctx.path} took ${duration}ms`);
  return response;
};
```

### Modifying the Response

```typescript
const addHeader: Middleware = async (ctx, next) => {
  const response = await next();

  // Clone headers and add new one
  const headers = new Headers(response.headers);
  headers.set('x-custom-header', 'value');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};
```

### Short-Circuiting

Return early without calling `next()`:

```typescript
const authMiddleware: Middleware = async (ctx, next) => {
  const token = ctx.headers.get('authorization');

  if (!token) {
    return ctx.error('Unauthorized', 401);
  }

  // Continue to handler
  return next();
};
```

### Error Handling

```typescript
const errorBoundary: Middleware = async (ctx, next) => {
  try {
    return await next();
  } catch (err) {
    console.error('Unhandled error:', err);
    return ctx.error('Internal Server Error', 500);
  }
};
```

## Built-in Middleware

### CORS

```typescript
import { cors } from '@pokemon/framework';

// Allow all origins
app.use(cors());

// Specific origins
app.use(cors({
  origins: ['http://localhost:3000', 'https://app.example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
```

See [CORS Middleware](middleware-cors.md) for full options.

### Logging

```typescript
import { logging, createLogging } from '@pokemon/framework';

// Default logging
app.use(logging);

// Custom logging
app.use(createLogging({
  skip: ['/health', '/ready'],
  logger: (msg) => myLogger.info(msg)
}));
```

See [Logging Middleware](middleware-logging.md) for full options.

### Rate Limiting

```typescript
import { rateLimit } from '@pokemon/framework';

// 100 requests per minute
app.use(rateLimit({ max: 100, windowMs: 60000 }));

// Custom key generator
app.use(rateLimit({
  max: 1000,
  keyGenerator: (ctx) => ctx.headers.get('x-api-key') || 'anonymous'
}));
```

See [Rate Limiting Middleware](middleware-ratelimit.md) for full options.

### Security Headers

```typescript
import { securityHeaders } from '@pokemon/framework';

app.use(securityHeaders);
```

Adds:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Request ID

```typescript
import { requestId } from '@pokemon/framework';

app.use(requestId);
```

Ensures every response has an `X-Request-ID` header.

### Timing

```typescript
import { timing } from '@pokemon/framework';

app.use(timing);
```

Adds a `Server-Timing` header with request duration:
```
Server-Timing: total;dur=12.5
```

## Middleware Order

Order matters! Middleware runs in registration order:

```typescript
app
  .use(requestId)      // 1st: Ensure request ID exists
  .use(logging)        // 2nd: Log with request ID
  .use(errorBoundary)  // 3rd: Catch errors from below
  .use(authMiddleware) // 4th: Check authentication
  .use(rateLimit())    // 5th: Apply rate limits
  .routes(api);        // Handlers run last
```

## Global vs Router Middleware

**Global middleware** runs for all routes:

```typescript
app.use(logging);  // All requests
```

**Router middleware** runs only for routes in that router:

```typescript
const adminRouter = createRouter('/admin')
  .use(adminAuth)  // Only /admin/* routes
  .get('/users', listUsers);
```

Execution order:
1. Global middleware
2. Router middleware
3. Handler
