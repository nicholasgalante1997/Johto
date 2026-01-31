# Logging Middleware

Request and response logging for debugging and monitoring.

## Basic Usage

```typescript
import { logging } from '@pokemon/framework';

app.use(logging);
```

Output:
```
--> GET /api/v1/cards
<-- GET /api/v1/cards 200 12ms
```

## Custom Logging

Use `createLogging` for more control:

```typescript
import { createLogging } from '@pokemon/framework';

app.use(createLogging({
  skip: ['/health', '/ready'],
  logger: (msg) => myLogger.info(msg)
}));
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `skip` | `string[]` | `[]` | Paths to skip logging |
| `logger` | `(message: string) => void` | `console.log` | Custom log function |

## Examples

### Skip Health Checks

```typescript
app.use(createLogging({
  skip: ['/health', '/ready', '/metrics']
}));
```

### Custom Logger

With Winston:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

app.use(createLogging({
  logger: (msg) => logger.info(msg)
}));
```

With Pino:

```typescript
import pino from 'pino';

const logger = pino();

app.use(createLogging({
  logger: (msg) => logger.info(msg)
}));
```

### Structured Logging

For JSON logs, create a custom middleware:

```typescript
const structuredLogging: Middleware = async (ctx, next) => {
  const start = Date.now();
  const response = await next();
  const duration = Date.now() - start;

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    method: ctx.method,
    path: ctx.path,
    status: response.status,
    duration,
    requestId: ctx.requestId
  }));

  return response;
};

app.use(structuredLogging);
```

Output:
```json
{"timestamp":"2024-01-01T12:00:00.000Z","method":"GET","path":"/api/v1/cards","status":200,"duration":12,"requestId":"ml1abc12-xyz789"}
```

## Log Format

The default format is:

```
--> {METHOD} {PATH}           # Request
<-- {METHOD} {PATH} {STATUS} {DURATION}ms  # Response
```

Examples:
```
--> GET /api/v1/cards
<-- GET /api/v1/cards 200 12ms

--> POST /api/v1/cards
<-- POST /api/v1/cards 201 45ms

--> GET /api/v1/cards/invalid
<-- GET /api/v1/cards/invalid 404 2ms
```

## Combining with Request ID

Use with the `requestId` middleware for traceable logs:

```typescript
import { requestId, createLogging } from '@pokemon/framework';

app
  .use(requestId)
  .use(createLogging({
    logger: (msg) => {
      // Request ID is now in ctx, but not easily accessible here
      // For request ID in logs, use custom middleware above
      console.log(msg);
    }
  }));
```

For request IDs in every log line, use the structured logging approach shown above.
