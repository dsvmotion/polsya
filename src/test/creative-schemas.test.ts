import { describe, it, expect } from 'vitest';
import {
  clientSchema,
  projectSchema,
  opportunitySchema,
  contactSchema,
  portfolioSchema,
  styleAnalysisSchema,
  signalRuleSchema,
  enrichmentRecipeSchema,
} from '@/lib/creative-schemas';

describe('creative-schemas', () => {
  describe('clientSchema', () => {
    it('accepts valid client', () => {
      const result = clientSchema.safeParse({ name: 'Acme Corp' });
      expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
      const result = clientSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('rejects missing name', () => {
      const result = clientSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('accepts valid website URL', () => {
      const result = clientSchema.safeParse({ name: 'Acme', website: 'https://acme.com' });
      expect(result.success).toBe(true);
    });

    it('allows empty website string', () => {
      const result = clientSchema.safeParse({ name: 'Acme', website: '' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid website URL', () => {
      const result = clientSchema.safeParse({ name: 'Acme', website: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('defaults status to prospect', () => {
      const result = clientSchema.parse({ name: 'Acme' });
      expect(result.status).toBe('prospect');
    });
  });

  describe('projectSchema', () => {
    const valid = { name: 'Website Redesign', clientId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' };

    it('accepts valid project', () => {
      const result = projectSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects missing name', () => {
      const result = projectSchema.safeParse({ ...valid, name: '' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid clientId format', () => {
      const result = projectSchema.safeParse({ ...valid, clientId: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });

    it('rejects negative budget', () => {
      const result = projectSchema.safeParse({ ...valid, budgetCents: -100 });
      expect(result.success).toBe(false);
    });

    it('defaults status to draft', () => {
      const result = projectSchema.parse(valid);
      expect(result.status).toBe('draft');
    });
  });

  describe('opportunitySchema', () => {
    const valid = { title: 'Big Deal', clientId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' };

    it('accepts valid opportunity', () => {
      expect(opportunitySchema.safeParse(valid).success).toBe(true);
    });

    it('rejects empty title', () => {
      expect(opportunitySchema.safeParse({ ...valid, title: '' }).success).toBe(false);
    });

    it('rejects probability over 100', () => {
      expect(opportunitySchema.safeParse({ ...valid, probability: 150 }).success).toBe(false);
    });

    it('rejects negative value', () => {
      expect(opportunitySchema.safeParse({ ...valid, valueCents: -1 }).success).toBe(false);
    });

    it('defaults stage to lead', () => {
      expect(opportunitySchema.parse(valid).stage).toBe('lead');
    });
  });

  describe('contactSchema', () => {
    it('accepts valid contact', () => {
      expect(contactSchema.safeParse({ firstName: 'Jane' }).success).toBe(true);
    });

    it('rejects missing firstName', () => {
      expect(contactSchema.safeParse({ firstName: '' }).success).toBe(false);
    });

    it('accepts valid email', () => {
      expect(contactSchema.safeParse({ firstName: 'Jane', email: 'jane@example.com' }).success).toBe(true);
    });

    it('rejects invalid email', () => {
      expect(contactSchema.safeParse({ firstName: 'Jane', email: 'not-email' }).success).toBe(false);
    });

    it('allows empty email string', () => {
      expect(contactSchema.safeParse({ firstName: 'Jane', email: '' }).success).toBe(true);
    });

    it('defaults isDecisionMaker to false', () => {
      expect(contactSchema.parse({ firstName: 'Jane' }).isDecisionMaker).toBe(false);
    });

    it('defaults status to active', () => {
      expect(contactSchema.parse({ firstName: 'Jane' }).status).toBe('active');
    });
  });

  describe('portfolioSchema', () => {
    it('accepts valid portfolio', () => {
      expect(portfolioSchema.safeParse({ title: 'Brand Work' }).success).toBe(true);
    });

    it('rejects empty title', () => {
      expect(portfolioSchema.safeParse({ title: '' }).success).toBe(false);
    });

    it('defaults isPublic to false', () => {
      expect(portfolioSchema.parse({ title: 'Work' }).isPublic).toBe(false);
    });
  });

  describe('signalRuleSchema', () => {
    const valid = { name: 'New Hire Alert', conditions: '{"field":"title"}' };

    it('accepts valid rule', () => {
      expect(signalRuleSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects empty name', () => {
      expect(signalRuleSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
    });

    it('rejects empty conditions', () => {
      expect(signalRuleSchema.safeParse({ ...valid, conditions: '' }).success).toBe(false);
    });

    it('defaults isActive to true', () => {
      expect(signalRuleSchema.parse(valid).isActive).toBe(true);
    });

    it('defaults priority to 0', () => {
      expect(signalRuleSchema.parse(valid).priority).toBe(0);
    });
  });

  describe('enrichmentRecipeSchema', () => {
    const valid = { name: 'LinkedIn Enrichment', steps: '{"provider":"linkedin"}' };

    it('accepts valid recipe', () => {
      expect(enrichmentRecipeSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects empty name', () => {
      expect(enrichmentRecipeSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
    });

    it('rejects empty steps', () => {
      expect(enrichmentRecipeSchema.safeParse({ ...valid, steps: '' }).success).toBe(false);
    });

    it('defaults isActive to true', () => {
      expect(enrichmentRecipeSchema.parse(valid).isActive).toBe(true);
    });
  });
});
