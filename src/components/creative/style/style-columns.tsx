import type { ColumnDef } from '@tanstack/react-table';
import type { StyleAnalysis } from '@/types/style-intelligence';
import { DataTableColumnHeader } from '@/components/creative/shared/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';

export const styleColumns: ColumnDef<StyleAnalysis, unknown>[] = [
  {
    accessorKey: 'sourceUrl',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Source" />,
    cell: ({ row }) => {
      const url = row.original.sourceUrl;
      return url ? (
        <span className="font-medium truncate max-w-[200px] block">{url}</span>
      ) : (
        <span className="text-muted-foreground">Manual</span>
      );
    },
  },
  {
    accessorKey: 'colorPalette',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Colors" />,
    cell: ({ row }) => {
      const palette = row.original.colorPalette.slice(0, 5);
      return (
        <div className="flex items-center gap-1">
          {palette.map((swatch) => (
            <div
              key={swatch.hex}
              className="h-5 w-5 rounded-full border border-border"
              style={{ backgroundColor: swatch.hex }}
              title={swatch.name ?? swatch.hex}
            />
          ))}
          {row.original.colorPalette.length === 0 && (
            <span className="text-muted-foreground text-xs">None</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'confidenceScore',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Confidence" />,
    cell: ({ row }) => {
      const score = row.original.confidenceScore;
      const pct = Math.round(score * 100);
      return (
        <Badge variant="secondary" className={pct >= 80 ? 'bg-green-100 text-green-800 border-0' : pct >= 50 ? 'bg-amber-100 text-amber-800 border-0' : 'bg-gray-100 text-gray-800 border-0'}>
          {pct}%
        </Badge>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Analyzed" />,
    cell: ({ row }) => {
      const date = row.original.analyzedAt ?? row.original.createdAt;
      return new Date(date).toLocaleDateString();
    },
  },
];
