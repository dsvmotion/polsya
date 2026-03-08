import { describe, it, expect } from 'vitest';
import {
  typography,
  spacing,
  borderRadius,
  shadows,
  layout,
  animation,
  zIndex,
  breakpoints,
  viewModes,
} from '@/lib/design-tokens';

describe('design-tokens', () => {
  describe('typography', () => {
    it('has font family definitions', () => {
      expect(typography.fontFamily.sans).toContain('Manrope');
      expect(typography.fontFamily.mono).toContain('JetBrains Mono');
    });

    it('has standard font sizes', () => {
      expect(typography.fontSize.base).toBe('0.875rem');
      expect(typography.fontSize.sm).toBeDefined();
      expect(typography.fontSize.lg).toBeDefined();
    });

    it('has font weights from normal to extrabold', () => {
      expect(typography.fontWeight.normal).toBe(400);
      expect(typography.fontWeight.bold).toBe(700);
      expect(typography.fontWeight.extrabold).toBe(800);
    });
  });

  describe('spacing', () => {
    it('uses 4px base unit', () => {
      expect(spacing[1]).toBe('0.25rem'); // 4px
      expect(spacing[2]).toBe('0.5rem');  // 8px
      expect(spacing[4]).toBe('1rem');    // 16px
    });

    it('has zero value', () => {
      expect(spacing[0]).toBe('0');
    });
  });

  describe('borderRadius', () => {
    it('has none and full values', () => {
      expect(borderRadius.none).toBe('0');
      expect(borderRadius.full).toBe('9999px');
    });

    it('sizes increase progressively', () => {
      const sizes = [borderRadius.sm, borderRadius.md, borderRadius.lg, borderRadius.xl];
      for (let i = 1; i < sizes.length; i++) {
        expect(parseFloat(sizes[i])).toBeGreaterThan(parseFloat(sizes[i - 1]));
      }
    });
  });

  describe('shadows', () => {
    it('has none shadow', () => {
      expect(shadows.none).toBe('none');
    });

    it('has card shadow using CSS variable', () => {
      expect(shadows.card).toBe('var(--shadow-card)');
    });
  });

  describe('layout', () => {
    it('sidebar collapsed is narrower than expanded', () => {
      expect(layout.sidebar.collapsedWidth).toBeLessThan(layout.sidebar.expandedWidth);
    });

    it('context panel has valid width constraints', () => {
      expect(layout.contextPanel.minWidth).toBeLessThan(layout.contextPanel.maxWidth);
      expect(layout.contextPanel.defaultWidth).toBeGreaterThanOrEqual(layout.contextPanel.minWidth);
      expect(layout.contextPanel.defaultWidth).toBeLessThanOrEqual(layout.contextPanel.maxWidth);
    });
  });

  describe('animation', () => {
    it('durations are ordered correctly', () => {
      const durations = ['instant', 'fast', 'normal', 'slow', 'slower'] as const;
      for (let i = 1; i < durations.length; i++) {
        const curr = parseInt(animation.duration[durations[i]]);
        const prev = parseInt(animation.duration[durations[i - 1]]);
        expect(curr).toBeGreaterThan(prev);
      }
    });
  });

  describe('zIndex', () => {
    it('layers increase in proper order', () => {
      expect(zIndex.base).toBeLessThan(zIndex.dropdown);
      expect(zIndex.dropdown).toBeLessThan(zIndex.sidebar);
      expect(zIndex.sidebar).toBeLessThan(zIndex.modal);
      expect(zIndex.modal).toBeLessThan(zIndex.tooltip);
      expect(zIndex.tooltip).toBeLessThan(zIndex.toast);
    });
  });

  describe('breakpoints', () => {
    it('has standard responsive breakpoints', () => {
      expect(breakpoints.sm).toBe(640);
      expect(breakpoints.md).toBe(768);
      expect(breakpoints.lg).toBe(1024);
    });
  });

  describe('viewModes', () => {
    it('includes standard view modes', () => {
      expect(viewModes).toContain('table');
      expect(viewModes).toContain('cards');
      expect(viewModes).toContain('board');
    });
  });
});
