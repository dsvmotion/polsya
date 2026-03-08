import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Security from '../Security';

vi.mock('@/components/marketing/ScrollAnimation', () => ({
  ScrollAnimation: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/marketing/SecurityBadges', () => ({
  SecurityBadges: () => <div data-testid="security-badges" />,
}));

vi.mock('@/components/marketing/CTASection', () => ({
  CTASection: ({ headline }: { headline: string }) => <div>{headline}</div>,
}));

vi.mock('@/components/marketing/PageMeta', () => ({
  PageMeta: () => null,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <Security />
    </MemoryRouter>,
  );
}

describe('Security (marketing)', () => {
  it('renders the hero heading', () => {
    renderPage();
    expect(screen.getByText(/Security &/)).toBeInTheDocument();
  });

  it('renders all four security detail sections', () => {
    renderPage();
    expect(screen.getByText('Data Handling')).toBeInTheDocument();
    expect(screen.getByText('Access Control')).toBeInTheDocument();
    expect(screen.getByText('Infrastructure')).toBeInTheDocument();
    expect(screen.getByText('Compliance')).toBeInTheDocument();
  });

  it('renders security badges', () => {
    renderPage();
    expect(screen.getByTestId('security-badges')).toBeInTheDocument();
  });

  it('renders the CTA section', () => {
    renderPage();
    expect(screen.getByText('Have security questions?')).toBeInTheDocument();
  });
});
