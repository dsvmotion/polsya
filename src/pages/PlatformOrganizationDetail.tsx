import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Users, CreditCard, Package, Plug, Bot } from 'lucide-react';
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
import { usePlatformOrganizationDetail } from '@/hooks/usePlatformOrganizationDetail';
import { useUpsertAiChatConfig } from '@/hooks/useUpsertAiChatConfig';

function truncateId(id: string): string {
  if (!id || id.length < 8) return id;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

const OPENAI_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'];
const ANTHROPIC_MODELS = ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'];

export default function PlatformOrganizationDetail() {
  const { orgId } = useParams<{ orgId: string }>();
  const { data: org, isLoading, error } = usePlatformOrganizationDetail(orgId);
  const upsert = useUpsertAiChatConfig();
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('openai');
  const [model, setModel] = useState('gpt-4o-mini');

  useEffect(() => {
    if (!org) return;
    if (org.aiChatConfig) {
      setProvider(org.aiChatConfig.provider);
      setModel(org.aiChatConfig.model);
    } else {
      setProvider('openai');
      setModel('gpt-4o-mini');
    }
  }, [org?.id, org?.aiChatConfig?.provider, org?.aiChatConfig?.model]);

  const handleSave = () => {
    if (!orgId) return;
    upsert.mutate({ organizationId: orgId, provider, model });
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="p-4 md:p-6">
        <Button variant="ghost" asChild>
          <Link to="/platform" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>
        <p className="mt-4 text-destructive">
          {error instanceof Error ? error.message : 'Organización no encontrada'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/platform">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <p className="text-sm text-muted-foreground">{org.slug}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold capitalize">
                  {org.subscriptionStatus ?? '—'}
                </p>
                <p className="text-sm text-muted-foreground">Suscripción</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{org.memberCount}</p>
                <p className="text-sm text-muted-foreground">Miembros</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{org.entityCount}</p>
                <p className="text-sm text-muted-foreground">Entidades</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Plug className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{org.integrationCount}</p>
                <p className="text-sm text-muted-foreground">Integraciones</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID</span>
              <code className="text-xs">{truncateId(org.id)}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Creado</span>
              <span>{new Date(org.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Locale</span>
              <span>{org.locale}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zona horaria</span>
              <span>{org.timezone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Moneda</span>
              <span>{org.currency}</span>
            </div>
            {org.currentPeriodEnd && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Periodo hasta</span>
                <span>{new Date(org.currentPeriodEnd).toLocaleDateString()}</span>
              </div>
            )}
            {org.stripeSubscriptionId && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground">Stripe Subscription</span>
                <code className="text-xs truncate">{org.stripeSubscriptionId.slice(0, 20)}…</code>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Miembros ({org.members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {org.members.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin miembros</p>
            ) : (
              <div className="space-y-2">
                {org.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg border border-border"
                  >
                    <code className="text-xs text-muted-foreground">{truncateId(m.user_id)}</code>
                    <Badge variant={m.status === 'active' ? 'default' : 'secondary'}>
                      {m.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{m.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Chat
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Provider y modelo usados por el asistente IA de esta organización.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="ai-provider">Provider</Label>
              <Select
                value={provider}
                onValueChange={(v) => {
                  setProvider(v as 'openai' | 'anthropic');
                  setModel(
                    v === 'anthropic' ? ANTHROPIC_MODELS[0] : OPENAI_MODELS[0]
                  );
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
              <Label htmlFor="ai-model">Modelo</Label>
              <Input
                id="ai-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={
                  provider === 'anthropic'
                    ? ANTHROPIC_MODELS[0]
                    : OPENAI_MODELS[0]
                }
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Sugeridos:{' '}
                {provider === 'anthropic'
                  ? ANTHROPIC_MODELS.join(', ')
                  : OPENAI_MODELS.join(', ')}
              </p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={upsert.isPending || !orgId}
          >
            {upsert.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
          {upsert.isError && (
            <p className="text-sm text-destructive">
              {upsert.error instanceof Error
                ? upsert.error.message
                : 'Error al guardar'}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to={`/dashboard?as_org=${orgId}`}>Ver como cliente</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/platform/billing">Ver en Pagos</Link>
        </Button>
      </div>
    </div>
  );
}
