# Exports Reference

All exports from `@pokemon/framework`.

## Core Functions

### createApp

Create an application instance.

```typescript
import { createApp } from '@pokemon/framework';

const app = createApp();
const app = createApp({ container });
```

### createRouter

Create a router for grouping routes.

```typescript
import { createRouter } from '@pokemon/framework';

const router = createRouter();
const router = createRouter('/api/v1');
```

### createContainer

Create a service container.

```typescript
import { createContainer } from '@pokemon/framework';

const container = createContainer();
```

### createContext

Create a request context (internal use).

```typescript
import { createContext } from '@pokemon/framework';

const ctx = createContext(request, params, services);
```

## Router Utilities

### compilePath

Compile a path pattern to regex.

```typescript
import { compilePath } from '@pokemon/framework';

const { pattern, paramNames } = compilePath('/users/:id');
// pattern: /^\/users\/([^\/]+)\/?$/
// paramNames: ['id']
```

### matchRoute

Match a path against a compiled route.

```typescript
import { matchRoute } from '@pokemon/framework';

const params = matchRoute('/users/123', compiledPath);
// { id: '123' }
```

### normalizePath

Normalize a path string.

```typescript
import { normalizePath } from '@pokemon/framework';

normalizePath('api/v1/');     // '/api/v1'
normalizePath('//api//v1//'); // '/api/v1'
```

## Middleware

### cors

CORS middleware factory.

```typescript
import { cors } from '@pokemon/framework';

app.use(cors());
app.use(cors({ origins: ['http://localhost:3000'] }));
```

### logging

Basic request logging middleware.

```typescript
import { logging } from '@pokemon/framework';

app.use(logging);
```

### createLogging

Configurable logging middleware factory.

```typescript
import { createLogging } from '@pokemon/framework';

app.use(createLogging({ skip: ['/health'] }));
```

### rateLimit

Rate limiting middleware factory.

```typescript
import { rateLimit } from '@pokemon/framework';

app.use(rateLimit());
app.use(rateLimit({ max: 1000, windowMs: 60000 }));
```

### securityHeaders

Security headers middleware.

```typescript
import { securityHeaders } from '@pokemon/framework';

app.use(securityHeaders);
```

### requestId

Request ID middleware.

```typescript
import { requestId } from '@pokemon/framework';

app.use(requestId);
```

### timing

Server timing middleware.

```typescript
import { timing } from '@pokemon/framework';

app.use(timing);
```

## Types

All types are available as type imports:

```typescript
import type {
  // HTTP
  HttpMethod,

  // Handler & Middleware
  Handler,
  Middleware,

  // Context
  Context,
  QueryParams,

  // Service
  Service,
  ServiceMap,

  // Route
  Route,
  CompiledRoute,
  CompiledPath,

  // Application
  App,
  AppOptions,

  // Router
  Router,

  // Container
  Container,
  ServiceFactory,
  ServiceOptions,

  // Middleware Options
  CorsOptions,
  LoggingOptions,
  RateLimitOptions
} from '@pokemon/framework';
```

## Full Import Example

```typescript
import {
  // Core
  createApp,
  createRouter,
  createContainer,

  // Middleware
  cors,
  logging,
  createLogging,
  rateLimit,
  securityHeaders,
  requestId,
  timing,

  // Utilities
  compilePath,
  matchRoute,
  normalizePath
} from '@pokemon/framework';

import type {
  App,
  Router,
  Container,
  Context,
  Handler,
  Middleware,
  Service
} from '@pokemon/framework';
```
