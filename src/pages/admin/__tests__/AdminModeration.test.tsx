import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminModeration from '../AdminModeration';

describe('AdminModeration', () => {
  it('renders the page heading', () => {
    render(<AdminModeration />);
    expect(screen.getByText('Content Moderation')).toBeInTheDocument();
  });

  it('renders all three stats cards with zero values', () => {
    render(<AdminModeration />);
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
    expect(screen.getByText('Approved (30d)')).toBeInTheDocument();
    expect(screen.getByText('Rejected (30d)')).toBeInTheDocument();
    // All values should be 0
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBe(3);
  });

  it('renders the empty-state moderation queue', () => {
    render(<AdminModeration />);
    expect(screen.getByText('No moderation features active')).toBeInTheDocument();
    expect(
      screen.getByText(/Content moderation will activate/),
    ).toBeInTheDocument();
  });
});
