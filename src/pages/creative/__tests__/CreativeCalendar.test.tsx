import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreativeCalendar from '../CreativeCalendar';

vi.mock('@/hooks/useCreativeCalendarEvents', () => ({
  useCreativeCalendarEvents: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@/components/creative/calendar/CalendarEventFormSheet', () => ({
  CalendarEventFormSheet: () => null,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CreativeCalendar />
    </MemoryRouter>,
  );
}

describe('CreativeCalendar', () => {
  it('renders page heading', () => {
    renderPage();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    renderPage();
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('renders new event button', () => {
    renderPage();
    expect(screen.getByText('New Event')).toBeInTheDocument();
  });
});
