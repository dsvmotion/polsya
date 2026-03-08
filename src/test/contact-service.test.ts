import { describe, it, expect } from 'vitest';
import {
  toAccountContact,
  toAccountContacts,
  type ContactRow,
} from '@/services/contactService';

const makeRow = (overrides: Partial<ContactRow> = {}): ContactRow => ({
  id: 'c-1',
  pharmacy_id: 'ph-1',
  name: 'Jane Doe',
  role: 'owner',
  email: 'jane@pharmacy.com',
  phone: '+34 600 123 456',
  is_primary: true,
  notes: 'Primary contact',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

describe('contactService', () => {
  describe('toAccountContact', () => {
    it('maps all fields from snake_case to camelCase', () => {
      const result = toAccountContact(makeRow());
      expect(result).toEqual({
        id: 'c-1',
        entityId: 'ph-1',
        name: 'Jane Doe',
        role: 'owner',
        email: 'jane@pharmacy.com',
        phone: '+34 600 123 456',
        isPrimary: true,
        notes: 'Primary contact',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      });
    });

    it('handles null optional fields', () => {
      const result = toAccountContact(
        makeRow({ role: null, email: null, phone: null, notes: null }),
      );
      expect(result.role).toBeNull();
      expect(result.email).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.notes).toBeNull();
    });

    it('maps is_primary correctly', () => {
      expect(toAccountContact(makeRow({ is_primary: false })).isPrimary).toBe(false);
      expect(toAccountContact(makeRow({ is_primary: true })).isPrimary).toBe(true);
    });
  });

  describe('toAccountContacts', () => {
    it('maps an array of rows', () => {
      const rows = [makeRow({ id: 'c1' }), makeRow({ id: 'c2' })];
      const result = toAccountContacts(rows);
      expect(result).toHaveLength(2);
      expect(result.map((c) => c.id)).toEqual(['c1', 'c2']);
    });

    it('returns empty array for empty input', () => {
      expect(toAccountContacts([])).toEqual([]);
    });
  });
});
