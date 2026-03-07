import { createContext, useContext } from 'react';

export const ImpersonationContext = createContext<{
  impersonateOrgId: string | null;
  setImpersonateOrgId: (id: string | null) => void;
} | null>(null);

export function useImpersonation() {
  const ctx = useContext(ImpersonationContext);
  return ctx ?? { impersonateOrgId: null, setImpersonateOrgId: () => {} };
}
