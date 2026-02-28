export type PharmacyStatus = 'not_contacted' | 'contacted' | 'qualified' | 'proposal' | 'client' | 'retained' | 'lost';

export type ClientType = 'pharmacy' | 'herbalist';

export interface Pharmacy {
  id: string;
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
  commercial_status: PharmacyStatus;
  notes: string | null;
  google_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  client_type: ClientType;
  saved_at: string | null;
  postal_code?: string | null;
  autonomous_community?: string | null;
  secondary_phone?: string | null;
  activity?: string | null;
  subsector?: string | null;
  legal_form?: string | null;
  sub_locality?: string | null;
}

export type ContactRole = 'owner' | 'buyer' | 'finance' | 'other';

export const CONTACT_ROLE_LABELS: Record<ContactRole, string> = {
  owner: 'Owner',
  buyer: 'Buyer',
  finance: 'Finance',
  other: 'Other',
};

export interface PharmacyContact {
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

export type ActivityType = 'call' | 'email' | 'visit' | 'note' | 'task';

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: 'Call',
  email: 'Email',
  visit: 'Visit',
  note: 'Note',
  task: 'Task',
};

export const ACTIVITY_TYPE_ICONS: Record<ActivityType, string> = {
  call: '📞',
  email: '✉️',
  visit: '🏢',
  note: '📝',
  task: '✅',
};

export interface PharmacyActivity {
  id: string;
  pharmacy_id: string;
  activity_type: ActivityType;
  title: string;
  description: string | null;
  due_at: string | null;
  completed_at: string | null;
  owner: string | null;
  created_at: string;
  updated_at: string;
}

export type OpportunityStage = 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export const OPPORTUNITY_STAGE_LABELS: Record<OpportunityStage, string> = {
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

export const OPPORTUNITY_STAGE_COLORS: Record<OpportunityStage, { bg: string; text: string }> = {
  qualified: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  proposal: { bg: 'bg-purple-100', text: 'text-purple-800' },
  negotiation: { bg: 'bg-amber-100', text: 'text-amber-800' },
  won: { bg: 'bg-green-100', text: 'text-green-800' },
  lost: { bg: 'bg-red-100', text: 'text-red-800' },
};

export interface PharmacyOpportunity {
  id: string;
  pharmacy_id: string;
  title: string;
  stage: OpportunityStage;
  amount: number;
  probability: number;
  expected_close_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PharmacyFilters {
  city: string;
  province: string;
  country: string;
  status: PharmacyStatus | 'all';
  search: string;
}

export const STATUS_LABELS: Record<PharmacyStatus, string> = {
  not_contacted: 'Not Contacted',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  client: 'Client',
  retained: 'Retained',
  lost: 'Lost',
};

export const STATUS_COLORS: Record<PharmacyStatus, { bg: string; text: string; pin: string }> = {
  not_contacted: { bg: 'bg-yellow-100', text: 'text-yellow-800', pin: '#eab308' },
  contacted: { bg: 'bg-blue-100', text: 'text-blue-800', pin: '#3b82f6' },
  qualified: { bg: 'bg-indigo-100', text: 'text-indigo-800', pin: '#6366f1' },
  proposal: { bg: 'bg-purple-100', text: 'text-purple-800', pin: '#a855f7' },
  client: { bg: 'bg-green-100', text: 'text-green-800', pin: '#22c55e' },
  retained: { bg: 'bg-teal-100', text: 'text-teal-800', pin: '#14b8a6' },
  lost: { bg: 'bg-red-100', text: 'text-red-800', pin: '#ef4444' },
};

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  pharmacy: 'Pharmacy',
  herbalist: 'Herbalist',
};

// WooCommerce-only customer color (not matched to pharmacy)
export const WOOCOMMERCE_CUSTOMER_COLOR = {
  bg: 'bg-violet-100',
  text: 'text-violet-800',
  pin: '#8b5cf6', // Violet
};

export const EUROPEAN_COUNTRIES = [
  'Spain', 'France', 'Germany', 'Italy', 'Portugal', 'United Kingdom',
  'Netherlands', 'Belgium', 'Austria', 'Switzerland', 'Poland', 'Greece',
  'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland', 'Czech Republic',
  'Hungary', 'Romania', 'Bulgaria', 'Croatia', 'Slovakia', 'Slovenia',
] as const;

export const SPANISH_CITIES = [
  { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
  { name: 'Barcelona', lat: 41.3851, lng: 2.1734 },
  { name: 'Valencia', lat: 39.4699, lng: -0.3763 },
  { name: 'Seville', lat: 37.3891, lng: -5.9845 },
  { name: 'Bilbao', lat: 43.263, lng: -2.935 },
  { name: 'Málaga', lat: 36.7213, lng: -4.4214 },
  { name: 'Zaragoza', lat: 41.6488, lng: -0.8891 },
  { name: 'Murcia', lat: 37.9922, lng: -1.1307 },
  { name: 'Palma', lat: 39.5696, lng: 2.6502 },
  { name: 'Las Palmas', lat: 28.1235, lng: -15.4366 },
] as const;
