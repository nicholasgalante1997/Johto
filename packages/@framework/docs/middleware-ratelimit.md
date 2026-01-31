# Rate Limiting Middleware

Protect your API from abuse with configurable rate limiting.

## Basic Usage

```typescript
import { rateLimit } from '@pokemon/framework';

// 100 requests per minute per IP
app.use(rateLimit());
```

## Options

| Option         | Type                            | Default    | Description                     |
| -------------- | ------------------------------- | ---------- | ------------------------------- |
| `windowMs`     | `number`                        | `60000`    | Time window in milliseconds     |
| `max`          | `number`                        | `100`      | Max requests per window         |
| `keyGenerator` | `(ctx) => string`               | IP-based   | Function to generate client key |
| `handler`      | `(ctx, retryAfter) => Response` | JSON error | Custom rate limit response      |

## Examples

### Custom Limits

```typescript
// 1000 requests per minute
app.use(
  rateLimit({
    max: 1000,
    windowMs: 60000
  })
);

// 10 requests per second (burst protection)
app.use(
  rateLimit({
    max: 10,
    windowMs: 1000
  })
);
```

### By API Key

```typescript
app.use(
  rateLimit({
    max: 10000,
    keyGenerator: (ctx) => {
      return ctx.headers.get('x-api-key') || 'anonymous';
    }
  })
);
```

### By User ID

```typescript
app.use(
  rateLimit({
    max: 100,
    keyGenerator: (ctx) => {
      // Assumes auth middleware ran first and set user
      return ctx.user?.id || ctx.headers.get('x-forwarded-for') || 'anonymous';
    }
  })
);
```

### Custom Response

```typescript
app.use(
  rateLimit({
    max: 100,
    handler: (ctx, retryAfter) => {
      return new Response(
        JSON.stringify({
          error: 'Slow down!',
          retryAfter
        }),
        {
          status: 429,
          headers: {
            'content-type': 'application/json',
            'retry-after': String(retryAfter)
          }
        }
      );
    }
  })
);
```

## Response Headers

The middleware adds rate limit headers to all responses:

| Header                  | Description                       |
| ----------------------- | --------------------------------- |
| `X-RateLimit-Limit`     | Max requests allowed              |
| `X-RateLimit-Remaining` | Requests remaining in window      |
| `X-RateLimit-Reset`     | Unix timestamp when window resets |

Example response:

```
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067260
```

## Rate Limited Response

When the limit is exceeded:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 45
Content-Type: application/json

{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "status": 429
  }
}
```

## Multiple Rate Limits

Apply different limits to different routes:

```typescript
// Global: 1000/min
app.use(rateLimit({ max: 1000 }));

// Auth routes: 10/min (prevent brute force)
const authRouter = createRouter('/auth')
  .use(rateLimit({ max: 10 }))
  .post('/login', loginHandler)
  .post('/register', registerHandler);

// API routes: use global limit
const apiRouter = createRouter('/api/v1').get('/cards', listCards);

app.routes(authRouter).routes(apiRouter);
```

## Production Considerations

The built-in rate limiter uses an in-memory store. For production with multiple instances, consider:

1. **Redis-based rate limiting**: Share state across instances
2. **Load balancer rate limiting**: Handle at the infrastructure level
3. **API Gateway**: Use a dedicated API gateway

Example Redis adapter (conceptual):

```typescript
const redisRateLimit = (
  redis: Redis,
  options: RateLimitOptions
): Middleware => {
  return async (ctx, next) => {
    const key = `ratelimit:${options.keyGenerator(ctx)}`;
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, options.windowMs / 1000);
    }

    if (count > options.max) {
      return ctx.error('Too many requests', 429);
    }

    return next();
  };
};
```
