import type { ColumnDef } from '@tanstack/react-table';
import type { ResolutionCandidate, ResolutionStatus } from '@/types/entity-resolution';
import { RESOLUTION_STATUS_LABELS, RESOLUTION_STATUS_COLORS } from '@/types/entity-resolution';
import { DataTableColumnHeader } from '@/components/creative/shared/DataTableColumnHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

export function createCandidateColumns(
  onResolve: (id: string, status: 'confirmed' | 'rejected') => void
): ColumnDef<ResolutionCandidate, unknown>[] {
  return [
    {
      id: 'entityA',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Entity A" />,
      cell: ({ row }) => (
        <div>
          <Badge variant="outline" className="text-xs capitalize mr-1">{row.original.entityAType}</Badge>
          <span className="font-mono text-xs">{row.original.entityAId.slice(0, 8)}…</span>
        </div>
      ),
    },
    {
      id: 'entityB',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Entity B" />,
      cell: ({ row }) => (
        <div>
          <Badge variant="outline" className="text-xs capitalize mr-1">{row.original.entityBType}</Badge>
          <span className="font-mono text-xs">{row.original.entityBId.slice(0, 8)}…</span>
        </div>
      ),
    },
    {
      accessorKey: 'confidenceScore',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Confidence" />,
      cell: ({ row }) => {
        const score = row.original.confidenceScore;
        const pct = Math.round(score * 100);
        return (
          <Badge variant="secondary" className={`border-0 ${pct >= 80 ? 'bg-green-100 text-green-800' : pct >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-muted text-foreground'}`}>
            {pct}%
          </Badge>
        );
      },
    },
    {
      accessorKey: 'matchReasons',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Match Reasons" />,
      cell: ({ row }) => {
        const reasons = row.original.matchReasons;
        return (
          <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
            {reasons.length > 0 ? reasons.join(', ') : '—'}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as ResolutionStatus;
        const colors = RESOLUTION_STATUS_COLORS[status];
        return (
          <Badge variant="secondary" className={`${colors.bg} ${colors.text} border-0`}>
            {RESOLUTION_STATUS_LABELS[status]}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        if (row.original.status !== 'pending') return null;
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={(e) => { e.stopPropagation(); onResolve(row.original.id, 'confirmed'); }}
            >
              <Check className="h-3 w-3" /> Confirm
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 text-destructive"
              onClick={(e) => { e.stopPropagation(); onResolve(row.original.id, 'rejected'); }}
            >
              <X className="h-3 w-3" /> Reject
            </Button>
          </div>
        );
      },
    },
  ];
}
