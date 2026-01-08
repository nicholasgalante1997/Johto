import { createGraphQLSidecarServer } from './lib/api/graphql/server';
import { handleRequest } from './lib/handleRequest';
import { middleware } from './lib/middleware/middleware';

export const serve = async () => {
  const gqlserver = createGraphQLSidecarServer();
  await gqlserver.start();
  return Bun.serve({
    port: 3000,
    async fetch(req) {
      const url = new URL(req.url);

      if (url.pathname.startsWith('/graphql')) {
        return await gqlserver.handleGraphQLRequest(req);
      }

      middleware(req);
      return handleRequest(req);
    }
  });
};
