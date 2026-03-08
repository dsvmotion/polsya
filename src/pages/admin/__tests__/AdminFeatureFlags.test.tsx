import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TestProviders } from './helpers';
import AdminFeatureFlags from '../AdminFeatureFlags';

/* ─── Supabase mock ─── */

const mockSelectData = vi.fn();

vi.mock('@/integrations/supabase/client', () => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn(() => mockSelectData()),
    update: vi.fn().mockReturnThis(),
  };
  return {
    supabase: {
      from: vi.fn(() => builder),
    },
  };
});

/* ─── Tests ─── */

describe('AdminFeatureFlags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', async () => {
    mockSelectData.mockResolvedValue({ data: [], error: null });

    render(
      <TestProviders>
        <AdminFeatureFlags />
      </TestProviders>,
    );

    expect(screen.getByText('Feature Flags')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    // Never resolve so the query stays loading
    mockSelectData.mockReturnValue(new Promise(() => {}));

    render(
      <TestProviders>
        <AdminFeatureFlags />
      </TestProviders>,
    );

    expect(screen.getByText('Loading flags…')).toBeInTheDocument();
  });

  it('shows empty state when no flags exist', async () => {
    mockSelectData.mockResolvedValue({ data: [], error: null });

    render(
      <TestProviders>
        <AdminFeatureFlags />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText(/No feature flags configured/)).toBeInTheDocument();
    });
  });

  it('renders flags with ON/OFF badges', async () => {
    mockSelectData.mockResolvedValue({
      data: [
        { key: 'dark_mode', value: 'true', description: 'Enable dark theme', updated_at: '2025-01-01T00:00:00Z' },
        { key: 'beta_api', value: 'false', description: null, updated_at: '2025-01-02T00:00:00Z' },
      ],
      error: null,
    });

    render(
      <TestProviders>
        <AdminFeatureFlags />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText('dark_mode')).toBeInTheDocument();
    });

    expect(screen.getByText('beta_api')).toBeInTheDocument();
    expect(screen.getByText('Enable dark theme')).toBeInTheDocument();
    expect(screen.getByText('ON')).toBeInTheDocument();
    expect(screen.getByText('OFF')).toBeInTheDocument();
  });

  it('shows enabled count in subtitle', async () => {
    mockSelectData.mockResolvedValue({
      data: [
        { key: 'flag_a', value: 'true', description: null, updated_at: '2025-01-01T00:00:00Z' },
        { key: 'flag_b', value: 'true', description: null, updated_at: '2025-01-01T00:00:00Z' },
        { key: 'flag_c', value: 'false', description: null, updated_at: '2025-01-01T00:00:00Z' },
      ],
      error: null,
    });

    render(
      <TestProviders>
        <AdminFeatureFlags />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText('2 of 3 flags enabled.')).toBeInTheDocument();
    });
  });
});
