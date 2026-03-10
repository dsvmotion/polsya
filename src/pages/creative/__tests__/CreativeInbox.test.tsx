import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreativeInbox from '../CreativeInbox';

vi.mock('@/hooks/useCreativeEmails', () => ({
  useCreativeEmails: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@/components/creative/email/EmailComposeSheet', () => ({
  EmailComposeSheet: () => null,
}));

vi.mock('@/components/creative/email/EmailThreadView', () => ({
  EmailThreadView: () => null,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CreativeInbox />
    </MemoryRouter>,
  );
}

describe('CreativeInbox', () => {
  it('renders page heading', () => {
    renderPage();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders compose button', () => {
    renderPage();
    expect(screen.getByText('Compose')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    renderPage();
    expect(screen.getByText('No emails synced yet.')).toBeInTheDocument();
  });
});
