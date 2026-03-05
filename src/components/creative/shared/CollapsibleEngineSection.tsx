import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CollapsibleEngineSectionProps {
  icon: LucideIcon;
  label: string;
  count: number;
  isLoading: boolean;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleEngineSection({
  icon: Icon,
  label,
  count,
  isLoading,
  children,
  defaultOpen = false,
}: CollapsibleEngineSectionProps): React.JSX.Element {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 text-sm font-medium hover:text-foreground text-muted-foreground transition-colors">
        <ChevronRight className={cn('h-4 w-4 transition-transform', open && 'rotate-90')} />
        <Icon className="h-4 w-4" />
        <span className="flex-1 text-left">{label}</span>
        {isLoading ? (
          <div className="h-5 w-8 rounded-full bg-muted animate-pulse" />
        ) : (
          <Badge variant="secondary" className="text-xs">{count}</Badge>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-8 pb-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
