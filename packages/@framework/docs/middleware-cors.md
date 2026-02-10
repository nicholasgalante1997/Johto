# CORS Middleware

Cross-Origin Resource Sharing (CORS) middleware handles preflight requests and adds CORS headers to responses.

## Basic Usage

```typescript
import { cors } from '@pokemon/framework';

// Allow all origins
app.use(cors());
```

## Options

| Option          | Type                 | Default                                                        | Description                       |
| --------------- | -------------------- | -------------------------------------------------------------- | --------------------------------- |
| `origins`       | `string \| string[]` | `'*'`                                                          | Allowed origins                   |
| `methods`       | `string[]`           | `['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']` | Allowed methods                   |
| `headers`       | `string[]`           | `['Content-Type', 'Authorization', 'X-Request-ID']`            | Allowed request headers           |
| `exposeHeaders` | `string[]`           | `['X-Request-ID']`                                             | Headers exposed to browser        |
| `credentials`   | `boolean`            | `false`                                                        | Allow credentials                 |
| `maxAge`        | `number`             | `86400`                                                        | Preflight cache max age (seconds) |

## Examples

### Specific Origins

```typescript
app.use(
  cors({
    origins: ['http://localhost:3000', 'https://app.example.com']
  })
);
```

### With Credentials

Required for cookies and authorization headers:

```typescript
app.use(
  cors({
    origins: ['https://app.example.com'],
    credentials: true
  })
);
```

> **Note**: When `credentials: true`, you cannot use `'*'` for origins. You must specify exact origins.

### Custom Headers

```typescript
app.use(
  cors({
    headers: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Custom-Header'],
    exposeHeaders: ['X-Request-ID', 'X-RateLimit-Remaining']
  })
);
```

### Restrict Methods

```typescript
app.use(
  cors({
    methods: ['GET', 'POST'] // Only allow GET and POST
  })
);
```

## How It Works

### Preflight Requests

For complex requests (non-simple methods, custom headers), browsers send an OPTIONS preflight request. The CORS middleware automatically handles these:

```
OPTIONS /api/v1/cards HTTP/1.1
Origin: http://localhost:3000
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Request-ID
Access-Control-Max-Age: 86400
```

### Actual Requests

For actual requests, CORS headers are added to the response:

```
GET /api/v1/cards HTTP/1.1
Origin: http://localhost:3000

HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Expose-Headers: X-Request-ID
Content-Type: application/json
```

## Security Notes

- Use specific origins in production instead of `'*'`
- Only enable `credentials` if your app needs it
- Be careful with `exposeHeaders` - only expose what's necessary
