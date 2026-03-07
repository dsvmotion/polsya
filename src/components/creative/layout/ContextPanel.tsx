import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { layout } from '@/lib/design-tokens';

interface ContextPanelProps {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}

/**
 * Context Panel — resizable right-side panel for entity details.
 * Opens alongside the main workspace without navigating away.
 *
 * Uses react-resizable-panels for drag-to-resize in Phase 1.
 * For Phase 0, this is a fixed-width panel with CSS animation.
 */
export function ContextPanel({ children, onClose, className }: ContextPanelProps) {
  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-l border-border bg-card shadow-elevation-popover animate-in slide-in-from-right duration-[180ms]',
        className,
      )}
      style={{
        width: layout.contextPanel.defaultWidth,
        minWidth: layout.contextPanel.minWidth,
        maxWidth: layout.contextPanel.maxWidth,
      }}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between h-12 px-4 border-b">
        <span className="font-display text-sm font-medium text-muted-foreground">Details</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Panel content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {children || (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Select an item to view details
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
