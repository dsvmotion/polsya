import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UseCases from '../UseCases';

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
      <UseCases />
    </MemoryRouter>,
  );
}

describe('UseCases (marketing)', () => {
  it('renders the hero heading', () => {
    renderPage();
    expect(screen.getByText(/Built for every/)).toBeInTheDocument();
  });

  it('renders all six persona titles', () => {
    renderPage();
    const personas = ['Agencies', 'Brands', 'Producers', 'Recruiters', 'Investors', 'Consultants'];
    personas.forEach((p) => {
      expect(screen.getByText(p)).toBeInTheDocument();
    });
  });

  it('renders persona bullet points', () => {
    renderPage();
    expect(screen.getByText(/Scout freelance talent/)).toBeInTheDocument();
    expect(screen.getByText(/Map the creative economy/)).toBeInTheDocument();
  });

  it('renders the CTA section', () => {
    renderPage();
    expect(screen.getByText('See how Polsya fits your team')).toBeInTheDocument();
  });
});
