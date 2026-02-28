import type { AccountContact } from '@/types/entity';
import type { PharmacyContact } from '@/types/pharmacy';

export function toAccountContact(row: PharmacyContact): AccountContact {
  return {
    id: row.id,
    entityId: row.pharmacy_id,
    name: row.name,
    role: row.role,
    email: row.email,
    phone: row.phone,
    isPrimary: row.is_primary,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toAccountContacts(rows: readonly PharmacyContact[]): AccountContact[] {
  return rows.map(toAccountContact);
}
