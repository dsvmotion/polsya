// src/components/creative/shared/KanbanBoard.tsx
import { useState, type DragEvent, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface KanbanColumn {
  key: string;
  label: string;
  color: { bg: string; text: string };
}

interface KanbanBoardProps<T extends { id: string }> {
  columns: KanbanColumn[];
  items: T[];
  getColumnKey: (item: T) => string;
  onMove: (itemId: string, newColumnKey: string) => void;
  renderCard: (item: T) => ReactNode;
  isLoading?: boolean;
}

export function KanbanBoard<T extends { id: string }>({
  columns,
  items,
  getColumnKey,
  onMove,
  renderCard,
  isLoading,
}: KanbanBoardProps<T>) {
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  function handleDragStart(e: DragEvent, itemId: string) {
    setDraggedItemId(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
  }

  function handleDragOver(e: DragEvent, columnKey: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnKey);
  }

  function handleDragLeave() {
    setDragOverColumn(null);
  }

  function handleDrop(e: DragEvent, columnKey: string) {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    if (itemId && getColumnKey(items.find((i) => i.id === itemId)!) !== columnKey) {
      onMove(itemId, columnKey);
    }
    setDragOverColumn(null);
    setDraggedItemId(null);
  }

  function handleDragEnd() {
    setDragOverColumn(null);
    setDraggedItemId(null);
  }

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div key={col.key} className="flex-shrink-0 w-72">
            <div className="h-8 w-24 bg-muted rounded animate-pulse mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted/60 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => {
        const columnItems = items.filter((item) => getColumnKey(item) === col.key);
        return (
          <div
            key={col.key}
            className={cn(
              'flex-shrink-0 w-72 rounded-lg border bg-muted/30 transition-colors',
              dragOverColumn === col.key && 'ring-2 ring-primary/50 bg-primary/5',
            )}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <span className={`text-sm font-medium ${col.color.text}`}>{col.label}</span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {columnItems.length}
              </Badge>
            </div>
            <ScrollArea className="p-2" style={{ maxHeight: 'calc(100vh - 280px)' }}>
              <div className="space-y-2">
                {columnItems.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    No items
                  </div>
                ) : (
                  columnItems.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'cursor-grab active:cursor-grabbing rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow',
                        draggedItemId === item.id && 'opacity-50',
                      )}
                    >
                      {renderCard(item)}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}
