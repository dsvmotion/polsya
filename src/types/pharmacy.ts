/**
 * @deprecated Import from '@/types/entity' instead.
 * This file re-exports entity types for backward compatibility during migration.
 */
export {
  type EntityStatus as PharmacyStatus,
  type EntityTypeKey,
  type ContactRole,
  CONTACT_ROLE_LABELS,
  type ActivityType,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_ICONS,
  type OpportunityStage,
  OPPORTUNITY_STAGE_LABELS,
  OPPORTUNITY_STAGE_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  WOOCOMMERCE_CUSTOMER_COLOR,
  type BusinessEntity as Pharmacy,
  type AccountContact as PharmacyContact,
  type AccountActivity as PharmacyActivity,
  type AccountOpportunity as PharmacyOpportunity,
  type EntityFilters as PharmacyFilters,
  EUROPEAN_COUNTRIES,
  SPANISH_CITIES,
} from '@/types/entity';

/** @deprecated Use EntityTypeKey instead */
export type ClientType = string;

/** @deprecated Use entity types from useEntityTypes() instead */
export const CLIENT_TYPE_LABELS: Record<string, string> = {
  pharmacy: 'Pharmacy',
  herbalist: 'Herbalist',
};
