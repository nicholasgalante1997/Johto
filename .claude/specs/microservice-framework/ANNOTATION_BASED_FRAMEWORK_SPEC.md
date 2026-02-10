# Pokemon Microservice Framework Specification

## Overview

This specification defines `@pokemon/framework` - a TypeScript decorator-based microservice framework inspired by NestJS, Ruby on Rails, and Flask. The framework provides a structured, scalable approach to building HTTP services with dependency injection, modular architecture, and declarative routing.

**Current Problem:**
The existing microservices (`apps/rest-api`, `apps/graphql-api`) use ad-hoc patterns with:

- Scattered handler functions without clear organization
- Manual dependency management
- Duplicated routing logic
- No standardized request/response lifecycle
- Inconsistent middleware application

**Proposed Solution:**
A shared framework package providing:

- Decorator-based controllers and routing (`@Controller`, `@Get`, `@Post`)
- Dependency injection container (`@Injectable`, `@Inject`)
- Module system for code organization (`@Module`)
- Middleware pipeline with decorators (`@UseMiddleware`, `@UseGuard`)
- Standardized request context and response builders
- Lifecycle hooks for startup/shutdown

---

## Package Structure

```
packages/@framework/
├── src/
│   ├── index.ts                      # Public API exports
│   │
│   ├── core/
│   │   ├── Application.ts            # Main application bootstrap
│   │   ├── Container.ts              # Dependency injection container
│   │   ├── Module.ts                 # Module registry and loader
│   │   ├── Router.ts                 # Route collection and matching
│   │   ├── RequestContext.ts         # Per-request context
│   │   └── types.ts                  # Core type definitions
│   │
│   ├── decorators/
│   │   ├── index.ts                  # Decorator exports
│   │   ├── controller.ts             # @Controller decorator
│   │   ├── routes.ts                 # @Get, @Post, @Put, @Delete, @Patch
│   │   ├── parameters.ts             # @Param, @Query, @Body, @Headers, @Ctx
│   │   ├── injectable.ts             # @Injectable decorator
│   │   ├── inject.ts                 # @Inject decorator
│   │   ├── module.ts                 # @Module decorator
│   │   ├── middleware.ts             # @UseMiddleware, @UseGuard
│   │   └── lifecycle.ts              # @OnStart, @OnShutdown
│   │
│   ├── http/
│   │   ├── Request.ts                # Enhanced request wrapper
│   │   ├── Response.ts               # Response builder (fluent API)
│   │   ├── HttpException.ts          # Standard HTTP exceptions
│   │   └── StatusCodes.ts            # HTTP status code constants
│   │
│   ├── middleware/
│   │   ├── Middleware.ts             # Middleware interface
│   │   ├── MiddlewarePipeline.ts     # Middleware execution chain
│   │   ├── CorsMiddleware.ts         # Built-in CORS middleware
│   │   ├── LoggingMiddleware.ts      # Built-in request logging
│   │   └── ErrorMiddleware.ts        # Global error handler
│   │
│   ├── validation/
│   │   ├── Validator.ts              # Request validation
│   │   ├── decorators.ts             # @IsString, @IsNumber, @IsOptional
│   │   └── ValidationPipe.ts         # Auto-validation pipe
│   │
│   └── testing/
│       ├── TestApplication.ts        # Test harness
│       ├── MockContainer.ts          # DI mocking utilities
│       └── RequestBuilder.ts         # Test request builder
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## Core Concepts

### 1. Application Bootstrap

The `Application` class is the entry point that bootstraps modules, initializes the DI container, and starts the HTTP server.

```typescript
// apps/rest-api/src/main.ts
import { Application } from '@pokemon/framework';
import { AppModule } from './app.module';

const app = await Application.create(AppModule);

await app.listen(3001, () => {
  console.log('REST API listening on port 3001');
});
```

### 2. Modules

Modules organize related functionality (controllers, services, imports) into cohesive units.

```typescript
// apps/rest-api/src/app.module.ts
import { Module } from '@pokemon/framework';
import { CardsModule } from './cards/cards.module';
import { SetsModule } from './sets/sets.module';
import { HealthModule } from './health/health.module';
import { DatabaseService } from './database/database.service';

@Module({
  imports: [CardsModule, SetsModule, HealthModule],
  providers: [DatabaseService],
  exports: [DatabaseService]
})
export class AppModule {}
```

```typescript
// apps/rest-api/src/cards/cards.module.ts
import { Module } from '@pokemon/framework';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';

@Module({
  controllers: [CardsController],
  providers: [CardsService]
})
export class CardsModule {}
```

### 3. Controllers

Controllers handle incoming requests and return responses. Routes are defined via decorators.

```typescript
// apps/rest-api/src/cards/cards.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Ctx,
  UseMiddleware,
  HttpException,
  HttpStatus
} from '@pokemon/framework';
import { CardsService } from './cards.service';
import { RequestContext } from '@pokemon/framework';
import { LoggingMiddleware } from '../middleware/logging.middleware';

@Controller('/api/v1/cards')
@UseMiddleware(LoggingMiddleware)
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get('/')
  async getCards(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 60,
    @Ctx() ctx: RequestContext
  ) {
    const result = await this.cardsService.findAll({ page, pageSize });

    return {
      data: result.cards,
      meta: {
        page,
        pageSize,
        totalCount: result.total,
        totalPages: Math.ceil(result.total / pageSize)
      }
    };
  }

  @Get('/search')
  async searchCards(
    @Query('name') name?: string,
    @Query('type') type?: string,
    @Query('rarity') rarity?: string,
    @Query('set') setId?: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 60
  ) {
    if (!name && !type && !rarity && !setId) {
      throw new HttpException(
        'At least one search parameter is required',
        HttpStatus.BAD_REQUEST
      );
    }

    return this.cardsService.search({
      name,
      type,
      rarity,
      setId,
      page,
      pageSize
    });
  }

  @Get('/:id')
  async getCard(@Param('id') id: string) {
    const card = await this.cardsService.findById(id);

    if (!card) {
      throw new HttpException(
        `Card with id ${id} not found`,
        HttpStatus.NOT_FOUND
      );
    }

    return { data: card };
  }
}
```

### 4. Services (Injectables)

Services contain business logic and are managed by the DI container.

```typescript
// apps/rest-api/src/cards/cards.service.ts
import { Injectable } from '@pokemon/framework';
import { DatabaseService } from '../database/database.service';

interface FindAllOptions {
  page: number;
  pageSize: number;
}

interface SearchOptions extends FindAllOptions {
  name?: string;
  type?: string;
  rarity?: string;
  setId?: string;
}

@Injectable()
export class CardsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(options: FindAllOptions) {
    const { page, pageSize } = options;
    const offset = (page - 1) * pageSize;

    const total = await this.db.count('pokemon_cards');
    const cards = await this.db.query(
      'SELECT * FROM pokemon_cards ORDER BY name LIMIT ? OFFSET ?',
      [pageSize, offset]
    );

    return { cards, total };
  }

  async findById(id: string) {
    return this.db.queryOne('SELECT * FROM pokemon_cards WHERE id = ?', [id]);
  }

  async search(options: SearchOptions) {
    // Build dynamic query based on search options
    const conditions: string[] = [];
    const values: any[] = [];

    if (options.name) {
      conditions.push('name LIKE ?');
      values.push(`%${options.name}%`);
    }

    if (options.type) {
      conditions.push('types LIKE ?');
      values.push(`%"${options.type}"%`);
    }

    if (options.rarity) {
      conditions.push('rarity = ?');
      values.push(options.rarity);
    }

    if (options.setId) {
      conditions.push('set_id = ?');
      values.push(options.setId);
    }

    const whereClause = conditions.join(' AND ');
    const offset = (options.page - 1) * options.pageSize;

    const total = await this.db.count('pokemon_cards', whereClause, values);
    const cards = await this.db.query(
      `SELECT * FROM pokemon_cards WHERE ${whereClause} ORDER BY name LIMIT ? OFFSET ?`,
      [...values, options.pageSize, offset]
    );

    return {
      data: cards,
      meta: { total, page: options.page, pageSize: options.pageSize }
    };
  }
}
```

### 5. Dependency Injection

The framework provides constructor-based dependency injection with automatic resolution.

```typescript
// apps/rest-api/src/database/database.service.ts
import { Injectable, OnStart, OnShutdown } from '@pokemon/framework';
import { Database } from 'bun:sqlite';

@Injectable()
export class DatabaseService {
  private db: Database | null = null;

  @OnStart()
  async initialize() {
    this.db = new Database(process.env.DATABASE_PATH!, { readonly: true });
    this.db.run('PRAGMA query_only = ON;');
    console.log('Database connection established');
  }

  @OnShutdown()
  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('Database connection closed');
    }
  }

  query<T>(sql: string, params: any[] = []): T[] {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.query(sql).all(...params) as T[];
  }

  queryOne<T>(sql: string, params: any[] = []): T | null {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.query(sql).get(...params) as T | null;
  }

  async count(
    table: string,
    where?: string,
    params: any[] = []
  ): Promise<number> {
    const sql = where
      ? `SELECT COUNT(*) as count FROM ${table} WHERE ${where}`
      : `SELECT COUNT(*) as count FROM ${table}`;
    const result = this.queryOne<{ count: number }>(sql, params);
    return result?.count ?? 0;
  }
}
```

### 6. Middleware

Middleware intercepts requests before they reach controllers.

```typescript
// packages/@framework/src/middleware/Middleware.ts
export interface Middleware {
  use(ctx: RequestContext, next: () => Promise<Response>): Promise<Response>;
}

// apps/rest-api/src/middleware/logging.middleware.ts
import { Injectable, Middleware, RequestContext } from '@pokemon/framework';

@Injectable()
export class LoggingMiddleware implements Middleware {
  async use(
    ctx: RequestContext,
    next: () => Promise<Response>
  ): Promise<Response> {
    const start = Date.now();
    console.log(`--> ${ctx.method} ${ctx.path}`);

    const response = await next();

    const duration = Date.now() - start;
    console.log(
      `<-- ${ctx.method} ${ctx.path} ${response.status} ${duration}ms`
    );

    return response;
  }
}
```

### 7. Guards

Guards determine if a request should be handled (authentication, authorization).

```typescript
// apps/rest-api/src/guards/api-key.guard.ts
import {
  Injectable,
  Guard,
  RequestContext,
  HttpException,
  HttpStatus
} from '@pokemon/framework';

@Injectable()
export class ApiKeyGuard implements Guard {
  async canActivate(ctx: RequestContext): Promise<boolean> {
    const apiKey = ctx.headers.get('X-API-Key');

    if (!apiKey || apiKey !== process.env.API_KEY) {
      throw new HttpException('Invalid API key', HttpStatus.UNAUTHORIZED);
    }

    return true;
  }
}

// Usage in controller
@Controller('/api/v1/admin')
@UseGuard(ApiKeyGuard)
export class AdminController {
  // All routes require API key
}
```

---

## Decorator Specifications

### Controller Decorators

| Decorator           | Target | Description                              |
| ------------------- | ------ | ---------------------------------------- |
| `@Controller(path)` | Class  | Marks class as controller with base path |
| `@Get(path?)`       | Method | HTTP GET route                           |
| `@Post(path?)`      | Method | HTTP POST route                          |
| `@Put(path?)`       | Method | HTTP PUT route                           |
| `@Patch(path?)`     | Method | HTTP PATCH route                         |
| `@Delete(path?)`    | Method | HTTP DELETE route                        |

### Parameter Decorators

| Decorator         | Target    | Description             |
| ----------------- | --------- | ----------------------- |
| `@Param(name)`    | Parameter | Extract path parameter  |
| `@Query(name)`    | Parameter | Extract query parameter |
| `@Body()`         | Parameter | Extract request body    |
| `@Headers(name?)` | Parameter | Extract header(s)       |
| `@Ctx()`          | Parameter | Inject request context  |
| `@Req()`          | Parameter | Inject raw request      |

### DI Decorators

| Decorator               | Target    | Description                               |
| ----------------------- | --------- | ----------------------------------------- |
| `@Injectable(options?)` | Class     | Marks class for DI (singleton by default) |
| `@Inject(token)`        | Parameter | Inject dependency by token                |
| `@Optional()`           | Parameter | Mark dependency as optional               |

### Module Decorators

| Decorator          | Target | Description      |
| ------------------ | ------ | ---------------- |
| `@Module(options)` | Class  | Defines a module |

### Lifecycle Decorators

| Decorator       | Target | Description                        |
| --------------- | ------ | ---------------------------------- |
| `@OnStart()`    | Method | Called when application starts     |
| `@OnShutdown()` | Method | Called when application shuts down |

### Middleware Decorators

| Decorator                       | Target       | Description      |
| ------------------------------- | ------------ | ---------------- |
| `@UseMiddleware(...middleware)` | Class/Method | Apply middleware |
| `@UseGuard(...guards)`          | Class/Method | Apply guards     |

---

## Core Implementation Details

### Application Class

```typescript
// packages/@framework/src/core/Application.ts
export class Application {
  private container: Container;
  private router: Router;
  private modules: Map<Function, ModuleMetadata>;
  private middlewarePipeline: MiddlewarePipeline;

  private constructor() {
    this.container = new Container();
    this.router = new Router();
    this.modules = new Map();
    this.middlewarePipeline = new MiddlewarePipeline();
  }

  static async create(rootModule: Function): Promise<Application> {
    const app = new Application();
    await app.bootstrap(rootModule);
    return app;
  }

  private async bootstrap(rootModule: Function): Promise<void> {
    // 1. Load module tree
    await this.loadModule(rootModule);

    // 2. Initialize providers with @OnStart
    await this.container.initializeAll();

    // 3. Register routes from controllers
    this.registerRoutes();
  }

  private async loadModule(moduleClass: Function): Promise<void> {
    const metadata = Reflect.getMetadata(MODULE_METADATA_KEY, moduleClass);
    if (!metadata) {
      throw new Error(`${moduleClass.name} is not a valid module`);
    }

    // Register providers
    for (const provider of metadata.providers || []) {
      this.container.register(provider);
    }

    // Register controllers
    for (const controller of metadata.controllers || []) {
      this.container.register(controller);
    }

    // Load imported modules recursively
    for (const importedModule of metadata.imports || []) {
      await this.loadModule(importedModule);
    }

    this.modules.set(moduleClass, metadata);
  }

  private registerRoutes(): void {
    for (const [, metadata] of this.modules) {
      for (const controllerClass of metadata.controllers || []) {
        const controller = this.container.resolve(controllerClass);
        const routes = Reflect.getMetadata(
          ROUTES_METADATA_KEY,
          controllerClass
        );
        const basePath = Reflect.getMetadata(
          CONTROLLER_PATH_KEY,
          controllerClass
        );

        for (const route of routes || []) {
          const fullPath = this.normalizePath(basePath + route.path);
          this.router.register(
            route.method,
            fullPath,
            controller,
            route.handler
          );
        }
      }
    }
  }

  async listen(port: number, callback?: () => void): Promise<void> {
    const server = Bun.serve({
      port,
      fetch: async (request) => {
        return this.handleRequest(request);
      }
    });

    // Register shutdown handlers
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());

    callback?.();
  }

  private async handleRequest(request: Request): Promise<Response> {
    const ctx = new RequestContext(request);

    try {
      // Run through middleware pipeline
      return await this.middlewarePipeline.execute(ctx, async () => {
        // Match route
        const match = this.router.match(ctx.method, ctx.path);

        if (!match) {
          throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
        }

        // Extract and inject parameters
        const args = await this.resolveParameters(match, ctx);

        // Execute handler
        const result = await match.handler.apply(match.controller, args);

        // Transform result to Response
        return this.transformResult(result);
      });
    } catch (error) {
      return this.handleError(error, ctx);
    }
  }

  private async shutdown(): Promise<void> {
    console.log('Shutting down...');
    await this.container.shutdownAll();
    process.exit(0);
  }
}
```

### Container (Dependency Injection)

```typescript
// packages/@framework/src/core/Container.ts
export class Container {
  private instances = new Map<Function, any>();
  private definitions = new Map<Function, ProviderDefinition>();

  register(provider: Function | ProviderDefinition): void {
    if (typeof provider === 'function') {
      this.definitions.set(provider, {
        useClass: provider,
        scope: 'singleton'
      });
    } else {
      this.definitions.set(provider.provide, provider);
    }
  }

  resolve<T>(token: Function): T {
    // Check for existing singleton instance
    if (this.instances.has(token)) {
      return this.instances.get(token);
    }

    const definition = this.definitions.get(token);
    if (!definition) {
      throw new Error(`No provider found for ${token.name}`);
    }

    // Resolve dependencies
    const paramTypes =
      Reflect.getMetadata('design:paramtypes', definition.useClass) || [];
    const dependencies = paramTypes.map((type: Function) => this.resolve(type));

    // Create instance
    const instance = new definition.useClass(...dependencies);

    // Store singleton
    if (definition.scope === 'singleton') {
      this.instances.set(token, instance);
    }

    return instance;
  }

  async initializeAll(): Promise<void> {
    for (const [token] of this.definitions) {
      const instance = this.resolve(token);
      const onStartMethod = Reflect.getMetadata(
        ON_START_KEY,
        instance.constructor
      );
      if (onStartMethod) {
        await instance[onStartMethod]();
      }
    }
  }

  async shutdownAll(): Promise<void> {
    for (const [, instance] of this.instances) {
      const onShutdownMethod = Reflect.getMetadata(
        ON_SHUTDOWN_KEY,
        instance.constructor
      );
      if (onShutdownMethod) {
        await instance[onShutdownMethod]();
      }
    }
  }
}
```

### Router

```typescript
// packages/@framework/src/core/Router.ts
interface RouteMatch {
  controller: any;
  handler: Function;
  params: Record<string, string>;
  metadata: RouteMetadata;
}

export class Router {
  private routes: RouteDefinition[] = [];

  register(
    method: HttpMethod,
    path: string,
    controller: any,
    handler: Function
  ): void {
    const { pattern, paramNames } = this.compilePath(path);
    this.routes.push({ method, pattern, paramNames, controller, handler });
  }

  match(method: string, path: string): RouteMatch | null {
    for (const route of this.routes) {
      if (route.method !== method) continue;

      const match = path.match(route.pattern);
      if (match) {
        const params: Record<string, string> = {};
        route.paramNames.forEach((name, i) => {
          params[name] = match[i + 1];
        });

        return {
          controller: route.controller,
          handler: route.handler,
          params,
          metadata: route.metadata
        };
      }
    }
    return null;
  }

  private compilePath(path: string): { pattern: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];
    const pattern = path.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    return { pattern: new RegExp(`^${pattern}/?$`), paramNames };
  }
}
```

---

## HTTP Response Builder

Fluent API for building responses:

```typescript
// packages/@framework/src/http/Response.ts
export class ResponseBuilder {
  private _status: number = 200;
  private _headers: Headers = new Headers();
  private _body: any = null;

  static ok(data?: any): ResponseBuilder {
    return new ResponseBuilder().status(200).json(data);
  }

  static created(data?: any): ResponseBuilder {
    return new ResponseBuilder().status(201).json(data);
  }

  static noContent(): ResponseBuilder {
    return new ResponseBuilder().status(204);
  }

  status(code: number): this {
    this._status = code;
    return this;
  }

  header(name: string, value: string): this {
    this._headers.set(name, value);
    return this;
  }

  json(data: any): this {
    this._body = data;
    this._headers.set('Content-Type', 'application/json');
    return this;
  }

  build(): Response {
    return new Response(
      this._body ? JSON.stringify(this._body) : null,
      {
        status: this._status,
        headers: this._headers
      }
    );
  }
}

// Usage in controller
@Get('/:id')
async getCard(@Param('id') id: string) {
  const card = await this.cardsService.findById(id);

  if (!card) {
    return ResponseBuilder.notFound(`Card ${id} not found`);
  }

  return ResponseBuilder.ok({ data: card })
    .header('X-Cache', 'MISS')
    .build();
}
```

---

## GraphQL Integration

The framework extends to support GraphQL with similar patterns:

```typescript
// apps/graphql-api/src/cards/cards.resolver.ts
import {
  Resolver,
  Query,
  Arg,
  Ctx,
  FieldResolver,
  Root
} from '@pokemon/framework/graphql';
import { CardsService } from './cards.service';
import { SetsService } from '../sets/sets.service';

@Resolver('Card')
export class CardsResolver {
  constructor(
    private readonly cardsService: CardsService,
    private readonly setsService: SetsService
  ) {}

  @Query('card')
  async getCard(@Arg('id') id: string) {
    return this.cardsService.findById(id);
  }

  @Query('cards')
  async getCards(
    @Arg('limit', { defaultValue: 60 }) limit: number,
    @Arg('offset', { defaultValue: 0 }) offset: number,
    @Arg('name', { nullable: true }) name?: string
  ) {
    return this.cardsService.findAll({ limit, offset, name });
  }

  @FieldResolver('set')
  async getSet(@Root() card: Card, @Ctx() ctx: GraphQLContext) {
    return ctx.loaders.setLoader.load(card.setId);
  }
}
```

---

## Migration Path

### Phase 1: Create Framework Package

1. Initialize `packages/@framework` with core abstractions
2. Implement decorators using `reflect-metadata`
3. Build DI container with constructor injection
4. Create router with path parameter support
5. Add middleware pipeline

### Phase 2: Migrate REST API

**Before:**

```typescript
// apps/rest-api/src/handlers/cards/getCards.ts
export async function getCards(
  request: Request,
  _params: Record<string, string>,
  searchParams: URLSearchParams,
  context: RequestContext
): Promise<Response> {
  const db = getDatabase();
  const pagination = parsePaginationParams(searchParams);
  // ... handler logic
}
```

**After:**

```typescript
// apps/rest-api/src/cards/cards.controller.ts
@Controller('/api/v1/cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get('/')
  async getCards(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 60
  ) {
    return this.cardsService.findAll({ page, pageSize });
  }
}
```

### Phase 3: Migrate GraphQL API

Convert resolvers to use the same DI patterns with GraphQL-specific decorators.

### Phase 4: Migrate Web BFF

Apply framework to BFF handlers for consistent architecture across all services.

---

## Package Dependencies

```json
{
  "name": "@pokemon/framework",
  "version": "0.0.1",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "bun build src/index.ts --outdir=dist --target=bun",
    "test": "bun test",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "reflect-metadata": "^0.2.2"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "5.5.4"
  },
  "peerDependencies": {
    "bun": ">=1.0.0"
  }
}
```

---

## Configuration

The framework supports configuration through decorators and environment:

```typescript
// apps/rest-api/src/config/config.service.ts
import { Injectable, OnStart } from '@pokemon/framework';

@Injectable()
export class ConfigService {
  private config: Record<string, any> = {};

  @OnStart()
  async load() {
    this.config = {
      port: parseInt(process.env.REST_API_PORT || '3001', 10),
      database: {
        path: process.env.DATABASE_PATH || './database/pokemon.db',
        readonly: process.env.DATABASE_READONLY !== 'false'
      },
      cors: {
        origins: (process.env.CORS_ORIGINS || '*').split(',')
      }
    };
  }

  get<T>(key: string): T {
    return key.split('.').reduce((obj, k) => obj?.[k], this.config) as T;
  }
}
```

---

## Testing Support

```typescript
// apps/rest-api/src/cards/cards.controller.spec.ts
import { TestApplication, MockContainer } from '@pokemon/framework/testing';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';

describe('CardsController', () => {
  let app: TestApplication;
  let mockCardsService: jest.Mocked<CardsService>;

  beforeEach(async () => {
    mockCardsService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      search: jest.fn()
    };

    app = await TestApplication.create(CardsController, {
      providers: [{ provide: CardsService, useValue: mockCardsService }]
    });
  });

  describe('GET /api/v1/cards', () => {
    it('returns paginated cards', async () => {
      mockCardsService.findAll.mockResolvedValue({
        cards: [{ id: 'sv8-1', name: 'Pikachu' }],
        total: 1
      });

      const response = await app.get('/api/v1/cards?page=1&pageSize=10');

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        data: [{ id: 'sv8-1', name: 'Pikachu' }],
        meta: { page: 1, pageSize: 10, totalCount: 1, totalPages: 1 }
      });
    });
  });

  describe('GET /api/v1/cards/:id', () => {
    it('returns 404 for non-existent card', async () => {
      mockCardsService.findById.mockResolvedValue(null);

      const response = await app.get('/api/v1/cards/invalid-id');

      expect(response.status).toBe(404);
    });
  });
});
```

---

## Complete REST API Example

```
apps/rest-api/
├── src/
│   ├── main.ts                       # Application entry
│   ├── app.module.ts                 # Root module
│   │
│   ├── config/
│   │   ├── config.module.ts
│   │   └── config.service.ts
│   │
│   ├── database/
│   │   ├── database.module.ts
│   │   └── database.service.ts
│   │
│   ├── cards/
│   │   ├── cards.module.ts
│   │   ├── cards.controller.ts
│   │   ├── cards.service.ts
│   │   └── dto/
│   │       ├── card.dto.ts
│   │       └── search-cards.dto.ts
│   │
│   ├── sets/
│   │   ├── sets.module.ts
│   │   ├── sets.controller.ts
│   │   └── sets.service.ts
│   │
│   ├── health/
│   │   ├── health.module.ts
│   │   └── health.controller.ts
│   │
│   └── middleware/
│       ├── cors.middleware.ts
│       ├── logging.middleware.ts
│       └── rate-limit.middleware.ts
│
├── package.json
├── tsconfig.json
└── Dockerfile
```

---

## Success Criteria

| Criteria             | Metric                                          |
| -------------------- | ----------------------------------------------- |
| Code Clarity         | Controllers are self-documenting via decorators |
| Testability          | 90%+ coverage achievable with DI mocking        |
| Consistency          | Same patterns across REST, GraphQL, and BFF     |
| Developer Experience | <5 min to add new endpoint                      |
| Performance          | <5ms framework overhead per request             |
| Type Safety          | Full TypeScript inference for DI and routes     |

---

## Implementation Phases

### Phase 1: Core Framework (Week 1)

- [ ] Set up `packages/@framework` structure
- [ ] Implement `reflect-metadata` decorators
- [ ] Build DI Container with constructor injection
- [ ] Create Router with path parameter extraction
- [ ] Add basic middleware pipeline

### Phase 2: HTTP Layer (Week 1)

- [ ] Implement RequestContext
- [ ] Build ResponseBuilder with fluent API
- [ ] Create HttpException hierarchy
- [ ] Add parameter decorators (@Param, @Query, @Body)

### Phase 3: Module System (Week 2)

- [ ] Implement @Module decorator
- [ ] Build module loader with import resolution
- [ ] Add lifecycle hooks (@OnStart, @OnShutdown)
- [ ] Create Application bootstrap

### Phase 4: Migrate REST API (Week 2)

- [ ] Refactor to module structure
- [ ] Convert handlers to controllers
- [ ] Extract services from handlers
- [ ] Add middleware via decorators

### Phase 5: GraphQL Support (Week 3)

- [ ] Add GraphQL-specific decorators
- [ ] Integrate with Apollo Server
- [ ] Migrate GraphQL API

### Phase 6: Testing & Documentation (Week 3)

- [ ] Build TestApplication harness
- [ ] Create MockContainer utilities
- [ ] Write framework documentation
- [ ] Add example applications

---

## Appendix: Decorator Implementation

```typescript
// packages/@framework/src/decorators/controller.ts
import 'reflect-metadata';

export const CONTROLLER_METADATA_KEY = Symbol('controller');
export const ROUTES_METADATA_KEY = Symbol('routes');

export function Controller(path: string = ''): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(CONTROLLER_METADATA_KEY, { path }, target);

    // Initialize routes array if not exists
    if (!Reflect.hasMetadata(ROUTES_METADATA_KEY, target)) {
      Reflect.defineMetadata(ROUTES_METADATA_KEY, [], target);
    }
  };
}

// packages/@framework/src/decorators/routes.ts
function createRouteDecorator(method: string) {
  return (path: string = ''): MethodDecorator => {
    return (target, propertyKey, descriptor) => {
      const routes =
        Reflect.getMetadata(ROUTES_METADATA_KEY, target.constructor) || [];
      routes.push({
        method,
        path,
        handler: propertyKey
      });
      Reflect.defineMetadata(ROUTES_METADATA_KEY, routes, target.constructor);
    };
  };
}

export const Get = createRouteDecorator('GET');
export const Post = createRouteDecorator('POST');
export const Put = createRouteDecorator('PUT');
export const Patch = createRouteDecorator('PATCH');
export const Delete = createRouteDecorator('DELETE');

// packages/@framework/src/decorators/parameters.ts
export const PARAMS_METADATA_KEY = Symbol('params');

type ParamType = 'param' | 'query' | 'body' | 'headers' | 'context' | 'request';

function createParamDecorator(
  type: ParamType,
  key?: string
): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    const existingParams =
      Reflect.getMetadata(PARAMS_METADATA_KEY, target, propertyKey!) || [];
    existingParams.push({ type, key, index: parameterIndex });
    Reflect.defineMetadata(
      PARAMS_METADATA_KEY,
      existingParams,
      target,
      propertyKey!
    );
  };
}

export const Param = (name: string) => createParamDecorator('param', name);
export const Query = (name: string) => createParamDecorator('query', name);
export const Body = () => createParamDecorator('body');
export const Headers = (name?: string) => createParamDecorator('headers', name);
export const Ctx = () => createParamDecorator('context');
export const Req = () => createParamDecorator('request');
```

---

## Questions for Clarification

1. **Scope Preferences**: Should services default to singleton or request-scoped?
2. **Validation**: Include built-in validation decorators or defer to external library?
3. **GraphQL Priority**: Should GraphQL support be included in Phase 1 or deferred?
4. **Authentication**: Include built-in auth decorators or keep as application concern?
5. **Configuration**: Use environment variables only or support config files (YAML/JSON)?
