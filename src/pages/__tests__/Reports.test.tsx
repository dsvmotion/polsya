import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Reports from '../Reports';

/* ─── Mocks ─── */

vi.mock('@/hooks/useWooCommerceOrders', () => ({
  useWooCommerceOrders: vi.fn(() => ({ data: [] })),
}));

vi.mock('@/hooks/useEntityOperations', () => ({
  useEntitiesWithOrders: vi.fn(() => ({ data: [] })),
}));

vi.mock('@/hooks/useDashboardKpis', () => ({
  useDashboardKpis: vi.fn(() => ({ data: null })),
}));

vi.mock('@/components/layout/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
}));

describe('Reports', () => {
  it('renders the page heading', () => {
    render(<Reports />);
    expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
  });

  it('renders KPI cards', () => {
    render(<Reports />);
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
  });

  it('renders revenue KPI', () => {
    render(<Reports />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });
});
