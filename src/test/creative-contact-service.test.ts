import { describe, it, expect } from 'vitest';
import {
  toCreativeContact,
  toCreativeContacts,
  type CreativeContactRow,
} from '@/services/creativeContactService';

const makeRow = (o: Partial<CreativeContactRow> = {}): CreativeContactRow => ({
  id: 'ct-1',
  organization_id: 'org-1',
  client_id: 'cl-1',
  first_name: 'Alice',
  last_name: 'Johnson',
  email: 'alice@example.com',
  phone: '+1 555 1234',
  title: 'Creative Director',
  role: 'lead',
  linkedin_url: 'https://linkedin.com/in/alice',
  avatar_url: 'https://example.com/alice.jpg',
  is_decision_maker: true,
  status: 'active',
  tags: ['vip'],
  metadata: {},
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...o,
});

describe('creativeContactService', () => {
  describe('toCreativeContact', () => {
    it('maps all fields from snake_case to camelCase', () => {
      const result = toCreativeContact(makeRow());
      expect(result.id).toBe('ct-1');
      expect(result.organizationId).toBe('org-1');
      expect(result.clientId).toBe('cl-1');
      expect(result.firstName).toBe('Alice');
      expect(result.lastName).toBe('Johnson');
      expect(result.email).toBe('alice@example.com');
      expect(result.phone).toBe('+1 555 1234');
      expect(result.title).toBe('Creative Director');
      expect(result.role).toBe('lead');
      expect(result.linkedinUrl).toBe('https://linkedin.com/in/alice');
      expect(result.avatarUrl).toBe('https://example.com/alice.jpg');
      expect(result.isDecisionMaker).toBe(true);
      expect(result.status).toBe('active');
      expect(result.tags).toEqual(['vip']);
    });

    it('handles null optional fields', () => {
      const result = toCreativeContact(
        makeRow({
          client_id: null,
          last_name: null,
          email: null,
          phone: null,
          title: null,
          role: null,
          linkedin_url: null,
          avatar_url: null,
        }),
      );
      expect(result.clientId).toBeNull();
      expect(result.lastName).toBeNull();
      expect(result.email).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.title).toBeNull();
      expect(result.role).toBeNull();
      expect(result.linkedinUrl).toBeNull();
      expect(result.avatarUrl).toBeNull();
    });

    it('defaults nullish is_decision_maker to false', () => {
      const row = makeRow();
      (row as unknown as Record<string, unknown>).is_decision_maker = null;
      expect(toCreativeContact(row).isDecisionMaker).toBe(false);
    });

    it('defaults nullish tags/metadata to empty', () => {
      const row = makeRow();
      (row as unknown as Record<string, unknown>).tags = null;
      (row as unknown as Record<string, unknown>).metadata = null;
      const result = toCreativeContact(row);
      expect(result.tags).toEqual([]);
      expect(result.metadata).toEqual({});
    });
  });

  describe('toCreativeContacts', () => {
    it('maps array', () => {
      const result = toCreativeContacts([makeRow({ id: 'a' }), makeRow({ id: 'b' })]);
      expect(result).toHaveLength(2);
    });

    it('returns empty for empty input', () => {
      expect(toCreativeContacts([])).toEqual([]);
    });
  });
});
