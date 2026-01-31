# Context

The context object provides access to request data and response helpers.

## Request Data

### Method and Path

```typescript
ctx.method  // 'GET', 'POST', 'PUT', etc.
ctx.path    // '/api/v1/cards/123'
```

### Path Parameters

Captured from route patterns like `/cards/:id`:

```typescript
ctx.params.id       // '123'
ctx.params.userId   // 'abc'
```

### Query Parameters

```typescript
// URL: /search?name=pikachu&page=2&active=true

ctx.query.get('name')              // 'pikachu'
ctx.query.get('missing')           // undefined
ctx.query.get('missing', 'default') // 'default'

ctx.query.getNumber('page')        // 2
ctx.query.getNumber('page', 1)     // 2 (or 1 if missing/invalid)

ctx.query.getBool('active')        // true
ctx.query.has('name')              // true

ctx.query.raw                      // URLSearchParams instance
```

### Headers

```typescript
ctx.headers.get('authorization')   // 'Bearer xyz...'
ctx.headers.get('content-type')    // 'application/json'
```

### Request Body

Access the raw Fetch API Request:

```typescript
const body = await ctx.request.json();
const text = await ctx.request.text();
const form = await ctx.request.formData();
```

### Services

Access container-registered services:

```typescript
const user = await ctx.services.db.findUser(id);
const cached = await ctx.services.cache.get(key);
```

### Request ID

Every request has a unique ID for tracing:

```typescript
ctx.requestId  // 'ml1abc12-xyz789'
```

If the incoming request has an `X-Request-ID` header, that value is used. Otherwise, a new ID is generated.

## Response Helpers

### JSON Response

```typescript
return ctx.json({ data: cards });           // 200 OK
return ctx.json({ data: card }, 201);       // 201 Created
return ctx.json({ data: cards }, 200);      // Explicit status
```

### Text Response

```typescript
return ctx.text('OK');                      // 200 OK
return ctx.text('Created', 201);            // 201 Created
```

### Empty Response

```typescript
return ctx.empty();                         // 204 No Content
return ctx.empty(202);                      // 202 Accepted
```

### Error Responses

```typescript
return ctx.notFound();                      // 404 Not Found
return ctx.notFound('Card not found');      // 404 with message

return ctx.badRequest();                    // 400 Bad Request
return ctx.badRequest('Invalid card ID');   // 400 with message

return ctx.error('Something went wrong');   // 500 Internal Error
return ctx.error('Unauthorized', 401);      // Custom status
```

Error responses return a standard JSON structure:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Card not found",
    "status": 404
  }
}
```

## Request Timing

```typescript
ctx.startTime  // Date.now() when request started

// Calculate duration
const duration = Date.now() - ctx.startTime;
```

## Using with Validation

Combine with Zod or other validation libraries:

```typescript
import { z } from 'zod';

const SearchSchema = z.object({
  name: z.string().optional(),
  page: z.coerce.number().positive().default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20)
});

router.get('/search', async (ctx) => {
  const result = SearchSchema.safeParse(
    Object.fromEntries(ctx.query.raw)
  );

  if (!result.success) {
    return ctx.badRequest(result.error.message);
  }

  const { name, page, pageSize } = result.data;
  const cards = await ctx.services.cards.search({ name, page, pageSize });

  return ctx.json({ data: cards });
});
```
