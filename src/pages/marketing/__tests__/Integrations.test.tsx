import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Integrations from '../Integrations';

vi.mock('@/components/marketing/ScrollAnimation', () => ({
  ScrollAnimation: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
      <Integrations />
    </MemoryRouter>,
  );
}

describe('Integrations (marketing)', () => {
  it('renders the hero heading', () => {
    renderPage();
    expect(screen.getByText(/Connect to the platforms/)).toBeInTheDocument();
  });

  it('renders all integration category titles', () => {
    renderPage();
    const categories = [
      'Portfolio Platforms',
      'Professional Networks',
      'Award Databases',
      'Social Signals',
      'Agency Directories',
    ];
    categories.forEach((c) => {
      expect(screen.getByText(c)).toBeInTheDocument();
    });
  });

  it('renders source names', () => {
    renderPage();
    expect(screen.getByText('Behance')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
  });

  it('renders the CTA section', () => {
    renderPage();
    expect(screen.getByText('Connect your stack')).toBeInTheDocument();
  });
});
