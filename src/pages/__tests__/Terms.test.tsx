import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestProviders } from '../admin/__tests__/helpers';
import Terms from '../Terms';

vi.mock('@/lib/brand', () => ({ APP_NAME: 'Polsya' }));

describe('Terms', () => {
  it('renders the heading', () => {
    render(<TestProviders><Terms /></TestProviders>);
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
  });

  it('renders all sections', () => {
    render(<TestProviders><Terms /></TestProviders>);
    expect(screen.getByText('1. Acceptance')).toBeInTheDocument();
    expect(screen.getByText('2. Use of the Service')).toBeInTheDocument();
    expect(screen.getByText('3. Subscription and Payment')).toBeInTheDocument();
    expect(screen.getByText('4. Data and Privacy')).toBeInTheDocument();
  });

  it('renders links to privacy and contact', () => {
    render(<TestProviders><Terms /></TestProviders>);
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('contact us')).toBeInTheDocument();
  });

  it('shows last updated date', () => {
    render(<TestProviders><Terms /></TestProviders>);
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });
});
