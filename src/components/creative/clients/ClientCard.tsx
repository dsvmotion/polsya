import type { CreativeClient } from '@/types/creative';
import { CLIENT_STATUS_LABELS, CLIENT_STATUS_COLORS, CLIENT_SIZE_LABELS } from '@/types/creative';
import { Badge } from '@/components/ui/badge';
import { Building2, Globe } from 'lucide-react';

interface ClientCardProps {
  client: CreativeClient;
  onClick?: () => void;
}

export function ClientCard({ client, onClick }: ClientCardProps) {
  const statusColors = CLIENT_STATUS_COLORS[client.status];

  return (
    <div
      className="rounded-xl border border-border border-t-2 border-t-primary bg-card p-4 space-y-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <h3 className="font-medium text-sm truncate">{client.name}</h3>
        <Badge variant="secondary" className={`${statusColors.bg} ${statusColors.text} border-0 shrink-0 ml-2 rounded-full px-2 py-0.5 text-xs`}>
          {CLIENT_STATUS_LABELS[client.status]}
        </Badge>
      </div>
      {client.industry && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          <span>{client.industry}</span>
        </div>
      )}
      {client.website && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground truncate">
          <Globe className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{client.website}</span>
        </div>
      )}
      <div className="flex gap-2 pt-1">
        {client.sizeCategory && (
          <Badge variant="outline" className="text-xs rounded-full px-2 py-0.5">
            {CLIENT_SIZE_LABELS[client.sizeCategory]}
          </Badge>
        )}
      </div>
    </div>
  );
}
