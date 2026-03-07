import { describe, it, expect } from 'vitest';
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION } from '@/lib/brand';

describe('brand constants', () => {
  it('has correct app name', () => {
    expect(APP_NAME).toBe('Polsya');
  });

  it('has creative-intelligence tagline (not legacy sales)', () => {
    expect(APP_TAGLINE).not.toContain('B2B');
    expect(APP_TAGLINE).not.toContain('sales');
    expect(APP_TAGLINE.toLowerCase()).toContain('creative');
  });

  it('has creative-intelligence description (not legacy sales)', () => {
    expect(APP_DESCRIPTION).not.toContain('prospecting');
    expect(APP_DESCRIPTION).not.toContain('revenue');
    expect(APP_DESCRIPTION.toLowerCase()).toContain('creative');
  });
});
