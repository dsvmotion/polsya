import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { Column } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const sortIcon = (() => {
    if (column.getIsSorted() === 'desc') {
      return <ArrowDown className="ml-2 h-3.5 w-3.5" />;
    }
    if (column.getIsSorted() === 'asc') {
      return <ArrowUp className="ml-2 h-3.5 w-3.5" />;
    }
    return <ChevronsUpDown className="ml-2 h-3.5 w-3.5" />;
  })();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        '-ml-3 h-8 text-muted-foreground/60 hover:text-foreground transition-colors duration-150 data-[state=open]:bg-accent',
        className,
      )}
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      <span>{title}</span>
      {sortIcon}
    </Button>
  );
}
