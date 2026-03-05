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
