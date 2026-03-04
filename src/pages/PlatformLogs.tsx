import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ScrollText, ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useMemo, useState } from 'react';

type AuditLog = {
  id: string;
  created_at: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  organization_id: string | null;
  actor_type: string;
  actor_email: string | null;
  metadata: Record<string, unknown>;
};

export default function PlatformLogs() {
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ['platform', 'audit-logs'],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from('platform_audit_logs')
        .select('id, created_at, action, resource_type, resource_id, organization_id, actor_type, actor_email, metadata')
        .order('created_at', { ascending: false })
        .limit(200);
      if (err) throw err;
      return (data ?? []) as AuditLog[];
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.trim().toLowerCase();
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.resource_type.toLowerCase().includes(q) ||
        (l.resource_id ?? '').toLowerCase().includes(q) ||
        (l.actor_email ?? '').toLowerCase().includes(q)
    );
  }, [logs, search]);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/platform">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Audit logs</h1>
          <p className="text-sm text-muted-foreground">
            Critical actions (billing, subscriptions, etc.)
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Logs
          </CardTitle>
          <Input
            placeholder="Filtrar por acción, tipo, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent>
          {error && (
            <p className="py-4 text-destructive text-sm">
              Error al cargar: {(error as Error).message}
            </p>
          )}
          {isLoading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No hay logs aún. Se registran eventos de Stripe (suscripciones, facturas).
            </p>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {filtered.map((l) => (
                <div
                  key={l.id}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-mono"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-muted-foreground shrink-0">
                      {new Date(l.created_at).toLocaleString()}
                    </span>
                    <span className="font-medium">{l.action}</span>
                    <span className="text-muted-foreground">{l.resource_type}</span>
                    {l.resource_id && (
                      <span className="text-xs truncate max-w-[120px]" title={l.resource_id}>
                        {l.resource_id}
                      </span>
                    )}
                    {l.organization_id && (
                      <Link
                        to={`/platform/org/${l.organization_id}`}
                        className="text-primary hover:underline truncate max-w-[100px]"
                      >
                        {l.organization_id.slice(0, 8)}…
                      </Link>
                    )}
                    {l.actor_email && (
                      <span className="text-muted-foreground">{l.actor_email}</span>
                    )}
                  </div>
                  {Object.keys(l.metadata ?? {}).length > 0 && (
                    <pre className="mt-1 text-xs text-muted-foreground overflow-x-auto">
                      {JSON.stringify(l.metadata)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
