import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProviderIcon } from '@/components/ui/provider-icon';
import { PROVIDER_REGISTRY, type ProviderCategory } from '@/lib/provider-registry';
import { useIntegrations, useCreateIntegration } from '@/hooks/useIntegrations';
import { useStartOAuth } from '@/hooks/useOAuth';
import type { IntegrationProvider } from '@/types/integrations';
import { IntegrationsCard } from '@/components/dashboard/IntegrationsCard';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getProviderDefinition } from '@/lib/provider-registry';

const CATEGORIES: Array<{ key: ProviderCategory | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'ecommerce', label: 'E-commerce' },
  { key: 'email', label: 'Email' },
  { key: 'crm', label: 'CRM' },
  { key: 'ai', label: 'AI' },
  { key: 'communication', label: 'Communication' },
  { key: 'custom', label: 'Custom' },
];

const CATEGORY_COLORS: Record<string, string> = {
  crm: 'bg-blue-100 text-blue-700',
  ecommerce: 'bg-purple-100 text-purple-700',
  email: 'bg-green-100 text-green-700',
  ai: 'bg-amber-100 text-amber-700',
  communication: 'bg-cyan-100 text-cyan-700',
  custom: 'bg-gray-100 text-gray-700',
};

const allProviders = Object.values(PROVIDER_REGISTRY);

export default function IntegrationsPage() {
  const { data: integrations = [] } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const startOAuth = useStartOAuth();

  const [activeCategory, setActiveCategory] = useState<ProviderCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  const connectedProviderKeys = useMemo(
    () => new Set(integrations.map((i) => i.provider)),
    [integrations],
  );

  const availableProviders = useMemo(() => {
    return allProviders
      .filter((p) => !connectedProviderKeys.has(p.key as IntegrationProvider))
      .filter((p) => activeCategory === 'all' || p.category === activeCategory)
      .filter((p) => !search || p.label.toLowerCase().includes(search.toLowerCase()));
  }, [connectedProviderKeys, activeCategory, search]);

  const handleConnect = async (providerKey: string) => {
    const def = getProviderDefinition(providerKey);
    if (!def) return;

    try {
      const created = await createIntegration.mutateAsync({
        provider: providerKey as IntegrationProvider,
        displayName: def.label,
        metadata: {},
      });

      if (def.authType === 'oauth2') {
        toast.success('Integration added — redirecting to authorize...');
        try {
          const result = await startOAuth.mutateAsync({
            integrationId: created.id,
            provider: providerKey,
          });
          window.location.assign(result.authUrl);
        } catch {
          toast.error('Integration added but OAuth failed. Click "Connect" to retry.');
        }
      } else {
        toast.success('Integration added — click Configure to set up credentials');
      }
    } catch {
      toast.error('Failed to add integration');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Connect your tools and manage data sync pipelines.
        </p>
      </div>

      {/* Category tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
                activeCategory === cat.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-auto sm:ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm w-full sm:w-56"
          />
        </div>
      </div>

      {/* Available section */}
      <div className="rounded-lg border border-border bg-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-semibold">
            Available {availableProviders.length}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Action
          </span>
        </div>
        <div className="divide-y divide-border">
          {availableProviders.map((provider) => (
            <div
              key={provider.key}
              className="px-4 py-3 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <ProviderIcon provider={provider.key} size={28} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{provider.label}</span>
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded font-medium',
                        CATEGORY_COLORS[provider.category] ?? CATEGORY_COLORS.custom,
                      )}
                    >
                      {provider.category.charAt(0).toUpperCase() +
                        provider.category.slice(1)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {provider.description}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleConnect(provider.key)}
                disabled={createIntegration.isPending}
                className="shrink-0"
              >
                Connect
              </Button>
            </div>
          ))}
          {availableProviders.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {search
                ? 'No matching integrations found.'
                : 'All integrations are connected!'}
            </div>
          )}
        </div>
      </div>

      {/* Connected section */}
      <ErrorBoundary section="integrations">
        <IntegrationsCard />
      </ErrorBoundary>
    </div>
  );
}
