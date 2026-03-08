import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Pricing from '../Pricing';

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
      <Pricing />
    </MemoryRouter>,
  );
}

describe('Pricing (marketing)', () => {
  it('renders the hero heading', () => {
    renderPage();
    expect(screen.getByText(/Simple, transparent/)).toBeInTheDocument();
  });

  it('renders all plan names', () => {
    renderPage();
    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('renders monthly prices by default', () => {
    renderPage();
    expect(screen.getByText('€29')).toBeInTheDocument();
    expect(screen.getByText('€79')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('switches to annual pricing when toggle is clicked', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Annual/ }));
    // 29 * 0.8 = 23, 79 * 0.8 = 63
    expect(screen.getByText('€23')).toBeInTheDocument();
    expect(screen.getByText('€63')).toBeInTheDocument();
  });

  it('renders "Most popular" badge on Pro', () => {
    renderPage();
    expect(screen.getByText('Most popular')).toBeInTheDocument();
  });

  it('renders FAQ questions', () => {
    renderPage();
    expect(screen.getByText('Can I switch plans at any time?')).toBeInTheDocument();
    expect(screen.getByText('Is there a free trial?')).toBeInTheDocument();
  });

  it('expands FAQ answer when clicked', () => {
    renderPage();
    const question = screen.getByText('Is there a free trial?');
    fireEvent.click(question);
    expect(screen.getByText(/7-day free trial/)).toBeInTheDocument();
  });
});
