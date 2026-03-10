import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CreditCard, Users, TrendingUp, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { usePlatformTenants } from '@/hooks/usePlatformTenants';
import { supabase } from '@/integrations/supabase/client';

export default function AdminDashboard() {
  const { data: tenants = [], isLoading: tenantsLoading, error: tenantsError } = usePlatformTenants();

  const activeCount = useMemo(
    () => tenants.filter((t) => ['active', 'trialing'].includes(t.subscriptionStatus ?? '')).length,
    [tenants],
  );

  const trialingCount = useMemo(
    () => tenants.filter((t) => t.subscriptionStatus === 'trialing').length,
    [tenants],
  );

  // MRR calculation — sum active subscription amounts
  // amount_cents may exist at DB level but is not in generated Supabase types;
  // select all fields and access dynamically for forward-compatibility
  const { data: mrrCents = 0 } = useQuery({
    queryKey: ['admin', 'mrr'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_subscriptions')
        .select('*')
        .eq('status', 'active');
      if (error) throw error;
      return (data ?? []).reduce((sum, s) => {
        const row = s as Record<string, unknown>;
        return sum + (Number(row.amount_cents) || 0);
      }, 0);
    },
  });

  // Recent audit logs
  const { data: recentLogs = [] } = useQuery({
    queryKey: ['admin', 'recent-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Contact messages count
  const { data: contactCount = 0 } = useQuery({
    queryKey: ['admin', 'contact-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  if (tenantsLoading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Loading platform data…</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 w-24 bg-muted rounded mb-2" />
                <div className="h-8 w-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (tenantsError) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-destructive">
            Failed to load dashboard: {tenantsError instanceof Error ? tenantsError.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Platform overview and quick actions.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard
          title="Organizations"
          value={tenants.length}
          icon={Building2}
          subtitle={`${activeCount} active`}
        />
        <AdminStatsCard
          title="Active Subscriptions"
          value={activeCount}
          icon={CreditCard}
          subtitle={`${trialingCount} trialing`}
        />
        <AdminStatsCard
          title="MRR"
          value={`$${(mrrCents / 100).toLocaleString()}`}
          icon={TrendingUp}
        />
        <AdminStatsCard
          title="Contact Messages"
          value={contactCount}
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/logs" className="gap-1 text-xs">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{log.action} — {log.resource_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link to="/admin/users"><Users className="h-4 w-4" /> Manage Users</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link to="/admin/organizations"><Building2 className="h-4 w-4" /> Manage Organizations</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link to="/admin/subscriptions"><CreditCard className="h-4 w-4" /> View Subscriptions</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link to="/admin/logs"><AlertTriangle className="h-4 w-4" /> System Logs</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link to="/admin/flags"><TrendingUp className="h-4 w-4" /> Feature Flags</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
