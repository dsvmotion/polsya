import type {
  ActivityType,
  ContactRole,
  OpportunityStage,
  Pharmacy,
  PharmacyActivity,
  PharmacyContact,
  PharmacyOpportunity,
  PharmacyStatus,
} from '@/types/pharmacy';

export type EntityStatus = PharmacyStatus;

// Configurable per workspace in ARCH-03B. For now we keep legacy compatibility.
export type EntityTypeKey = string;

export interface BusinessEntity {
  id: string;
  entityTypeId: string | null;
  externalId: string | null;
  name: string;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  lat: number;
  lng: number;
  status: EntityStatus;
  typeKey: EntityTypeKey;
  notes: string | null;
  sourceData: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  savedAt: string | null;
  attributes: {
    postalCode?: string | null;
    autonomousCommunity?: string | null;
    secondaryPhone?: string | null;
    activity?: string | null;
    subsector?: string | null;
    legalForm?: string | null;
    subLocality?: string | null;
    openingHours?: string[] | null;
  };
}

export interface AccountContact {
  id: string;
  entityId: string;
  name: string;
  role: ContactRole | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountActivity {
  id: string;
  entityId: string;
  activityType: ActivityType;
  title: string;
  description: string | null;
  dueAt: string | null;
  completedAt: string | null;
  owner: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountOpportunity {
  id: string;
  entityId: string;
  title: string;
  stage: OpportunityStage;
  amount: number;
  probability: number;
  expectedCloseDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EntityTypeDefinition {
  id: string;
  organizationId: string | null;
  key: string;
  label: string;
  color: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type LegacyEntityRow = Pharmacy;
export type LegacyAccountContactRow = PharmacyContact;
export type LegacyAccountActivityRow = PharmacyActivity;
export type LegacyAccountOpportunityRow = PharmacyOpportunity;
