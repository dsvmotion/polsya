import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Product from '../Product';

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
      <Product />
    </MemoryRouter>,
  );
}

describe('Product (marketing)', () => {
  it('renders the hero heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/creative intelligence/);
  });

  it('renders all five capability titles', () => {
    renderPage();
    const caps = ['Discover', 'Enrich', 'Pipeline', 'Analytics', 'Communication'];
    caps.forEach((c) => {
      const headings = screen.getAllByRole('heading', { level: 2 });
      expect(headings.some((h) => h.textContent === c)).toBe(true);
    });
  });

  it('renders capability bullet points', () => {
    renderPage();
    expect(screen.getByText('Cross-platform search')).toBeInTheDocument();
    expect(screen.getByText('Style classification')).toBeInTheDocument();
    expect(screen.getByText('Unified inbox')).toBeInTheDocument();
  });

  it('renders hero CTA buttons', () => {
    renderPage();
    expect(screen.getByText('Start free trial')).toBeInTheDocument();
    expect(screen.getByText('Request a demo')).toBeInTheDocument();
  });

  it('renders the CTA section', () => {
    renderPage();
    expect(screen.getByText('Ready to transform your creative workflow?')).toBeInTheDocument();
  });
});
