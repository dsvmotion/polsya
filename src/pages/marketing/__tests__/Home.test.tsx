import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '../Home';

vi.mock('@/components/marketing/ScrollAnimation', () => ({
  ScrollAnimation: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/marketing/HeroSection', () => ({
  HeroSection: () => <div data-testid="hero-section">Hero</div>,
}));

vi.mock('@/components/marketing/UseCaseGrid', () => ({
  UseCaseGrid: () => <div data-testid="use-case-grid" />,
}));

vi.mock('@/components/marketing/CustomerLogos', () => ({
  CustomerLogos: () => <div data-testid="customer-logos" />,
}));

vi.mock('@/components/marketing/TestimonialCarousel', () => ({
  TestimonialCarousel: () => <div data-testid="testimonial-carousel" />,
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
      <Home />
    </MemoryRouter>,
  );
}

describe('Home (marketing)', () => {
  it('renders the hero section', () => {
    renderPage();
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
  });

  it('renders the customer logos section', () => {
    renderPage();
    expect(screen.getByTestId('customer-logos')).toBeInTheDocument();
  });

  it('renders pillar section headings', () => {
    renderPage();
    const headings = screen.getAllByRole('heading');
    const headingTexts = headings.map((h) => h.textContent);
    expect(headingTexts.some((t) => t?.includes('Discover'))).toBe(true);
    expect(headingTexts.some((t) => t?.includes('Enrich'))).toBe(true);
  });

  it('renders mock profile data', () => {
    renderPage();
    // The home page has mock data for Sarah Chen
    expect(screen.getAllByText('Sarah Chen').length).toBeGreaterThanOrEqual(1);
  });

  it('renders product exploration links', () => {
    renderPage();
    const links = screen.getAllByRole('link');
    const productLinks = links.filter((l) => l.getAttribute('href')?.includes('/product'));
    expect(productLinks.length).toBeGreaterThanOrEqual(1);
  });
});
