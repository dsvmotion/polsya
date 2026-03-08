import { describe, it, expect } from 'vitest';
import {
  adminDashboardItem,
  adminNavGroups,
  adminBottomItems,
} from '@/components/admin/layout/admin-nav-config';

describe('admin-nav-config', () => {
  describe('adminDashboardItem', () => {
    it('points to /admin', () => {
      expect(adminDashboardItem.path).toBe('/admin');
    });

    it('has Dashboard label', () => {
      expect(adminDashboardItem.label).toBe('Dashboard');
    });

    it('has an icon', () => {
      expect(adminDashboardItem.icon).toBeDefined();
    });
  });

  describe('adminNavGroups', () => {
    it('has at least 4 groups', () => {
      expect(adminNavGroups.length).toBeGreaterThanOrEqual(4);
    });

    it('every group has label, icon, and items', () => {
      for (const group of adminNavGroups) {
        expect(group.label).toBeTruthy();
        expect(group.icon).toBeDefined();
        expect(group.items.length).toBeGreaterThan(0);
      }
    });

    it('every item has label, icon, and path', () => {
      for (const group of adminNavGroups) {
        for (const item of group.items) {
          expect(item.label).toBeTruthy();
          expect(item.icon).toBeDefined();
          expect(item.path).toMatch(/^\/admin/);
        }
      }
    });

    it('all paths are unique', () => {
      const paths = adminNavGroups.flatMap((g) => g.items.map((i) => i.path));
      const unique = new Set(paths);
      expect(unique.size).toBe(paths.length);
    });

    it('first group is Users & Organizations and defaults open', () => {
      expect(adminNavGroups[0].label).toBe('Users & Organizations');
      expect(adminNavGroups[0].defaultOpen).toBe(true);
    });

    it('contains expected admin sections', () => {
      const labels = adminNavGroups.map((g) => g.label);
      expect(labels).toContain('Revenue');
      expect(labels).toContain('Intelligence');
      expect(labels).toContain('Platform');
      expect(labels).toContain('Settings');
    });
  });

  describe('adminBottomItems', () => {
    it('has Back to App link', () => {
      expect(adminBottomItems.length).toBeGreaterThanOrEqual(1);
      const backItem = adminBottomItems.find((i) => i.label === 'Back to App');
      expect(backItem).toBeDefined();
      expect(backItem!.path).toBe('/app');
    });
  });
});
