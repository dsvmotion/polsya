import { CheckSquare, Square, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EntitySelectionBarProps {
  totalCount: number;
  selectedCount: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export function EntitySelectionBar({
  totalCount,
  selectedCount,
  allSelected,
  onSelectAll,
  onDeselectAll,
  onSave,
  isSaving,
}: EntitySelectionBarProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div className="flex items-center justify-between gap-2 p-2 bg-muted border-b border-border">
      {/* Select All / Deselect All */}
      <button
        onClick={allSelected ? onDeselectAll : onSelectAll}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        disabled={totalCount === 0}
      >
        {allSelected ? (
          <CheckSquare className="h-4 w-4 text-primary" />
        ) : (
          <Square className="h-4 w-4" />
        )}
        <span>
          {allSelected ? 'Deselect all' : 'Select all'}
          {totalCount > 0 && ` (${totalCount})`}
        </span>
      </button>

      {/* Selection count and Save button */}
      <div className="flex items-center gap-2">
        {hasSelection && (
          <span className="text-xs text-muted-foreground">
            {selectedCount} selected
          </span>
        )}
        <Button
          size="sm"
          onClick={onSave}
          disabled={!hasSelection || isSaving}
          className={cn(
            'transition-all',
            hasSelection
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-1.5" />
              Save to Operations
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
