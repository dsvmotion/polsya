import type { Pharmacy } from '@/types/pharmacy';
import type { BusinessEntity } from '@/types/entity';

export function toBusinessEntity(pharmacy: Pharmacy): BusinessEntity {
  return {
    id: pharmacy.id,
    entityTypeId: pharmacy.entity_type_id ?? null,
    externalId: pharmacy.google_place_id,
    name: pharmacy.name,
    address: pharmacy.address,
    city: pharmacy.city,
    region: pharmacy.province,
    country: pharmacy.country,
    phone: pharmacy.phone,
    email: pharmacy.email,
    website: pharmacy.website,
    lat: pharmacy.lat,
    lng: pharmacy.lng,
    status: pharmacy.commercial_status,
    typeKey: pharmacy.client_type,
    notes: pharmacy.notes,
    sourceData: pharmacy.google_data,
    createdAt: pharmacy.created_at,
    updatedAt: pharmacy.updated_at,
    savedAt: pharmacy.saved_at,
    attributes: {
      postalCode: pharmacy.postal_code ?? null,
      autonomousCommunity: pharmacy.autonomous_community ?? null,
      secondaryPhone: pharmacy.secondary_phone ?? null,
      activity: pharmacy.activity ?? null,
      subsector: pharmacy.subsector ?? null,
      legalForm: pharmacy.legal_form ?? null,
      subLocality: pharmacy.sub_locality ?? null,
      openingHours: pharmacy.opening_hours ?? null,
    },
  };
}

export function toBusinessEntities(pharmacies: readonly Pharmacy[]): BusinessEntity[] {
  return pharmacies.map(toBusinessEntity);
}

export function toLegacyPharmacyPatch(
  patch: Partial<Pick<BusinessEntity, 'status' | 'notes' | 'email' | 'phone' | 'website'>>,
): Partial<Pick<Pharmacy, 'commercial_status' | 'notes' | 'email' | 'phone' | 'website'>> {
  const legacyPatch: Partial<Pick<Pharmacy, 'commercial_status' | 'notes' | 'email' | 'phone' | 'website'>> = {};

  if (patch.status !== undefined) legacyPatch.commercial_status = patch.status;
  if (patch.notes !== undefined) legacyPatch.notes = patch.notes;
  if (patch.email !== undefined) legacyPatch.email = patch.email;
  if (patch.phone !== undefined) legacyPatch.phone = patch.phone;
  if (patch.website !== undefined) legacyPatch.website = patch.website;

  return legacyPatch;
}
