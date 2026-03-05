# Phase 1: Creative CRM Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all skeleton placeholders in the creative pages with real CRUD for Clients, Projects, and Opportunities — the three core creative entities.

**Architecture:** Layered approach — shared infrastructure (types, services, hooks, DataTable) first, then each entity as a thin composition layer. All data flows through Supabase with RLS scoped via `organization_members`. The existing `useCurrentOrganization()` hook provides the org ID.

**Tech Stack:** TanStack Table v8, react-hook-form + zod, shadcn Sheet/Form/Table components, React Query, Supabase JS.

**DB Schema Notes (from `20260309100000_creative_domain_core.sql`):**
- `creative_clients`: status ∈ {prospect, active, inactive, archived}, size via `size_category` ∈ {solo, small, medium, large, enterprise}. NO embedded contact fields — contacts live in `creative_contacts`.
- `creative_projects`: status ∈ {draft, active, on_hold, completed, cancelled}. Budget via `budget_cents` (bigint) + `currency` (text). Has `client_id` FK.
- `creative_opportunities`: stage ∈ {lead, qualified, proposal, negotiation, won, lost}. Value via `value_cents` (bigint) + `currency` (text). Has `client_id` FK + `contact_id` FK. NO `project_id`.

---

### Task 1: Types & Validation Schemas

**Files:**
- Create: `src/types/creative.ts`
- Create: `src/lib/creative-schemas.ts`
- Test: `src/test/creative-types.test.ts`

**Step 1: Write the test file**

```typescript
// src/test/creative-types.test.ts
import { describe, it, expect } from 'vitest';
import { clientSchema, projectSchema, opportunitySchema } from '@/lib/creative-schemas';
import {
  CLIENT_STATUS_LABELS,
  CLIENT_SIZE_LABELS,
  PROJECT_STATUS_LABELS,
  OPPORTUNITY_STAGE_LABELS,
  CLIENT_STATUS_COLORS,
  PROJECT_STATUS_COLORS,
  OPPORTUNITY_STAGE_COLORS,
} from '@/types/creative';

describe('creative-schemas', () => {
  describe('clientSchema', () => {
    it('accepts valid client data', () => {
      const result = clientSchema.safeParse({
        name: 'Acme Studio',
        status: 'active',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
      const result = clientSchema.safeParse({ name: '', status: 'active' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid status', () => {
      const result = clientSchema.safeParse({ name: 'Test', status: 'bogus' });
      expect(result.success).toBe(false);
    });

    it('accepts optional fields', () => {
      const result = clientSchema.safeParse({
        name: 'Studio X',
        website: 'https://example.com',
        industry: 'Design',
        sizeCategory: 'small',
        status: 'prospect',
        description: 'A design studio',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('projectSchema', () => {
    it('accepts valid project data', () => {
      const result = projectSchema.safeParse({
        name: 'Brand Refresh',
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'draft',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing clientId', () => {
      const result = projectSchema.safeParse({ name: 'Test', status: 'draft' });
      expect(result.success).toBe(false);
    });

    it('rejects negative budget', () => {
      const result = projectSchema.safeParse({
        name: 'Test',
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'draft',
        budgetCents: -100,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('opportunitySchema', () => {
    it('accepts valid opportunity data', () => {
      const result = opportunitySchema.safeParse({
        title: 'Rebrand Project',
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        stage: 'lead',
      });
      expect(result.success).toBe(true);
    });

    it('rejects probability > 100', () => {
      const result = opportunitySchema.safeParse({
        title: 'Test',
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        stage: 'lead',
        probability: 150,
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid stage', () => {
      const result = opportunitySchema.safeParse({
        title: 'Test',
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        stage: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('creative type maps', () => {
  it('has labels for all client statuses', () => {
    expect(Object.keys(CLIENT_STATUS_LABELS)).toEqual(['prospect', 'active', 'inactive', 'archived']);
  });

  it('has colors for all client statuses', () => {
    expect(Object.keys(CLIENT_STATUS_COLORS)).toEqual(['prospect', 'active', 'inactive', 'archived']);
    Object.values(CLIENT_STATUS_COLORS).forEach((c) => {
      expect(c).toHaveProperty('bg');
      expect(c).toHaveProperty('text');
    });
  });

  it('has labels for all client sizes', () => {
    expect(Object.keys(CLIENT_SIZE_LABELS)).toEqual(['solo', 'small', 'medium', 'large', 'enterprise']);
  });

  it('has labels for all project statuses', () => {
    expect(Object.keys(PROJECT_STATUS_LABELS)).toEqual(['draft', 'active', 'on_hold', 'completed', 'cancelled']);
  });

  it('has labels and colors for all opportunity stages', () => {
    expect(Object.keys(OPPORTUNITY_STAGE_LABELS)).toEqual(['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']);
    expect(Object.keys(OPPORTUNITY_STAGE_COLORS)).toEqual(['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']);
  });
});
```

**Step 2: Run the test to verify it fails**

Run: `npx vitest run src/test/creative-types.test.ts`
Expected: FAIL — modules don't exist yet.

**Step 3: Create `src/types/creative.ts`**

```typescript
// src/types/creative.ts
// Domain types for the Creative CRM — Clients, Projects, Opportunities.
// Matches DB tables in 20260309100000_creative_domain_core.sql.

// ─── Client ──────────────────────────────────

export type ClientStatus = 'prospect' | 'active' | 'inactive' | 'archived';

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  prospect: 'Prospect',
  active: 'Active',
  inactive: 'Inactive',
  archived: 'Archived',
};

export const CLIENT_STATUS_COLORS: Record<ClientStatus, { bg: string; text: string }> = {
  prospect: { bg: 'bg-blue-100', text: 'text-blue-800' },
  active: { bg: 'bg-green-100', text: 'text-green-800' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-800' },
  archived: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

export type ClientSize = 'solo' | 'small' | 'medium' | 'large' | 'enterprise';

export const CLIENT_SIZE_LABELS: Record<ClientSize, string> = {
  solo: 'Solo',
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  enterprise: 'Enterprise',
};

export interface CreativeClient {
  id: string;
  organizationId: string;
  name: string;
  slug: string | null;
  website: string | null;
  industry: string | null;
  subIndustry: string | null;
  sizeCategory: ClientSize | null;
  status: ClientStatus;
  logoUrl: string | null;
  description: string | null;
  tags: string[];
  socialLinks: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Project ─────────────────────────────────

export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-800' },
  active: { bg: 'bg-green-100', text: 'text-green-800' },
  on_hold: { bg: 'bg-amber-100', text: 'text-amber-800' },
  completed: { bg: 'bg-blue-100', text: 'text-blue-800' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
};

export interface CreativeProject {
  id: string;
  organizationId: string;
  clientId: string | null;
  name: string;
  slug: string | null;
  description: string | null;
  projectType: string | null;
  status: ProjectStatus;
  budgetCents: number | null;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  deliverables: unknown[];
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Opportunity ─────────────────────────────

export type OpportunityStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export const OPPORTUNITY_STAGE_LABELS: Record<OpportunityStage, string> = {
  lead: 'Lead',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

export const OPPORTUNITY_STAGE_COLORS: Record<OpportunityStage, { bg: string; text: string }> = {
  lead: { bg: 'bg-sky-100', text: 'text-sky-800' },
  qualified: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  proposal: { bg: 'bg-purple-100', text: 'text-purple-800' },
  negotiation: { bg: 'bg-amber-100', text: 'text-amber-800' },
  won: { bg: 'bg-green-100', text: 'text-green-800' },
  lost: { bg: 'bg-red-100', text: 'text-red-800' },
};

export interface CreativeOpportunity {
  id: string;
  organizationId: string;
  clientId: string | null;
  contactId: string | null;
  title: string;
  description: string | null;
  stage: OpportunityStage;
  valueCents: number | null;
  currency: string;
  probability: number;
  expectedCloseDate: string | null;
  source: string | null;
  lostReason: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

**Step 4: Create `src/lib/creative-schemas.ts`**

```typescript
// src/lib/creative-schemas.ts
// Zod schemas for creative entity form validation.

import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  website: z.string().url('Invalid URL').or(z.literal('')).optional(),
  industry: z.string().optional(),
  subIndustry: z.string().optional(),
  sizeCategory: z.enum(['solo', 'small', 'medium', 'large', 'enterprise']).optional(),
  status: z.enum(['prospect', 'active', 'inactive', 'archived']).default('prospect'),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

export const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  clientId: z.string().uuid('Select a client'),
  projectType: z.string().optional(),
  status: z.enum(['draft', 'active', 'on_hold', 'completed', 'cancelled']).default('draft'),
  budgetCents: z.number().int().nonnegative('Budget cannot be negative').optional(),
  currency: z.string().default('USD'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

export const opportunitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  clientId: z.string().uuid('Select a client'),
  contactId: z.string().uuid().optional(),
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).default('lead'),
  valueCents: z.number().int().nonnegative('Value cannot be negative').optional(),
  currency: z.string().default('USD'),
  probability: z.number().int().min(0).max(100, 'Probability must be 0-100').optional(),
  expectedCloseDate: z.string().optional(),
  description: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type OpportunityFormValues = z.infer<typeof opportunitySchema>;
```

**Step 5: Run tests to verify they pass**

Run: `npx vitest run src/test/creative-types.test.ts`
Expected: PASS — all tests green.

**Step 6: Commit**

```bash
git add src/types/creative.ts src/lib/creative-schemas.ts src/test/creative-types.test.ts
git commit -m "feat(creative): add types and zod validation schemas for Clients, Projects, Opportunities"
```

---

### Task 2: Service Layer — Row Converters

**Files:**
- Create: `src/services/creativeClientService.ts`
- Create: `src/services/creativeProjectService.ts`
- Create: `src/services/creativeOpportunityService.ts`
- Test: `src/test/creative-services.test.ts`

**Step 1: Write the test file**

```typescript
// src/test/creative-services.test.ts
import { describe, it, expect } from 'vitest';
import { toCreativeClient, toCreativeClients } from '@/services/creativeClientService';
import { toCreativeProject } from '@/services/creativeProjectService';
import { toCreativeOpportunity } from '@/services/creativeOpportunityService';

describe('creativeClientService', () => {
  const row = {
    id: 'abc',
    organization_id: 'org1',
    name: 'Studio X',
    slug: 'studio-x',
    website: 'https://studio-x.com',
    industry: 'Design',
    sub_industry: null,
    size_category: 'small',
    status: 'active',
    logo_url: null,
    description: 'A studio',
    tags: ['design'],
    social_links: {},
    metadata: {},
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  it('converts snake_case row to camelCase domain type', () => {
    const client = toCreativeClient(row);
    expect(client.id).toBe('abc');
    expect(client.organizationId).toBe('org1');
    expect(client.name).toBe('Studio X');
    expect(client.sizeCategory).toBe('small');
    expect(client.status).toBe('active');
    expect(client.tags).toEqual(['design']);
    expect(client.createdAt).toBe('2026-01-01T00:00:00Z');
  });

  it('converts array of rows', () => {
    const clients = toCreativeClients([row, { ...row, id: 'def', name: 'Studio Y' }]);
    expect(clients).toHaveLength(2);
    expect(clients[1].name).toBe('Studio Y');
  });
});

describe('creativeProjectService', () => {
  it('converts project row', () => {
    const project = toCreativeProject({
      id: 'p1',
      organization_id: 'org1',
      client_id: 'c1',
      name: 'Brand Refresh',
      slug: null,
      description: null,
      project_type: 'branding',
      status: 'active',
      budget_cents: 500000,
      currency: 'USD',
      start_date: '2026-01-15',
      end_date: '2026-03-15',
      deliverables: [],
      tags: [],
      metadata: {},
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    });
    expect(project.clientId).toBe('c1');
    expect(project.budgetCents).toBe(500000);
    expect(project.projectType).toBe('branding');
    expect(project.startDate).toBe('2026-01-15');
  });
});

describe('creativeOpportunityService', () => {
  it('converts opportunity row', () => {
    const opp = toCreativeOpportunity({
      id: 'o1',
      organization_id: 'org1',
      client_id: 'c1',
      contact_id: null,
      title: 'Rebrand Deal',
      description: null,
      stage: 'proposal',
      value_cents: 1000000,
      currency: 'EUR',
      probability: 75,
      expected_close_date: '2026-06-01',
      source: 'referral',
      lost_reason: null,
      tags: ['big'],
      metadata: {},
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    });
    expect(opp.title).toBe('Rebrand Deal');
    expect(opp.valueCents).toBe(1000000);
    expect(opp.currency).toBe('EUR');
    expect(opp.probability).toBe(75);
    expect(opp.stage).toBe('proposal');
    expect(opp.source).toBe('referral');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/test/creative-services.test.ts`
Expected: FAIL — modules don't exist yet.

**Step 3: Create `src/services/creativeClientService.ts`**

```typescript
// src/services/creativeClientService.ts
import type { CreativeClient, ClientStatus, ClientSize } from '@/types/creative';

export interface CreativeClientRow {
  id: string;
  organization_id: string;
  name: string;
  slug: string | null;
  website: string | null;
  industry: string | null;
  sub_industry: string | null;
  size_category: string | null;
  status: string;
  logo_url: string | null;
  description: string | null;
  tags: string[];
  social_links: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function toCreativeClient(row: CreativeClientRow): CreativeClient {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    slug: row.slug,
    website: row.website,
    industry: row.industry,
    subIndustry: row.sub_industry,
    sizeCategory: (row.size_category as ClientSize) ?? null,
    status: row.status as ClientStatus,
    logoUrl: row.logo_url,
    description: row.description,
    tags: row.tags ?? [],
    socialLinks: row.social_links ?? {},
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toCreativeClients(rows: readonly CreativeClientRow[]): CreativeClient[] {
  return rows.map(toCreativeClient);
}
```

**Step 4: Create `src/services/creativeProjectService.ts`**

```typescript
// src/services/creativeProjectService.ts
import type { CreativeProject, ProjectStatus } from '@/types/creative';

export interface CreativeProjectRow {
  id: string;
  organization_id: string;
  client_id: string | null;
  name: string;
  slug: string | null;
  description: string | null;
  project_type: string | null;
  status: string;
  budget_cents: number | null;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  deliverables: unknown[];
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function toCreativeProject(row: CreativeProjectRow): CreativeProject {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    projectType: row.project_type,
    status: row.status as ProjectStatus,
    budgetCents: row.budget_cents,
    currency: row.currency ?? 'USD',
    startDate: row.start_date,
    endDate: row.end_date,
    deliverables: row.deliverables ?? [],
    tags: row.tags ?? [],
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toCreativeProjects(rows: readonly CreativeProjectRow[]): CreativeProject[] {
  return rows.map(toCreativeProject);
}
```

**Step 5: Create `src/services/creativeOpportunityService.ts`**

```typescript
// src/services/creativeOpportunityService.ts
import type { CreativeOpportunity, OpportunityStage } from '@/types/creative';

export interface CreativeOpportunityRow {
  id: string;
  organization_id: string;
  client_id: string | null;
  contact_id: string | null;
  title: string;
  description: string | null;
  stage: string;
  value_cents: number | null;
  currency: string;
  probability: number;
  expected_close_date: string | null;
  source: string | null;
  lost_reason: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function toCreativeOpportunity(row: CreativeOpportunityRow): CreativeOpportunity {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    contactId: row.contact_id,
    title: row.title,
    description: row.description,
    stage: row.stage as OpportunityStage,
    valueCents: row.value_cents,
    currency: row.currency ?? 'USD',
    probability: row.probability ?? 0,
    expectedCloseDate: row.expected_close_date,
    source: row.source,
    lostReason: row.lost_reason,
    tags: row.tags ?? [],
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toCreativeOpportunities(rows: readonly CreativeOpportunityRow[]): CreativeOpportunity[] {
  return rows.map(toCreativeOpportunity);
}
```

**Step 6: Run tests**

Run: `npx vitest run src/test/creative-services.test.ts`
Expected: PASS

**Step 7: Commit**

```bash
git add src/services/creativeClientService.ts src/services/creativeProjectService.ts src/services/creativeOpportunityService.ts src/test/creative-services.test.ts
git commit -m "feat(creative): add service layer with Row→Domain converters for all 3 entities"
```

---

### Task 3: React Query Hooks — CRUD for All 3 Entities

**Files:**
- Create: `src/hooks/useCreativeClients.ts`
- Create: `src/hooks/useCreativeProjects.ts`
- Create: `src/hooks/useCreativeOpportunities.ts`

**Reference:** Existing hook pattern in `src/hooks/useBusinessEntities.ts`. Uses `useCurrentOrganization()` from `src/hooks/useOrganizationContext.ts` for org ID (supports impersonation).

**Step 1: Create `src/hooks/useCreativeClients.ts`**

```typescript
// src/hooks/useCreativeClients.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CreativeClient } from '@/types/creative';
import type { ClientFormValues } from '@/lib/creative-schemas';
import { toCreativeClient, toCreativeClients, type CreativeClientRow } from '@/services/creativeClientService';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

const clientsKeys = {
  all: (orgId: string) => ['creative-clients', orgId] as const,
  detail: (id: string) => ['creative-client', id] as const,
};

export function useCreativeClients() {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<CreativeClient[]>({
    queryKey: clientsKeys.all(orgId ?? ''),
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creative_clients')
        .select('*')
        .eq('organization_id', orgId!)
        .order('name');
      if (error) throw error;
      return toCreativeClients((data ?? []) as unknown as CreativeClientRow[]);
    },
  });
}

export function useCreativeClient(id: string | null) {
  return useQuery<CreativeClient | null>({
    queryKey: clientsKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('creative_clients')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return toCreativeClient(data as unknown as CreativeClientRow);
    },
  });
}

export function useCreateCreativeClient() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (values: ClientFormValues) => {
      const orgId = membership?.organization_id;
      if (!orgId) throw new Error('No organization');
      const { data, error } = await supabase
        .from('creative_clients')
        .insert({ ...values, organization_id: orgId, size_category: values.sizeCategory, sub_industry: values.subIndustry })
        .select('*')
        .single();
      if (error) throw error;
      return toCreativeClient(data as unknown as CreativeClientRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-clients'] });
    },
  });
}

export function useUpdateCreativeClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<ClientFormValues> }) => {
      const patch: Record<string, unknown> = { ...values };
      if (values.sizeCategory !== undefined) { patch.size_category = values.sizeCategory; delete patch.sizeCategory; }
      if (values.subIndustry !== undefined) { patch.sub_industry = values.subIndustry; delete patch.subIndustry; }

      const { data, error } = await supabase
        .from('creative_clients')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return toCreativeClient(data as unknown as CreativeClientRow);
    },
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: ['creative-clients'] });
      queryClient.setQueryData(clientsKeys.detail(client.id), client);
    },
  });
}

export function useDeleteCreativeClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('creative_clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-clients'] });
    },
  });
}
```

**Step 2: Create `src/hooks/useCreativeProjects.ts`**

```typescript
// src/hooks/useCreativeProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CreativeProject } from '@/types/creative';
import type { ProjectFormValues } from '@/lib/creative-schemas';
import { toCreativeProject, toCreativeProjects, type CreativeProjectRow } from '@/services/creativeProjectService';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

const projectsKeys = {
  all: (orgId: string) => ['creative-projects', orgId] as const,
  byClient: (clientId: string) => ['creative-projects', 'client', clientId] as const,
  detail: (id: string) => ['creative-project', id] as const,
};

export function useCreativeProjects(clientId?: string) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<CreativeProject[]>({
    queryKey: clientId ? projectsKeys.byClient(clientId) : projectsKeys.all(orgId ?? ''),
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('creative_projects')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (error) throw error;
      return toCreativeProjects((data ?? []) as unknown as CreativeProjectRow[]);
    },
  });
}

export function useCreativeProject(id: string | null) {
  return useQuery<CreativeProject | null>({
    queryKey: projectsKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('creative_projects')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return toCreativeProject(data as unknown as CreativeProjectRow);
    },
  });
}

export function useCreateCreativeProject() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (values: ProjectFormValues) => {
      const orgId = membership?.organization_id;
      if (!orgId) throw new Error('No organization');
      const { data, error } = await supabase
        .from('creative_projects')
        .insert({
          organization_id: orgId,
          name: values.name,
          client_id: values.clientId,
          project_type: values.projectType,
          status: values.status,
          budget_cents: values.budgetCents,
          currency: values.currency,
          start_date: values.startDate,
          end_date: values.endDate,
          description: values.description,
          tags: values.tags,
        })
        .select('*')
        .single();
      if (error) throw error;
      return toCreativeProject(data as unknown as CreativeProjectRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-projects'] });
    },
  });
}

export function useUpdateCreativeProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<ProjectFormValues> }) => {
      const patch: Record<string, unknown> = {};
      if (values.name !== undefined) patch.name = values.name;
      if (values.clientId !== undefined) patch.client_id = values.clientId;
      if (values.projectType !== undefined) patch.project_type = values.projectType;
      if (values.status !== undefined) patch.status = values.status;
      if (values.budgetCents !== undefined) patch.budget_cents = values.budgetCents;
      if (values.currency !== undefined) patch.currency = values.currency;
      if (values.startDate !== undefined) patch.start_date = values.startDate;
      if (values.endDate !== undefined) patch.end_date = values.endDate;
      if (values.description !== undefined) patch.description = values.description;
      if (values.tags !== undefined) patch.tags = values.tags;

      const { data, error } = await supabase
        .from('creative_projects')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return toCreativeProject(data as unknown as CreativeProjectRow);
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['creative-projects'] });
      queryClient.setQueryData(projectsKeys.detail(project.id), project);
    },
  });
}

export function useDeleteCreativeProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('creative_projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-projects'] });
    },
  });
}
```

**Step 3: Create `src/hooks/useCreativeOpportunities.ts`**

```typescript
// src/hooks/useCreativeOpportunities.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CreativeOpportunity } from '@/types/creative';
import type { OpportunityFormValues } from '@/lib/creative-schemas';
import { toCreativeOpportunity, toCreativeOpportunities, type CreativeOpportunityRow } from '@/services/creativeOpportunityService';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

const oppsKeys = {
  all: (orgId: string) => ['creative-opportunities', orgId] as const,
  byClient: (clientId: string) => ['creative-opportunities', 'client', clientId] as const,
  detail: (id: string) => ['creative-opportunity', id] as const,
};

export function useCreativeOpportunities(clientId?: string) {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<CreativeOpportunity[]>({
    queryKey: clientId ? oppsKeys.byClient(clientId) : oppsKeys.all(orgId ?? ''),
    enabled: !!orgId,
    queryFn: async () => {
      let query = supabase
        .from('creative_opportunities')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (error) throw error;
      return toCreativeOpportunities((data ?? []) as unknown as CreativeOpportunityRow[]);
    },
  });
}

export function useCreativeOpportunity(id: string | null) {
  return useQuery<CreativeOpportunity | null>({
    queryKey: oppsKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('creative_opportunities')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return toCreativeOpportunity(data as unknown as CreativeOpportunityRow);
    },
  });
}

export function useCreateCreativeOpportunity() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (values: OpportunityFormValues) => {
      const orgId = membership?.organization_id;
      if (!orgId) throw new Error('No organization');
      const { data, error } = await supabase
        .from('creative_opportunities')
        .insert({
          organization_id: orgId,
          title: values.title,
          client_id: values.clientId,
          contact_id: values.contactId,
          stage: values.stage,
          value_cents: values.valueCents,
          currency: values.currency,
          probability: values.probability ?? 0,
          expected_close_date: values.expectedCloseDate,
          description: values.description,
          source: values.source,
          tags: values.tags,
        })
        .select('*')
        .single();
      if (error) throw error;
      return toCreativeOpportunity(data as unknown as CreativeOpportunityRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-opportunities'] });
    },
  });
}

export function useUpdateCreativeOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<OpportunityFormValues> }) => {
      const patch: Record<string, unknown> = {};
      if (values.title !== undefined) patch.title = values.title;
      if (values.clientId !== undefined) patch.client_id = values.clientId;
      if (values.contactId !== undefined) patch.contact_id = values.contactId;
      if (values.stage !== undefined) patch.stage = values.stage;
      if (values.valueCents !== undefined) patch.value_cents = values.valueCents;
      if (values.currency !== undefined) patch.currency = values.currency;
      if (values.probability !== undefined) patch.probability = values.probability;
      if (values.expectedCloseDate !== undefined) patch.expected_close_date = values.expectedCloseDate;
      if (values.description !== undefined) patch.description = values.description;
      if (values.source !== undefined) patch.source = values.source;
      if (values.tags !== undefined) patch.tags = values.tags;

      const { data, error } = await supabase
        .from('creative_opportunities')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return toCreativeOpportunity(data as unknown as CreativeOpportunityRow);
    },
    onSuccess: (opp) => {
      queryClient.invalidateQueries({ queryKey: ['creative-opportunities'] });
      queryClient.setQueryData(oppsKeys.detail(opp.id), opp);
    },
  });
}

export function useDeleteCreativeOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('creative_opportunities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creative-opportunities'] });
    },
  });
}
```

**Step 4: Run full test suite to ensure nothing is broken**

Run: `npx vitest run`
Expected: All existing tests still pass (hooks aren't unit tested because they depend on Supabase — integration tested via the UI).

**Step 5: Commit**

```bash
git add src/hooks/useCreativeClients.ts src/hooks/useCreativeProjects.ts src/hooks/useCreativeOpportunities.ts
git commit -m "feat(creative): add React Query CRUD hooks for Clients, Projects, Opportunities"
```

---

### Task 4: Shared DataTable Component

**Files:**
- Create: `src/components/creative/shared/DataTable.tsx`
- Create: `src/components/creative/shared/DataTableColumnHeader.tsx`
- Create: `src/components/creative/shared/DataTablePagination.tsx`

**Reference:** Uses shadcn `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` from `src/components/ui/table.tsx`. Uses `@tanstack/react-table` (installed, v8.21.3).

**Step 1: Create `src/components/creative/shared/DataTableColumnHeader.tsx`**

```typescript
// src/components/creative/shared/DataTableColumnHeader.tsx
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { Column } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('-ml-3 h-8 data-[state=open]:bg-accent', className)}
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      <span>{title}</span>
      {column.getIsSorted() === 'desc' ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : column.getIsSorted() === 'asc' ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ChevronsUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
}
```

**Step 2: Create `src/components/creative/shared/DataTablePagination.tsx`**

```typescript
// src/components/creative/shared/DataTablePagination.tsx
import type { Table } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        {table.getFilteredRowModel().rows.length} row(s)
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 25, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Create `src/components/creative/shared/DataTable.tsx`**

```typescript
// src/components/creative/shared/DataTable.tsx
import { useState } from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTablePagination } from './DataTablePagination';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  searchKey?: string;
  searchPlaceholder?: string;
  onRowClick?: (row: TData) => void;
  emptyState?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  searchKey,
  searchPlaceholder = 'Search...',
  onRowClick,
  emptyState,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
    initialState: { pagination: { pageSize: 25 } },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <div className="rounded-md border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b last:border-b-0">
              {Array.from({ length: columns.length }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {searchKey && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
            onChange={(e) => table.getColumn(searchKey)?.setFilterValue(e.target.value)}
            className="pl-9"
          />
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={onRowClick ? 'cursor-pointer' : ''}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyState ?? 'No results.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
```

**Step 4: Run full test suite**

Run: `npx vitest run`
Expected: All tests still pass (DataTable has no unit tests — it's a presentation component tested via visual/integration).

**Step 5: Commit**

```bash
git add src/components/creative/shared/DataTable.tsx src/components/creative/shared/DataTableColumnHeader.tsx src/components/creative/shared/DataTablePagination.tsx
git commit -m "feat(creative): add shared DataTable component with sorting, filtering, pagination"
```

---

### Task 5: Clients — Columns, Card, Form Sheet, Detail

**Files:**
- Create: `src/components/creative/clients/client-columns.tsx`
- Create: `src/components/creative/clients/ClientCard.tsx`
- Create: `src/components/creative/clients/ClientFormSheet.tsx`
- Create: `src/components/creative/clients/ClientDetail.tsx`

**Step 1: Create `src/components/creative/clients/client-columns.tsx`**

```typescript
// src/components/creative/clients/client-columns.tsx
import type { ColumnDef } from '@tanstack/react-table';
import type { CreativeClient } from '@/types/creative';
import { CLIENT_STATUS_LABELS, CLIENT_STATUS_COLORS, CLIENT_SIZE_LABELS } from '@/types/creative';
import { DataTableColumnHeader } from '@/components/creative/shared/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';

export const clientColumns: ColumnDef<CreativeClient, unknown>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
  },
  {
    accessorKey: 'industry',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Industry" />,
    cell: ({ row }) => row.getValue('industry') ?? '—',
  },
  {
    accessorKey: 'sizeCategory',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Size" />,
    cell: ({ row }) => {
      const size = row.getValue('sizeCategory') as string | null;
      return size ? CLIENT_SIZE_LABELS[size as keyof typeof CLIENT_SIZE_LABELS] : '—';
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue('status') as keyof typeof CLIENT_STATUS_LABELS;
      const colors = CLIENT_STATUS_COLORS[status];
      return (
        <Badge variant="secondary" className={`${colors.bg} ${colors.text} border-0`}>
          {CLIENT_STATUS_LABELS[status]}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => new Date(row.getValue('createdAt') as string).toLocaleDateString(),
  },
];
```

**Step 2: Create `src/components/creative/clients/ClientCard.tsx`**

```typescript
// src/components/creative/clients/ClientCard.tsx
import type { CreativeClient } from '@/types/creative';
import { CLIENT_STATUS_LABELS, CLIENT_STATUS_COLORS, CLIENT_SIZE_LABELS } from '@/types/creative';
import { Badge } from '@/components/ui/badge';
import { Building2, Globe } from 'lucide-react';

interface ClientCardProps {
  client: CreativeClient;
  onClick?: () => void;
}

export function ClientCard({ client, onClick }: ClientCardProps) {
  const statusColors = CLIENT_STATUS_COLORS[client.status];

  return (
    <div
      className="rounded-lg border bg-card p-4 space-y-3 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <h3 className="font-semibold truncate">{client.name}</h3>
        <Badge variant="secondary" className={`${statusColors.bg} ${statusColors.text} border-0 shrink-0 ml-2`}>
          {CLIENT_STATUS_LABELS[client.status]}
        </Badge>
      </div>
      {client.industry && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          <span>{client.industry}</span>
        </div>
      )}
      {client.website && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground truncate">
          <Globe className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{client.website}</span>
        </div>
      )}
      <div className="flex gap-2 pt-1">
        {client.sizeCategory && (
          <Badge variant="outline" className="text-xs">
            {CLIENT_SIZE_LABELS[client.sizeCategory]}
          </Badge>
        )}
      </div>
    </div>
  );
}
```

**Step 3: Create `src/components/creative/clients/ClientFormSheet.tsx`**

```typescript
// src/components/creative/clients/ClientFormSheet.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientSchema, type ClientFormValues } from '@/lib/creative-schemas';
import { useCreateCreativeClient, useUpdateCreativeClient } from '@/hooks/useCreativeClients';
import type { CreativeClient } from '@/types/creative';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface ClientFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: CreativeClient;
  onSuccess?: () => void;
}

export function ClientFormSheet({ open, onOpenChange, client, onSuccess }: ClientFormSheetProps) {
  const { toast } = useToast();
  const createMutation = useCreateCreativeClient();
  const updateMutation = useUpdateCreativeClient();
  const isEditing = !!client;

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name ?? '',
      website: client?.website ?? '',
      industry: client?.industry ?? '',
      sizeCategory: client?.sizeCategory ?? undefined,
      status: client?.status ?? 'prospect',
      description: client?.description ?? '',
    },
  });

  async function onSubmit(values: ClientFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: client.id, values });
        toast({ title: 'Client updated' });
      } else {
        await createMutation.mutateAsync(values);
        toast({ title: 'Client created' });
      }
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Client' : 'New Client'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Update client details.' : 'Add a new creative client.'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl><Input {...field} placeholder="Studio name" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="website" render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl><Input {...field} placeholder="https://..." /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="industry" render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. Design" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="sizeCategory" render={({ field }) => (
                <FormItem>
                  <FormLabel>Size</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="solo">Solo</SelectItem>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea {...field} rows={3} placeholder="Notes about this client..." /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEditing ? 'Save Changes' : 'Create Client'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
```

**Step 4: Create `src/components/creative/clients/ClientDetail.tsx`**

```typescript
// src/components/creative/clients/ClientDetail.tsx
import { useState } from 'react';
import type { CreativeClient } from '@/types/creative';
import { CLIENT_STATUS_LABELS, CLIENT_STATUS_COLORS, CLIENT_SIZE_LABELS } from '@/types/creative';
import { useDeleteCreativeClient } from '@/hooks/useCreativeClients';
import { ClientFormSheet } from './ClientFormSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Pencil, Trash2, Globe, Building2 } from 'lucide-react';

interface ClientDetailProps {
  client: CreativeClient;
  onClose: () => void;
}

export function ClientDetail({ client, onClose }: ClientDetailProps) {
  const [editOpen, setEditOpen] = useState(false);
  const deleteMutation = useDeleteCreativeClient();
  const { toast } = useToast();
  const statusColors = CLIENT_STATUS_COLORS[client.status];

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(client.id);
      toast({ title: 'Client deleted' });
      onClose();
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">{client.name}</h2>
          <Badge variant="secondary" className={`${statusColors.bg} ${statusColors.text} border-0 mt-1`}>
            {CLIENT_STATUS_LABELS[client.status]}
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete client?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{client.name}" and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-3 text-sm">
        {client.industry && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{client.industry}{client.subIndustry ? ` · ${client.subIndustry}` : ''}</span>
          </div>
        )}
        {client.website && (
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{client.website}</a>
          </div>
        )}
        {client.sizeCategory && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Size:</span>
            <span>{CLIENT_SIZE_LABELS[client.sizeCategory]}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {client.description && (
        <div>
          <h3 className="text-sm font-medium mb-1">Description</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.description}</p>
        </div>
      )}

      {/* Tags */}
      {client.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1">
            {client.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-muted-foreground pt-4 border-t">
        Created {new Date(client.createdAt).toLocaleDateString()}
      </div>

      <ClientFormSheet open={editOpen} onOpenChange={setEditOpen} client={client} />
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add src/components/creative/clients/
git commit -m "feat(creative): add client columns, card, form sheet, and detail components"
```

---

### Task 6: Wire Up CreativeClients Page

**Files:**
- Modify: `src/pages/creative/CreativeClients.tsx`

**Step 1: Replace the entire file**

```typescript
// src/pages/creative/CreativeClients.tsx
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { ViewSwitcher } from '@/components/creative/navigation/ViewSwitcher';
import { DataTable } from '@/components/creative/shared/DataTable';
import { clientColumns } from '@/components/creative/clients/client-columns';
import { ClientCard } from '@/components/creative/clients/ClientCard';
import { ClientFormSheet } from '@/components/creative/clients/ClientFormSheet';
import { ClientDetail } from '@/components/creative/clients/ClientDetail';
import { useCreativeClients } from '@/hooks/useCreativeClients';
import { useCreativeLayout } from '@/components/creative/layout/CreativeLayout';
import type { CreativeClient } from '@/types/creative';
import type { ViewMode } from '@/lib/design-tokens';

export default function CreativeClients() {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [formOpen, setFormOpen] = useState(false);
  const { data: clients = [], isLoading } = useCreativeClients();
  const { setContextPanelOpen, setContextPanelContent } = useCreativeLayout();

  function handleRowClick(client: CreativeClient) {
    setContextPanelContent(
      <ClientDetail
        client={client}
        onClose={() => {
          setContextPanelOpen(false);
          setContextPanelContent(null);
        }}
      />
    );
    setContextPanelOpen(true);
  }

  return (
    <WorkspaceContainer
      title="Clients"
      description="Manage your creative clients and relationships"
      actions={
        <div className="flex items-center gap-2">
          <ViewSwitcher value={viewMode} onChange={setViewMode} availableViews={['table', 'cards']} />
          <Button size="sm" className="gap-1.5" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Client</span>
          </Button>
        </div>
      }
    >
      <div className="mt-2">
        {viewMode === 'table' ? (
          <DataTable
            columns={clientColumns}
            data={clients}
            isLoading={isLoading}
            searchKey="name"
            searchPlaceholder="Search clients..."
            onRowClick={handleRowClick}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card p-4 space-y-3 animate-pulse">
                  <div className="h-5 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted/60 rounded" />
                  <div className="h-4 w-full bg-muted/40 rounded" />
                </div>
              ))
            ) : clients.length === 0 ? (
              <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
                No clients yet. Click "Add Client" to get started.
              </div>
            ) : (
              clients.map((client) => (
                <ClientCard key={client.id} client={client} onClick={() => handleRowClick(client)} />
              ))
            )}
          </div>
        )}
      </div>

      <ClientFormSheet open={formOpen} onOpenChange={setFormOpen} />
    </WorkspaceContainer>
  );
}
```

**Step 2: Run test suite**

Run: `npx vitest run`
Expected: All tests pass.

**Step 3: Commit**

```bash
git add src/pages/creative/CreativeClients.tsx
git commit -m "feat(creative): wire up CreativeClients page with DataTable, cards, form sheet, detail panel"
```

---

### Task 7: Projects — Columns, Card, Form Sheet, Detail + Wire Up Page

**Files:**
- Create: `src/components/creative/projects/project-columns.tsx`
- Create: `src/components/creative/projects/ProjectCard.tsx`
- Create: `src/components/creative/projects/ProjectFormSheet.tsx`
- Create: `src/components/creative/projects/ProjectDetail.tsx`
- Modify: `src/pages/creative/CreativeProjects.tsx`

Follow the exact same pattern as Task 5 + Task 6 but for projects.

**Key differences from clients:**
- Columns: Name, Client (via `clientId` → join lookup not available, show `clientId` or use a client name resolver), Status, Start Date, End Date, Budget
- Budget display: `budgetCents / 100` formatted as currency with `currency` field
- Form: includes client select dropdown populated by `useCreativeClients()`
- Form has date pickers for `startDate` and `endDate`
- Detail: shows client info, budget, date range

**Step 1: Create all 4 component files following the client pattern**

The project-columns, ProjectCard, ProjectFormSheet, and ProjectDetail should mirror the client versions with these adaptations:
- Use `PROJECT_STATUS_LABELS`, `PROJECT_STATUS_COLORS` from `@/types/creative`
- Budget formatting: `new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency }).format((project.budgetCents ?? 0) / 100)`
- The form sheet needs a client select: use `useCreativeClients()` to populate options
- ProjectFormSheet uses `projectSchema` and `ProjectFormValues` from `@/lib/creative-schemas`

**Step 2: Replace `CreativeProjects.tsx`** following the same pattern as `CreativeClients.tsx` but:
- Import project-specific components
- Use `useCreativeProjects()` hook
- Use `projectColumns` for the DataTable

**Step 3: Run tests, commit**

```bash
git add src/components/creative/projects/ src/pages/creative/CreativeProjects.tsx
git commit -m "feat(creative): add Projects CRUD with table, cards, form sheet, detail panel"
```

---

### Task 8: Opportunities — Columns, Card, Form Sheet, Detail + Wire Up Page

**Files:**
- Create: `src/components/creative/opportunities/opportunity-columns.tsx`
- Create: `src/components/creative/opportunities/OpportunityCard.tsx`
- Create: `src/components/creative/opportunities/OpportunityFormSheet.tsx`
- Create: `src/components/creative/opportunities/OpportunityDetail.tsx`
- Modify: `src/pages/creative/CreativeOpportunities.tsx`

Follow the exact same pattern as Task 7 but for opportunities.

**Key differences:**
- Columns: Title, Client, Stage, Value, Probability, Expected Close
- Stage badges use `OPPORTUNITY_STAGE_LABELS`, `OPPORTUNITY_STAGE_COLORS`
- Value display: `valueCents / 100` formatted as currency
- Probability display: `{probability}%` with optional progress bar
- Form: includes client select + stage select
- Detail: shows stage pipeline position, value, probability

**Step 1: Create all 4 component files**
**Step 2: Replace `CreativeOpportunities.tsx`**
**Step 3: Run tests, commit**

```bash
git add src/components/creative/opportunities/ src/pages/creative/CreativeOpportunities.tsx
git commit -m "feat(creative): add Opportunities CRUD with table, cards, form sheet, detail panel"
```

---

### Task 9: Dashboard with Live KPIs

**Files:**
- Create: `src/hooks/useCreativeDashboard.ts`
- Modify: `src/pages/creative/CreativeDashboard.tsx`

**Step 1: Create `src/hooks/useCreativeDashboard.ts`**

```typescript
// src/hooks/useCreativeDashboard.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

interface DashboardStats {
  totalClients: number;
  activeProjects: number;
  pipelineValueCents: number;
  pipelineCurrency: string;
  winRate: number;
  stageBreakdown: Record<string, number>;
}

export function useCreativeDashboard() {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id ?? null;

  return useQuery<DashboardStats>({
    queryKey: ['creative-dashboard', orgId ?? ''],
    enabled: !!orgId,
    queryFn: async () => {
      const [clientsRes, projectsRes, oppsRes] = await Promise.all([
        supabase.from('creative_clients').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!),
        supabase.from('creative_projects').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!).eq('status', 'active'),
        supabase.from('creative_opportunities').select('stage, value_cents, currency').eq('organization_id', orgId!),
      ]);

      const opps = oppsRes.data ?? [];
      const openStages = ['lead', 'qualified', 'proposal', 'negotiation'];
      const pipelineValueCents = opps
        .filter((o) => openStages.includes(o.stage))
        .reduce((sum, o) => sum + (o.value_cents ?? 0), 0);

      const won = opps.filter((o) => o.stage === 'won').length;
      const lost = opps.filter((o) => o.stage === 'lost').length;
      const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0;

      const stageBreakdown: Record<string, number> = {};
      opps.forEach((o) => { stageBreakdown[o.stage] = (stageBreakdown[o.stage] ?? 0) + 1; });

      return {
        totalClients: clientsRes.count ?? 0,
        activeProjects: projectsRes.count ?? 0,
        pipelineValueCents,
        pipelineCurrency: 'USD',
        winRate,
        stageBreakdown,
      };
    },
  });
}
```

**Step 2: Update `src/pages/creative/CreativeDashboard.tsx`** to use `useCreativeDashboard()` hook:
- Replace hardcoded `"—"` values with live data
- Format pipeline value as currency
- Show win rate as percentage
- Add stage breakdown as simple bar/badges

**Step 3: Run tests, commit**

```bash
git add src/hooks/useCreativeDashboard.ts src/pages/creative/CreativeDashboard.tsx
git commit -m "feat(creative): add live dashboard KPIs with client count, active projects, pipeline value, win rate"
```

---

### Task 10: Final Integration — Run All Tests, Type-Check, Build

**Step 1: Run all tests**

```bash
npx vitest run
```
Expected: All tests pass.

**Step 2: Type-check**

```bash
npx tsc --noEmit
```
Expected: No type errors. If there are Supabase type issues (the auto-generated types may not include the new creative tables), use `as unknown as CreativeClientRow` casts as done in existing hooks.

**Step 3: Build**

```bash
npm run build
```
Expected: Build succeeds.

**Step 4: Push and deploy**

```bash
git push origin main
```
Expected: Vercel auto-deploys. CI passes (all tests green, build succeeds).

**Step 5: Final commit if any fixups needed**

```bash
git add -A
git commit -m "fix(creative): address type-check and build issues for Phase 1"
git push origin main
```
