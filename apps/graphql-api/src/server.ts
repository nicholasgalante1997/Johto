import { ApolloServer, HeaderMap, type HTTPGraphQLResponse } from '@apollo/server';
import { config } from './config';
import { getDatabase, checkDatabaseHealth } from './config/database';
import { typeDefs } from './schema';
import { createResolvers, type ResolverContext } from './resolvers';
import { createDataLoaders } from './dataloaders';

/**
 * Create and start the GraphQL server
 */
export async function createGraphQLServer() {
  const db = getDatabase();

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers: createResolvers(db),
    introspection: config.apollo.introspection,
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

  await apolloServer.start();

  /**
   * Convert Apollo response to Bun Response
   */
  async function toResponse(gqlResponse: HTTPGraphQLResponse): Promise<Response> {
    const headers = new Headers();
    for (const [key, value] of gqlResponse.headers) {
      headers.set(key, value);
    }

    // Add CORS headers
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');

    const status = gqlResponse.status || 200;

    if (gqlResponse.body.kind === 'complete') {
      return new Response(gqlResponse.body.string, { status, headers });
    }

    // Handle streaming response
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

  /**
   * Handle GraphQL request
   */
  async function handleGraphQLRequest(request: Request): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID'
        }
      });
    }

    try {
      const url = new URL(request.url);

      // Parse body for POST requests
      let body: any = undefined;
      if (request.method === 'POST' && request.body) {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          body = await request.json();
        }
      }

      // Create request-scoped DataLoaders
      const loaders = createDataLoaders(db);

      // Convert Headers to HeaderMap
      const headerMap = new HeaderMap();
      request.headers.forEach((value, key) => {
        headerMap.set(key, value);
      });

      const gqlResponse = await apolloServer.executeHTTPGraphQLRequest({
        httpGraphQLRequest: {
          method: request.method.toUpperCase(),
          headers: headerMap,
          search: url.search,
          body
        },
        context: async (): Promise<ResolverContext> => ({
          db,
          loaders,
          request
        })
      });

      return await toResponse(gqlResponse);
    } catch (error) {
      console.error('GraphQL request error:', error);
      return new Response(
        JSON.stringify({
          errors: [{ message: 'Internal server error', extensions: { code: 'INTERNAL_SERVER_ERROR' } }]
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      );
    }
  }

  /**
   * Handle GraphiQL request
   */
  function handleGraphiQLRequest(request: Request): Response {
    const url = new URL(request.url);
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
  }

  /**
   * Handle health check request
   */
  function handleHealthRequest(): Response {
    const healthy = checkDatabaseHealth();
    return new Response(
      JSON.stringify({
        status: healthy ? 'healthy' : 'unhealthy',
        service: 'pokemon-graphql-api',
        timestamp: new Date().toISOString()
      }),
      {
        status: healthy ? 200 : 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return {
    server: apolloServer,
    handleGraphQLRequest,
    handleGraphiQLRequest,
    handleHealthRequest
  };
}

/**
 * Start the server
 */
export async function startServer(): Promise<void> {
  const graphql = await createGraphQLServer();

  const server = Bun.serve({
    port: config.port,
    hostname: config.host,
    async fetch(request) {
      const url = new URL(request.url);
      const pathname = url.pathname;

      // Health check endpoints
      if (pathname === '/health' || pathname === '/ready') {
        return graphql.handleHealthRequest();
      }

      // GraphiQL IDE
      if (pathname === '/graphiql' || pathname === '/') {
        return graphql.handleGraphiQLRequest(request);
      }

      // GraphQL endpoint
      if (pathname === '/graphql') {
        return graphql.handleGraphQLRequest(request);
      }

      // Not found
      return new Response('Not Found', { status: 404 });
    }
  });

  console.log(`Pokemon TCG GraphQL API listening on http://${config.host}:${config.port}`);
  console.log(`GraphiQL IDE: http://${config.host}:${config.port}/graphiql`);
  console.log(`GraphQL endpoint: http://${config.host}:${config.port}/graphql`);
  console.log(`Health check: http://${config.host}:${config.port}/health`);
}
