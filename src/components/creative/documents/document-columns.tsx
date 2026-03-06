import type { ColumnDef } from '@tanstack/react-table';
import type { AiDocument, DocumentSourceType, DocumentStatus } from '@/types/ai-documents';
import { DOCUMENT_SOURCE_LABELS, DOCUMENT_SOURCE_COLORS } from '@/types/ai-documents';
import { DataTableColumnHeader } from '@/components/creative/shared/DataTableColumnHeader';
import { DocumentStatusBadge } from '@/components/creative/documents/DocumentStatusBadge';
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => {
      const sourceType = row.getValue('sourceType') as DocumentSourceType;
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
      const doc = row.original;

      if (doc.status === 'error' && doc.errorMessage) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <DocumentStatusBadge status={doc.status} errorMessage={doc.errorMessage} />
            </TooltipTrigger>
            <TooltipContent>{doc.errorMessage}</TooltipContent>
          </Tooltip>
        );
      }

      return <DocumentStatusBadge status={doc.status} />;
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
