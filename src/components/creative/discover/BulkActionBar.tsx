import { Button } from '@/components/ui/button';
import { Users, Briefcase } from 'lucide-react';

interface BulkActionBarProps {
  count: number;
  onSaveAsClient: () => void;
  onSaveAsLead: () => void;
  isSaving: boolean;
}

export function BulkActionBar({ count, onSaveAsClient, onSaveAsLead, isSaving }: BulkActionBarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 bg-background border rounded-lg shadow-lg px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">
          {count} selected
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={onSaveAsClient}
          disabled={isSaving}
        >
          <Users className="h-4 w-4 mr-1.5" />
          Save as Client{count > 1 ? `s (${count})` : ''}
        </Button>
        <Button
          size="sm"
          onClick={onSaveAsLead}
          disabled={isSaving}
        >
          <Briefcase className="h-4 w-4 mr-1.5" />
          Save as Lead{count > 1 ? `s (${count})` : ''}
        </Button>
      </div>
    </div>
  );
}
