/**
 * GRAPHQL CLIENT CONFIGURATION
 *
 * Configured GraphQL client using graphql-request for the Pokemon TCG API
 */

import { GraphQLClient } from 'graphql-request';

// GraphQL endpoint - defaults to localhost in development
const GRAPHQL_ENDPOINT =
  typeof window !== 'undefined'
    ? `${window.location.origin}/graphql`
    : process.env.GRAPHQL_ENDPOINT || 'http://localhost:3000/graphql';

/**
 * GraphQL client instance
 * Can be used directly for queries/mutations or wrapped in react-query hooks
 */
export const graphqlClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    'Content-Type': 'application/json'
  },
  // Add credentials if needed for authentication
  credentials: 'include'
});

/**
 * Helper to update client headers (useful for auth tokens)
 */
export function setAuthToken(token: string | null) {
  if (token) {
    graphqlClient.setHeader('Authorization', `Bearer ${token}`);
  } else {
    graphqlClient.setHeader('Authorization', '');
  }
}

export default graphqlClient;
