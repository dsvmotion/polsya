import { useStartOAuth, useExchangeOAuth } from './useOAuth';

/** @deprecated Use useStartOAuth() from useOAuth.ts directly */
export function useStartGmailOAuth() {
  const generic = useStartOAuth();

  return {
    ...generic,
    mutateAsync: (input: { integrationId: string }) =>
      generic.mutateAsync({ integrationId: input.integrationId, provider: 'gmail' }),
    mutate: (input: { integrationId: string }) =>
      generic.mutate({ integrationId: input.integrationId, provider: 'gmail' }),
  };
}

/** @deprecated Use useExchangeOAuth() from useOAuth.ts directly */
export function useExchangeGmailOAuth() {
  return useExchangeOAuth();
}
