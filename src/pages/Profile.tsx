import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Mail, Calendar, Shield, Loader2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { UserMenu } from '@/components/auth/UserMenu';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import { evaluateBillingAccess, useBillingOverview } from '@/hooks/useBilling';
import { useUpdateOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { toast } from 'sonner';
import {
  getIndustryTemplate,
  getIndustryTemplateOptions,
  isIndustryTemplateKey,
} from '@/lib/industry-templates';

const LOCALE_OPTIONS = ['es-ES', 'en-US', 'en-GB', 'fr-FR', 'de-DE', 'pt-PT', 'it-IT'] as const;
const TIMEZONE_OPTIONS = [
  'Europe/Madrid',
  'Europe/London',
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/Bogota',
] as const;
const CURRENCY_OPTIONS = ['EUR', 'USD', 'GBP', 'MXN', 'COP'] as const;

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export default function Profile() {
  const { user, signOut, isLoading } = useAuth();
  const { organization, membership } = useCurrentOrganization();
  const { data: billingOverview } = useBillingOverview(organization?.id ?? null);
  const updateWorkspace = useUpdateOrganizationSettings();
  const canManageWorkspace = membership?.role === 'admin' || membership?.role === 'manager';
  const [workspaceForm, setWorkspaceForm] = useState({
    name: '',
    logo_url: '',
    primary_color: '#2563eb',
    locale: 'es-ES',
    timezone: 'Europe/Madrid',
    currency: 'EUR',
    entity_label_singular: 'Client',
    entity_label_plural: 'Clients',
    industry_template_key: 'general_b2b',
  });

  useEffect(() => {
    if (!organization) return;
    setWorkspaceForm({
      name: organization.name ?? '',
      logo_url: organization.logo_url ?? '',
      primary_color: organization.primary_color ?? '#2563eb',
      locale: organization.locale ?? 'es-ES',
      timezone: organization.timezone ?? 'Europe/Madrid',
      currency: organization.currency ?? 'EUR',
      entity_label_singular: organization.entity_label_singular ?? 'Client',
      entity_label_plural: organization.entity_label_plural ?? 'Clients',
      industry_template_key: organization.industry_template_key ?? 'general_b2b',
    });
  }, [organization]);

  if (isLoading) {
    return (
      <div className="app-shell flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const fullName = user.user_metadata?.full_name ?? 'Not set';
  const email = user.email ?? '—';
  const orgLocale = organization?.locale ?? 'es-ES';
  const orgTimezone = organization?.timezone ?? 'Europe/Madrid';
  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString(orgLocale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: orgTimezone,
      })
    : '—';
  const provider = user.app_metadata?.provider ?? 'email';
  const lastSignInAt = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString(orgLocale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: orgTimezone,
      })
    : '—';
  const userId = user.id;
  const billingAccess = evaluateBillingAccess(billingOverview?.subscription ?? null);
  const subscriptionStatus = billingOverview?.subscription?.status ?? 'none';

  const handleSaveWorkspaceSettings = async () => {
    if (!organization?.id) return;

    const name = workspaceForm.name.trim();
    const logoUrl = workspaceForm.logo_url.trim();
    const singular = workspaceForm.entity_label_singular.trim();
    const plural = workspaceForm.entity_label_plural.trim();
    const primaryColor = workspaceForm.primary_color.trim();
    const locale = workspaceForm.locale.trim();
    const timezone = workspaceForm.timezone.trim();
    const currency = workspaceForm.currency.trim().toUpperCase();
    const industryTemplateKey = workspaceForm.industry_template_key.trim();

    if (!name) {
      toast.error('Workspace name is required');
      return;
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
      toast.error('Primary color must be a valid hex value, e.g. #2563eb');
      return;
    }
    if (!/^[A-Za-z]{2}(-[A-Za-z]{2})?$/.test(locale)) {
      toast.error('Locale format is invalid');
      return;
    }
    if (!timezone) {
      toast.error('Timezone is required');
      return;
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      toast.error('Currency must be a 3-letter code, e.g. EUR');
      return;
    }
    if (!isIndustryTemplateKey(industryTemplateKey)) {
      toast.error('Industry template is invalid');
      return;
    }
    if (!singular || !plural) {
      toast.error('Entity labels are required');
      return;
    }
    if (logoUrl && !isValidUrl(logoUrl)) {
      toast.error('Logo URL must be valid (http/https)');
      return;
    }

    try {
      await updateWorkspace.mutateAsync({
        organizationId: organization.id,
        updates: {
          name,
          logo_url: logoUrl || null,
          primary_color: primaryColor,
          locale,
          timezone,
          currency,
          entity_label_singular: singular,
          entity_label_plural: plural,
          industry_template_key: industryTemplateKey,
        },
      });
      toast.success('Workspace settings updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update workspace settings';
      toast.error(message);
    }
  };

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <UserMenu />
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto py-6 md:py-8 px-4">
        <div className="space-y-6">
          {/* Account Information */}
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-600">Full Name</Label>
                <Input
                  readOnly
                  value={fullName}
                  className="bg-gray-50 border-gray-200 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  readOnly
                  value={email}
                  className="bg-gray-50 border-gray-200 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Account created
                </Label>
                <Input
                  readOnly
                  value={createdAt}
                  className="bg-gray-50 border-gray-200 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Auth provider
                </Label>
                <Input
                  readOnly
                  value={provider}
                  className="bg-gray-50 border-gray-200 text-gray-900"
                />
              </div>
            </CardContent>
          </Card>

          {/* Session */}
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-600">Last sign in</Label>
                <Input
                  readOnly
                  value={lastSignInAt}
                  className="bg-gray-50 border-gray-200 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-600">User ID</Label>
                <p className="text-xs text-gray-500 truncate bg-gray-50 border border-gray-200 rounded-md px-3 py-2 font-mono">
                  {userId}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Workspace Settings */}
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Workspace Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-600">Workspace Name</Label>
                <Input
                  value={workspaceForm.name}
                  onChange={(e) => setWorkspaceForm((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={!canManageWorkspace}
                  className="border-gray-200 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-600">Logo URL</Label>
                <Input
                  placeholder="https://..."
                  value={workspaceForm.logo_url}
                  onChange={(e) => setWorkspaceForm((prev) => ({ ...prev, logo_url: e.target.value }))}
                  disabled={!canManageWorkspace}
                  className="border-gray-200 text-gray-900"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-gray-600">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={workspaceForm.primary_color}
                      onChange={(e) => setWorkspaceForm((prev) => ({ ...prev, primary_color: e.target.value }))}
                      disabled={!canManageWorkspace}
                      className="border-gray-200 text-gray-900"
                    />
                    <span
                      className="h-8 w-8 rounded border border-gray-200"
                      style={{ backgroundColor: workspaceForm.primary_color }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600">Locale</Label>
                  <select
                    value={workspaceForm.locale}
                    onChange={(e) => setWorkspaceForm((prev) => ({ ...prev, locale: e.target.value }))}
                    disabled={!canManageWorkspace}
                    className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900"
                  >
                    {LOCALE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600">Currency</Label>
                  <select
                    value={workspaceForm.currency}
                    onChange={(e) => setWorkspaceForm((prev) => ({ ...prev, currency: e.target.value }))}
                    disabled={!canManageWorkspace}
                    className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900"
                  >
                    {CURRENCY_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-600">Timezone</Label>
                <select
                  value={workspaceForm.timezone}
                  onChange={(e) => setWorkspaceForm((prev) => ({ ...prev, timezone: e.target.value }))}
                  disabled={!canManageWorkspace}
                  className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900"
                >
                  {TIMEZONE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-600">Industry Template</Label>
                <div className="flex items-center gap-2">
                  <select
                    value={workspaceForm.industry_template_key}
                    onChange={(e) => setWorkspaceForm((prev) => ({ ...prev, industry_template_key: e.target.value }))}
                    disabled={!canManageWorkspace}
                    className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900"
                  >
                    {getIndustryTemplateOptions().map((template) => (
                      <option key={template.key} value={template.key}>{template.label}</option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 border-gray-300"
                    disabled={!canManageWorkspace}
                    onClick={() => {
                      const template = getIndustryTemplate(workspaceForm.industry_template_key);
                      setWorkspaceForm((prev) => ({
                        ...prev,
                        locale: template.defaults.locale,
                        timezone: template.defaults.timezone,
                        currency: template.defaults.currency,
                        entity_label_singular: template.defaults.entityLabelSingular,
                        entity_label_plural: template.defaults.entityLabelPlural,
                      }));
                    }}
                  >
                    Apply Defaults
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-gray-600">Entity Label (singular)</Label>
                  <Input
                    value={workspaceForm.entity_label_singular}
                    onChange={(e) => setWorkspaceForm((prev) => ({ ...prev, entity_label_singular: e.target.value }))}
                    disabled={!canManageWorkspace}
                    className="border-gray-200 text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600">Entity Label (plural)</Label>
                  <Input
                    value={workspaceForm.entity_label_plural}
                    onChange={(e) => setWorkspaceForm((prev) => ({ ...prev, entity_label_plural: e.target.value }))}
                    disabled={!canManageWorkspace}
                    className="border-gray-200 text-gray-900"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Preview: {workspaceForm.entity_label_plural || 'Entities'} pipeline in {workspaceForm.currency || 'EUR'} ({workspaceForm.locale || 'es-ES'}) using {getIndustryTemplate(workspaceForm.industry_template_key).label}.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSaveWorkspaceSettings}
                  disabled={!canManageWorkspace || updateWorkspace.isPending}
                >
                  {updateWorkspace.isPending ? 'Saving...' : 'Save Workspace Settings'}
                </Button>
                {!canManageWorkspace && (
                  <span className="text-xs text-gray-500">Only admin/manager can edit workspace settings.</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Organization Billing */}
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Organization Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label className="text-gray-600">Workspace</Label>
                <Input
                  readOnly
                  value={organization?.name ?? '—'}
                  className="bg-gray-50 border-gray-200 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-600">Subscription status</Label>
                <Input
                  readOnly
                  value={`${subscriptionStatus}${billingAccess.reason === 'past_due_grace' ? ' (grace period)' : ''}`}
                  className="bg-gray-50 border-gray-200 text-gray-900"
                />
              </div>
              <Link to="/billing">
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                  Open Billing
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-gray-200 bg-white border-red-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => signOut()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
