import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient configuration for React Query v5
 * Optimized for financial/wealth management application
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes - data considered fresh (increased for better caching)
      gcTime: 1000 * 60 * 60, // 60 minutes garbage collection (increased for chat history)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false, // Disable for financial app stability
      refetchOnReconnect: true, // Refetch when connection is restored
      networkMode: 'offlineFirst', // Serve from cache first for faster responses
    },
    mutations: {
      retry: false, // Don't retry mutations automatically to avoid duplicate operations
      onError: (error) => {
        // Global error handling - can be customized per mutation
        console.error('Mutation error:', error);
      },
    },
  },
});
