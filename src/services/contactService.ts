import type { AccountContact, ContactRole } from '@/types/entity';

export interface ContactRow {
  id: string;
  pharmacy_id: string;
  name: string;
  role: ContactRole | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function toAccountContact(row: ContactRow): AccountContact {
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

export function toAccountContacts(rows: readonly ContactRow[]): AccountContact[] {
  return rows.map(toAccountContact);
}
