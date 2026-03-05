// src/test/creative-types.test.ts
import { describe, it, expect } from 'vitest';
import { clientSchema, projectSchema, opportunitySchema } from '@/lib/creative-schemas';
import {
  CLIENT_STATUSES,
  CLIENT_SIZES,
  PROJECT_STATUSES,
  OPPORTUNITY_STAGES,
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

  it('const arrays match label map keys', () => {
    expect([...CLIENT_STATUSES]).toEqual(Object.keys(CLIENT_STATUS_LABELS));
    expect([...CLIENT_SIZES]).toEqual(Object.keys(CLIENT_SIZE_LABELS));
    expect([...PROJECT_STATUSES]).toEqual(Object.keys(PROJECT_STATUS_LABELS));
    expect([...OPPORTUNITY_STAGES]).toEqual(Object.keys(OPPORTUNITY_STAGE_LABELS));
  });
});
