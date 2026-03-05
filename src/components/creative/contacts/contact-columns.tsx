import type { ColumnDef } from '@tanstack/react-table';
import type { CreativeContact } from '@/types/creative';
import { CONTACT_STATUS_LABELS, CONTACT_STATUS_COLORS } from '@/types/creative';
import { DataTableColumnHeader } from '@/components/creative/shared/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

export const contactColumns: ColumnDef<CreativeContact, unknown>[] = [
  {
    accessorKey: 'firstName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => {
      const first = row.original.firstName;
      const last = row.original.lastName;
      return <span className="font-medium">{first}{last ? ` ${last}` : ''}</span>;
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => row.getValue('email') ?? '—',
  },
  {
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    cell: ({ row }) => row.getValue('title') ?? '—',
  },
  {
    accessorKey: 'isDecisionMaker',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Decision Maker" />,
    cell: ({ row }) =>
      row.original.isDecisionMaker ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue('status') as keyof typeof CONTACT_STATUS_LABELS;
      const colors = CONTACT_STATUS_COLORS[status];
      return (
        <Badge variant="secondary" className={`${colors.bg} ${colors.text} border-0`}>
          {CONTACT_STATUS_LABELS[status]}
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
