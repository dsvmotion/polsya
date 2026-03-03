import {
  getIndustryImportAliases,
  getIndustrySmartSegmentLabels,
  getIndustryTemplate,
  getIndustryTemplateOptions,
  isIndustryTemplateKey,
} from '@/lib/industry-templates';

describe('industry templates', () => {
  it('validates known keys', () => {
    expect(isIndustryTemplateKey('general_b2b')).toBe(true);
    expect(isIndustryTemplateKey('dental_clinic')).toBe(true);
    expect(isIndustryTemplateKey('unknown')).toBe(false);
    expect(isIndustryTemplateKey(null)).toBe(false);
  });

  it('returns fallback template for unknown keys', () => {
    const template = getIndustryTemplate('unknown');
    expect(template.key).toBe('general_b2b');
    expect(template.defaults.entityLabelSingular).toBe('Account');
  });

  it('returns requested template for valid keys', () => {
    const template = getIndustryTemplate('pharmacy_retail');
    expect(template.defaults.entityLabelSingular).toBe('Pharmacy');
    expect(template.defaults.entityLabelPlural).toBe('Pharmacies');
  });

  it('exposes template options for selectors', () => {
    const options = getIndustryTemplateOptions();
    expect(options.length).toBeGreaterThanOrEqual(6);
    expect(options.some((opt) => opt.key === 'veterinary_clinic')).toBe(true);
  });

  it('returns import aliases for selected template', () => {
    const aliases = getIndustryImportAliases('dental_clinic');
    expect(aliases['clinic name']).toBe('name');
    expect(aliases.practice).toBe('name');
  });

  it('returns fallback aliases for unknown template', () => {
    const aliases = getIndustryImportAliases('not-real');
    expect(aliases['company name']).toBe('name');
  });

  it('returns smart segment label overrides', () => {
    const labels = getIndustrySmartSegmentLabels('general_b2b');
    expect(labels.none).toBe('All accounts');
    expect(labels.at_risk).toBe('At-risk accounts');
  });
});
