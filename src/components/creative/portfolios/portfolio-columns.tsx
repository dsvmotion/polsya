import type { ColumnDef } from '@tanstack/react-table';
import type { CreativePortfolio } from '@/types/creative';
import { PORTFOLIO_CATEGORY_LABELS, PORTFOLIO_CATEGORY_COLORS } from '@/types/creative';
import { DataTableColumnHeader } from '@/components/creative/shared/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';
import { Globe, Lock } from 'lucide-react';

export const portfolioColumns: ColumnDef<CreativePortfolio, unknown>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    cell: ({ row }) => <span className="font-medium">{row.getValue('title')}</span>,
  },
  {
    accessorKey: 'category',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
    cell: ({ row }) => {
      const cat = row.getValue('category') as keyof typeof PORTFOLIO_CATEGORY_LABELS | null;
      if (!cat) return '—';
      const colors = PORTFOLIO_CATEGORY_COLORS[cat];
      return (
        <Badge variant="secondary" className={`${colors.bg} ${colors.text} border-0`}>
          {PORTFOLIO_CATEGORY_LABELS[cat]}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'isPublic',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Visibility" />,
    cell: ({ row }) =>
      row.original.isPublic ? (
        <div className="flex items-center gap-1 text-green-600"><Globe className="h-3.5 w-3.5" /><span className="text-xs">Public</span></div>
      ) : (
        <div className="flex items-center gap-1 text-muted-foreground"><Lock className="h-3.5 w-3.5" /><span className="text-xs">Private</span></div>
      ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => new Date(row.getValue('createdAt') as string).toLocaleDateString(),
  },
];
