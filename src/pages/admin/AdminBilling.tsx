import { Wallet, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { AdminDataTable, type AdminColumn } from '@/components/admin/AdminDataTable';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceRow {
  id: string;
  org_name: string;
  amount_cents: number;
  status: string;
  created_at: string;
  stripe_invoice_id: string | null;
  organizations?: { name: string } | null;
}

const columns: AdminColumn<InvoiceRow>[] = [
  { key: 'org_name', label: 'Organization' },
  {
    key: 'amount_cents',
    label: 'Amount',
    render: (row) => `$${((row.amount_cents ?? 0) / 100).toFixed(2)}`,
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => {
      const colors: Record<string, 'default' | 'destructive' | 'secondary'> = {
        paid: 'default',
        failed: 'destructive',
        pending: 'secondary',
      };
      return <Badge variant={colors[row.status] ?? 'secondary'}>{row.status}</Badge>;
    },
  },
  {
    key: 'created_at',
    label: 'Date',
    render: (row) => new Date(row.created_at).toLocaleDateString(),
  },
  {
    key: 'stripe_invoice_id',
    label: 'Stripe ID',
    render: (row) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.stripe_invoice_id ? row.stripe_invoice_id.slice(0, 20) + '…' : '—'}
      </span>
    ),
  },
];

export default function AdminBilling() {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['admin', 'invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table not in generated types
        .from('billing_invoices' as any)
        .select('*, organizations (name)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) {
        console.warn('billing_invoices table not found, showing empty state');
        return [];
      }
      return (data ?? []).map((i: Record<string, unknown>) => ({
        ...i,
        org_name: i.organizations?.name ?? '—',
      }));
    },
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Billing & Invoices</h1>
        <p className="text-sm text-muted-foreground">View invoices and revenue data.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatsCard title="Total Invoices" value={invoices.length} icon={Wallet} />
        <AdminStatsCard
          title="Paid"
          value={invoices.filter((i: InvoiceRow) => i.status === 'paid').length}
          icon={CheckCircle}
        />
        <AdminStatsCard
          title="Failed"
          value={invoices.filter((i: InvoiceRow) => i.status === 'failed').length}
          icon={AlertTriangle}
        />
      </div>

      <AdminDataTable
        data={invoices}
        columns={columns}
        searchPlaceholder="Search invoices..."
        searchKeys={['org_name', 'status']}
        isLoading={isLoading}
      />
    </div>
  );
}
