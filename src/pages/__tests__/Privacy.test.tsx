import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestProviders } from '../admin/__tests__/helpers';
import Privacy from '../Privacy';

describe('Privacy', () => {
  it('renders the heading', () => {
    render(<TestProviders><Privacy /></TestProviders>);
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('renders all sections', () => {
    render(<TestProviders><Privacy /></TestProviders>);
    expect(screen.getByText('1. Information we collect')).toBeInTheDocument();
    expect(screen.getByText('2. How we use it')).toBeInTheDocument();
    expect(screen.getByText('3. Data retention')).toBeInTheDocument();
    expect(screen.getByText('4. Cookies')).toBeInTheDocument();
    expect(screen.getByText('5. Your rights')).toBeInTheDocument();
  });

  it('renders contact link', () => {
    render(<TestProviders><Privacy /></TestProviders>);
    expect(screen.getByText('contact us')).toBeInTheDocument();
  });

  it('shows last updated date', () => {
    render(<TestProviders><Privacy /></TestProviders>);
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });
});
