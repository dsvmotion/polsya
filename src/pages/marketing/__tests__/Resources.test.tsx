import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Resources from '../Resources';

vi.mock('@/components/marketing/ScrollAnimation', () => ({
  ScrollAnimation: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/marketing/PageMeta', () => ({
  PageMeta: () => null,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <Resources />
    </MemoryRouter>,
  );
}

describe('Resources (marketing)', () => {
  it('renders the heading', () => {
    renderPage();
    expect(screen.getByText('Resources')).toBeInTheDocument();
  });

  it('renders placeholder message', () => {
    renderPage();
    expect(screen.getByText(/building our resource library/)).toBeInTheDocument();
  });

  it('renders back-to-home link', () => {
    renderPage();
    expect(screen.getByText('Back to home')).toBeInTheDocument();
  });
});
