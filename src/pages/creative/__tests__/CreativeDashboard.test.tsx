import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreativeDashboard from '../CreativeDashboard';

vi.mock('@/hooks/useCreativeDashboard', () => ({
  useCreativeDashboard: vi.fn(() => ({
    data: {
      totalClients: 0,
      activeProjects: 0,
      pipelineValueCents: 0,
      winRate: 0,
      stageBreakdown: {},
      newSignals: 0,
      activeRules: 0,
      pendingResolutions: 0,
      remainingCredits: 0,
    },
    isLoading: false,
  })),
}));

vi.mock('@/hooks/useSignals', () => ({
  useRecentSignals: vi.fn(() => ({ data: [] })),
}));

vi.mock('@/hooks/useEntityResolution', () => ({
  useResolutionCandidates: vi.fn(() => ({ data: [] })),
}));

vi.mock('@/hooks/useCreativeActivities', () => ({
  useRecentActivities: vi.fn(() => ({ data: [] })),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CreativeDashboard />
    </MemoryRouter>,
  );
}

describe('CreativeDashboard', () => {
  it('renders page heading', () => {
    renderPage();
    expect(screen.getByText('Creative Intelligence')).toBeInTheDocument();
  });

  it('renders page description', () => {
    renderPage();
    expect(screen.getByText('Your creative relationship overview')).toBeInTheDocument();
  });

  it('renders metric cards', () => {
    renderPage();
    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Active Projects')).toBeInTheDocument();
    expect(screen.getByText('Pipeline Value')).toBeInTheDocument();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
  });
});
