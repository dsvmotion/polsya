import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Home from '@/pages/marketing/Home';

function renderHome() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe('Marketing Home Page', () => {
  it('renders hero section with headline and CTAs', () => {
    renderHome();
    expect(screen.getByText(/discover creative talent/i)).toBeInTheDocument();
    expect(screen.getAllByText(/start free trial/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders intelligence sources section', () => {
    renderHome();
    expect(screen.getByText(/intelligence sources/i)).toBeInTheDocument();
  });

  it('renders core capabilities', () => {
    renderHome();
    expect(screen.getAllByText('Discover').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Enrich').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Connect').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Act').length).toBeGreaterThanOrEqual(1);
  });

  it('renders use cases section', () => {
    renderHome();
    expect(screen.getByText('Agencies')).toBeInTheDocument();
  });

  it('renders final CTA', () => {
    renderHome();
    expect(screen.getByText(/start discovering/i)).toBeInTheDocument();
  });
});
