import { handleGraphqlRequest } from './lib/api/graphql/handler';
import { createGraphQLSidecarServer } from './lib/api/graphql/server';
import { handleRequest } from './lib/handleRequest';
import { middleware } from './lib/middleware/middleware';

export const serve = async () => {
  const graphql = createGraphQLSidecarServer();
  await graphql.start();
  return Bun.serve({
    port: 3000,
    async fetch(req) {
      const url = new URL(req.url);

      const graphiqlRequest = url.pathname.startsWith('/graphiql');
      const graphqlRequest = url.pathname.startsWith('/graphql');
      if (graphqlRequest || graphiqlRequest) {
        return handleGraphqlRequest(req, graphql, graphiqlRequest);
      }

      middleware(req);
      return handleRequest(req);
    }
  });
};
