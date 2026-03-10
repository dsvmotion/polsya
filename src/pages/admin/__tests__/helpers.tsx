import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

/**
 * Creates a fresh QueryClient suitable for testing:
 * - No retries (fail fast)
 * - gcTime: 0 so data doesn't leak between tests
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

/**
 * Wraps children in both QueryClientProvider + MemoryRouter.
 * Accepts optional `initialEntries` for route param testing.
 */
export function TestProviders({
  children,
  initialEntries = ['/'],
}: {
  children: React.ReactNode;
  initialEntries?: string[];
}) {
  const qc = createTestQueryClient();
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}
