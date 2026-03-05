import type { ColumnDef } from '@tanstack/react-table';
import type { EnrichmentRun, EnrichmentRunStatus } from '@/types/enrichment-engine';
import { ENRICHMENT_RUN_STATUS_LABELS, ENRICHMENT_RUN_STATUS_COLORS } from '@/types/enrichment-engine';
import { DataTableColumnHeader } from '@/components/creative/shared/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';

export const runColumns: ColumnDef<EnrichmentRun, unknown>[] = [
  {
    accessorKey: 'recipeId',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Recipe" />,
    cell: ({ row }) => {
      const id = row.getValue('recipeId') as string | null;
      return id ? <span className="font-mono text-xs">{id.slice(0, 8)}…</span> : '—';
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue('status') as EnrichmentRunStatus;
      const colors = ENRICHMENT_RUN_STATUS_COLORS[status];
      return (
        <Badge variant="secondary" className={`${colors.bg} ${colors.text} border-0`}>
          {ENRICHMENT_RUN_STATUS_LABELS[status]}
        </Badge>
      );
    },
  },
  {
    id: 'entityCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Entities" />,
    cell: ({ row }) => row.original.entityIds.length,
  },
  {
    accessorKey: 'creditsUsed',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Credits" />,
    cell: ({ row }) => row.getValue('creditsUsed'),
  },
  {
    accessorKey: 'startedAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Started" />,
    cell: ({ row }) => {
      const date = row.getValue('startedAt') as string | null;
      return date ? new Date(date).toLocaleString() : '—';
    },
  },
  {
    id: 'duration',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Duration" />,
    cell: ({ row }) => {
      const started = row.original.startedAt;
      const completed = row.original.completedAt;
      if (!started || !completed) return '—';
      const ms = new Date(completed).getTime() - new Date(started).getTime();
      const secs = Math.round(ms / 1000);
      return secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m ${secs % 60}s`;
    },
  },
];
