import type { Handler } from '@pokemon/framework';
import type { Services } from '../types/services';

export const healthCheck: Handler<Services> = (ctx) => {
  const healthy = ctx.services.db.ping();
  return ctx.json(
    {
      status: healthy ? 'healthy' : 'unhealthy',
      service: 'pokemon-graphql-api',
      timestamp: new Date().toISOString()
    },
    healthy ? 200 : 503
  );
};

export const readyCheck: Handler<Services> = (ctx) => {
  const healthy = ctx.services.db.ping();
  return ctx.json({ ready: healthy }, healthy ? 200 : 503);
};
