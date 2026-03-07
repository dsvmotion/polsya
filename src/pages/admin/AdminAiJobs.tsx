import { useMemo } from 'react';
import { BrainCircuit, Activity, Wallet, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { AdminDataTable, type AdminColumn } from '@/components/admin/AdminDataTable';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

/* ─── Row interfaces (engine tables not yet in generated types) ─── */

interface AiDocumentRow {
  id: string;
  org_id: string;
  title: string;
  source_type: 'pdf' | 'text' | 'url';
  status: 'pending' | 'processing' | 'ready' | 'error';
  chunk_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AiUsageRow {
  id: string;
  org_id: string;
  period: string;
  credits_used: number;
  credits_purchased: number;
  operation_breakdown: Record<string, unknown> | null;
  created_at: string;
}

/* ─── Badge variant helpers ─── */

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  processing: 'default',
  ready: 'secondary',
  error: 'destructive',
  pending: 'outline',
};

/* ─── Column definitions ─── */

const documentColumns: AdminColumn<AiDocumentRow>[] = [
  {
    key: 'created_at',
    label: 'Created',
    render: (row) => (
      <span className="text-xs font-mono">
        {new Date(row.created_at).toLocaleString()}
      </span>
    ),
  },
  { key: 'title', label: 'Title' },
  {
    key: 'source_type',
    label: 'Source',
    render: (row) => <Badge variant="outline">{row.source_type.toUpperCase()}</Badge>,
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
    key: 'chunk_count',
    label: 'Chunks',
    render: (row) => row.chunk_count.toLocaleString(),
  },
];

const usageColumns: AdminColumn<AiUsageRow>[] = [
  {
    key: 'period',
    label: 'Period',
    render: (row) => <span className="font-mono text-xs">{row.period}</span>,
  },
  {
    key: 'org_id',
    label: 'Organization',
    render: (row) => (
      <code className="text-xs">
        {row.org_id.slice(0, 4)}...{row.org_id.slice(-4)}
      </code>
    ),
  },
  {
    key: 'credits_used',
    label: 'Credits Used',
    render: (row) => row.credits_used.toLocaleString(),
  },
  {
    key: 'credits_purchased',
    label: 'Credits Purchased',
    render: (row) => row.credits_purchased.toLocaleString(),
  },
];

/* ─── Component ─── */

export default function AdminAiJobs() {
  // Fetch AI documents (cross-org, platform owner RLS)
  const { data: documents = [], isLoading: docsLoading } = useQuery<AiDocumentRow[]>({
    queryKey: ['admin', 'ai-documents'],
    queryFn: async () => {
      // @ts-expect-error — table exists in DB but not yet in generated types
      const { data, error } = await supabase
        .from('ai_documents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as AiDocumentRow[];
    },
  });

  // Fetch AI usage stats
  const { data: usage = [], isLoading: usageLoading } = useQuery<AiUsageRow[]>({
    queryKey: ['admin', 'ai-usage'],
    queryFn: async () => {
      // @ts-expect-error — table exists in DB but not yet in generated types
      const { data, error } = await supabase
        .from('ai_usage_monthly')
        .select('*')
        .order('period', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as AiUsageRow[];
    },
  });

  // Computed stats
  const runningJobs = useMemo(
    () => documents.filter((d) => d.status === 'processing').length,
    [documents],
  );

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const completed24h = useMemo(
    () =>
      documents.filter(
        (d) => d.status === 'ready' && d.created_at >= oneDayAgo,
      ).length,
    [documents, oneDayAgo],
  );

  const totalCreditsUsed = useMemo(
    () => usage.reduce((sum, u) => sum + (u.credits_used ?? 0), 0),
    [usage],
  );

  const errorCount = useMemo(
    () => documents.filter((d) => d.status === 'error').length,
    [documents],
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">AI Jobs</h1>
        <p className="text-sm text-muted-foreground">
          Track AI processing jobs, usage, and costs across all organizations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard
          title="Processing"
          value={runningJobs}
          icon={Activity}
          subtitle={runningJobs > 0 ? 'In progress' : 'Idle'}
        />
        <AdminStatsCard
          title="Completed (24h)"
          value={completed24h}
          icon={BrainCircuit}
        />
        <AdminStatsCard
          title="Total Credits"
          value={totalCreditsUsed.toLocaleString()}
          icon={Wallet}
          subtitle="All time"
        />
        <AdminStatsCard
          title="Errors"
          value={errorCount}
          icon={Clock}
          subtitle={errorCount > 0 ? 'Needs attention' : 'All clear'}
        />
      </div>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="usage">Usage & Credits</TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <AdminDataTable
            data={documents}
            columns={documentColumns}
            searchPlaceholder="Search documents..."
            searchKeys={['title', 'source_type', 'status']}
            isLoading={docsLoading}
            pageSize={15}
          />
        </TabsContent>

        <TabsContent value="usage">
          <AdminDataTable
            data={usage}
            columns={usageColumns}
            searchPlaceholder="Search usage..."
            searchKeys={['period', 'org_id']}
            isLoading={usageLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
