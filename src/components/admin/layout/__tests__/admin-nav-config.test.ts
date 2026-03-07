import { describe, it, expect } from 'vitest';
import { adminNavGroups, adminDashboardItem, adminBottomItems } from '../admin-nav-config';

describe('admin-nav-config', () => {
  it('exports a dashboard item pointing to /admin', () => {
    expect(adminDashboardItem.path).toBe('/admin');
    expect(adminDashboardItem.label).toBe('Dashboard');
  });

  it('exports 5 navigation groups', () => {
    expect(adminNavGroups).toHaveLength(5);
    const labels = adminNavGroups.map((g) => g.label);
    expect(labels).toEqual([
      'Users & Organizations',
      'Revenue',
      'Intelligence',
      'Platform',
      'Settings',
    ]);
  });

  it('Users & Organizations group has Users and Organizations items', () => {
    const group = adminNavGroups.find((g) => g.label === 'Users & Organizations')!;
    const paths = group.items.map((i) => i.path);
    expect(paths).toContain('/admin/users');
    expect(paths).toContain('/admin/organizations');
  });

  it('Revenue group has Subscriptions and Billing', () => {
    const group = adminNavGroups.find((g) => g.label === 'Revenue')!;
    const paths = group.items.map((i) => i.path);
    expect(paths).toContain('/admin/subscriptions');
    expect(paths).toContain('/admin/billing');
  });

  it('Intelligence group has Signals, Ingestion, AI Jobs', () => {
    const group = adminNavGroups.find((g) => g.label === 'Intelligence')!;
    const paths = group.items.map((i) => i.path);
    expect(paths).toContain('/admin/signals');
    expect(paths).toContain('/admin/ingestion');
    expect(paths).toContain('/admin/ai-jobs');
  });

  it('Platform group has Moderation, Logs, Flags, Analytics', () => {
    const group = adminNavGroups.find((g) => g.label === 'Platform')!;
    const paths = group.items.map((i) => i.path);
    expect(paths).toContain('/admin/moderation');
    expect(paths).toContain('/admin/logs');
    expect(paths).toContain('/admin/flags');
    expect(paths).toContain('/admin/analytics');
  });

  it('exports bottom nav items with Back to App link', () => {
    const backItem = adminBottomItems.find((i) => i.path === '/app');
    expect(backItem).toBeDefined();
    expect(backItem!.label).toBe('Back to App');
  });

  it('all nav items have icon, label, and path', () => {
    const allItems = [
      adminDashboardItem,
      ...adminNavGroups.flatMap((g) => g.items),
      ...adminBottomItems,
    ];
    for (const item of allItems) {
      expect(item.label).toBeTruthy();
      expect(item.path).toBeTruthy();
      expect(item.icon).toBeTruthy();
    }
  });
});
