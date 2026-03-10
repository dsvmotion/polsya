import { describe, it, expect } from 'vitest';

describe('Route structure', () => {
  it('LandingOrRedirect module exports a component', async () => {
    const mod = await import('@/components/landing/LandingOrRedirect');
    expect(mod).toBeDefined();
    expect(mod.LandingOrRedirect).toBeDefined();
  });

  it('MarketingLayout module exports a component', async () => {
    const mod = await import('@/components/marketing/MarketingLayout');
    expect(mod).toBeDefined();
    expect(mod.MarketingLayout).toBeDefined();
  });

  it('CreativeLayout module exports a component', async () => {
    const mod = await import('@/components/creative/layout/CreativeLayout');
    expect(mod).toBeDefined();
    expect(mod.CreativeLayout).toBeDefined();
  });

  it('AdminLayout module exports a component', async () => {
    const mod = await import('@/components/admin/layout/AdminLayout');
    expect(mod).toBeDefined();
    expect(mod.AdminLayout).toBeDefined();
  });
});
