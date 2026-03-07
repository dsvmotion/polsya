import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ImpersonationContext } from './useImpersonation';

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
