import { CreditCard, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { AdminDataTable, type AdminColumn } from '@/components/admin/AdminDataTable';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionRow extends Record<string, unknown> {
  org_name: string;
  plan_name: string;
  status: string;
  amount_cents?: number;
  current_period_end: string | null;
}

const columns: AdminColumn<SubscriptionRow>[] = [
  { key: 'org_name', label: 'Organization' },
  {
    key: 'plan_name',
    label: 'Plan',
    render: (row) => row.plan_name ?? 'Unknown',
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => {
      const colors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
        active: 'default',
        trialing: 'outline',
        past_due: 'destructive',
        canceled: 'secondary',
      };
      return <Badge variant={colors[row.status] ?? 'secondary'}>{row.status}</Badge>;
    },
  },
  {
    key: 'amount_cents',
    label: 'MRR',
    render: (row) => `$${((row.amount_cents ?? 0) / 100).toFixed(2)}`,
  },
  {
    key: 'current_period_end',
    label: 'Period End',
    render: (row) => row.current_period_end ? new Date(row.current_period_end).toLocaleDateString() : '—',
  },
];

export default function AdminSubscriptions() {
  const { data: subs = [], isLoading } = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_subscriptions')
        .select(`
          *,
          organizations (name),
          billing_plans (name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((s): SubscriptionRow => ({
        ...s,
        org_name: (s as unknown as { organizations?: { name: string } | null }).organizations?.name ?? '—',
        plan_name: (s as unknown as { billing_plans?: { name: string } | null }).billing_plans?.name ?? '—',
      }));
    },
  });

  const active = subs.filter((s) => s.status === 'active');
  const trialing = subs.filter((s) => s.status === 'trialing');
  const pastDue = subs.filter((s) => s.status === 'past_due');
  const mrr = active.reduce((sum, s) => sum + ((s.amount_cents ?? 0) as number), 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">Manage all platform subscriptions.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard title="Active" value={active.length} icon={CreditCard} />
        <AdminStatsCard title="Trialing" value={trialing.length} icon={Users} />
        <AdminStatsCard title="Past Due" value={pastDue.length} icon={AlertTriangle} />
        <AdminStatsCard title="MRR" value={`$${(mrr / 100).toLocaleString()}`} icon={TrendingUp} />
      </div>

      <AdminDataTable
        data={subs}
        columns={columns}
        searchPlaceholder="Search subscriptions..."
        searchKeys={['org_name', 'plan_name', 'status']}
        isLoading={isLoading}
      />
    </div>
  );
}
