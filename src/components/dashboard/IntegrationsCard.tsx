import { useState, useMemo } from 'react';
import { Plug, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useIntegrations,
  useCreateIntegration,
  useDeleteIntegration,
  useToggleIntegrationEnabled,
} from '@/hooks/useIntegrations';
import {
  IntegrationProvider,
  PROVIDER_LABELS,
  PROVIDER_ICONS,
  STATUS_COLORS,
} from '@/types/integrations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PROVIDERS = Object.keys(PROVIDER_LABELS) as IntegrationProvider[];

export function IntegrationsCard() {
  const { data: integrations = [], isLoading } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const deleteIntegration = useDeleteIntegration();
  const toggleEnabled = useToggleIntegrationEnabled();

  const [showForm, setShowForm] = useState(false);
  const [newProvider, setNewProvider] = useState<IntegrationProvider>('woocommerce');
  const [newName, setNewName] = useState('');

  const counts = useMemo(() => {
    let connected = 0;
    let disconnected = 0;
    let error = 0;
    for (const i of integrations) {
      if (i.status === 'connected') connected++;
      else if (i.status === 'error') error++;
      else disconnected++;
    }
    return { connected, disconnected, error };
  }, [integrations]);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error('Display name is required');
      return;
    }
    try {
      await createIntegration.mutateAsync({ provider: newProvider, displayName: trimmed });
      toast.success('Integration added');
      setNewName('');
      setShowForm(false);
    } catch {
      toast.error('Failed to add integration');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteIntegration.mutateAsync(id);
      toast.success('Integration removed');
    } catch {
      toast.error('Failed to remove integration');
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleEnabled.mutateAsync({ id, is_enabled: !current });
    } catch {
      toast.error('Failed to toggle integration');
    }
  };

  return (
    <div className="p-4 rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Plug className="h-4 w-4 text-gray-500" />
          Integrations
        </h2>
        {!showForm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowForm(true)}
            className="h-7 px-2 text-gray-500"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Status summary */}
      <div className="flex items-center gap-4 mb-3 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          {counts.connected} connected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-400" />
          {counts.disconnected} disconnected
        </span>
        {counts.error > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {counts.error} error
          </span>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2 mb-3">
          <Select value={newProvider} onValueChange={(v) => setNewProvider(v as IntegrationProvider)}>
            <SelectTrigger className="h-8 text-sm bg-white border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              {PROVIDERS.map((p) => (
                <SelectItem key={p} value={p}>
                  {PROVIDER_ICONS[p]} {PROVIDER_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Display name *"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-8 text-sm bg-white border-gray-300"
          />
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={handleAdd} disabled={createIntegration.isPending}>
              {createIntegration.isPending ? 'Adding...' : 'Add'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setNewName(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <p className="text-xs text-gray-400">Loading integrations...</p>
      ) : integrations.length === 0 && !showForm ? (
        <p className="text-xs text-gray-400">No integrations configured</p>
      ) : (
        <div className="space-y-1.5">
          {integrations.map((intg) => {
            const statusColor = STATUS_COLORS[intg.status];
            return (
              <div
                key={intg.id}
                className="flex items-center justify-between gap-2 px-2 py-1.5 rounded border border-gray-100 bg-white"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm shrink-0">{PROVIDER_ICONS[intg.provider]}</span>
                  <span className="text-sm text-gray-900 truncate">{intg.display_name}</span>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0', statusColor.bg, statusColor.text)}>
                    {intg.status}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(intg.id, intg.is_enabled)}
                    className={cn(
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                      intg.is_enabled ? 'bg-green-500' : 'bg-gray-300'
                    )}
                    title={intg.is_enabled ? 'Disable' : 'Enable'}
                  >
                    <span
                      className={cn(
                        'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
                        intg.is_enabled ? 'translate-x-4' : 'translate-x-0.5'
                      )}
                    />
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1.5 text-gray-400 hover:text-red-600"
                    onClick={() => handleDelete(intg.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
