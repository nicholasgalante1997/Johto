import { handleRequest } from './lib/handleRequest';
import { middleware } from './lib/middleware/middleware';

export const serve = () => {
  return Bun.serve({
    port: 3000,
    async fetch(req) {
      middleware(req);
      return handleRequest(req);
    }
  });
};
