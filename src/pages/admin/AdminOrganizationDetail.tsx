import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminOrganizationDetail() {
  const { orgId } = useParams<{ orgId: string }>();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/organizations"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Organization Detail</h1>
          <p className="text-sm text-muted-foreground">ID: {orgId}</p>
        </div>
      </div>

      <p className="text-muted-foreground">
        TODO: Port and enhance PlatformOrganizationDetail with tabs
        (Overview, Members, Subscription, Integrations, Activity).
      </p>
    </div>
  );
}
