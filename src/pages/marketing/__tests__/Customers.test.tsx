import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Customers from '../Customers';

vi.mock('@/components/marketing/ScrollAnimation', () => ({
  ScrollAnimation: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/marketing/CustomerLogos', () => ({
  CustomerLogos: () => <div data-testid="customer-logos" />,
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
      <Customers />
    </MemoryRouter>,
  );
}

describe('Customers (marketing)', () => {
  it('renders the hero heading', () => {
    renderPage();
    expect(screen.getByText(/Trusted by creative teams/)).toBeInTheDocument();
  });

  it('renders all testimonial authors', () => {
    renderPage();
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('Marcus Webb')).toBeInTheDocument();
    expect(screen.getByText('Elena Vasquez')).toBeInTheDocument();
  });

  it('renders testimonial metrics', () => {
    renderPage();
    expect(screen.getByText('50% faster sourcing')).toBeInTheDocument();
    expect(screen.getByText('3\u00d7 pipeline visibility')).toBeInTheDocument();
  });

  it('renders customer logos section', () => {
    renderPage();
    expect(screen.getByTestId('customer-logos')).toBeInTheDocument();
  });

  it('renders the CTA section', () => {
    renderPage();
    expect(screen.getByText('Join hundreds of creative teams')).toBeInTheDocument();
  });
});
