import type { ColumnDef } from '@tanstack/react-table';
import type { CreativeProject, CreativeClient } from '@/types/creative';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '@/types/creative';
import { DataTableColumnHeader } from '@/components/creative/shared/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';

export function getProjectColumns(clients: CreativeClient[]): ColumnDef<CreativeProject, unknown>[] {
  const clientMap = new Map(clients.map((c) => [c.id, c.name]));

  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'clientId',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
      cell: ({ row }) => {
        const clientId = row.getValue('clientId') as string | null;
        return clientId ? clientMap.get(clientId) ?? '—' : '—';
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as keyof typeof PROJECT_STATUS_LABELS;
        const colors = PROJECT_STATUS_COLORS[status];
        return (
          <Badge variant="secondary" className={`${colors.bg} ${colors.text} border-0`}>
            {PROJECT_STATUS_LABELS[status]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'startDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Start" />,
      cell: ({ row }) => {
        const d = row.getValue('startDate') as string | null;
        return d ? new Date(d).toLocaleDateString() : '—';
      },
    },
    {
      accessorKey: 'endDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="End" />,
      cell: ({ row }) => {
        const d = row.getValue('endDate') as string | null;
        return d ? new Date(d).toLocaleDateString() : '—';
      },
    },
    {
      accessorKey: 'budgetCents',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Budget" />,
      cell: ({ row }) => {
        const cents = row.getValue('budgetCents') as number | null;
        if (cents == null) return '—';
        const currency = row.original.currency ?? 'USD';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
      },
    },
  ];
}
