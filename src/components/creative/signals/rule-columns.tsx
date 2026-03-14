import type { ColumnDef } from '@tanstack/react-table';
import type { SignalRule, RuleType } from '@/types/signal-engine';
import { RULE_TYPE_LABELS, RULE_TYPE_COLORS } from '@/types/signal-engine';
import { DataTableColumnHeader } from '@/components/creative/shared/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';

export const ruleColumns: ColumnDef<SignalRule, unknown>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
  },
  {
    accessorKey: 'ruleType',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => {
      const type = row.getValue('ruleType') as RuleType;
      const colors = RULE_TYPE_COLORS[type];
      return (
        <Badge variant="secondary" className={`${colors.bg} ${colors.text} border-0`}>
          {RULE_TYPE_LABELS[type]}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
    cell: ({ row }) => row.getValue('priority'),
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Active" />,
    cell: ({ row }) =>
      row.original.isActive ? (
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-0">Active</Badge>
      ) : (
        <Badge variant="secondary" className="bg-muted text-muted-foreground border-0">Inactive</Badge>
      ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => new Date(row.getValue('createdAt') as string).toLocaleDateString(),
  },
];
