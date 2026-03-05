// src/lib/creative-schemas.ts
// Zod schemas for creative entity form validation.

import { z } from 'zod';
import { CLIENT_STATUSES, CLIENT_SIZES, PROJECT_STATUSES, OPPORTUNITY_STAGES, CONTACT_STATUSES } from '@/types/creative';

export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  website: z.string().url('Invalid URL').or(z.literal('')).optional(),
  industry: z.string().optional(),
  subIndustry: z.string().optional(),
  sizeCategory: z.enum(CLIENT_SIZES).optional(),
  status: z.enum(CLIENT_STATUSES).default('prospect'),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

// clientId is required in forms — the DB allows null only for cascading deletes.
export const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  clientId: z.string().uuid('Select a client'),
  projectType: z.string().optional(),
  status: z.enum(PROJECT_STATUSES).default('draft'),
  budgetCents: z.number().int().nonnegative('Budget cannot be negative').optional(),
  currency: z.string().default('USD'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

// clientId is required in forms — the DB allows null only for cascading deletes.
export const opportunitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  clientId: z.string().uuid('Select a client'),
  contactId: z.string().uuid().optional(),
  stage: z.enum(OPPORTUNITY_STAGES).default('lead'),
  valueCents: z.number().int().nonnegative('Value cannot be negative').optional(),
  currency: z.string().default('USD'),
  probability: z.number().int().min(0).max(100, 'Probability must be 0-100').optional(),
  expectedCloseDate: z.string().optional(),
  description: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type OpportunityFormValues = z.infer<typeof opportunitySchema>;

export const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  role: z.string().optional(),
  clientId: z.string().uuid('Select a client').optional(),
  linkedinUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
  isDecisionMaker: z.boolean().default(false),
  status: z.enum(CONTACT_STATUSES).default('active'),
  tags: z.array(z.string()).optional(),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
