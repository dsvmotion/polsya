import type { SmartSegmentKey } from '@/types/operations';

export type IndustryTemplateKey =
  | 'general_b2b'
  | 'pharmacy_retail'
  | 'wellness_herbal'
  | 'dental_clinic'
  | 'veterinary_clinic'
  | 'beauty_wellness';

export interface IndustryTemplateDefinition {
  key: IndustryTemplateKey;
  label: string;
  description: string;
  defaults: {
    entityLabelSingular: string;
    entityLabelPlural: string;
    currency: string;
    locale: string;
    timezone: string;
  };
  importAliases: Record<string, string>;
  smartSegmentLabels: Partial<Record<SmartSegmentKey, string>>;
}

const TEMPLATES: Record<IndustryTemplateKey, IndustryTemplateDefinition> = {
  general_b2b: {
    key: 'general_b2b',
    label: 'General B2B',
    description: 'Generic account-based sales workflow for any B2B business.',
    defaults: {
      entityLabelSingular: 'Account',
      entityLabelPlural: 'Accounts',
      currency: 'EUR',
      locale: 'es-ES',
      timezone: 'Europe/Madrid',
    },
    importAliases: {
      company: 'name',
      business: 'name',
      account: 'name',
      'account name': 'name',
      'company name': 'name',
      state: 'province',
      region: 'province',
      'zip code': 'postal_code',
      zipcode: 'postal_code',
    },
    smartSegmentLabels: {
      none: 'All accounts',
      at_risk: 'At-risk accounts',
      no_orders_client: 'Customer with no orders',
      payment_failed: 'Payment failed',
      no_recent_orders_60d: 'No orders 60+ days',
    },
  },
  pharmacy_retail: {
    key: 'pharmacy_retail',
    label: 'Pharmacy Retail',
    description: 'Pharmacy-oriented terminology and import aliases.',
    defaults: {
      entityLabelSingular: 'Pharmacy',
      entityLabelPlural: 'Pharmacies',
      currency: 'EUR',
      locale: 'es-ES',
      timezone: 'Europe/Madrid',
    },
    importAliases: {
      farmacia: 'name',
      'nombre farmacia': 'name',
      nif: 'legal_form',
    },
    smartSegmentLabels: {
      none: 'All pharmacies',
      at_risk: 'At-risk pharmacies',
      no_orders_client: 'Client pharmacy with no orders',
    },
  },
  wellness_herbal: {
    key: 'wellness_herbal',
    label: 'Wellness / Herbal',
    description: 'Wellness stores, herbalists, and natural products teams.',
    defaults: {
      entityLabelSingular: 'Herbalist',
      entityLabelPlural: 'Herbalists',
      currency: 'EUR',
      locale: 'es-ES',
      timezone: 'Europe/Madrid',
    },
    importAliases: {
      herbolario: 'name',
      'tienda natural': 'name',
      wellness: 'subsector',
    },
    smartSegmentLabels: {
      none: 'All wellness accounts',
      at_risk: 'At-risk wellness accounts',
    },
  },
  dental_clinic: {
    key: 'dental_clinic',
    label: 'Dental Clinics',
    description: 'Dental practices and clinic sales pipelines.',
    defaults: {
      entityLabelSingular: 'Clinic',
      entityLabelPlural: 'Clinics',
      currency: 'EUR',
      locale: 'en-GB',
      timezone: 'Europe/London',
    },
    importAliases: {
      clinic: 'name',
      'clinic name': 'name',
      practice: 'name',
      dentist: 'activity',
    },
    smartSegmentLabels: {
      none: 'All clinics',
      at_risk: 'At-risk clinics',
      no_orders_client: 'Client clinic with no orders',
    },
  },
  veterinary_clinic: {
    key: 'veterinary_clinic',
    label: 'Veterinary Clinics',
    description: 'Veterinary practice pipeline and activity terminology.',
    defaults: {
      entityLabelSingular: 'Clinic',
      entityLabelPlural: 'Clinics',
      currency: 'EUR',
      locale: 'en-GB',
      timezone: 'Europe/London',
    },
    importAliases: {
      veterinary: 'name',
      vet: 'activity',
      'vet clinic': 'name',
      'animal hospital': 'name',
    },
    smartSegmentLabels: {
      none: 'All vet accounts',
      at_risk: 'At-risk vet accounts',
    },
  },
  beauty_wellness: {
    key: 'beauty_wellness',
    label: 'Beauty / Wellness',
    description: 'Salons, spas, and beauty businesses.',
    defaults: {
      entityLabelSingular: 'Salon',
      entityLabelPlural: 'Salons',
      currency: 'EUR',
      locale: 'en-GB',
      timezone: 'Europe/London',
    },
    importAliases: {
      salon: 'name',
      spa: 'name',
      esthetic: 'activity',
      aesthetic: 'activity',
      beautician: 'activity',
    },
    smartSegmentLabels: {
      none: 'All beauty accounts',
      at_risk: 'At-risk beauty accounts',
    },
  },
};

export const INDUSTRY_TEMPLATE_KEYS = Object.keys(TEMPLATES) as IndustryTemplateKey[];

export function isIndustryTemplateKey(value: string | null | undefined): value is IndustryTemplateKey {
  if (!value) return false;
  return value in TEMPLATES;
}

export function getIndustryTemplate(value: string | null | undefined): IndustryTemplateDefinition {
  if (isIndustryTemplateKey(value)) return TEMPLATES[value];
  return TEMPLATES.general_b2b;
}

export function getIndustryTemplateOptions(): Array<{ key: IndustryTemplateKey; label: string }> {
  return INDUSTRY_TEMPLATE_KEYS.map((key) => ({ key, label: TEMPLATES[key].label }));
}

export function getIndustryImportAliases(value: string | null | undefined): Record<string, string> {
  return getIndustryTemplate(value).importAliases;
}

export function getIndustrySmartSegmentLabels(
  value: string | null | undefined,
): Partial<Record<SmartSegmentKey, string>> {
  return getIndustryTemplate(value).smartSegmentLabels;
}
