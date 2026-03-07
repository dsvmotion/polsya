import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Product from '@/pages/marketing/Product';
import HowItWorks from '@/pages/marketing/HowItWorks';
import Integrations from '@/pages/marketing/Integrations';
import UseCasesPage from '@/pages/marketing/UseCases';
import Pricing from '@/pages/marketing/Pricing';
import Customers from '@/pages/marketing/Customers';
import Resources from '@/pages/marketing/Resources';
import SecurityPage from '@/pages/marketing/Security';
import ContactPage from '@/pages/marketing/Contact';

function wrap(el: React.ReactElement) {
  return render(<MemoryRouter>{el}</MemoryRouter>);
}

describe('Marketing Pages', () => {
  it('Product page renders capability sections', () => {
    wrap(<Product />);
    expect(screen.getByText('Discover')).toBeInTheDocument();
  });

  it('How It Works page renders steps', () => {
    wrap(<HowItWorks />);
    expect(screen.getByText(/how it works/i)).toBeInTheDocument();
  });

  it('Integrations page renders data source grid', () => {
    wrap(<Integrations />);
    expect(screen.getByRole('heading', { name: /integrations/i })).toBeInTheDocument();
  });

  it('Use Cases page renders personas', () => {
    wrap(<UseCasesPage />);
    expect(screen.getByText(/agencies/i)).toBeInTheDocument();
  });

  it('Pricing page renders plan tiers', () => {
    wrap(<Pricing />);
    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('Customers page renders testimonials section', () => {
    wrap(<Customers />);
    expect(screen.getByRole('heading', { name: /customers/i })).toBeInTheDocument();
  });

  it('Resources page renders resource links', () => {
    wrap(<Resources />);
    expect(screen.getByRole('heading', { name: /resources/i })).toBeInTheDocument();
  });

  it('Security page renders compliance info', () => {
    wrap(<SecurityPage />);
    expect(screen.getByRole('heading', { level: 1, name: /security/i })).toBeInTheDocument();
    expect(screen.getAllByText(/GDPR/i).length).toBeGreaterThan(0);
  });

  it('Contact page renders form', () => {
    wrap(<ContactPage />);
    expect(screen.getByRole('heading', { name: /contact/i })).toBeInTheDocument();
  });
});
