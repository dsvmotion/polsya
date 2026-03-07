import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '@/pages/marketing/Home';

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
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
    expect(screen.getByText('Discover')).toBeInTheDocument();
    expect(screen.getByText('Enrich')).toBeInTheDocument();
    expect(screen.getByText('Connect')).toBeInTheDocument();
    expect(screen.getByText('Act')).toBeInTheDocument();
  });

  it('renders use cases section', () => {
    renderHome();
    expect(screen.getByText(/use case/i)).toBeInTheDocument();
    expect(screen.getByText('Agencies')).toBeInTheDocument();
  });

  it('renders security section', () => {
    renderHome();
    expect(screen.getByText(/enterprise-grade security for/i)).toBeInTheDocument();
  });

  it('renders final CTA', () => {
    renderHome();
    expect(screen.getByText(/start discovering/i)).toBeInTheDocument();
  });
});
