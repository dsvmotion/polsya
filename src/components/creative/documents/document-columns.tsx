import type { ColumnDef } from '@tanstack/react-table';
import type { AiDocument } from '@/types/ai-documents';
import { DOCUMENT_SOURCE_LABELS, DOCUMENT_SOURCE_COLORS, DOCUMENT_STATUS_COLORS } from '@/types/ai-documents';
import { DataTableColumnHeader } from '@/components/creative/shared/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const documentColumns: ColumnDef<AiDocument, unknown>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    cell: ({ row }) => <span className="font-medium">{row.getValue('title')}</span>,
  },
  {
    accessorKey: 'sourceType',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Source" />,
    cell: ({ row }) => {
      const sourceType = row.getValue('sourceType') as keyof typeof DOCUMENT_SOURCE_LABELS;
      const colors = DOCUMENT_SOURCE_COLORS[sourceType];
      return (
        <Badge variant="secondary" className={`${colors.bg} ${colors.text} border-0`}>
          {DOCUMENT_SOURCE_LABELS[sourceType]}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue('status') as keyof typeof DOCUMENT_STATUS_COLORS;
      const colors = DOCUMENT_STATUS_COLORS[status];
      const label = status.charAt(0).toUpperCase() + status.slice(1);
      const errorMessage = row.original.errorMessage;

      const badge = (
        <Badge
          variant="secondary"
          className={`${colors.bg} ${colors.text} border-0 ${status === 'processing' ? 'animate-pulse' : ''}`}
        >
          {label}
        </Badge>
      );

      if (status === 'error' && errorMessage) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>{badge}</TooltipTrigger>
            <TooltipContent>{errorMessage}</TooltipContent>
          </Tooltip>
        );
      }

      return badge;
    },
  },
  {
    accessorKey: 'chunkCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Chunks" />,
    cell: ({ row }) => {
      const count = row.getValue('chunkCount') as number;
      return count > 0 ? count : '\u2014';
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => new Date(row.getValue('createdAt') as string).toLocaleDateString(),
  },
];
