// src/types/creative.ts
// Domain types for the Creative CRM — Clients, Projects, Opportunities.
// Matches DB tables in 20260309100000_creative_domain_core.sql.

// ─── Client ──────────────────────────────────

export const CLIENT_STATUSES = ['prospect', 'active', 'inactive', 'archived'] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

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

export const CLIENT_SIZES = ['solo', 'small', 'medium', 'large', 'enterprise'] as const;
export type ClientSize = (typeof CLIENT_SIZES)[number];

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

export const PROJECT_STATUSES = ['draft', 'active', 'on_hold', 'completed', 'cancelled'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

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

export const OPPORTUNITY_STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

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

// ─── Contact ────────────────────────────────

export const CONTACT_STATUSES = ['active', 'inactive', 'archived'] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  archived: 'Archived',
};

export const CONTACT_STATUS_COLORS: Record<ContactStatus, { bg: string; text: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-800' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-800' },
  archived: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

export interface CreativeContact {
  id: string;
  organizationId: string;
  clientId: string | null;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  role: string | null;
  linkedinUrl: string | null;
  avatarUrl: string | null;
  isDecisionMaker: boolean;
  status: ContactStatus;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Portfolio ──────────────────────────────

export const PORTFOLIO_CATEGORIES = ['branding', 'web_design', 'illustration', 'photography', 'motion', 'print', 'packaging', 'other'] as const;
export type PortfolioCategory = (typeof PORTFOLIO_CATEGORIES)[number];

export const PORTFOLIO_CATEGORY_LABELS: Record<PortfolioCategory, string> = {
  branding: 'Branding',
  web_design: 'Web Design',
  illustration: 'Illustration',
  photography: 'Photography',
  motion: 'Motion',
  print: 'Print',
  packaging: 'Packaging',
  other: 'Other',
};

export const PORTFOLIO_CATEGORY_COLORS: Record<PortfolioCategory, { bg: string; text: string }> = {
  branding: { bg: 'bg-purple-100', text: 'text-purple-800' },
  web_design: { bg: 'bg-blue-100', text: 'text-blue-800' },
  illustration: { bg: 'bg-pink-100', text: 'text-pink-800' },
  photography: { bg: 'bg-amber-100', text: 'text-amber-800' },
  motion: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  print: { bg: 'bg-orange-100', text: 'text-orange-800' },
  packaging: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  other: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

export interface CreativePortfolio {
  id: string;
  organizationId: string;
  projectId: string | null;
  clientId: string | null;
  title: string;
  description: string | null;
  category: PortfolioCategory | null;
  mediaUrls: string[];
  thumbnailUrl: string | null;
  isPublic: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
