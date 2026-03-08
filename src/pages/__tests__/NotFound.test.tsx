import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from '../NotFound';

describe('NotFound', () => {
  it('renders the 404 heading', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-page']}>
        <NotFound />
      </MemoryRouter>,
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });

  it('displays the attempted path', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-page']}>
        <NotFound />
      </MemoryRouter>,
    );

    expect(screen.getByText('/unknown-page')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-page']}>
        <NotFound />
      </MemoryRouter>,
    );

    expect(screen.getByText('Go home')).toBeInTheDocument();
    expect(screen.getByText('Go back')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-page']}>
        <NotFound />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/doesn't exist or you don't have access/),
    ).toBeInTheDocument();
  });
});
