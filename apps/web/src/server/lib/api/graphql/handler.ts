import { createGraphQLSidecarServer } from './server';

type GraphQLServerModule = ReturnType<typeof createGraphQLSidecarServer>;

export async function handleGraphqlRequest(
  request: Request,
  graphql: GraphQLServerModule,
  graphiql?: boolean
) {
  try {
    const response = graphiql
      ? graphql.handleGraphiQLRequest(request)
      : await graphql.handleGraphQLRequest(request);
    return response;
  } catch (e) {
    console.warn('An error occurred handling the request to /graphql', e);
    return new Response(JSON.stringify('An unknown graphql error occurred'), {
      status: 500,
      statusText: 'Internal Server Error',
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}
