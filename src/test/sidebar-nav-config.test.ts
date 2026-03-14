import { describe, it, expect } from 'vitest';
import {
  dashboardItem,
  navGroups,
  bottomNavItems,
} from '@/components/creative/layout/sidebar-nav-config';

describe('sidebar-nav-config (creative)', () => {
  describe('dashboardItem', () => {
    it('points to /app', () => {
      expect(dashboardItem.path).toBe('/app');
    });

    it('has Dashboard label', () => {
      expect(dashboardItem.label).toBe('Dashboard');
    });
  });

  describe('navGroups', () => {
    it('has at least 6 groups', () => {
      expect(navGroups.length).toBeGreaterThanOrEqual(6);
    });

    it('every group has label, icon, and items', () => {
      for (const group of navGroups) {
        expect(group.label).toBeTruthy();
        expect(group.icon).toBeDefined();
        expect(group.items.length).toBeGreaterThan(0);
      }
    });

    it('every item has label, icon, and path', () => {
      for (const group of navGroups) {
        for (const item of group.items) {
          expect(item.label).toBeTruthy();
          expect(item.icon).toBeDefined();
          expect(item.path).toMatch(/^\/app/);
        }
      }
    });

    it('non-future paths are unique', () => {
      const paths = navGroups
        .flatMap((g) => g.items.filter((i) => !i.future).map((i) => i.path));
      const unique = new Set(paths);
      expect(unique.size).toBe(paths.length);
    });

    it('contains expected sections', () => {
      const labels = navGroups.map((g) => g.label);
      expect(labels).toContain('Discover');
      expect(labels).toContain('Entities');
      expect(labels).toContain('Pipeline');
      expect(labels).toContain('Intelligence');
      expect(labels).toContain('Communication');
      expect(labels).toContain('Analytics');
      expect(labels).toContain('Operations');
    });

    it('Operations group defaults to closed', () => {
      const ops = navGroups.find((g) => g.label === 'Operations');
      expect(ops?.defaultOpen).toBe(false);
    });

    it('future items are marked correctly', () => {
      const futureItems = navGroups.flatMap((g) => g.items.filter((i) => i.future));
      expect(futureItems.length).toBeGreaterThan(0);
      for (const item of futureItems) {
        expect(item.future).toBe(true);
      }
    });
  });

  describe('bottomNavItems', () => {
    it('includes Integrations, Billing, and Settings', () => {
      const labels = bottomNavItems.map((i) => i.label);
      expect(labels).toContain('Integrations');
      expect(labels).toContain('Billing');
      expect(labels).toContain('Settings');
    });
  });
});
