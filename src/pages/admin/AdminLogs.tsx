import { Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AdminDataTable, type AdminColumn } from '@/components/admin/AdminDataTable';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

/** Escape a string for safe CSV output (prevents formula injection and structure corruption). */
function csvField(value: string): string {
  let safe = value;
  if (/^[=+\-@\t\r]/.test(safe)) {
    safe = `'${safe}`;
  }
  return `"${safe.replace(/"/g, '""')}"`;
}

interface AuditLogRow {
  id: string;
  created_at: string;
  action: string;
  resource_type: string;
  resource_id: string;
  organization_id: string;
  actor_type: string;
  actor_id: string;
  actor_email: string;
  metadata: Record<string, unknown> | null;
  org_name?: string;
}

const columns: AdminColumn<AuditLogRow>[] = [
  {
    key: 'created_at',
    label: 'Timestamp',
    render: (row) => (
      <span className="text-xs font-mono">
        {new Date(row.created_at).toLocaleString()}
      </span>
    ),
  },
  { key: 'action', label: 'Action' },
  { key: 'resource_type', label: 'Resource' },
  {
    key: 'actor_email',
    label: 'Actor',
    render: (row) => row.actor_email || row.actor_id?.slice(0, 8) || '—',
  },
  {
    key: 'org_name',
    label: 'Organization',
    render: (row) => row.org_name || '—',
  },
];

export default function AdminLogs() {
  const { data: logs = [], isLoading, error } = useQuery<AuditLogRow[]>({
    queryKey: ['admin', 'logs'],
    queryFn: async (): Promise<AuditLogRow[]> => {
      const { data, error } = await supabase
        .from('platform_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []).map((d) => ({
        ...d,
        metadata: (d.metadata ?? null) as Record<string, unknown> | null,
      }));
    },
  });

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Action', 'Resource', 'Actor', 'Details'].join(','),
      ...logs.map((log) =>
        [
          csvField(new Date(log.created_at).toISOString()),
          csvField(log.action),
          csvField(log.resource_type),
          csvField(log.actor_id),
          csvField(JSON.stringify(log.metadata ?? {})),
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 200);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Logs</h1>
          <p className="text-sm text-muted-foreground">
            Audit trail of platform actions ({logs.length} entries).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          Failed to load logs: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      )}

      <AdminDataTable
        data={logs}
        columns={columns}
        searchPlaceholder="Search logs..."
        searchKeys={['action', 'resource_type', 'actor_email']}
        isLoading={isLoading}
        pageSize={25}
      />
    </div>
  );
}
