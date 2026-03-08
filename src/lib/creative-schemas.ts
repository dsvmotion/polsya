// src/lib/creative-schemas.ts
// Zod schemas for creative entity form validation.

import { z } from 'zod';
import { CLIENT_STATUSES, CLIENT_SIZES, PROJECT_STATUSES, OPPORTUNITY_STAGES, CONTACT_STATUSES, PORTFOLIO_CATEGORIES } from '@/types/creative';
import { RULE_TYPES } from '@/types/signal-engine';
import { RECIPE_TARGET_TYPES } from '@/types/enrichment-engine';

export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  website: z.string().url('Invalid URL').max(2048).or(z.literal('')).optional(),
  industry: z.string().max(100).optional(),
  subIndustry: z.string().max(100).optional(),
  sizeCategory: z.enum(CLIENT_SIZES).optional(),
  status: z.enum(CLIENT_STATUSES).default('prospect'),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).max(30).optional(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

// clientId is required in forms — the DB allows null only for cascading deletes.
export const projectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  clientId: z.string().uuid('Select a client'),
  projectType: z.string().max(100).optional(),
  status: z.enum(PROJECT_STATUSES).default('draft'),
  budgetCents: z.number().int().nonnegative('Budget cannot be negative').optional(),
  currency: z.string().max(10).default('USD'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).max(30).optional(),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

// clientId is required in forms — the DB allows null only for cascading deletes.
export const opportunitySchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  clientId: z.string().uuid('Select a client'),
  contactId: z.string().uuid().optional(),
  stage: z.enum(OPPORTUNITY_STAGES).default('lead'),
  valueCents: z.number().int().nonnegative('Value cannot be negative').optional(),
  currency: z.string().max(10).default('USD'),
  probability: z.number().int().min(0).max(100, 'Probability must be 0-100').optional(),
  expectedCloseDate: z.string().optional(),
  description: z.string().max(5000).optional(),
  source: z.string().max(255).optional(),
  tags: z.array(z.string().max(50)).max(30).optional(),
});

export type OpportunityFormValues = z.infer<typeof opportunitySchema>;

export const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'Name is too long'),
  lastName: z.string().max(100).optional(),
  email: z.string().email('Invalid email').max(320).or(z.literal('')).optional(),
  phone: z.string().max(30).optional(),
  title: z.string().max(255).optional(),
  role: z.string().max(100).optional(),
  clientId: z.string().uuid('Select a client').optional(),
  linkedinUrl: z.string().url('Invalid URL').max(2048).or(z.literal('')).optional(),
  isDecisionMaker: z.boolean().default(false),
  status: z.enum(CONTACT_STATUSES).default('active'),
  tags: z.array(z.string().max(50)).max(30).optional(),
});

export type ContactFormValues = z.infer<typeof contactSchema>;

export const portfolioSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().max(5000).optional(),
  category: z.enum(PORTFOLIO_CATEGORIES).optional(),
  mediaUrls: z.string().max(10000).optional(), // Comma-separated URLs for MVP
  thumbnailUrl: z.string().url('Invalid URL').max(2048).or(z.literal('')).optional(),
  isPublic: z.boolean().default(false),
  projectId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  tags: z.array(z.string().max(50)).max(30).optional(),
});

export type PortfolioFormValues = z.infer<typeof portfolioSchema>;

export const styleAnalysisSchema = z.object({
  clientId: z.string().uuid().optional(),
  portfolioId: z.string().uuid().optional(),
  sourceUrl: z.string().url('Invalid URL').max(2048).or(z.literal('')).optional(),
  colorPalette: z.string().max(10000).optional(), // JSON string for MVP
  typographyProfile: z.string().max(10000).optional(), // JSON string for MVP
  brandAttributes: z.string().max(10000).optional(), // JSON string for MVP
});

export type StyleAnalysisFormValues = z.infer<typeof styleAnalysisSchema>;

export const signalRuleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  description: z.string().max(2000).optional(),
  ruleType: z.enum(RULE_TYPES).default('custom'),
  conditions: z.string().min(1, 'Conditions JSON is required').max(10000),
  actions: z.string().max(10000).optional(),
  priority: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type SignalRuleFormValues = z.infer<typeof signalRuleSchema>;

export const enrichmentRecipeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  description: z.string().max(2000).optional(),
  targetEntityType: z.enum(RECIPE_TARGET_TYPES).default('client'),
  steps: z.string().min(1, 'Steps JSON is required').max(10000),
  isActive: z.boolean().default(true),
});

export type EnrichmentRecipeFormValues = z.infer<typeof enrichmentRecipeSchema>;
