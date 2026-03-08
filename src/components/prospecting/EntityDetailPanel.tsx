import { useState, useMemo } from 'react';
import { 
  X, MapPin, Phone, Globe, Clock, Copy, Check, 
  ExternalLink, Mail, FileText, Save, ShoppingCart, Package,
  Building2, ImageIcon, Users, Plus, Trash2, Star, Activity, CheckCircle2, Circle, Calendar,
  TrendingUp, Pencil, Trophy, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pharmacy, PharmacyStatus, STATUS_LABELS, STATUS_COLORS,
  ContactRole, CONTACT_ROLE_LABELS,
  ActivityType, ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_ICONS,
  OpportunityStage, OPPORTUNITY_STAGE_LABELS, OPPORTUNITY_STAGE_COLORS,
} from '@/types/pharmacy';
import { useUpdatePharmacy } from '@/hooks/usePharmacies';
import { useEntityPhoto } from '@/hooks/useEntityPhoto';
import { useOrdersByPharmacy } from '@/hooks/useWooCommerceOrders';
import {
  useEntityContacts,
  useCreateEntityContact,
  useUpdateEntityContact,
  useDeleteEntityContact,
} from '@/hooks/useEntityContacts';
import {
  useEntityActivities,
  useCreateEntityActivity,
  useCompleteEntityActivity,
  useDeleteEntityActivity,
} from '@/hooks/useEntityActivities';
import {
  useEntityOpportunities,
  useCreateEntityOpportunity,
  useUpdateEntityOpportunity,
  useDeleteEntityOpportunity,
} from '@/hooks/useEntityOpportunities';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function ContactsSection({ pharmacyId }: { pharmacyId: string }) {
  const { data: contacts = [], isLoading } = useEntityContacts(pharmacyId);
  const createContact = useCreateEntityContact();
  const updateContact = useUpdateEntityContact();
  const deleteContact = useDeleteEntityContact();

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<ContactRole | ''>('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const resetForm = () => {
    setNewName('');
    setNewRole('');
    setNewEmail('');
    setNewPhone('');
    setShowForm(false);
  };

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error('Contact name is required');
      return;
    }
    try {
      await createContact.mutateAsync({
        pharmacyId,
        name: trimmed,
        role: newRole || null,
        email: newEmail.trim() || null,
        phone: newPhone.trim() || null,
        isPrimary: contacts.length === 0,
      });
      toast.success('Contact added');
      resetForm();
    } catch {
      toast.error('Failed to add contact');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContact.mutateAsync({ id, pharmacyId });
      toast.success('Contact deleted');
    } catch {
      toast.error('Failed to delete contact');
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      for (const c of contacts) {
        if (c.isPrimary && c.id !== id) {
          await updateContact.mutateAsync({
            id: c.id,
            pharmacyId,
            updates: { is_primary: false },
          });
        }
      }
      await updateContact.mutateAsync({
        id,
        pharmacyId,
        updates: { is_primary: true },
      });
      toast.success('Primary contact updated');
    } catch {
      toast.error('Failed to update primary contact');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Contacts ({contacts.length})
        </h3>
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

      {showForm && (
        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
          <Input
            placeholder="Name *"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-8 text-sm bg-white border-gray-300"
          />
          <Select value={newRole} onValueChange={(v) => setNewRole(v as ContactRole)}>
            <SelectTrigger className="h-8 text-sm bg-white border-gray-300">
              <SelectValue placeholder="Role (optional)" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              {(Object.keys(CONTACT_ROLE_LABELS) as ContactRole[]).map((r) => (
                <SelectItem key={r} value={r}>{CONTACT_ROLE_LABELS[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="h-8 text-sm bg-white border-gray-300"
          />
          <Input
            placeholder="Phone"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="h-8 text-sm bg-white border-gray-300"
          />
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={handleAdd} disabled={createContact.isPending}>
              {createContact.isPending ? 'Adding...' : 'Add Contact'}
            </Button>
            <Button size="sm" variant="ghost" onClick={resetForm}>Cancel</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-gray-400">Loading contacts...</p>
      ) : contacts.length === 0 && !showForm ? (
        <p className="text-xs text-gray-400">No contacts yet</p>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-start justify-between gap-2 p-2 rounded border border-gray-100 bg-white"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-gray-900 truncate">{contact.name}</span>
                  {contact.isPrimary && (
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />
                  )}
                  {contact.role && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">
                      {CONTACT_ROLE_LABELS[contact.role] ?? contact.role}
                    </span>
                  )}
                </div>
                {contact.email && (
                  <p className="text-xs text-gray-500 truncate">{contact.email}</p>
                )}
                {contact.phone && (
                  <p className="text-xs text-gray-500">{contact.phone}</p>
                )}
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {!contact.isPrimary && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1.5 text-gray-400 hover:text-yellow-600"
                    onClick={() => handleSetPrimary(contact.id)}
                    title="Set as primary"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-1.5 text-gray-400 hover:text-red-600"
                  onClick={() => handleDelete(contact.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivitiesSection({ pharmacyId }: { pharmacyId: string }) {
  const { data: activities = [], isLoading } = useEntityActivities(pharmacyId);
  const createActivity = useCreateEntityActivity();
  const completeActivity = useCompleteEntityActivity();
  const deleteActivity = useDeleteEntityActivity();

  const [showForm, setShowForm] = useState(false);
  const [newType, setNewType] = useState<ActivityType>('call');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueAt, setNewDueAt] = useState('');

  const resetForm = () => {
    setNewType('call');
    setNewTitle('');
    setNewDescription('');
    setNewDueAt('');
    setShowForm(false);
  };

  const handleAdd = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      toast.error('Activity title is required');
      return;
    }
    try {
      await createActivity.mutateAsync({
        pharmacyId,
        activityType: newType,
        title: trimmed,
        description: newDescription.trim() || null,
        dueAt: newDueAt || null,
      });
      toast.success('Activity added');
      resetForm();
    } catch {
      toast.error('Failed to add activity');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeActivity.mutateAsync({ id, pharmacyId });
      toast.success('Activity completed');
    } catch {
      toast.error('Failed to complete activity');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteActivity.mutateAsync({ id, pharmacyId });
      toast.success('Activity deleted');
    } catch {
      toast.error('Failed to delete activity');
    }
  };

  const pendingCount = activities.filter((a) => !a.completedAt).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Activities ({activities.length})
          {pendingCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
              {pendingCount} pending
            </span>
          )}
        </h3>
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

      {showForm && (
        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
          <Select value={newType} onValueChange={(v) => setNewType(v as ActivityType)}>
            <SelectTrigger className="h-8 text-sm bg-white border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {ACTIVITY_TYPE_ICONS[t]} {ACTIVITY_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Title *"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="h-8 text-sm bg-white border-gray-300"
          />
          <Textarea
            placeholder="Description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="min-h-[60px] text-sm bg-white border-gray-300 resize-none"
          />
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <Input
              type="datetime-local"
              value={newDueAt}
              onChange={(e) => setNewDueAt(e.target.value)}
              className="h-8 text-sm bg-white border-gray-300"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={handleAdd} disabled={createActivity.isPending}>
              {createActivity.isPending ? 'Adding...' : 'Add Activity'}
            </Button>
            <Button size="sm" variant="ghost" onClick={resetForm}>Cancel</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-gray-400">Loading activities...</p>
      ) : activities.length === 0 && !showForm ? (
        <p className="text-xs text-gray-400">No activities yet</p>
      ) : (
        <div className="space-y-2">
          {activities.map((act) => {
            const isDone = !!act.completedAt;
            const isOverdue = !isDone && act.dueAt && new Date(act.dueAt) < new Date();
            return (
              <div
                key={act.id}
                className={cn(
                  'flex items-start gap-2 p-2 rounded border bg-white',
                  isDone ? 'border-gray-100 opacity-60' : isOverdue ? 'border-red-200' : 'border-gray-100'
                )}
              >
                <button
                  type="button"
                  className="mt-0.5 shrink-0"
                  onClick={() => !isDone && handleComplete(act.id)}
                  disabled={isDone}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-300 hover:text-green-400" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{ACTIVITY_TYPE_ICONS[act.activityType]}</span>
                    <span className={cn('text-sm font-medium truncate', isDone ? 'line-through text-gray-400' : 'text-gray-900')}>
                      {act.title}
                    </span>
                  </div>
                  {act.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{act.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                    <span>{new Date(act.createdAt).toLocaleDateString()}</span>
                    {act.dueAt && (
                      <span className={cn(isOverdue ? 'text-red-500 font-medium' : '')}>
                        Due: {new Date(act.dueAt).toLocaleDateString()}
                      </span>
                    )}
                    {isDone && act.completedAt && (
                      <span className="text-green-600">
                        Done: {new Date(act.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-1.5 text-gray-400 hover:text-red-600 shrink-0"
                  onClick={() => handleDelete(act.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OpportunityRow({ opp, pharmacyId, onDelete }: {
  opp: { id: string; title: string; stage: OpportunityStage; amount: number; probability: number; expectedCloseDate: string | null; createdAt: string };
  pharmacyId: string;
  onDelete: (id: string) => void;
}) {
  const updateOpportunity = useUpdateEntityOpportunity();
  const [editing, setEditing] = useState(false);
  const [editStage, setEditStage] = useState<OpportunityStage>(opp.stage);
  const [editAmount, setEditAmount] = useState(String(opp.amount));
  const [editProbability, setEditProbability] = useState(String(opp.probability));
  const [editCloseDate, setEditCloseDate] = useState(opp.expectedCloseDate ?? '');

  const startEdit = () => {
    setEditStage(opp.stage);
    setEditAmount(String(opp.amount));
    setEditProbability(String(opp.probability));
    setEditCloseDate(opp.expectedCloseDate ?? '');
    setEditing(true);
  };

  const handleSave = async () => {
    const amount = parseFloat(editAmount) || 0;
    const probability = Math.min(100, Math.max(0, parseInt(editProbability) || 0));
    try {
      await updateOpportunity.mutateAsync({
        id: opp.id,
        pharmacyId,
        updates: {
          stage: editStage,
          amount,
          probability,
          expected_close_date: editCloseDate || null,
        },
      });
      toast.success('Opportunity updated');
      setEditing(false);
    } catch {
      toast.error('Failed to update opportunity');
    }
  };

  const handleQuickStage = async (stage: 'won' | 'lost') => {
    const probability = stage === 'won' ? 100 : 0;
    try {
      await updateOpportunity.mutateAsync({
        id: opp.id,
        pharmacyId,
        updates: { stage, probability },
      });
      toast.success(stage === 'won' ? 'Marked as won' : 'Marked as lost');
      setEditing(false);
    } catch {
      toast.error('Failed to update opportunity');
    }
  };

  const isSaving = updateOpportunity.isPending;
  const stageColor = OPPORTUNITY_STAGE_COLORS[opp.stage];
  const weighted = (opp.amount * opp.probability) / 100;
  const isClosed = opp.stage === 'won' || opp.stage === 'lost';

  if (editing) {
    return (
      <div className="p-2.5 rounded border border-blue-200 bg-blue-50/30 space-y-2">
        <p className="text-sm font-medium text-gray-900 truncate">{opp.title}</p>
        <Select value={editStage} onValueChange={(v) => setEditStage(v as OpportunityStage)}>
          <SelectTrigger className="h-8 text-sm bg-white border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            {(Object.keys(OPPORTUNITY_STAGE_LABELS) as OpportunityStage[]).map((s) => (
              <SelectItem key={s} value={s}>{OPPORTUNITY_STAGE_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Amount (€)"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            className="h-8 text-sm bg-white border-gray-300"
            min="0"
            step="0.01"
          />
          <Input
            type="number"
            placeholder="Prob (%)"
            value={editProbability}
            onChange={(e) => setEditProbability(e.target.value)}
            className="h-8 text-sm bg-white border-gray-300"
            min="0"
            max="100"
          />
        </div>
        <Input
          type="date"
          value={editCloseDate}
          onChange={(e) => setEditCloseDate(e.target.value)}
          className="h-8 text-sm bg-white border-gray-300"
        />
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={isSaving}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-2 rounded border bg-white',
        isClosed ? 'border-gray-100 opacity-70' : 'border-gray-100'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-gray-900 truncate">{opp.title}</span>
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', stageColor?.bg, stageColor?.text)}>
              {OPPORTUNITY_STAGE_LABELS[opp.stage]}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
            <span className="font-medium">€{opp.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
            <span>{opp.probability}%</span>
            <span className="text-gray-400">→ €{weighted.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
            {opp.expectedCloseDate && (
              <span>Close: {new Date(opp.expectedCloseDate + 'T00:00:00').toLocaleDateString()}</span>
            )}
            <span>{new Date(opp.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {!isClosed && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-1.5 text-gray-400 hover:text-green-600"
                onClick={() => handleQuickStage('won')}
                title="Mark won"
                disabled={isSaving}
              >
                <Trophy className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-1.5 text-gray-400 hover:text-red-600"
                onClick={() => handleQuickStage('lost')}
                title="Mark lost"
                disabled={isSaving}
              >
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 text-gray-400 hover:text-blue-600"
            onClick={startEdit}
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 text-gray-400 hover:text-red-600"
            onClick={() => onDelete(opp.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function OpportunitiesSection({ pharmacyId }: { pharmacyId: string }) {
  const { data: opportunities = [], isLoading } = useEntityOpportunities(pharmacyId);
  const createOpportunity = useCreateEntityOpportunity();
  const deleteOpportunity = useDeleteEntityOpportunity();

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStage, setNewStage] = useState<OpportunityStage>('qualified');
  const [newAmount, setNewAmount] = useState('');
  const [newProbability, setNewProbability] = useState('50');
  const [newCloseDate, setNewCloseDate] = useState('');

  const resetForm = () => {
    setNewTitle('');
    setNewStage('qualified');
    setNewAmount('');
    setNewProbability('50');
    setNewCloseDate('');
    setShowForm(false);
  };

  const handleAdd = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      toast.error('Opportunity title is required');
      return;
    }
    const amount = parseFloat(newAmount) || 0;
    const prob = Math.min(100, Math.max(0, parseInt(newProbability) || 50));
    try {
      await createOpportunity.mutateAsync({
        pharmacyId,
        title: trimmed,
        stage: newStage,
        amount,
        probability: prob,
        expectedCloseDate: newCloseDate || null,
      });
      toast.success('Opportunity added');
      resetForm();
    } catch {
      toast.error('Failed to add opportunity');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOpportunity.mutateAsync({ id, pharmacyId });
      toast.success('Opportunity deleted');
    } catch {
      toast.error('Failed to delete opportunity');
    }
  };

  const { totalPipeline, weightedForecast } = useMemo(() => {
    const open = opportunities.filter((o) => o.stage !== 'won' && o.stage !== 'lost');
    return {
      totalPipeline: open.reduce((sum, o) => sum + o.amount, 0),
      weightedForecast: open.reduce((sum, o) => sum + (o.amount * o.probability) / 100, 0),
    };
  }, [opportunities]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Opportunities ({opportunities.length})
        </h3>
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

      {opportunities.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-gray-900">
              €{totalPipeline.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-gray-500">Pipeline</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-gray-900">
              €{weightedForecast.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-gray-500">Weighted Forecast</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
          <Input
            placeholder="Title *"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="h-8 text-sm bg-white border-gray-300"
          />
          <Select value={newStage} onValueChange={(v) => setNewStage(v as OpportunityStage)}>
            <SelectTrigger className="h-8 text-sm bg-white border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              {(Object.keys(OPPORTUNITY_STAGE_LABELS) as OpportunityStage[]).map((s) => (
                <SelectItem key={s} value={s}>{OPPORTUNITY_STAGE_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Amount (€)"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="h-8 text-sm bg-white border-gray-300"
              min="0"
              step="0.01"
            />
            <Input
              type="number"
              placeholder="Probability (%)"
              value={newProbability}
              onChange={(e) => setNewProbability(e.target.value)}
              className="h-8 text-sm bg-white border-gray-300"
              min="0"
              max="100"
            />
          </div>
          <Input
            type="date"
            value={newCloseDate}
            onChange={(e) => setNewCloseDate(e.target.value)}
            className="h-8 text-sm bg-white border-gray-300"
          />
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={handleAdd} disabled={createOpportunity.isPending}>
              {createOpportunity.isPending ? 'Adding...' : 'Add Opportunity'}
            </Button>
            <Button size="sm" variant="ghost" onClick={resetForm}>Cancel</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-gray-400">Loading opportunities...</p>
      ) : opportunities.length === 0 && !showForm ? (
        <p className="text-xs text-gray-400">No opportunities yet</p>
      ) : (
        <div className="space-y-2">
          {opportunities.map((opp) => (
            <OpportunityRow
              key={opp.id}
              opp={opp}
              pharmacyId={pharmacyId}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface EntityDetailPanelProps {
  pharmacy: Pharmacy;
  onClose: () => void;
}

export function EntityDetailPanel({ pharmacy, onClose }: EntityDetailPanelProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [notes, setNotes] = useState(pharmacy.notes || '');
  const [email, setEmail] = useState(pharmacy.email || '');
  const [status, setStatus] = useState<PharmacyStatus>(pharmacy.status);
  const [hasChanges, setHasChanges] = useState(false);

  const updatePharmacy = useUpdatePharmacy();
  const { photoUrl, isLoading: photoLoading } = useEntityPhoto(pharmacy.id);
  
  // Get real WooCommerce orders for this pharmacy
  const relatedOrders = useOrdersByPharmacy(pharmacy.name, pharmacy.city || null);

  const statusColor = STATUS_COLORS[status];

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleSave = async () => {
    try {
      await updatePharmacy.mutateAsync({
        id: pharmacy.id,
        updates: {
          commercial_status: status,
          notes: notes || null,
          email: email || null,
        },
      });
      setHasChanges(false);
      toast.success('Pharmacy updated');
    } catch (error) {
      toast.error('Failed to update pharmacy');
    }
  };

  const handleStatusChange = (newStatus: PharmacyStatus) => {
    setStatus(newStatus);
    setHasChanges(true);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setHasChanges(true);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setHasChanges(true);
  };

  // Calculate order stats from real WooCommerce data
  const orderStats = {
    totalOrders: relatedOrders.length,
    totalRevenue: relatedOrders.reduce((sum, order) => sum + order.amount, 0),
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Photo Header */}
      <div className="border-b border-gray-200">
        <div className="h-32 bg-gray-100 relative overflow-hidden">
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt={pharmacy.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {photoLoading ? (
                <div className="animate-pulse">
                  <ImageIcon className="h-10 w-10 text-gray-300" />
                </div>
              ) : (
                <div className="text-center">
                  <Building2 className="h-10 w-10 text-gray-300 mx-auto" />
                  <p className="text-xs text-gray-400 mt-1">No photo</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Title and Status */}
        <div className="p-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg leading-tight truncate text-gray-900">
              {pharmacy.name}
            </h2>
            <span className={cn('inline-block px-2 py-0.5 rounded text-xs font-medium mt-1', statusColor.bg, statusColor.text)}>
              {STATUS_LABELS[status]}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 -mr-2">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Order History from WooCommerce - Real Data Only */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Order History (WooCommerce)
          </h3>
          
          {relatedOrders.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
              <Package className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">No sales data</p>
              <p className="text-xs text-gray-400 mt-1">
                No WooCommerce orders found for this pharmacy
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{orderStats.totalOrders}</p>
                  <p className="text-xs text-gray-500">Total Orders</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">€{orderStats.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Total Revenue</p>
                </div>
              </div>
              
              <div className="space-y-1 mt-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Recent Orders:</p>
                {relatedOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.orderId}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      €{order.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
                {relatedOrders.length > 5 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    +{relatedOrders.length - 5} more orders
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Location Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500">Location</h3>
          
          {pharmacy.address && (
            <div className="flex items-start gap-3 group">
              <MapPin className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">{pharmacy.address}</p>
                {(pharmacy.city || pharmacy.region) && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[pharmacy.city, pharmacy.region, pharmacy.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500">Contact</h3>
          
          {pharmacy.phone && (
            <div className="flex items-center gap-3 group">
              <Phone className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-sm flex-1 text-gray-700">{pharmacy.phone}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500"
                onClick={() => copyToClipboard(pharmacy.phone ?? '', 'phone')}
              >
                {copiedField === 'phone' ? (
                  <Check className="h-3 w-3 text-gray-700" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          )}

          {pharmacy.website && (
            <div className="flex items-center gap-3 group">
              <Globe className="h-4 w-4 text-gray-400 shrink-0" />
              <a
                href={pharmacy.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-700 hover:text-gray-900 flex items-center gap-1 flex-1 truncate"
              >
                {new URL(pharmacy.website).hostname}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Email Field (editable) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-xs text-gray-500">
              <Mail className="h-3 w-3" />
              Email (manually added)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="email"
                type="email"
                placeholder="Add email..."
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className="h-8 text-sm bg-white border-gray-300"
              />
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="shrink-0"
                >
                  <Button variant="outline" size="sm" className="h-8 border-gray-300">
                    <Mail className="h-3 w-3" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Contacts */}
        <ContactsSection pharmacyId={pharmacy.id} />

        {/* Activities */}
        <ActivitiesSection pharmacyId={pharmacy.id} />

        {/* Opportunities */}
        <OpportunitiesSection pharmacyId={pharmacy.id} />

        {/* Opening Hours */}
        {pharmacy.attributes.openingHours && pharmacy.attributes.openingHours.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Opening Hours
            </h3>
            <div className="text-xs space-y-1 pl-6">
              {pharmacy.attributes.openingHours.map((hours, index) => (
                <p key={index} className="text-gray-600">{hours}</p>
              ))}
            </div>
          </div>
        )}

        {/* Commercial Status */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500">Commercial Status</h3>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="bg-white border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              {(Object.keys(STATUS_LABELS) as PharmacyStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-3">
          <Label htmlFor="notes" className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Internal Notes
          </Label>
          <Textarea
            id="notes"
            placeholder="Add notes about this pharmacy..."
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            className="min-h-[100px] resize-none bg-white border-gray-300"
          />
        </div>
      </div>

      {/* Footer */}
      {hasChanges && (
        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={handleSave}
            disabled={updatePharmacy.isPending}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {updatePharmacy.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
