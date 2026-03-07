import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';

function renderLayout() {
  return render(
    <MemoryRouter>
      <MarketingLayout />
    </MemoryRouter>
  );
}

describe('MarketingLayout', () => {
  it('renders navigation with key links', () => {
    renderLayout();
    expect(screen.getAllByText('Product').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('Log in')).toBeInTheDocument();
    expect(screen.getByText('Get started')).toBeInTheDocument();
  });

  it('renders footer with product column', () => {
    renderLayout();
    expect(screen.getByText('Terms')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
  });

  it('does NOT force dark mode (light theme)', () => {
    renderLayout();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
