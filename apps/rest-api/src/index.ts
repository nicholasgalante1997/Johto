import {
  createApp,
  createContainer,
  createRouter,
  cors,
  logging,
  rateLimit,
  securityHeaders
} from '@pokemon/framework';

import { loadConfig } from './config';
import { DatabaseService } from './services/database';
import type { Services } from './types';
import { getCards, getCardById, searchCards } from './handlers/cards';
import { getSets, getSetById, getSetCards, getSetsBySeries } from './handlers/sets';
import { healthCheck, readyCheck, getApiDiscovery } from './handlers/health';

const config = loadConfig();

// ============================================================
// 1. Container — service registration and lifecycle
// ============================================================

const container = createContainer()
  .register('config', () => config)
  .register('db', (c) => new DatabaseService(c.get('config').database));

// ============================================================
// 2. Routers — route definitions grouped by domain
// ============================================================

// Health & discovery (no base path — these live at the root)
const health = createRouter<Services>('/health')
  .get('/', healthCheck);

const ready = createRouter<Services>('/ready')
  .get('/', readyCheck);

const discovery = createRouter<Services>('/api/v1')
  .get('/endpoints', getApiDiscovery)
  .get('/', getApiDiscovery);

// Cards — search must be registered before :id so it matches first
const cards = createRouter<Services>('/api/v1/cards')
  .get('/search', searchCards)
  .get('/:id', getCardById)
  .get('/', getCards);

// Sets — series and :id/cards must come before bare :id
const sets = createRouter<Services>('/api/v1/sets')
  .get('/series/:series', getSetsBySeries)
  .get('/:id/cards', getSetCards)
  .get('/:id', getSetById)
  .get('/', getSets);

// ============================================================
// 3. Application assembly
// ============================================================

const app = createApp({ container })
  .use(logging)
  .use(securityHeaders)
  .use(cors({
    origins: config.cors.origins,
    credentials: true
  }))
  .use(rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests
  }))
  .routes(health)
  .routes(ready)
  .routes(discovery)
  .routes(cards)
  .routes(sets);

// ============================================================
// 4. Start
// ============================================================

await app.listen(config.port, () => {
  console.log(`Pokemon TCG REST API listening on http://${config.host}:${config.port}`);
  console.log(`Health:     http://${config.host}:${config.port}/health`);
  console.log(`Discovery:  http://${config.host}:${config.port}/api/v1/endpoints`);
});
