import type { ColumnDef } from '@tanstack/react-table';
import type { CreativeClient } from '@/types/creative';
import { CLIENT_STATUS_LABELS, CLIENT_STATUS_COLORS, CLIENT_SIZE_LABELS } from '@/types/creative';
import { DataTableColumnHeader } from '@/components/creative/shared/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';

export const clientColumns: ColumnDef<CreativeClient, unknown>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
  },
  {
    accessorKey: 'industry',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Industry" />,
    cell: ({ row }) => row.getValue('industry') ?? '—',
  },
  {
    accessorKey: 'sizeCategory',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Size" />,
    cell: ({ row }) => {
      const size = row.getValue('sizeCategory') as string | null;
      return size ? CLIENT_SIZE_LABELS[size as keyof typeof CLIENT_SIZE_LABELS] : '—';
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue('status') as keyof typeof CLIENT_STATUS_LABELS;
      const colors = CLIENT_STATUS_COLORS[status];
      return (
        <Badge variant="secondary" className={`${colors.bg} ${colors.text} border-0`}>
          {CLIENT_STATUS_LABELS[status]}
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
