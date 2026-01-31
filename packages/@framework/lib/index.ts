/**
 * @fileoverview @pokemon/framework - Minimal, performant, type-safe microservice framework for Bun.
 *
 * @example
 * ```typescript
 * import {
 *   createApp,
 *   createRouter,
 *   createContainer,
 *   cors,
 *   logging
 * } from '@pokemon/framework';
 *
 * // Create container with services
 * const container = createContainer()
 *   .register('db', () => new DatabaseService())
 *   .register('cards', (c) => new CardsService(c.get('db')));
 *
 * // Define routes
 * const cards = createRouter('/api/v1/cards')
 *   .get('/', async (ctx) => {
 *     const data = await ctx.services.cards.findAll();
 *     return ctx.json({ data });
 *   })
 *   .get('/:id', async (ctx) => {
 *     const card = await ctx.services.cards.findById(ctx.params.id);
 *     return card ? ctx.json({ data: card }) : ctx.notFound();
 *   });
 *
 * // Create and start app
 * const app = createApp({ container })
 *   .use(logging)
 *   .use(cors())
 *   .routes(cards);
 *
 * await app.listen(3001, () => console.log('Server running'));
 * ```
 *
 * @packageDocumentation
 */

// ============================================================
// Application
// ============================================================

export { createApp } from './app';
export type { App, AppOptions } from './app';

// ============================================================
// Router
// ============================================================

export { createRouter, compilePath, matchRoute, normalizePath } from './router';
export type { Router, CompiledPath } from './router';

// ============================================================
// Container
// ============================================================

export { createContainer } from './container';
export type { Container, ServiceFactory, ServiceOptions } from './container';

// ============================================================
// Context
// ============================================================

export { createContext } from './context';

// ============================================================
// Middleware
// ============================================================

export {
  // CORS
  cors,
  // Logging
  logging,
  createLogging,
  // Rate limiting
  rateLimit,
  // Security
  securityHeaders,
  // Utilities
  requestId,
  timing
} from './middleware';

export type {
  CorsOptions,
  LoggingOptions,
  RateLimitOptions
} from './middleware';

// ============================================================
// Types
// ============================================================

export type {
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
  CompiledRoute
} from './types';
