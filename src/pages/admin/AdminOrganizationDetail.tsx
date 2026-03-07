import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Users,
  CreditCard,
  Plug,
  Bot,
  Clock,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { AdminDataTable, type AdminColumn } from '@/components/admin/AdminDataTable';
import {
  usePlatformOrganizationDetail,
  type OrganizationDetail,
  type OrgMemberRow,
} from '@/hooks/usePlatformOrganizationDetail';
import { useUpsertAiChatConfig } from '@/hooks/useUpsertAiChatConfig';
import { supabase } from '@/integrations/supabase/client';

function truncateId(id: string): string {
  if (!id || id.length < 8) return id;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

const OPENAI_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'];
const ANTHROPIC_MODELS = [
  'claude-3-5-sonnet-20241022',
  'claude-3-opus-20240229',
  'claude-3-haiku-20240307',
];

interface AuditLogRow {
  id: string;
  action: string;
  resource_type: string;
  actor_id: string | null;
  created_at: string;
  details?: Record<string, unknown>;
}

const memberColumns: AdminColumn<OrgMemberRow>[] = [
  {
    key: 'user_id',
    label: 'User ID',
    render: (row) => (
      <code className="text-xs font-mono">{truncateId(row.user_id)}</code>
    ),
  },
  {
    key: 'role',
    label: 'Role',
    render: (row) => <Badge variant="outline">{row.role}</Badge>,
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
    label: 'Joined',
    render: (row) => new Date(row.created_at).toLocaleDateString(),
  },
];

const activityColumns: AdminColumn<AuditLogRow>[] = [
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
    key: 'actor_id',
    label: 'Actor',
    render: (row) => (
      <code className="text-xs">{row.actor_id ? truncateId(row.actor_id) : '—'}</code>
    ),
  },
];

export default function AdminOrganizationDetail() {
  const { orgId } = useParams<{ orgId: string }>();
  const { data, isLoading, error } = usePlatformOrganizationDetail(orgId);
  const org: OrganizationDetail | null = data ?? null;
  const upsert = useUpsertAiChatConfig();
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('openai');
  const [model, setModel] = useState('gpt-4o-mini');

  // Activity logs scoped to this org
  const { data: activityLogs = [] } = useQuery<AuditLogRow[]>({
    queryKey: ['admin', 'org-activity', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data: logs, error: logErr } = await supabase
        .from('platform_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (logErr) return [];
      // Filter client-side since platform_audit_logs may not have org_id
      return (logs ?? []) as AuditLogRow[];
    },
  });

  useEffect(() => {
    if (!org?.aiChatConfig) {
      setProvider('openai');
      setModel('gpt-4o-mini');
      return;
    }
    setProvider(org.aiChatConfig.provider);
    setModel(org.aiChatConfig.model);
  }, [org?.id, org?.aiChatConfig?.provider, org?.aiChatConfig?.model]);

  const handleSave = () => {
    if (!orgId) return;
    upsert.mutate({ organizationId: orgId, provider, model });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Loading organization…</p>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Button variant="ghost" asChild>
          <Link to="/admin/organizations" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <p className="text-destructive">
          {error instanceof Error ? error.message : 'Organization not found'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/organizations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <p className="text-sm text-muted-foreground">{org.slug}</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard
          title="Subscription"
          value={org.subscriptionStatus ?? '—'}
          icon={CreditCard}
        />
        <AdminStatsCard
          title="Members"
          value={org.memberCount}
          icon={Users}
        />
        <AdminStatsCard
          title="Entities"
          value={org.entityCount}
          icon={Building2}
        />
        <AdminStatsCard
          title="Integrations"
          value={org.integrationCount}
          icon={Plug}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="ai">AI Config</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* ─── Overview ─── */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" /> Organization Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <InfoRow label="ID" value={<code className="text-xs">{truncateId(org.id)}</code>} />
              <InfoRow label="Created" value={new Date(org.created_at).toLocaleDateString()} />
              <InfoRow label="Locale" value={org.locale} />
              <InfoRow label="Timezone" value={org.timezone} />
              <InfoRow label="Currency" value={org.currency} />
              {org.currentPeriodEnd && (
                <InfoRow label="Period End" value={new Date(org.currentPeriodEnd).toLocaleDateString()} />
              )}
              {org.stripeSubscriptionId && (
                <InfoRow
                  label="Stripe Subscription"
                  value={<code className="text-xs">{org.stripeSubscriptionId.slice(0, 24)}…</code>}
                />
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button asChild>
              <Link to={`/dashboard?as_org=${orgId}`}>View as customer</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/billing">Billing</Link>
            </Button>
          </div>
        </TabsContent>

        {/* ─── Members ─── */}
        <TabsContent value="members">
          <AdminDataTable
            data={org.members}
            columns={memberColumns}
            searchPlaceholder="Search members…"
            searchKeys={['user_id', 'role', 'status']}
          />
        </TabsContent>

        {/* ─── Subscription ─── */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4" /> Subscription Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <InfoRow
                label="Status"
                value={
                  <Badge
                    variant={
                      org.subscriptionStatus === 'active'
                        ? 'default'
                        : org.subscriptionStatus === 'past_due'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {org.subscriptionStatus ?? 'none'}
                  </Badge>
                }
              />
              {org.currentPeriodEnd && (
                <InfoRow label="Current Period End" value={new Date(org.currentPeriodEnd).toLocaleDateString()} />
              )}
              {org.stripeSubscriptionId && (
                <InfoRow
                  label="Stripe ID"
                  value={<code className="text-xs font-mono">{org.stripeSubscriptionId}</code>}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── AI Config ─── */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="h-4 w-4" /> AI Chat Configuration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Provider and model used by this organization&apos;s AI assistant.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="ai-provider">Provider</Label>
                  <Select
                    value={provider}
                    onValueChange={(v) => {
                      const p = v as 'openai' | 'anthropic';
                      setProvider(p);
                      setModel(p === 'anthropic' ? ANTHROPIC_MODELS[0] : OPENAI_MODELS[0]);
                    }}
                  >
                    <SelectTrigger id="ai-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                      <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-model">Model</Label>
                  <Input
                    id="ai-model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={provider === 'anthropic' ? ANTHROPIC_MODELS[0] : OPENAI_MODELS[0]}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Suggested:{' '}
                    {provider === 'anthropic'
                      ? ANTHROPIC_MODELS.join(', ')
                      : OPENAI_MODELS.join(', ')}
                  </p>
                </div>
              </div>
              <Button onClick={handleSave} disabled={upsert.isPending || !orgId}>
                {upsert.isPending ? 'Saving…' : 'Save'}
              </Button>
              {upsert.isError && (
                <p className="text-sm text-destructive">
                  {upsert.error instanceof Error ? upsert.error.message : 'Save failed'}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Activity ─── */}
        <TabsContent value="activity">
          <AdminDataTable
            data={activityLogs}
            columns={activityColumns}
            searchPlaceholder="Search activity…"
            searchKeys={['action', 'resource_type']}
            pageSize={15}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Small helper for key-value rows */
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
