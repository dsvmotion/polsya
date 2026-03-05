/**
 * Design Tokens for Creative Intelligence Platform
 *
 * Centralized visual language complementing the CSS variables in index.css.
 * Use these tokens in TypeScript/JSX for programmatic styling decisions.
 * For Tailwind classes, prefer the CSS variables directly.
 */

// ─── Typography ──────────────────────────────────────────────
export const typography = {
  fontFamily: {
    sans: "'Manrope', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.8125rem',  // 13px
    base: '0.875rem', // 14px — default body
    md: '1rem',       // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.625,
  },
  letterSpacing: {
    tight: '-0.01em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
} as const;

// ─── Spacing ─────────────────────────────────────────────────
// 4px base unit system
export const spacing = {
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  3: '0.75rem',    // 12px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  8: '2rem',       // 32px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
} as const;

// ─── Border Radius ───────────────────────────────────────────
export const borderRadius = {
  none: '0',
  sm: '0.375rem',  // 6px  — pills, tags
  md: '0.5rem',    // 8px  — inputs, small cards
  lg: '0.75rem',   // 12px — cards, panels (matches --radius)
  xl: '1rem',      // 16px — modals, large cards
  full: '9999px',  // circular
} as const;

// ─── Shadows ─────────────────────────────────────────────────
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)',
  card: 'var(--shadow-card)',
  'card-hover': '0 8px 25px -5px rgb(0 0 0 / 0.08), 0 4px 10px -3px rgb(0 0 0 / 0.04)',
} as const;

// ─── Layout ──────────────────────────────────────────────────
export const layout = {
  sidebar: {
    expandedWidth: 264,    // px
    collapsedWidth: 68,    // px
    mobileBreakpoint: 1024, // lg
  },
  topBar: {
    height: 56, // px (h-14)
  },
  contextPanel: {
    defaultWidth: 380, // px
    minWidth: 280,     // px
    maxWidth: 600,     // px
  },
  contentMaxWidth: 1400, // px
  pageGutter: 24,        // px — padding inside workspace
} as const;

// ─── Animation ───────────────────────────────────────────────
export const animation = {
  duration: {
    instant: '0ms',
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

// ─── Z-Index ─────────────────────────────────────────────────
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  sidebar: 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
  commandPalette: 90,
} as const;

// ─── Breakpoints ─────────────────────────────────────────────
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1400,
} as const;

// ─── Creative View Modes ─────────────────────────────────────
export const viewModes = ['table', 'cards', 'board', 'graph', 'map'] as const;
export type ViewMode = (typeof viewModes)[number];
