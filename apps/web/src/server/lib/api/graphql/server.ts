import { schema } from './schema';
import resolverDefs from './resolvers';
import {
  ApolloServer,
  HeaderMap,
  type HTTPGraphQLResponse
} from '@apollo/server';

import { getDatabase } from '../db';

export function createGraphQLSidecarServer() {
  const db = getDatabase();
  const apolloServer = new ApolloServer({
    typeDefs: schema,
    resolvers: resolverDefs.resolvers(db),
    // Log GraphQL errors
    formatError: (error) => {
      console.error('GraphQL Error:', {
        message: error.message,
        extensions: error.extensions
      });
      return {
        message: error.message,
        extensions: error.extensions
      };
    }
  });

  async function start() {
    await apolloServer.start();
  }

  /**
   * Converts Apollo Server's HTTPGraphQLResponse to a Bun-compatible Response
   */
  async function toWellFormedResponse(
    gqlResponse: HTTPGraphQLResponse
  ): Promise<Response> {
    // Convert HeaderMap to Headers object
    const headers = new Headers();
    for (const [key, value] of gqlResponse.headers) {
      headers.set(key, value);
    }

    // Add CORS headers
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    const status = gqlResponse.status || 200;

    // Handle complete response body
    if (gqlResponse.body.kind === 'complete') {
      return new Response(gqlResponse.body.string, {
        status,
        headers
      });
    }

    // Handle chunked/streaming response body
    // Convert AsyncIterator to ReadableStream for Bun's Response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of (
            gqlResponse.body as {
              kind: 'chunked';
              asyncIterator: AsyncIterableIterator<string>;
            }
          ).asyncIterator) {
            controller.enqueue(new TextEncoder().encode(chunk));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      status,
      headers
    });
  }

  async function _handleGraphQLRequest(request: Request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    const url = new URL(request.url);

    return apolloServer.executeHTTPGraphQLRequest({
      httpGraphQLRequest: {
        method: request.method,
        headers: new HeaderMap(request.headers),
        search: url.search,
        body: request.body
      },
      context: async () => ({ db, request })
    });
  }

  async function handleGraphQLRequest(request: Request): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    try {
      const url = new URL(request.url);

      // Parse body if present (for POST requests)
      let body: any = undefined;
      if (request.method === 'POST' && request.body) {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          body = await request.json();
        }
      }

      const gqlResponse = await apolloServer.executeHTTPGraphQLRequest({
        httpGraphQLRequest: {
          method: request.method.toUpperCase(),
          headers: new HeaderMap(request.headers),
          search: url.search,
          body
        },
        context: async () => ({ db, request })
      });

      return await toWellFormedResponse(gqlResponse);
    } catch (error) {
      console.error('GraphQL request error:', error);
      return new Response(
        JSON.stringify({
          errors: [
            {
              message: 'Internal server error',
              extensions: {
                code: 'INTERNAL_SERVER_ERROR'
              }
            }
          ]
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
  }

  return {
    start,
    handleGraphQLRequest,
    server: apolloServer
  };
}
