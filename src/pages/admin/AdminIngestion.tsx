import { useMemo } from 'react';
import { Download, Activity, AlertTriangle, Database } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { AdminDataTable, type AdminColumn } from '@/components/admin/AdminDataTable';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

/* ─── Row interfaces (engine tables not yet in generated types) ─── */

interface IngestionRunRow {
  id: string;
  org_id: string;
  provider_id: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string | null;
  completed_at: string | null;
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_log: string | null;
  created_at: string;
}

interface IngestionProviderRow {
  id: string;
  org_id: string;
  provider_type: string;
  name: string;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
}

/* ─── Column definitions ─── */

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  running: 'default',
  completed: 'secondary',
  failed: 'destructive',
  pending: 'outline',
  cancelled: 'outline',
};

const runColumns: AdminColumn<IngestionRunRow>[] = [
  {
    key: 'created_at',
    label: 'Started',
    render: (row) => (
      <span className="text-xs font-mono">
        {new Date(row.started_at ?? row.created_at).toLocaleString()}
      </span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <Badge variant={STATUS_VARIANT[row.status] ?? 'outline'}>
        {row.status}
      </Badge>
    ),
  },
  {
    key: 'records_processed',
    label: 'Processed',
    render: (row) => row.records_processed.toLocaleString(),
  },
  {
    key: 'records_failed',
    label: 'Failed',
    render: (row) =>
      row.records_failed > 0 ? (
        <span className="text-destructive font-medium">{row.records_failed}</span>
      ) : (
        '0'
      ),
  },
  {
    key: 'completed_at',
    label: 'Duration',
    render: (row) => {
      if (!row.started_at || !row.completed_at) return '—';
      const ms = new Date(row.completed_at).getTime() - new Date(row.started_at).getTime();
      return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
    },
  },
];

const providerColumns: AdminColumn<IngestionProviderRow>[] = [
  { key: 'name', label: 'Name' },
  {
    key: 'provider_type',
    label: 'Type',
    render: (row) => <Badge variant="outline">{row.provider_type}</Badge>,
  },
  {
    key: 'is_active',
    label: 'Active',
    render: (row) => (
      <Badge variant={row.is_active ? 'default' : 'secondary'}>
        {row.is_active ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    key: 'last_sync_at',
    label: 'Last Sync',
    render: (row) =>
      row.last_sync_at ? new Date(row.last_sync_at).toLocaleString() : '—',
  },
];

/* ─── Component ─── */

export default function AdminIngestion() {
  // Fetch recent ingestion runs (cross-org, platform owner RLS)
  const { data: runs = [], isLoading: runsLoading, error: runsError } = useQuery<IngestionRunRow[]>({
    queryKey: ['admin', 'ingestion-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        // @ts-expect-error — table exists in DB but not yet in generated types
        .from('ingestion_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as IngestionRunRow[];
    },
  });

  // Fetch ingestion providers
  const { data: providers = [], isLoading: providersLoading, error: providersError } = useQuery<IngestionProviderRow[]>({
    queryKey: ['admin', 'ingestion-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        // @ts-expect-error — table exists in DB but not yet in generated types
        .from('ingestion_providers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as IngestionProviderRow[];
    },
  });

  // Computed stats
  const activeJobs = useMemo(
    () => runs.filter((r) => r.status === 'running').length,
    [runs],
  );

  const activeSources = useMemo(
    () => providers.filter((p) => p.is_active).length,
    [providers],
  );

  const totalProcessed = useMemo(
    () => runs.reduce((sum, r) => sum + (r.records_processed ?? 0), 0),
    [runs],
  );

  const errorCount = useMemo(
    () => runs.filter((r) => r.status === 'failed').length,
    [runs],
  );

  const isLoading = runsLoading || providersLoading;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Data Ingestion</h1>
        <p className="text-sm text-muted-foreground">
          Monitor and manage data ingestion jobs across all organizations.
        </p>
      </div>

      {(runsError || providersError) && (
        <p className="text-sm text-destructive">
          Failed to load ingestion data: {(runsError ?? providersError) instanceof Error ? (runsError ?? providersError)!.message : 'Unknown error'}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard
          title="Active Jobs"
          value={activeJobs}
          icon={Activity}
          subtitle={isLoading ? 'Loading...' : undefined}
        />
        <AdminStatsCard
          title="Sources Connected"
          value={activeSources}
          icon={Database}
          subtitle={`${providers.length} total`}
        />
        <AdminStatsCard
          title="Records Processed"
          value={totalProcessed.toLocaleString()}
          icon={Download}
          subtitle="Last 100 runs"
        />
        <AdminStatsCard
          title="Failed Runs"
          value={errorCount}
          icon={AlertTriangle}
          subtitle={errorCount > 0 ? 'Needs attention' : 'All clear'}
        />
      </div>

      {/* Recent runs table */}
      <AdminDataTable
        data={runs}
        columns={runColumns}
        searchPlaceholder="Search runs..."
        searchKeys={['status', 'provider_id']}
        isLoading={runsLoading}
        pageSize={15}
      />

      {/* Providers table */}
      <AdminDataTable
        data={providers}
        columns={providerColumns}
        searchPlaceholder="Search providers..."
        searchKeys={['name', 'provider_type']}
        isLoading={providersLoading}
      />
    </div>
  );
}
