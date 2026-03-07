import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminStatsCard } from '../AdminStatsCard';
import { Users } from 'lucide-react';

describe('AdminStatsCard', () => {
  it('renders title and value', () => {
    render(<AdminStatsCard title="Total Users" value={1234} icon={Users} />);
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('renders trend when provided', () => {
    render(<AdminStatsCard title="MRR" value={5000} icon={Users} trend={{ value: 12, direction: 'up' }} />);
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<AdminStatsCard title="Active" value={42} icon={Users} subtitle="this month" />);
    expect(screen.getByText('this month')).toBeInTheDocument();
  });
});
