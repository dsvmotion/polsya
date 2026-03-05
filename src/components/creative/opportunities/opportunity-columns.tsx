import type { ColumnDef } from '@tanstack/react-table';
import type { CreativeOpportunity, CreativeClient } from '@/types/creative';
import { OPPORTUNITY_STAGE_LABELS, OPPORTUNITY_STAGE_COLORS } from '@/types/creative';
import { DataTableColumnHeader } from '@/components/creative/shared/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';

export function getOpportunityColumns(clients: CreativeClient[]): ColumnDef<CreativeOpportunity, unknown>[] {
  const clientMap = new Map(clients.map((c) => [c.id, c.name]));

  return [
    {
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => <span className="font-medium">{row.getValue('title')}</span>,
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
      accessorKey: 'stage',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Stage" />,
      cell: ({ row }) => {
        const stage = row.getValue('stage') as keyof typeof OPPORTUNITY_STAGE_LABELS;
        const colors = OPPORTUNITY_STAGE_COLORS[stage];
        return (
          <Badge variant="secondary" className={`${colors.bg} ${colors.text} border-0`}>
            {OPPORTUNITY_STAGE_LABELS[stage]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'valueCents',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Value" />,
      cell: ({ row }) => {
        const cents = row.getValue('valueCents') as number | null;
        if (cents == null) return '—';
        const currency = row.original.currency ?? 'USD';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
      },
    },
    {
      accessorKey: 'probability',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Prob." />,
      cell: ({ row }) => {
        const prob = row.getValue('probability') as number;
        return `${prob}%`;
      },
    },
    {
      accessorKey: 'expectedCloseDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Expected Close" />,
      cell: ({ row }) => {
        const d = row.getValue('expectedCloseDate') as string | null;
        return d ? new Date(d).toLocaleDateString() : '—';
      },
    },
  ];
}
