import { useStartOAuth, useExchangeOAuth } from './useOAuth';

/** @deprecated Use useStartOAuth() from useOAuth.ts directly */
export function useStartOutlookOAuth() {
  const generic = useStartOAuth();

  return {
    ...generic,
    mutateAsync: (input: { integrationId: string }) =>
      generic.mutateAsync({ integrationId: input.integrationId, provider: 'outlook' }),
    mutate: (input: { integrationId: string }) =>
      generic.mutate({ integrationId: input.integrationId, provider: 'outlook' }),
  };
}

/** @deprecated Use useExchangeOAuth() from useOAuth.ts directly */
export function useExchangeOutlookOAuth() {
  return useExchangeOAuth();
}
