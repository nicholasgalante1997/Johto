/**
 * QUERY CLIENT PROVIDER
 *
 * Generic react-query provider for the application
 * Enables data fetching, caching, and state management throughout the component tree
 * Used for GraphQL queries, REST API calls, and any async data operations
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Configure the QueryClient with sensible defaults for the application
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 5 minutes before considered stale
      staleTime: 1000 * 60 * 5,
      // Unused data garbage collected after 10 minutes
      gcTime: 1000 * 60 * 10,
      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus to ensure fresh data
      refetchOnWindowFocus: true,
      // Don't refetch on mount if data is still fresh
      refetchOnMount: false,
      // Refetch on reconnect after network loss
      refetchOnReconnect: true
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      retryDelay: 1000
    }
  }
});

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * QueryProvider Component
 * Wraps the application to provide react-query context for data fetching
 *
 * Usage:
 * ```tsx
 * import { QueryProvider } from '@/providers/QueryProvider';
 *
 * function App() {
 *   return (
 *     <QueryProvider>
 *       <YourApp />
 *     </QueryProvider>
 *   );
 * }
 * ```
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// Export the query client instance for use in non-component code
// (e.g., manually invalidating queries, prefetching data)
export { queryClient };
