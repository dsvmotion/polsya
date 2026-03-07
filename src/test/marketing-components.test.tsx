import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CTASection } from '@/components/marketing/CTASection';

describe('CTASection', () => {
  it('renders headline and CTAs', () => {
    render(
      <MemoryRouter>
        <CTASection
          headline="Start today"
          subtitle="Free trial"
          primaryCta={{ label: 'Get started', href: '/signup' }}
          secondaryCta={{ label: 'See demo', href: '/contact' }}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Start today')).toBeInTheDocument();
    expect(screen.getByText('Free trial')).toBeInTheDocument();
    expect(screen.getByText('Get started')).toBeInTheDocument();
    expect(screen.getByText('See demo')).toBeInTheDocument();
  });

  it('renders without secondary CTA', () => {
    render(
      <MemoryRouter>
        <CTASection
          headline="Join now"
          primaryCta={{ label: 'Sign up', href: '/signup' }}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Join now')).toBeInTheDocument();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });
});
