import type { DocumentStatus } from '@/types/ai-documents';
import { DOCUMENT_STATUS_COLORS } from '@/types/ai-documents';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  errorMessage?: string | null;
}

export function DocumentStatusBadge({ status, errorMessage }: DocumentStatusBadgeProps) {
  const colors = DOCUMENT_STATUS_COLORS[status];
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge
      variant="secondary"
      className={cn(colors.bg, colors.text, 'border-0', status === 'processing' && 'animate-pulse')}
      title={status === 'error' && errorMessage ? errorMessage : undefined}
    >
      {label}
    </Badge>
  );
}
