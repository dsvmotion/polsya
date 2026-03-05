import type { ColumnDef } from '@tanstack/react-table';
import type { Signal, SignalSeverity, SignalStatus } from '@/types/signal-engine';
import { SIGNAL_SEVERITY_LABELS, SIGNAL_SEVERITY_COLORS, SIGNAL_STATUS_LABELS, SIGNAL_STATUS_COLORS } from '@/types/signal-engine';
import { DataTableColumnHeader } from '@/components/creative/shared/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';

export const signalColumns: ColumnDef<Signal, unknown>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    cell: ({ row }) => <span className="font-medium">{row.getValue('title')}</span>,
  },
  {
    accessorKey: 'entityType',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Entity" />,
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs capitalize">
        {row.getValue('entityType') as string}
      </Badge>
    ),
  },
  {
    accessorKey: 'severity',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Severity" />,
    cell: ({ row }) => {
      const severity = row.getValue('severity') as SignalSeverity;
      const colors = SIGNAL_SEVERITY_COLORS[severity];
      return (
        <Badge variant="secondary" className={`${colors.bg} ${colors.text} border-0`}>
          {SIGNAL_SEVERITY_LABELS[severity]}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue('status') as SignalStatus;
      const colors = SIGNAL_STATUS_COLORS[status];
      return (
        <Badge variant="secondary" className={`${colors.bg} ${colors.text} border-0`}>
          {SIGNAL_STATUS_LABELS[status]}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => new Date(row.getValue('createdAt') as string).toLocaleDateString(),
  },
];
