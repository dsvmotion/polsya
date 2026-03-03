import { useState, useMemo } from 'react';
import { Plug, Plus, Trash2, RotateCw, Pencil } from 'lucide-react';
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
  useUpdateIntegration,
  useDeleteIntegration,
  useToggleIntegrationEnabled,
} from '@/hooks/useIntegrations';
import { useIntegrationRuns } from '@/hooks/useIntegrationRuns';
import { useIntegrationJobs, useEnqueueIntegrationJob, useProcessIntegrationJob, createJobIdempotencyKey } from '@/hooks/useIntegrationJobs';
import { useStartGmailOAuth } from '@/hooks/useGmailOAuth';
import { useStartOutlookOAuth } from '@/hooks/useOutlookOAuth';
import { useUpsertEmailImapCredentials } from '@/hooks/useEmailImapCredentials';
import {
  IntegrationProvider,
  IntegrationConnection,
  PROVIDER_LABELS,
  PROVIDER_ICONS,
  STATUS_COLORS,
  SYNC_RUN_STATUS_COLORS,
  INTEGRATION_JOB_STATUS_COLORS,
} from '@/types/integrations';
import {
  PROVIDER_METADATA_SCHEMA,
  validateIntegrationMetadata,
  sanitizeIntegrationMetadata,
} from '@/lib/integration-metadata';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PROVIDERS = Object.keys(PROVIDER_LABELS) as IntegrationProvider[];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function MetadataFields({
  provider,
  values,
  onChange,
  errors,
}: {
  provider: IntegrationProvider;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  errors: Record<string, string>;
}) {
  const schema = PROVIDER_METADATA_SCHEMA[provider];
  if (schema.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {schema.map((field) => (
        <div key={field.key}>
          <Input
            placeholder={`${field.label}${field.required ? ' *' : ''}`}
            value={values[field.key] ?? ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            className={cn(
              'h-8 text-sm bg-white border-gray-300',
              errors[field.key] && 'border-red-400'
            )}
            type={field.type === 'email' ? 'email' : 'text'}
          />
          {errors[field.key] && (
            <p className="text-[10px] text-red-500 mt-0.5 pl-1">{errors[field.key]}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function IntegrationRow({
  intg,
  onDelete,
  onToggle,
}: {
  intg: IntegrationConnection;
  onDelete: (id: string) => void;
  onToggle: (id: string, current: boolean) => void;
}) {
  const { data: runs = [] } = useIntegrationRuns(intg.id, 3);
  const { data: jobs = [] } = useIntegrationJobs(intg.id, 1);
  const enqueueJob = useEnqueueIntegrationJob();
  const processJob = useProcessIntegrationJob();
  const startGmailOAuth = useStartGmailOAuth();
  const startOutlookOAuth = useStartOutlookOAuth();
  const upsertEmailImap = useUpsertEmailImapCredentials();
  const updateIntegration = useUpdateIntegration();

  const [editing, setEditing] = useState(false);
  const [editMeta, setEditMeta] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [configuringImap, setConfiguringImap] = useState(false);
  const [imapForm, setImapForm] = useState({
    accountEmail: '',
    username: '',
    password: '',
    imapHost: '',
    imapPort: '993',
    imapSecure: true,
    smtpHost: '',
    smtpPort: '465',
    smtpSecure: true,
  });

  const lastRun = runs[0] ?? null;
  const latestJob = jobs[0] ?? null;
  const statusColor = STATUS_COLORS[intg.status];
  const schema = PROVIDER_METADATA_SCHEMA[intg.provider];
  const isSyncing = enqueueJob.isPending || processJob.isPending;
  const isConnectingGmail = startGmailOAuth.isPending;
  const isConnectingOutlook = startOutlookOAuth.isPending;

  const handleConnectGmail = async () => {
    try {
      const result = await startGmailOAuth.mutateAsync({ integrationId: intg.id });
      window.location.assign(result.authUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start Gmail OAuth';
      toast.error(message);
    }
  };

  const handleConnectOutlook = async () => {
    try {
      const result = await startOutlookOAuth.mutateAsync({ integrationId: intg.id });
      window.location.assign(result.authUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start Outlook OAuth';
      toast.error(message);
    }
  };

  const handleQueueSync = async () => {
    try {
      const idempotencyKey = createJobIdempotencyKey(intg.id, 'manual');
      await enqueueJob.mutateAsync({
        integrationId: intg.id,
        provider: intg.provider,
        jobType: 'manual',
        requestedBy: 'dashboard',
        idempotencyKey,
      });
      const result = await processJob.mutateAsync({
        integrationId: intg.id,
      });

      if (result.status === 'success') {
        toast.success(
          `Sync completed (${result.recordsProcessed ?? 0} processed, ${result.recordsCreated ?? 0} new, ${result.recordsUpdated ?? 0} updated)`
        );
      } else if (result.status === 'error') {
        toast.error(result.error || result.summary || 'Sync finished with errors');
      } else if (result.processed === false) {
        toast.info(result.summary || 'No queued jobs to process');
      } else {
        toast.success('Sync job processed');
      }
    } catch {
      toast.error('Failed to queue sync');
    }
  };

  const startImapConfig = () => {
    const meta = intg.metadata as Record<string, unknown>;
    setImapForm((prev) => ({
      ...prev,
      accountEmail: typeof meta.account_email === 'string' ? meta.account_email : '',
      username: typeof meta.account_email === 'string' ? meta.account_email : prev.username,
    }));
    setConfiguringImap(true);
  };

  const handleSaveImap = async () => {
    try {
      await upsertEmailImap.mutateAsync({
        integrationId: intg.id,
        accountEmail: imapForm.accountEmail.trim(),
        username: imapForm.username.trim(),
        password: imapForm.password,
        imapHost: imapForm.imapHost.trim(),
        imapPort: Number(imapForm.imapPort),
        imapSecure: imapForm.imapSecure,
        smtpHost: imapForm.smtpHost.trim(),
        smtpPort: Number(imapForm.smtpPort),
        smtpSecure: imapForm.smtpSecure,
      });
      toast.success('IMAP/SMTP credentials saved');
      setConfiguringImap(false);
      setImapForm((prev) => ({ ...prev, password: '' }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save IMAP credentials';
      toast.error(message);
    }
  };

  const startEdit = () => {
    const current: Record<string, string> = {};
    for (const field of schema) {
      const val = (intg.metadata as Record<string, unknown>)[field.key];
      current[field.key] = typeof val === 'string' ? val : '';
    }
    setEditMeta(current);
    setEditErrors({});
    setEditing(true);
  };

  const handleSaveMeta = async () => {
    const result = validateIntegrationMetadata(intg.provider, editMeta);
    if (!result.valid) {
      setEditErrors(result.errors);
      return;
    }
    const sanitized = sanitizeIntegrationMetadata(intg.provider, editMeta);
    try {
      await updateIntegration.mutateAsync({
        id: intg.id,
        updates: { metadata: sanitized },
      });
      toast.success('Metadata updated');
      setEditing(false);
    } catch {
      toast.error('Failed to update metadata');
    }
  };

  const metaSummary = schema
    .map((f) => {
      const val = (intg.metadata as Record<string, unknown>)[f.key];
      return typeof val === 'string' && val ? val : null;
    })
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="px-2 py-2 rounded border border-gray-100 bg-white space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm shrink-0">{PROVIDER_ICONS[intg.provider]}</span>
          <span className="text-sm text-gray-900 truncate">{intg.display_name}</span>
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0', statusColor.bg, statusColor.text)}>
            {intg.status}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 text-gray-400 hover:text-blue-600"
            onClick={handleQueueSync}
            disabled={isSyncing}
            title="Queue sync"
          >
            <RotateCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin')} />
          </Button>
          {intg.provider === 'gmail' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-1.5 text-gray-400 hover:text-blue-600"
              onClick={handleConnectGmail}
              disabled={isConnectingGmail}
              title={intg.status === 'connected' ? 'Reconnect Gmail' : 'Connect Gmail'}
            >
              <span className="text-[10px] font-medium">
                {isConnectingGmail ? '...' : intg.status === 'connected' ? 'Reconnect' : 'Connect'}
              </span>
            </Button>
          )}
          {intg.provider === 'outlook' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-1.5 text-gray-400 hover:text-blue-600"
              onClick={handleConnectOutlook}
              disabled={isConnectingOutlook}
              title={intg.status === 'connected' ? 'Reconnect Outlook' : 'Connect Outlook'}
            >
              <span className="text-[10px] font-medium">
                {isConnectingOutlook ? '...' : intg.status === 'connected' ? 'Reconnect' : 'Connect'}
              </span>
            </Button>
          )}
          {intg.provider === 'email_imap' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-1.5 text-gray-400 hover:text-blue-600"
              onClick={startImapConfig}
              title="Configure IMAP/SMTP credentials"
            >
              <span className="text-[10px] font-medium">Configure</span>
            </Button>
          )}
          {schema.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-1.5 text-gray-400 hover:text-blue-600"
              onClick={startEdit}
              title="Edit metadata"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          <button
            type="button"
            onClick={() => onToggle(intg.id, intg.is_enabled)}
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
            onClick={() => onDelete(intg.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Metadata summary */}
      {metaSummary && !editing && (
        <p className="text-[10px] text-gray-400 pl-6 truncate">{metaSummary}</p>
      )}

      {configuringImap && intg.provider === 'email_imap' && (
        <div className="pl-6 pt-1 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Account email *"
              value={imapForm.accountEmail}
              onChange={(e) => setImapForm((prev) => ({ ...prev, accountEmail: e.target.value }))}
              className="h-8 text-sm"
              type="email"
            />
            <Input
              placeholder="Username *"
              value={imapForm.username}
              onChange={(e) => setImapForm((prev) => ({ ...prev, username: e.target.value }))}
              className="h-8 text-sm"
            />
            <Input
              placeholder="IMAP host *"
              value={imapForm.imapHost}
              onChange={(e) => setImapForm((prev) => ({ ...prev, imapHost: e.target.value }))}
              className="h-8 text-sm"
            />
            <Input
              placeholder="IMAP port"
              value={imapForm.imapPort}
              onChange={(e) => setImapForm((prev) => ({ ...prev, imapPort: e.target.value }))}
              className="h-8 text-sm"
              type="number"
            />
            <Input
              placeholder="SMTP host *"
              value={imapForm.smtpHost}
              onChange={(e) => setImapForm((prev) => ({ ...prev, smtpHost: e.target.value }))}
              className="h-8 text-sm"
            />
            <Input
              placeholder="SMTP port"
              value={imapForm.smtpPort}
              onChange={(e) => setImapForm((prev) => ({ ...prev, smtpPort: e.target.value }))}
              className="h-8 text-sm"
              type="number"
            />
            <Input
              placeholder="Password *"
              value={imapForm.password}
              onChange={(e) => setImapForm((prev) => ({ ...prev, password: e.target.value }))}
              className="h-8 text-sm col-span-2"
              type="password"
            />
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <label className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={imapForm.imapSecure}
                onChange={(e) => setImapForm((prev) => ({ ...prev, imapSecure: e.target.checked }))}
              />
              IMAP secure (TLS/SSL)
            </label>
            <label className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={imapForm.smtpSecure}
                onChange={(e) => setImapForm((prev) => ({ ...prev, smtpSecure: e.target.checked }))}
              />
              SMTP secure (TLS/SSL)
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSaveImap} disabled={upsertEmailImap.isPending}>
              {upsertEmailImap.isPending ? 'Saving...' : 'Save credentials'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setConfiguringImap(false);
                setImapForm((prev) => ({ ...prev, password: '' }));
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Inline metadata edit */}
      {editing && (
        <div className="pl-6 pt-1 space-y-2">
          <MetadataFields
            provider={intg.provider}
            values={editMeta}
            onChange={(k, v) => {
              setEditMeta((prev) => ({ ...prev, [k]: v }));
              setEditErrors((prev) => { const next = { ...prev }; delete next[k]; return next; });
            }}
            errors={editErrors}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSaveMeta} disabled={updateIntegration.isPending}>
              {updateIntegration.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Latest job status */}
      {latestJob && (latestJob.status === 'queued' || latestJob.status === 'running') && (
        <div className="flex items-center gap-1.5 pl-6 text-[10px] text-gray-400">
          <span>job:</span>
          <span className={cn('px-1 py-0.5 rounded font-medium', INTEGRATION_JOB_STATUS_COLORS[latestJob.status].bg, INTEGRATION_JOB_STATUS_COLORS[latestJob.status].text)}>
            {latestJob.status}
          </span>
          <span>{timeAgo(latestJob.created_at)}</span>
        </div>
      )}

      {/* Last sync info + mini run history */}
      <div className="flex items-center gap-3 pl-6 text-[10px] text-gray-400">
        {lastRun ? (
          <>
            <span className="flex items-center gap-1">
              last sync:
              <span className={cn('px-1 py-0.5 rounded font-medium', SYNC_RUN_STATUS_COLORS[lastRun.status].bg, SYNC_RUN_STATUS_COLORS[lastRun.status].text)}>
                {lastRun.status}
              </span>
            </span>
            <span>{timeAgo(lastRun.started_at)}</span>
            {lastRun.records_processed > 0 && (
              <span>{lastRun.records_processed} processed</span>
            )}
            {lastRun.duration_ms > 0 && (
              <span>{(lastRun.duration_ms / 1000).toFixed(1)}s</span>
            )}
            {lastRun.records_failed > 0 && (
              <span className="text-red-500">{lastRun.records_failed} failed</span>
            )}
          </>
        ) : (
          <span>no syncs yet</span>
        )}
      </div>

      {runs.length > 1 && (
        <div className="flex items-center gap-1.5 pl-6">
          {runs.slice(1).map((run) => {
            const rc = SYNC_RUN_STATUS_COLORS[run.status];
            return (
              <span
                key={run.id}
                className={cn('text-[9px] px-1 py-0.5 rounded', rc.bg, rc.text)}
                title={`${run.run_type} — ${run.status} — ${new Date(run.started_at).toLocaleString()}`}
              >
                {run.status === 'success' ? '✓' : run.status === 'error' ? '✗' : '…'}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function IntegrationsCard() {
  const { data: integrations = [], isLoading } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const deleteIntegration = useDeleteIntegration();
  const toggleEnabled = useToggleIntegrationEnabled();

  const [showForm, setShowForm] = useState(false);
  const [newProvider, setNewProvider] = useState<IntegrationProvider>('woocommerce');
  const [newName, setNewName] = useState('');
  const [newMeta, setNewMeta] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  const resetForm = () => {
    setNewName('');
    setNewMeta({});
    setFormErrors({});
    setShowForm(false);
  };

  const handleProviderChange = (provider: IntegrationProvider) => {
    setNewProvider(provider);
    setNewMeta({});
    setFormErrors({});
  };

  const handleAdd = async () => {
    const trimmed = newName.trim();
    const errs: Record<string, string> = {};
    if (!trimmed) {
      errs._name = 'Display name is required';
    }

    const metaResult = validateIntegrationMetadata(newProvider, newMeta);
    if (!metaResult.valid) {
      Object.assign(errs, metaResult.errors);
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    const sanitized = sanitizeIntegrationMetadata(newProvider, newMeta);
    try {
      await createIntegration.mutateAsync({
        provider: newProvider,
        displayName: trimmed,
        metadata: sanitized,
      });
      toast.success('Integration added');
      resetForm();
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
          <Select value={newProvider} onValueChange={(v) => handleProviderChange(v as IntegrationProvider)}>
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
          <div>
            <Input
              placeholder="Display name *"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setFormErrors((prev) => { const next = { ...prev }; delete next._name; return next; });
              }}
              className={cn('h-8 text-sm bg-white border-gray-300', formErrors._name && 'border-red-400')}
            />
            {formErrors._name && (
              <p className="text-[10px] text-red-500 mt-0.5 pl-1">{formErrors._name}</p>
            )}
          </div>
          <MetadataFields
            provider={newProvider}
            values={newMeta}
            onChange={(k, v) => {
              setNewMeta((prev) => ({ ...prev, [k]: v }));
              setFormErrors((prev) => { const next = { ...prev }; delete next[k]; return next; });
            }}
            errors={formErrors}
          />
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={handleAdd} disabled={createIntegration.isPending}>
              {createIntegration.isPending ? 'Adding...' : 'Add'}
            </Button>
            <Button size="sm" variant="ghost" onClick={resetForm}>
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
          {integrations.map((intg) => (
            <IntegrationRow
              key={intg.id}
              intg={intg}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
