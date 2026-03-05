import type { CreativeContact, ContactStatus } from '@/types/creative';

export interface CreativeContactRow {
  id: string;
  organization_id: string;
  client_id: string | null;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  role: string | null;
  linkedin_url: string | null;
  avatar_url: string | null;
  is_decision_maker: boolean;
  status: string;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function toCreativeContact(row: CreativeContactRow): CreativeContact {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    title: row.title,
    role: row.role,
    linkedinUrl: row.linkedin_url,
    avatarUrl: row.avatar_url,
    isDecisionMaker: row.is_decision_maker ?? false,
    status: row.status as ContactStatus,
    tags: row.tags ?? [],
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toCreativeContacts(rows: readonly CreativeContactRow[]): CreativeContact[] {
  return rows.map(toCreativeContact);
}
