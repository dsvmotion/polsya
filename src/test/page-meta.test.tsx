import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { PageMeta } from '@/components/marketing/PageMeta';

describe('PageMeta', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <HelmetProvider>
        <MemoryRouter>
          <PageMeta title="Test Page" description="A test" />
        </MemoryRouter>
      </HelmetProvider>
    );
    expect(container).toBeDefined();
  });
});
