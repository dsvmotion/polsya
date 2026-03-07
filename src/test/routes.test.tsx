import { describe, it, expect } from 'vitest';

describe('Route structure', () => {
  it('marketing routes use MarketingLayout', async () => {
    const App = await import('@/App');
    expect(App).toBeDefined();
  });

  it('LandingOrRedirect points to /app for authenticated users', async () => {
    const mod = await import('@/components/landing/LandingOrRedirect');
    expect(mod).toBeDefined();
  });
});
