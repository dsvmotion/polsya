import { useNavigate } from 'react-router-dom';
import { Building2, CreditCard, Users } from 'lucide-react';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { AdminDataTable, type AdminColumn } from '@/components/admin/AdminDataTable';
import { Badge } from '@/components/ui/badge';
import { usePlatformTenants, type TenantWithBilling } from '@/hooks/usePlatformTenants';

const columns: AdminColumn<TenantWithBilling>[] = [
  { key: 'name', label: 'Organization' },
  { key: 'slug', label: 'Slug' },
  {
    key: 'memberCount',
    label: 'Members',
    render: (row) => row.memberCount ?? '—',
  },
  {
    key: 'subscriptionStatus',
    label: 'Status',
    render: (row) => {
      const status = row.subscriptionStatus ?? 'none';
      const variant = status === 'active' ? 'default' : status === 'trialing' ? 'outline' : 'secondary';
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    key: 'createdAt',
    label: 'Created',
    render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—',
  },
];

export default function AdminOrganizations() {
  const navigate = useNavigate();
  const { data: tenants = [], isLoading, error } = usePlatformTenants();

  const activeCount = tenants.filter((t) =>
    ['active', 'trialing'].includes(t.subscriptionStatus ?? ''),
  ).length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Organizations</h1>
        <p className="text-sm text-muted-foreground">
          Manage tenant organizations.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          Failed to load organizations: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatsCard title="Total Orgs" value={tenants.length} icon={Building2} />
        <AdminStatsCard title="Active" value={activeCount} icon={CreditCard} />
        <AdminStatsCard
          title="Trialing"
          value={tenants.filter((t) => t.subscriptionStatus === 'trialing').length}
          icon={Users}
        />
      </div>

      <AdminDataTable
        data={tenants}
        columns={columns}
        searchPlaceholder="Search organizations..."
        searchKeys={['name', 'slug', 'subscriptionStatus']}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/admin/org/${row.id}`)}
      />
    </div>
  );
}
