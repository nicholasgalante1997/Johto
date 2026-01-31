import {
  ApolloServer,
  HeaderMap,
  type HTTPGraphQLResponse
} from '@apollo/server';
import type { Handler } from '@pokemon/framework';
import { typeDefs } from './schema';
import { createResolvers, type ResolverContext } from './resolvers';
import { createDataLoaders } from './dataloaders';
import type { Services } from './types/services';
import type { DatabaseService } from './services/database';

export async function createApolloServer(
  db: DatabaseService,
  introspection: boolean
): Promise<ApolloServer<ResolverContext>> {
  const server = new ApolloServer({
    typeDefs,
    resolvers: createResolvers(db),
    introspection,
    formatError: (error) => {
      console.error('GraphQL Error:', {
        message: error.message,
        path: error.path,
        extensions: error.extensions
      });
      return {
        message: error.message,
        locations: error.locations,
        path: error.path,
        extensions: error.extensions
      };
    }
  });

  await server.start();
  return server;
}

async function toResponse(gqlResponse: HTTPGraphQLResponse): Promise<Response> {
  const headers = new Headers();
  for (const [key, value] of gqlResponse.headers) {
    headers.set(key, value);
  }

  const status = gqlResponse.status || 200;

  if (gqlResponse.body.kind === 'complete') {
    return new Response(gqlResponse.body.string, { status, headers });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of (gqlResponse.body as any).asyncIterator) {
          controller.enqueue(new TextEncoder().encode(chunk));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });

  return new Response(stream, { status, headers });
}

export function createGraphQLHandler(
  apolloServer: ApolloServer
): Handler<Services> {
  return async (ctx) => {
    try {
      const loaders = createDataLoaders(ctx.services.db);
      const url = new URL(ctx.request.url);

      let body: any = undefined;
      if (ctx.method === 'POST' && ctx.request.body) {
        const contentType = ctx.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          body = await ctx.request.json();
        }
      }

      const headerMap = new HeaderMap();
      ctx.headers.forEach((value, key) => {
        headerMap.set(key, value);
      });

      const gqlResponse = await apolloServer.executeHTTPGraphQLRequest({
        httpGraphQLRequest: {
          method: ctx.method,
          headers: headerMap,
          search: url.search,
          body
        },
        context: async (): Promise<ResolverContext> => ({
          db: ctx.services.db,
          loaders,
          request: ctx.request
        })
      });

      return await toResponse(gqlResponse);
    } catch (error) {
      console.error('GraphQL request error:', error);
      return new Response(
        JSON.stringify({
          errors: [
            {
              message: 'Internal server error',
              extensions: { code: 'INTERNAL_SERVER_ERROR' }
            }
          ]
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}

export const graphiqlHandler: Handler<Services> = (ctx) => {
  const url = new URL(ctx.request.url);
  const graphqlEndpoint = `${url.protocol}//${url.host}/graphql`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pokemon TCG GraphQL API</title>
  <style>
    body { height: 100vh; margin: 0; width: 100%; overflow: hidden; }
    #graphiql { height: 100vh; }
  </style>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/graphiql@3/graphiql.min.css" />
</head>
<body>
  <div id="graphiql">Loading...</div>
  <script src="https://unpkg.com/graphiql@3/graphiql.min.js" type="application/javascript"></script>
  <script>
    const fetcher = GraphiQL.createFetcher({ url: '${graphqlEndpoint}' });
    const root = ReactDOM.createRoot(document.getElementById('graphiql'));
    root.render(
      React.createElement(GraphiQL, {
        fetcher,
        defaultEditorToolsVisibility: true,
        defaultQuery: \`# Pokemon TCG GraphQL API
# Try these example queries:

# Get statistics
query Stats {
  stats {
    totalCards
    totalSets
    lastUpdated
  }
}

# Get sets with pagination
query Sets {
  sets(limit: 10) {
    totalCount
    edges {
      node {
        id
        name
        series
        total
        releaseDate
      }
    }
    pageInfo {
      hasNextPage
    }
  }
}

# Get a specific card
query Card {
  card(id: "sv8-25") {
    id
    name
    supertype
    types
    hp
    attacks {
      name
      damage
      cost
    }
    set {
      name
      series
    }
  }
}

# Search cards by name
query SearchCards {
  cardsByName(name: "Pikachu") {
    id
    name
    rarity
    set {
      name
    }
  }
}
\`
      })
    );
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
};
