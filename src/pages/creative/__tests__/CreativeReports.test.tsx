import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreativeReports from '../CreativeReports';

vi.mock('@/hooks/useCreativeReports', () => ({
  useCreativeReports: vi.fn(() => ({
    data: {
      kpis: { pipelineTotal: 0, winRate: 0, avgDealSize: 0, activeProjects: 0 },
      pipelineByStage: [],
      revenueOverTime: [],
      funnelData: [],
      projectStatusBreakdown: [],
    },
    isLoading: false,
  })),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => null,
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => null,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CreativeReports />
    </MemoryRouter>,
  );
}

describe('CreativeReports', () => {
  it('renders page heading', () => {
    renderPage();
    expect(screen.getByText('Creative Reports')).toBeInTheDocument();
  });

  it('renders page description', () => {
    renderPage();
    expect(screen.getByText('Analytics and insights for your creative business')).toBeInTheDocument();
  });

  it('renders KPI cards', () => {
    renderPage();
    expect(screen.getByText('Pipeline Total')).toBeInTheDocument();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('Avg Deal Size')).toBeInTheDocument();
    expect(screen.getByText('Active Projects')).toBeInTheDocument();
  });
});
