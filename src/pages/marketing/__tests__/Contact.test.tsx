import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Contact from '../Contact';

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
      <Contact />
    </MemoryRouter>,
  );
}

describe('Contact (marketing)', () => {
  it('renders the hero heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Get in/);
  });

  it('renders contact form fields', () => {
    renderPage();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Company')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
  });

  it('renders company info section', () => {
    renderPage();
    expect(screen.getByText('hello@polsya.com')).toBeInTheDocument();
    expect(screen.getByText('Madrid, Spain')).toBeInTheDocument();
  });

  it('shows thank you message after form submission', () => {
    renderPage();
    const form = screen.getByText('Send message').closest('form')!;
    fireEvent.submit(form);
    expect(screen.getByText('Thank you!')).toBeInTheDocument();
  });

  it('renders subject options', () => {
    renderPage();
    const select = screen.getByLabelText('Subject');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('General inquiry')).toBeInTheDocument();
    expect(screen.getByText('Enterprise plan')).toBeInTheDocument();
  });
});
