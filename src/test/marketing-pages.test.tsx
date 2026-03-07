import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

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
  return render(<HelmetProvider><MemoryRouter>{el}</MemoryRouter></HelmetProvider>);
}

describe('Marketing Pages', () => {
  it('Product page renders capability sections', () => {
    wrap(<Product />);
    expect(screen.getAllByText('Discover').length).toBeGreaterThanOrEqual(1);
  });

  it('How It Works page renders steps', () => {
    wrap(<HowItWorks />);
    expect(screen.getAllByText(/how it works/i).length).toBeGreaterThanOrEqual(1);
  });

  it('Integrations page renders data source grid', () => {
    wrap(<Integrations />);
    expect(screen.getAllByText(/integrations/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Behance')).toBeInTheDocument();
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
    expect(screen.getAllByText(/customers/i).length).toBeGreaterThanOrEqual(1);
  });

  it('Resources page renders resource links', () => {
    wrap(<Resources />);
    expect(screen.getAllByText(/resources/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Documentation')).toBeInTheDocument();
  });

  it('Security page renders compliance info', () => {
    wrap(<SecurityPage />);
    expect(screen.getAllByText(/security/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/GDPR/i).length).toBeGreaterThan(0);
  });

  it('Contact page renders form', () => {
    wrap(<ContactPage />);
    expect(screen.getAllByText(/contact/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });
});
