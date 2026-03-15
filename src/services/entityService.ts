import type { BusinessEntity } from '@/types/entity';

/**
 * Loose row shape accepted by toBusinessEntity.
 * Intentionally uses Record<string, unknown> so that both the hand-typed
 * EntityRow and Supabase-generated row types satisfy it without `as never`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EntityRowLike = Record<string, any>;

interface EntityRow {
  id: string;
  organization_id?: string;
  entity_type_id?: string | null;
  google_place_id: string | null;
  name: string;
  address: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  opening_hours: string[] | null;
  lat: number;
  lng: number;
  commercial_status: string;
  notes: string | null;
  google_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  client_type: string;
  saved_at: string | null;
  postal_code?: string | null;
  autonomous_community?: string | null;
  secondary_phone?: string | null;
  activity?: string | null;
  subsector?: string | null;
  legal_form?: string | null;
  sub_locality?: string | null;
}

export function toBusinessEntity(row: EntityRow | EntityRowLike): BusinessEntity {
  return {
    id: row.id,
    entityTypeId: row.entity_type_id ?? null,
    externalId: row.google_place_id,
    name: row.name,
    address: row.address,
    city: row.city,
    region: row.province,
    country: row.country,
    phone: row.phone,
    email: row.email,
    website: row.website,
    lat: row.lat,
    lng: row.lng,
    status: row.commercial_status as BusinessEntity['status'],
    typeKey: row.client_type,
    notes: row.notes,
    sourceData: row.google_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    savedAt: row.saved_at,
    attributes: {
      postalCode: row.postal_code ?? null,
      autonomousCommunity: row.autonomous_community ?? null,
      secondaryPhone: row.secondary_phone ?? null,
      activity: row.activity ?? null,
      subsector: row.subsector ?? null,
      legalForm: row.legal_form ?? null,
      subLocality: row.sub_locality ?? null,
      openingHours: row.opening_hours ?? null,
    },
  };
}

export function toBusinessEntities(rows: readonly (EntityRow | EntityRowLike)[]): BusinessEntity[] {
  return rows.map(toBusinessEntity);
}

export function toLegacyPatch(
  patch: Partial<Pick<BusinessEntity, 'status' | 'notes' | 'email' | 'phone' | 'website'>>,
): Record<string, unknown> {
  const legacyPatch: Record<string, unknown> = {};

  if (patch.status !== undefined) legacyPatch.commercial_status = patch.status;
  if (patch.notes !== undefined) legacyPatch.notes = patch.notes;
  if (patch.email !== undefined) legacyPatch.email = patch.email;
  if (patch.phone !== undefined) legacyPatch.phone = patch.phone;
  if (patch.website !== undefined) legacyPatch.website = patch.website;

  return legacyPatch;
}

/** @deprecated Use toLegacyPatch */
export const toLegacyPharmacyPatch = toLegacyPatch;
