# Integrations System Audit & Fix

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the Integrations page to match Apollo.io's catalog layout, fix all console errors, fix sync failures, add credential persistence state, and fix accessibility warnings.

**Architecture:** Replace the current card-based Integrations page with a full-page catalog listing all providers with descriptions, category badges, and Connect/Configure actions. Fix backend by making all table queries graceful, fixing the credential-resolver to support all API key providers, and adding credential-status queries.

**Tech Stack:** React, TypeScript, Supabase (PostgREST + Edge Functions), TanStack Query, Radix UI, Tailwind CSS, react-icons/si

---

### Task 1: Add provider descriptions to provider-registry

**Files:**
- Modify: `src/lib/provider-registry.ts`

**Step 1: Add `description` field to ProviderDefinition interface**

```typescript
export interface ProviderDefinition {
  key: string;
  label: string;
  description: string;  // NEW
  icon: string;
  category: ProviderCategory;
  // ... rest unchanged
}
```

**Step 2: Add descriptions to every provider entry**

Add a one-line `description` field to each provider in `PROVIDER_REGISTRY`:

| Provider | Description |
|----------|-------------|
| woocommerce | "Sync orders, products, and inventory from your WooCommerce store" |
| shopify | "Sync orders, products, and inventory from your Shopify store" |
| gmail | "Connect Gmail to sync contacts and email communications" |
| outlook | "Connect Outlook to sync contacts and email communications" |
| email_imap | "Connect any email via IMAP/SMTP for contact sync and messaging" |
| brevo | "Sync contacts, campaigns, and email marketing data from Brevo" |
| notion | "Connect Notion to sync workspace data and documents" |
| google_drive | "Connect Google Drive to import files and spreadsheet data" |
| openai | "Connect OpenAI for AI-powered features and document processing" |
| anthropic | "Connect Anthropic Claude for AI-powered features and analysis" |
| hubspot | "Sync contacts, deals, and CRM data from HubSpot" |
| salesforce | "Sync contacts, deals, and CRM data from Salesforce" |
| pipedrive | "Sync contacts, deals, and pipeline data from Pipedrive" |
| prestashop | "Sync orders, products, and inventory from PrestaShop" |
| whatsapp | "Send and receive WhatsApp messages via Business API" |
| slack | "Receive alerts and notifications directly in Slack" |
| custom_api | "Connect any REST API with custom configuration" |

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS (all providers now have `description`)

**Step 4: Commit**

```bash
git add src/lib/provider-registry.ts
git commit -m "feat: add provider descriptions to registry"
```

---

### Task 2: Redesign Integrations page — Apollo.io catalog layout

**Files:**
- Rewrite: `src/pages/Integrations.tsx`
- Modify: `src/components/dashboard/IntegrationsCard.tsx` (keep as sub-component for connected integration management)

**Step 1: Rewrite Integrations.tsx as a catalog page**

The new page structure:
```
┌──────────────────────────────────────────────┐
│ Integrations                                  │
│ Connect your tools and manage data pipelines  │
├──────────────────────────────────────────────┤
│ [All] [E-commerce] [Email] [CRM] [AI] [Comm] │
├──────────────────────────────────────────────┤
│ ┌─ Available (count) ────────────────────┐   │
│ │ 🛒 WooCommerce          [Connect]      │   │
│ │   Sync orders, products...             │   │
│ │ ✉️ Gmail                 [Connect]      │   │
│ │   Connect Gmail to sync...             │   │
│ │ ...                                    │   │
│ └────────────────────────────────────────┘   │
│ ┌─ Connected (count) ───────────────────┐    │
│ │ [IntegrationsCard rows for connected]  │   │
│ └────────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

New Integrations.tsx:

```tsx
import { useState, useMemo } from 'react';
import { Plug, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProviderIcon } from '@/components/ui/provider-icon';
import { PROVIDER_REGISTRY, getProviderDefinition, type ProviderCategory } from '@/lib/provider-registry';
import { useIntegrations, useCreateIntegration } from '@/hooks/useIntegrations';
import { useStartOAuth } from '@/hooks/useOAuth';
import { IntegrationProvider, STATUS_COLORS } from '@/types/integrations';
import { ConnectedIntegrationRow } from '@/components/dashboard/IntegrationsCard';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const CATEGORIES: Array<{ key: ProviderCategory | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'ecommerce', label: 'E-commerce' },
  { key: 'email', label: 'Email' },
  { key: 'crm', label: 'CRM' },
  { key: 'ai', label: 'AI' },
  { key: 'communication', label: 'Communication' },
  { key: 'custom', label: 'Custom' },
];

const allProviders = Object.values(PROVIDER_REGISTRY);
```

The page renders:
1. Header with title + search
2. Category filter tabs (horizontal pill buttons)
3. "Available" section — providers NOT yet connected, each as a row with icon + name + description + category badge + "Connect" button
4. "Connected" section — existing integrations using the current IntegrationRow component

**Step 2: Export IntegrationRow from IntegrationsCard.tsx**

Rename the internal `IntegrationRow` to `ConnectedIntegrationRow` and export it so the new Integrations page can use it for connected integrations.

**Step 3: Run build**

Run: `npx vite build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/pages/Integrations.tsx src/components/dashboard/IntegrationsCard.tsx
git commit -m "feat: redesign Integrations page with Apollo.io catalog layout"
```

---

### Task 3: Fix console errors — graceful table queries

**Files:**
- Modify: `src/hooks/useAgentActions.ts`
- Modify: `src/hooks/useIntegrationJobs.ts`
- Modify: `src/hooks/useIntegrationRuns.ts`

**Step 1: Make useAgentActions graceful**

In `useAgentActions.ts` line 22, replace `throw new Error(error.message)` with:

```typescript
if (error) {
  const msg = (error.message ?? '').toLowerCase();
  if (error.code === '42P01' || msg.includes('does not exist') || msg.includes('schema cache')) {
    return [];
  }
  throw new Error(error.message);
}
```

**Step 2: Make useIntegrationJobs graceful**

In `useIntegrationJobs.ts` line 32, same pattern:

```typescript
if (error) {
  const msg = (error.message ?? '').toLowerCase();
  if (error.code === '42P01' || msg.includes('does not exist') || msg.includes('schema cache')) {
    return [];
  }
  throw new Error(error.message);
}
```

**Step 3: Run tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/hooks/useAgentActions.ts src/hooks/useIntegrationJobs.ts
git commit -m "fix: graceful handling for missing agent_actions_log and integration_sync_jobs tables"
```

---

### Task 4: Fix credential-resolver for all API key providers

**Files:**
- Modify: `supabase/functions/_shared/credential-resolver.ts:238-275`

**Step 1: Generalize resolveApiKeyCredentials**

Replace the Brevo-only logic (lines 238-275) with a generic resolver for ALL API key providers:

```typescript
async function resolveApiKeyCredentials(
  supabaseClient: any,
  provider: string,
  integrationId: string,
  baseMetadata: Record<string, unknown>,
): Promise<ResolvedCredentials> {
  const organizationId = baseMetadata._organization_id as string | undefined;

  const query = supabaseClient
    .from('integration_api_credentials')
    .select('api_key, api_secret, base_url')
    .eq('integration_id', integrationId)
    .eq('provider', provider);

  if (organizationId) {
    query.eq('organization_id', organizationId);
  }

  const { data: credsRow, error: credsError } = await query.maybeSingle();

  if (credsError) {
    // Schema cache miss — allow test connections to work without credentials
    const msg = (credsError.message ?? '').toLowerCase();
    if (msg.includes('schema cache') || msg.includes('does not exist') || credsError.code === '42P01') {
      return { metadata: baseMetadata };
    }
    throw new Error(`Failed to load ${provider} API credentials: ${credsError.message}`);
  }
  if (!credsRow) {
    throw new Error(`${provider} API credentials not found. Configure ${provider} credentials first.`);
  }

  const creds = credsRow as Record<string, unknown>;
  return {
    metadata: {
      ...baseMetadata,
      [`${provider}_api_key`]: creds.api_key,
      ...(creds.api_secret ? { [`${provider}_api_secret`]: creds.api_secret } : {}),
      ...(creds.base_url ? { [`${provider}_base_url`]: creds.base_url } : {}),
    },
  };
}
```

**Step 2: Deploy edge function**

```bash
npx supabase functions deploy process-integration-sync-jobs --no-verify-jwt
```

**Step 3: Commit**

```bash
git add supabase/functions/_shared/credential-resolver.ts
git commit -m "fix: credential-resolver supports all API key providers, not just Brevo"
```

---

### Task 5: Add credential status query hook

**Files:**
- Create: `src/hooks/useCredentialStatus.ts`

**Step 1: Create the hook**

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CredentialStatus {
  hasCredentials: boolean;
  provider: string;
  maskedKey?: string;
  updatedAt?: string;
}

export function useCredentialStatus(integrationId: string | null, provider: string | null) {
  return useQuery<CredentialStatus>({
    queryKey: ['credential-status', integrationId, provider],
    enabled: !!integrationId && !!provider,
    queryFn: async () => {
      // Check integration_api_credentials
      const { data, error } = await supabase
        .from('integration_api_credentials')
        .select('api_key, updated_at')
        .eq('integration_id', integrationId!)
        .eq('provider', provider!)
        .maybeSingle();

      if (error) {
        const msg = (error.message ?? '').toLowerCase();
        if (msg.includes('schema cache') || msg.includes('does not exist')) {
          return { hasCredentials: false, provider: provider! };
        }
        return { hasCredentials: false, provider: provider! };
      }

      if (!data) {
        return { hasCredentials: false, provider: provider! };
      }

      const key = (data as Record<string, unknown>).api_key as string;
      const maskedKey = key && key.length > 8
        ? `${key.slice(0, 4)}...${key.slice(-4)}`
        : '••••••••';

      return {
        hasCredentials: true,
        provider: provider!,
        maskedKey,
        updatedAt: (data as Record<string, unknown>).updated_at as string,
      };
    },
    staleTime: 30_000,
  });
}
```

**Step 2: Use in IntegrationRow (IntegrationsCard.tsx)**

When `authType === 'api_key'`, query credential status:
- If credentials exist → show "Connected" badge + masked key + "Update" button
- If no credentials → show "Configure" button as before

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 4: Commit**

```bash
git add src/hooks/useCredentialStatus.ts src/components/dashboard/IntegrationsCard.tsx
git commit -m "feat: show credential status for API key integrations"
```

---

### Task 6: Fix Radix Dialog accessibility warning

**Files:**
- Search all files with `<DialogContent` and ensure they include either:
  - A `<DialogDescription>` child, OR
  - `aria-describedby={undefined}` prop

Run: `grep -rn "DialogContent" src/components/ src/pages/ --include="*.tsx" | grep -v "import"`

For each occurrence missing Description, add `aria-describedby={undefined}`:

```tsx
<DialogContent aria-describedby={undefined}>
```

**Step 1: Fix all Dialog components**

**Step 2: Run build**

Run: `npx vite build`
Expected: PASS

**Step 3: Commit**

```bash
git add -u
git commit -m "fix: add aria-describedby to DialogContent components"
```

---

### Task 7: Deploy everything

**Step 1: Deploy edge functions**

```bash
for fn in process-integration-sync-jobs email-marketing-key-upsert woocommerce-orders oauth-start oauth-exchange; do
  npx supabase functions deploy "$fn" --no-verify-jwt
done
```

**Step 2: Deploy frontend**

```bash
npx vercel --prod
```

**Step 3: Verify**

- Open integrations page → catalog layout visible
- Add WooCommerce → shows Consumer Key + Consumer Secret fields
- Save credentials → shows "Connected" state
- Tab close + reopen → still shows "Connected"
- Console: no 404/500/409 errors from billing/agent tables

**Step 4: Commit + push**

```bash
git push origin feat/quality-improvements
```

---

## Execution Order

| # | Task | Type | Est. |
|---|------|------|------|
| 1 | Provider descriptions | Data | 3 min |
| 2 | Catalog page redesign | UI | 15 min |
| 3 | Graceful table queries | Fix | 5 min |
| 4 | Credential resolver | Backend | 5 min |
| 5 | Credential status hook | Feature | 8 min |
| 6 | Dialog accessibility | Fix | 3 min |
| 7 | Deploy | Ops | 5 min |
