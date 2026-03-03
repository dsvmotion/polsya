import { useEffect } from 'react';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';

const DEFAULT_PRIMARY = '#2563eb';

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const normalized = hex.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;

  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function WorkspaceThemeBridge() {
  const { organization } = useCurrentOrganization();

  useEffect(() => {
    const root = document.documentElement;
    const primaryHex = organization?.primary_color ?? DEFAULT_PRIMARY;
    const hsl = hexToHsl(primaryHex) ?? hexToHsl(DEFAULT_PRIMARY);
    if (!hsl) return;

    root.style.setProperty('--workspace-primary-hex', primaryHex);
    root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);

    const ringL = Math.min(62, hsl.l + 12);
    root.style.setProperty('--ring', `${hsl.h} ${Math.max(35, hsl.s)}% ${ringL}%`);
  }, [organization?.primary_color]);

  return null;
}
