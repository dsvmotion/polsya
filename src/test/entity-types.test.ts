import { resolveEntityTypeLabel } from '@/hooks/useEntityTypes';
import type { EntityTypeDefinition } from '@/types/entity';

describe('resolveEntityTypeLabel', () => {
  const types: EntityTypeDefinition[] = [
    {
      id: '1',
      organizationId: null,
      key: 'pharmacy',
      label: 'Pharmacy',
      color: '#334155',
      isDefault: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  it('resolves configured label', () => {
    expect(resolveEntityTypeLabel('pharmacy', types)).toBe('Pharmacy');
  });

  it('falls back to key when type is unknown', () => {
    expect(resolveEntityTypeLabel('clinic', types)).toBe('clinic');
  });

  it('falls back to default label when key is missing', () => {
    expect(resolveEntityTypeLabel(null, types, 'Entity')).toBe('Entity');
  });
});
