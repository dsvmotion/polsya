import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminDataTable, type AdminColumn } from '../AdminDataTable';

interface TestRow {
  id: number;
  name: string;
  email: string;
}

const columns: AdminColumn<TestRow>[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
];

const data: TestRow[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com' },
];

function renderTable(props: Partial<Parameters<typeof AdminDataTable<TestRow>>[0]> = {}) {
  return render(
    <AdminDataTable data={data} columns={columns} {...props} />,
  );
}

describe('AdminDataTable', () => {
  it('renders column headers', () => {
    renderTable();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders all rows', () => {
    renderTable();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('renders search input with default placeholder', () => {
    renderTable();
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('renders search input with custom placeholder', () => {
    renderTable({ searchPlaceholder: 'Find user...' });
    expect(screen.getByPlaceholderText('Find user...')).toBeInTheDocument();
  });

  it('filters rows by search term', () => {
    renderTable({ searchKeys: ['name'] });
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'Alice' } });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderTable({ isLoading: true });
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows empty state when no results', () => {
    renderTable({ data: [] });
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('calls onRowClick when row is clicked', () => {
    const onRowClick = vi.fn();
    renderTable({ onRowClick });
    fireEvent.click(screen.getByText('Alice'));
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });

  it('renders custom cell content via render function', () => {
    const customColumns: AdminColumn<TestRow>[] = [
      { key: 'name', label: 'Name', render: (row) => `>> ${row.name}` },
    ];
    render(<AdminDataTable data={data} columns={customColumns} />);
    expect(screen.getByText('>> Alice')).toBeInTheDocument();
  });

  it('paginates when data exceeds page size', () => {
    const manyRows = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
    }));
    render(<AdminDataTable data={manyRows} columns={columns} pageSize={10} />);
    // Should show first 10 and pagination controls
    expect(screen.getByText('User 0')).toBeInTheDocument();
    expect(screen.queryByText('User 10')).not.toBeInTheDocument();
    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
  });

  it('hides pagination when data fits in one page', () => {
    renderTable({ pageSize: 10 });
    expect(screen.queryByText(/Page/)).not.toBeInTheDocument();
  });
});
