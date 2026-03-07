import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import { useImpersonation } from '@/contexts/impersonation-context';
import { Button } from '@/components/ui/button';
import { EyeOff } from 'lucide-react';

export function ImpersonationBanner() {
  const { organization, isImpersonating } = useCurrentOrganization();
  const { setImpersonateOrgId } = useImpersonation();

  if (!isImpersonating || !organization) return null;

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between gap-2">
      <span className="text-sm text-amber-800 dark:text-amber-200">
        Viendo como <strong>{organization.name}</strong>
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setImpersonateOrgId(null)}
        className="border-amber-600/50 text-amber-800 hover:bg-amber-500/20 dark:text-amber-200"
      >
        <EyeOff className="h-4 w-4 mr-1" />
        Salir
      </Button>
    </div>
  );
}
