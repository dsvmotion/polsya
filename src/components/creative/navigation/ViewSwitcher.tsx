import { LayoutGrid, Table2, GitBranch, Map, Columns3 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ViewMode } from '@/lib/design-tokens';

interface ViewSwitcherProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  /** Which views to show (defaults to all) */
  availableViews?: ViewMode[];
}

const viewConfig: Record<ViewMode, { icon: typeof Table2; label: string }> = {
  table: { icon: Table2, label: 'Table' },
  cards: { icon: LayoutGrid, label: 'Cards' },
  board: { icon: Columns3, label: 'Board' },
  graph: { icon: GitBranch, label: 'Graph' },
  map: { icon: Map, label: 'Map' },
};

/**
 * ViewSwitcher — toggles between Table/Cards/Graph/Map views.
 * Each mode renders a different data visualization for the same dataset.
 */
export function ViewSwitcher({
  value,
  onChange,
  availableViews = ['table', 'cards', 'board', 'graph', 'map'],
}: ViewSwitcherProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(val) => {
        if (val) onChange(val as ViewMode);
      }}
      className="rounded-full bg-muted/60 p-1 inline-flex items-center gap-1"
    >
      {availableViews.map((mode) => {
        const { icon: Icon, label } = viewConfig[mode];
        return (
          <Tooltip key={mode}>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value={mode}
                aria-label={label}
                className="rounded-full px-3 py-1.5 text-sm transition-all duration-150 text-muted-foreground hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
              >
                <Icon className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              {label} view
            </TooltipContent>
          </Tooltip>
        );
      })}
    </ToggleGroup>
  );
}

// ─── Skeleton Views ──────────────────────────────────────────

export function TableViewSkeleton() {
  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="flex gap-4 px-4 py-3 border-b">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${80 + i * 20}px` }} />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: 8 }).map((_, row) => (
        <div key={row} className="flex gap-4 px-4 py-3 border-b border-border/50">
          {Array.from({ length: 5 }).map((_, col) => (
            <div key={col} className="h-4 bg-muted/60 rounded animate-pulse" style={{ width: `${60 + col * 25}px` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardsViewSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
          <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-full bg-muted/40 rounded animate-pulse" />
          <div className="flex gap-2 pt-2">
            <div className="h-6 w-16 bg-muted/50 rounded-full animate-pulse" />
            <div className="h-6 w-12 bg-muted/50 rounded-full animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GraphViewSkeleton() {
  return (
    <div className="flex items-center justify-center h-96 rounded-lg border bg-muted/20">
      <div className="text-center space-y-2">
        <GitBranch className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <p className="text-sm text-muted-foreground">Relationship graph coming in Phase 1</p>
      </div>
    </div>
  );
}

export function MapViewSkeleton() {
  return (
    <div className="flex items-center justify-center h-96 rounded-lg border bg-muted/20">
      <div className="text-center space-y-2">
        <Map className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <p className="text-sm text-muted-foreground">Geographic map coming in Phase 1</p>
      </div>
    </div>
  );
}
