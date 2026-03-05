import type { ColumnDef } from '@tanstack/react-table';
import type { EntitySourceMapping } from '@/types/entity-resolution';
import { DataTableColumnHeader } from '@/components/creative/shared/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';

export const mappingColumns: ColumnDef<EntitySourceMapping, unknown>[] = [
  {
    accessorKey: 'entityType',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Entity Type" />,
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs capitalize">
        {row.getValue('entityType') as string}
      </Badge>
    ),
  },
  {
    accessorKey: 'entityId',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Entity ID" />,
    cell: ({ row }) => (
      <span className="font-mono text-xs">{(row.getValue('entityId') as string).slice(0, 8)}…</span>
    ),
  },
  {
    accessorKey: 'sourceProvider',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Provider" />,
    cell: ({ row }) => <span className="capitalize">{row.getValue('sourceProvider') as string}</span>,
  },
  {
    accessorKey: 'sourceId',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Source ID" />,
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.getValue('sourceId') as string}</span>
    ),
  },
  {
    accessorKey: 'isPrimary',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Primary" />,
    cell: ({ row }) =>
      row.original.isPrimary ? (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-0">Primary</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: 'lastSyncedAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Synced" />,
    cell: ({ row }) => {
      const date = row.getValue('lastSyncedAt') as string | null;
      return date ? new Date(date).toLocaleDateString() : '—';
    },
  },
];
