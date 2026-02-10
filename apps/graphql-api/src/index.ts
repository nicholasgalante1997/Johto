import {
  createApp,
  createContainer,
  createRouter,
  cors,
  securityHeaders,
  type Middleware
} from '@pokemon/framework';

import { loadConfig } from './config';
import { DatabaseService } from './services/database';
import type { Services } from './types/services';
import {
  createApolloServer,
  createGraphQLHandler,
  graphiqlHandler
} from './server';
import { healthCheck, readyCheck } from './handlers/health';

const config = loadConfig();

// ============================================================
// 1. Container — service registration and lifecycle
// ============================================================

const db = new DatabaseService(config.database);

const container = createContainer()
  .register('config', () => config)
  .register('db', () => db);

// ============================================================
// 2. Apollo Server — initialized before listen, queries only
//    execute after container.start() opens the database
// ============================================================

const apolloServer = await createApolloServer(db, config.apollo.introspection);
const handleGraphQL = createGraphQLHandler(apolloServer);

// ============================================================
// 3. Routers — route definitions grouped by domain
// ============================================================

const health = createRouter<Services>('/health').get('/', healthCheck);

const ready = createRouter<Services>('/ready').get('/', readyCheck);

const graphql = createRouter<Services>('/graphql')
  .post('/', handleGraphQL)
  .get('/', handleGraphQL);

const graphiql = createRouter<Services>('/graphiql').get('/', graphiqlHandler);

const root = createRouter<Services>('/').get('/', graphiqlHandler);

// ============================================================
// 4. Application assembly
// ============================================================

const log_middleware: Middleware<Services> = (ctx, next) => {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      method: ctx.method,
      path: ctx.path,
      requestId: ctx.requestId
    })
  );

  return next();
};

const app = createApp({ container })
  .use(log_middleware)
  .use(securityHeaders)
  .use(
    cors({
      origins: config.cors.origins
    })
  )
  .routes(health)
  .routes(ready)
  .routes(graphql)
  .routes(graphiql)
  .routes(root);

// ============================================================
// 5. Start
// ============================================================

await app.listen(config.port, () => {
  console.log(
    `Pokemon TCG GraphQL API listening on http://${config.host}:${config.port}`
  );
  console.log(`GraphiQL IDE: http://${config.host}:${config.port}/graphiql`);
  console.log(`GraphQL endpoint: http://${config.host}:${config.port}/graphql`);
  console.log(`Health check: http://${config.host}:${config.port}/health`);
});
