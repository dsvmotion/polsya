import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { AdminDataTable, type AdminColumn } from '@/components/admin/AdminDataTable';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  organization_name: string | null;
  role: string | null;
  status: string;
  created_at: string;
  last_sign_in_at: string | null;
}

const columns: AdminColumn<AdminUser>[] = [
  { key: 'email', label: 'Email' },
  { key: 'full_name', label: 'Name', render: (row) => row.full_name || '—' },
  { key: 'organization_name', label: 'Organization', render: (row) => row.organization_name || '—' },
  {
    key: 'role',
    label: 'Role',
    render: (row) => (
      <Badge variant="outline" className="text-xs">{row.role || 'member'}</Badge>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>
        {row.status}
      </Badge>
    ),
  },
  {
    key: 'created_at',
    label: 'Created',
    render: (row) => new Date(row.created_at).toLocaleDateString(),
  },
];

export default function AdminUsers() {
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          user_id,
          role,
          created_at,
          organizations (name)
        `)
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((m) => {
        const org = m.organizations as { name: string } | null;
        return {
          id: m.user_id,
          email: m.user_id,
          full_name: null,
          organization_name: org?.name ?? null,
          role: m.role,
          status: 'active',
          created_at: m.created_at,
          last_sign_in_at: null,
        };
      });
    },
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage platform users and their roles.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          Failed to load users: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatsCard title="Total Users" value={users.length} icon={Users} />
        <AdminStatsCard
          title="Active"
          value={users.filter((u) => u.status === 'active').length}
          icon={Users}
        />
        <AdminStatsCard
          title="Admins"
          value={users.filter((u) => u.role === 'admin' || u.role === 'owner').length}
          icon={Users}
        />
      </div>

      <AdminDataTable
        data={users}
        columns={columns}
        searchPlaceholder="Search by email or name..."
        searchKeys={['email', 'full_name', 'organization_name']}
        isLoading={isLoading}
      />
    </div>
  );
}
