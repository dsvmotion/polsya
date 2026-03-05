import type { ColumnDef } from '@tanstack/react-table';
import type { EnrichmentRecipe, RecipeTargetType } from '@/types/enrichment-engine';
import { RECIPE_TARGET_LABELS } from '@/types/enrichment-engine';
import { DataTableColumnHeader } from '@/components/creative/shared/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';

export const recipeColumns: ColumnDef<EnrichmentRecipe, unknown>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
  },
  {
    accessorKey: 'targetEntityType',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Target" />,
    cell: ({ row }) => {
      const type = row.getValue('targetEntityType') as RecipeTargetType;
      return (
        <Badge variant="outline" className="capitalize text-xs">
          {RECIPE_TARGET_LABELS[type]}
        </Badge>
      );
    },
  },
  {
    id: 'stepCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Steps" />,
    cell: ({ row }) => row.original.steps.length,
  },
  {
    accessorKey: 'runCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Runs" />,
    cell: ({ row }) => row.getValue('runCount'),
  },
  {
    accessorKey: 'lastRunAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Run" />,
    cell: ({ row }) => {
      const date = row.getValue('lastRunAt') as string | null;
      return date ? new Date(date).toLocaleDateString() : '—';
    },
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Active" />,
    cell: ({ row }) =>
      row.original.isActive ? (
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-0">Active</Badge>
      ) : (
        <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-0">Inactive</Badge>
      ),
  },
];
