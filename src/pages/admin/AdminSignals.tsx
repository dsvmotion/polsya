import { useMemo } from 'react';
import { Zap, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { AdminDataTable, type AdminColumn } from '@/components/admin/AdminDataTable';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

/* ─── Row interfaces (engine tables not yet in generated types) ─── */

interface SignalRow {
  id: string;
  org_id: string;
  rule_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  signal_type: string;
  title: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'seen' | 'actioned' | 'dismissed';
  data: Record<string, unknown> | null;
  created_at: string;
}

interface SignalRuleRow {
  id: string;
  org_id: string;
  name: string;
  rule_type: string;
  is_active: boolean;
  priority: number;
  created_at: string;
}

/* ─── Badge variant helpers ─── */

const SEVERITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'default',
  low: 'secondary',
  info: 'outline',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  new: 'default',
  seen: 'secondary',
  actioned: 'outline',
  dismissed: 'outline',
};

/* ─── Column definitions ─── */

const signalColumns: AdminColumn<SignalRow>[] = [
  {
    key: 'created_at',
    label: 'Time',
    render: (row) => (
      <span className="text-xs font-mono">
        {new Date(row.created_at).toLocaleString()}
      </span>
    ),
  },
  { key: 'title', label: 'Title' },
  {
    key: 'signal_type',
    label: 'Type',
    render: (row) => <Badge variant="outline">{row.signal_type}</Badge>,
  },
  {
    key: 'severity',
    label: 'Severity',
    render: (row) => (
      <Badge variant={SEVERITY_VARIANT[row.severity] ?? 'outline'}>
        {row.severity}
      </Badge>
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
];

const ruleColumns: AdminColumn<SignalRuleRow>[] = [
  { key: 'name', label: 'Rule Name' },
  {
    key: 'rule_type',
    label: 'Type',
    render: (row) => <Badge variant="outline">{row.rule_type}</Badge>,
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
    key: 'priority',
    label: 'Priority',
    render: (row) => <span className="font-mono text-xs">{row.priority}</span>,
  },
  {
    key: 'created_at',
    label: 'Created',
    render: (row) => new Date(row.created_at).toLocaleDateString(),
  },
];

/* ─── Component ─── */

export default function AdminSignals() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Fetch recent signals (cross-org, platform owner RLS)
  const { data: signals = [], isLoading: signalsLoading } = useQuery<SignalRow[]>({
    queryKey: ['admin', 'signals'],
    queryFn: async () => {
      const { data, error } = await supabase
        // @ts-expect-error — table exists in DB but not yet in generated types
        .from('signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as SignalRow[];
    },
  });

  // Fetch signal rules
  const { data: rules = [], isLoading: rulesLoading } = useQuery<SignalRuleRow[]>({
    queryKey: ['admin', 'signal-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        // @ts-expect-error — table exists in DB but not yet in generated types
        .from('signal_rules')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SignalRuleRow[];
    },
  });

  // Computed stats
  const activeRules = useMemo(
    () => rules.filter((r) => r.is_active).length,
    [rules],
  );

  const processed24h = useMemo(
    () => signals.filter((s) => s.created_at >= oneDayAgo).length,
    [signals, oneDayAgo],
  );

  const errors24h = useMemo(
    () =>
      signals.filter(
        (s) => s.created_at >= oneDayAgo && s.severity === 'critical',
      ).length,
    [signals, oneDayAgo],
  );

  const successRate = useMemo(() => {
    if (processed24h === 0) return '—';
    const rate = ((processed24h - errors24h) / processed24h) * 100;
    return `${rate.toFixed(1)}%`;
  }, [processed24h, errors24h]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Signals Monitoring</h1>
        <p className="text-sm text-muted-foreground">
          Monitor creative intelligence signal pipeline health across all organizations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard
          title="Active Rules"
          value={activeRules}
          icon={Zap}
          subtitle={`${rules.length} total`}
        />
        <AdminStatsCard
          title="Processed (24h)"
          value={processed24h}
          icon={Activity}
        />
        <AdminStatsCard
          title="Critical (24h)"
          value={errors24h}
          icon={AlertTriangle}
          subtitle={errors24h > 0 ? 'Needs attention' : 'All clear'}
        />
        <AdminStatsCard
          title="Success Rate"
          value={successRate}
          icon={CheckCircle}
          subtitle="Last 24 hours"
        />
      </div>

      <Tabs defaultValue="signals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="signals">Recent Signals</TabsTrigger>
          <TabsTrigger value="rules">Signal Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="signals">
          <AdminDataTable
            data={signals}
            columns={signalColumns}
            searchPlaceholder="Search signals..."
            searchKeys={['title', 'signal_type', 'severity', 'status']}
            isLoading={signalsLoading}
            pageSize={15}
          />
        </TabsContent>

        <TabsContent value="rules">
          <AdminDataTable
            data={rules}
            columns={ruleColumns}
            searchPlaceholder="Search rules..."
            searchKeys={['name', 'rule_type']}
            isLoading={rulesLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
