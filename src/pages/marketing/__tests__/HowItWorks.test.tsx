import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HowItWorks from '../HowItWorks';

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
      <HowItWorks />
    </MemoryRouter>,
  );
}

describe('HowItWorks (marketing)', () => {
  it('renders the hero heading', () => {
    renderPage();
    expect(screen.getByText(/Five steps to/)).toBeInTheDocument();
  });

  it('renders all five step titles', () => {
    renderPage();
    const titles = [
      'Connect your sources',
      'Discover creative talent',
      'Enrich profiles automatically',
      'Build relationship maps',
      'Track your pipeline',
    ];
    titles.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it('renders step numbers 1 through 5', () => {
    renderPage();
    for (let i = 1; i <= 5; i++) {
      expect(screen.getAllByText(String(i)).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('renders the CTA section', () => {
    renderPage();
    expect(screen.getByText('See it in action')).toBeInTheDocument();
  });
});
