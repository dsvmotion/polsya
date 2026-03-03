import {
  toBusinessEntity,
  toBusinessEntities,
  toLegacyPatch,
} from '@/services/entityService';
import { toAccountActivities } from '@/services/activityService';
import { toAccountContacts } from '@/services/contactService';
import { toAccountOpportunities } from '@/services/opportunityService';
import type { ContactRow } from '@/services/contactService';
import type { ActivityRow } from '@/services/activityService';
import type { OpportunityRow } from '@/services/opportunityService';

describe('entityService', () => {
  const entityRow = {
    id: 'p1',
    google_place_id: 'g-1',
    name: 'Farmacia Central',
    address: 'Main St 1',
    city: 'Madrid',
    province: 'Madrid',
    country: 'Spain',
    phone: '123',
    email: 'a@b.com',
    website: 'https://example.com',
    opening_hours: ['Mon-Fri 9-18'],
    lat: 40.4,
    lng: -3.7,
    commercial_status: 'client',
    notes: 'note',
    google_data: { source: 'google' },
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-02T00:00:00.000Z',
    client_type: 'pharmacy',
    saved_at: '2026-01-03T00:00:00.000Z',
    postal_code: '28001',
    autonomous_community: 'Comunidad de Madrid',
    secondary_phone: null,
    activity: 'Retail',
    subsector: 'Health',
    legal_form: 'SL',
    sub_locality: null,
  };

  it('maps entity row to BusinessEntity', () => {
    const entity = toBusinessEntity(entityRow);

    expect(entity.id).toBe('p1');
    expect(entity.externalId).toBe('g-1');
    expect(entity.region).toBe('Madrid');
    expect(entity.status).toBe('client');
    expect(entity.typeKey).toBe('pharmacy');
    expect(entity.attributes.postalCode).toBe('28001');
  });

  it('maps list of entity rows', () => {
    const list = toBusinessEntities([entityRow]);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Farmacia Central');
  });

  it('maps business patch to legacy DB patch', () => {
    const patch = toLegacyPatch({
      status: 'proposal',
      notes: 'updated',
      email: 'new@example.com',
      phone: '999',
      website: 'https://new.com',
    });

    expect(patch).toEqual({
      commercial_status: 'proposal',
      notes: 'updated',
      email: 'new@example.com',
      phone: '999',
      website: 'https://new.com',
    });
  });
});

describe('account adapters', () => {
  it('maps contacts/activities/opportunities to account models', () => {
    const contacts: ContactRow[] = [{
      id: 'c1',
      pharmacy_id: 'p1',
      name: 'John',
      role: 'owner',
      email: 'john@example.com',
      phone: '111',
      is_primary: true,
      notes: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    }];

    const activities: ActivityRow[] = [{
      id: 'a1',
      pharmacy_id: 'p1',
      activity_type: 'task',
      title: 'Follow up',
      description: null,
      due_at: null,
      completed_at: null,
      owner: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    }];

    const opportunities: OpportunityRow[] = [{
      id: 'o1',
      pharmacy_id: 'p1',
      title: 'Deal',
      stage: 'qualified',
      amount: 1000,
      probability: 50,
      expected_close_date: null,
      notes: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    }];

    const mappedContacts = toAccountContacts(contacts);
    const mappedActivities = toAccountActivities(activities);
    const mappedOpps = toAccountOpportunities(opportunities);

    expect(mappedContacts[0].entityId).toBe('p1');
    expect(mappedActivities[0].activityType).toBe('task');
    expect(mappedOpps[0].expectedCloseDate).toBeNull();
  });
});
