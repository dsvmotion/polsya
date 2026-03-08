import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestProviders } from '../admin/__tests__/helpers';
import Trust from '../Trust';

vi.mock('@/lib/brand', () => ({ APP_NAME: 'Polsya' }));
vi.mock('@/components/marketing/ScrollAnimation', () => ({
  ScrollAnimation: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Trust', () => {
  it('renders the heading', () => {
    render(<TestProviders><Trust /></TestProviders>);
    expect(screen.getByText('Trust Center')).toBeInTheDocument();
  });

  it('renders all security sections', () => {
    render(<TestProviders><Trust /></TestProviders>);
    expect(screen.getByText('GDPR compliant')).toBeInTheDocument();
    expect(screen.getByText('Encryption at rest')).toBeInTheDocument();
    expect(screen.getByText('Row-level security')).toBeInTheDocument();
    expect(screen.getByText('Audit and compliance')).toBeInTheDocument();
  });

  it('renders related links', () => {
    render(<TestProviders><Trust /></TestProviders>);
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('Contact us')).toBeInTheDocument();
  });

  it('renders the related section heading', () => {
    render(<TestProviders><Trust /></TestProviders>);
    expect(screen.getByText('Related')).toBeInTheDocument();
  });
});
