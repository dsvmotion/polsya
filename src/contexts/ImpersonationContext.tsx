import { createContext, useContext, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const ImpersonationContext = createContext<{
  impersonateOrgId: string | null;
  setImpersonateOrgId: (id: string | null) => void;
} | null>(null);

export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const impersonateOrgId = searchParams.get('as_org');

  const value = useMemo(
    () => ({
      impersonateOrgId,
      setImpersonateOrgId: (id: string | null) => {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          if (id) next.set('as_org', id);
          else next.delete('as_org');
          return next;
        }, { replace: true });
      },
    }),
    [impersonateOrgId, setSearchParams]
  );

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const ctx = useContext(ImpersonationContext);
  return ctx ?? { impersonateOrgId: null, setImpersonateOrgId: () => {} };
}
